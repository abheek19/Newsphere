/**
 * SyncEngine - Handles Data Ingestion Exclusively from the Google Sheet:
 * https://docs.google.com/spreadsheets/d/1MolkiancFTaDSWEW1rYtg0yY7XP6R65pJh7iPsRtpXs/edit?usp=sharing
 */

class NewsSyncEngine {
  constructor() {
    this.storageKey = 'newssphere_google_sheet_articles_v6';
    this.configKey = 'newssphere_sync_config_v6';
    this.defaultSheetUrl = 'https://docs.google.com/spreadsheets/d/1MolkiancFTaDSWEW1rYtg0yY7XP6R65pJh7iPsRtpXs/export?format=csv';

    // Clear all previous version caches to eliminate any wrong/stale mappings
    try {
      localStorage.removeItem('newssphere_custom_articles_v1');
      localStorage.removeItem('newssphere_google_sheet_articles_v2');
      localStorage.removeItem('newssphere_google_sheet_articles_v3');
      localStorage.removeItem('newssphere_google_sheet_articles_v4');
      localStorage.removeItem('newssphere_google_sheet_articles_v5');
      localStorage.removeItem('newssphere_bookmarks_v1');
      localStorage.removeItem('newssphere_bookmarks_v2');
      localStorage.removeItem('newssphere_bookmarks_v3');
      localStorage.removeItem('newssphere_bookmarks_v4');
    } catch (e) {}
  }

  // Load saved config
  getConfig() {
    try {
      const raw = localStorage.getItem(this.configKey);
      return raw ? JSON.parse(raw) : {
        sheetUrl: this.defaultSheetUrl,
        lastSyncTime: new Date().toISOString()
      };
    } catch (e) {
      return { sheetUrl: this.defaultSheetUrl, lastSyncTime: null };
    }
  }

  saveConfig(config) {
    try {
      localStorage.setItem(this.configKey, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to persist sync config:', e);
    }
  }

  // Retrieve all articles
  getAllArticles() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
    return (window.DEFAULT_NEWS_ARTICLES || []);
  }

  // Persist articles list
  saveArticles(articles) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(articles));
      return true;
    } catch (e) {
      console.error('Error saving articles:', e);
      return false;
    }
  }

  // Reset to default dataset
  resetToDefaults() {
    try {
      localStorage.removeItem(this.storageKey);
      return (window.DEFAULT_NEWS_ARTICLES || []);
    } catch (e) {
      return (window.DEFAULT_NEWS_ARTICLES || []);
    }
  }

  /**
   * Classify article into categories based on URL structure and headline content
   */
  classifyCategory(headline = '', url = '') {
    const u = (url || '').toLowerCase();
    const h = (headline || '').toLowerCase();

    // International Politics
    if (u.includes('/news/international/') || h.includes('iran') || h.includes('brics') || h.includes('ceasefire') || h.includes('trump') || h.includes('diplomacy') || h.includes('un ') || h.includes('foreign')) {
      return 'Political: International';
    }

    // Sports
    if (u.includes('/sport/') || u.includes('/cricket/') || u.includes('/football/') || u.includes('/motorsport/') || h.includes('fifa') || h.includes('starc') || h.includes('f1') || h.includes('test match') || h.includes('score') || h.includes('cup')) {
      return 'Sports';
    }

    // Entertainment
    if (u.includes('/entertainment/') || u.includes('/movies/') || h.includes('movie review') || h.includes('theatre') || h.includes('cinema') || h.includes('film') || h.includes('actor')) {
      return 'Entertainment';
    }

    // Science & Tech
    if (u.includes('/sci-tech/') || u.includes('/health/') || u.includes('/science/') || h.includes('mrna') || h.includes('cancer') || h.includes('drug') || h.includes('tech') || h.includes('ai ') || h.includes('quantum') || h.includes('study')) {
      return 'Science & Tech';
    }

    // Books & Education
    if (u.includes('/books/') || u.includes('/education/') || h.includes('college') || h.includes('teacher') || h.includes('comic') || h.includes('review of') || h.includes('learning')) {
      return 'Books & Education';
    }

    // Lifestyle & Food
    if (u.includes('/food/') || u.includes('/life-and-style/') || h.includes('restaurant') || h.includes('recipe') || h.includes('cocktail') || h.includes('sweet') || h.includes('dining')) {
      return 'Lifestyle & Food';
    }

    // National Politics & City
    if (u.includes('/news/national/') || u.includes('/cities/') || u.includes('kerala') || u.includes('chennai') || h.includes('president') || h.includes('census') || h.includes('court') || h.includes('minister') || h.includes('parliament')) {
      return 'Political: National';
    }

    return 'General News';
  }

  /**
   * Extract Full High-Quality Image URL from Google Sheet thumbnail URLs
   * Replaces SQUARE_80, SQUARE_100, FREE_80, LANDSCAPE_80, etc. with crisp LANDSCAPE_1200 HD rendition.
   */
  extractHighQualityImageUrl(url) {
    if (!url || typeof url !== 'string') {
      return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';
    }
    let hq = url.trim();
    hq = hq.replace(/\/alternates\/(SQUARE|LANDSCAPE|FREE|PORTRAIT|STATIC|RECTANGLE)_[0-9]+\//i, '/alternates/LANDSCAPE_1200/');
    hq = hq.replace(/SQUARE_\d+/gi, 'LANDSCAPE_1200')
           .replace(/LANDSCAPE_80/gi, 'LANDSCAPE_1200');
    return hq;
  }

  /**
   * Parse CSV content from Google Sheets link
   */
  parseGoogleSheetCsv(csvText) {
    if (!csvText || typeof csvText !== 'string') return [];

    const lines = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;

    // Standard CSV parser
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        if (currentRow.some(val => val.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      lines.push(currentRow);
    }

    if (lines.length < 2) return [];

    const headers = lines[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    // Strict exact matching first, then fallback
    const findIndex = (aliases) => {
      // 1. Exact match
      for (let i = 0; i < headers.length; i++) {
        if (aliases.includes(headers[i])) return i;
      }
      // 2. Non-ambiguous contains match (excluding imageurl from generic url alias)
      for (let i = 0; i < headers.length; i++) {
        for (const a of aliases) {
          if (headers[i].includes(a) && (a !== 'url' || headers[i] !== 'imageurl')) {
            return i;
          }
        }
      }
      return -1;
    };

    const headlineIdx = findIndex(['headline', 'title', 'articletitle']);
    const imageIdx = findIndex(['imageurl', 'imgurl', 'image', 'photo']);
    const authorIdx = findIndex(['author', 'writer', 'byline', 'reporter']);
    const urlIdx = findIndex(['articleurl', 'articlelink', 'sourceurl', 'link', 'weburl']);
    const categoryIdx = findIndex(['category', 'section', 'topic']);

    if (headlineIdx === -1) {
      throw new Error('Google Sheet is missing required "Headline" column header.');
    }

    const articles = [];
    for (let r = 1; r < lines.length; r++) {
      const row = lines[r];
      if (!row || row.length === 0) continue;

      let headline = row[headlineIdx] || '';
      headline = headline.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"').trim();
      if (!headline || headline.length < 3) continue;

      // Extract high quality image from image column
      let imageUrl = (imageIdx !== -1 && row[imageIdx]) ? this.extractHighQualityImageUrl(row[imageIdx]) : '';
      if (!imageUrl || (!imageUrl.startsWith('http') && !imageUrl.startsWith('//'))) {
        imageUrl = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';
      }

      let author = (authorIdx !== -1 && row[authorIdx]) ? row[authorIdx].trim() : '';
      if (!author) {
        author = 'The Hindu Bureau';
      }

      // Extract genuine article URL from article column (guaranteeing it is not an image file)
      let articleUrl = (urlIdx !== -1 && row[urlIdx]) ? row[urlIdx].trim() : '';
      
      // Safety: If urlIdx accidentally resolved to an image URL, scan the row for the thehindu.com article link
      if (!articleUrl || (articleUrl.includes('th-i.thgim.com') && (articleUrl.endsWith('.jpg') || articleUrl.endsWith('.JPG') || articleUrl.endsWith('.png')))) {
        for (const cell of row) {
          if (cell && cell.startsWith('http') && (cell.includes('/article') || cell.includes('thehindu.com')) && !cell.endsWith('.jpg') && !cell.endsWith('.JPG')) {
            articleUrl = cell.trim();
            break;
          }
        }
      }

      if (!articleUrl) {
        articleUrl = 'https://www.thehindu.com/';
      }

      let category = (categoryIdx !== -1 && row[categoryIdx]) ? row[categoryIdx].trim() : '';
      if (!category) {
        category = this.classifyCategory(headline, articleUrl);
      }

      articles.push({
        id: `sheet-item-${r}`,
        "Headline": headline,
        "Image URL": imageUrl,
        "Author": author,
        "Article URL": articleUrl,
        Category: category,
        Date: "2026-08-22",
        ReadTime: `${Math.max(2, Math.min(8, Math.round(headline.length / 14)))} min read`,
        Summary: headline,
        Source: 'The Hindu / Google Sheet'
      });
    }

    return articles;
  }

  /**
   * Normalize Google Sheet URL to direct CSV link
   */
  normalizeGoogleSheetUrl(url) {
    if (!url || typeof url !== 'string') return this.defaultSheetUrl;
    const clean = url.trim();
    if (clean.includes('export?format=csv')) return clean;

    const match = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
    }
    return clean;
  }

  /**
   * Fetch and sync live data from Google Sheet
   */
  async syncFromGoogleSheet(sheetUrl = this.defaultSheetUrl) {
    const csvUrl = this.normalizeGoogleSheetUrl(sheetUrl);
    let csvData = null;

    try {
      const directResp = await fetch(csvUrl, { cache: 'no-store' });
      if (directResp.ok) {
        csvData = await directResp.text();
      }
    } catch (e) {
      console.info('Direct fetch restricted, using server proxy...');
    }

    if (!csvData) {
      const proxyResp = await fetch(`/api/sync/sheet?url=${encodeURIComponent(csvUrl)}`);
      if (!proxyResp.ok) {
        const err = await proxyResp.json().catch(() => ({}));
        throw new Error(err.error || `Failed to fetch Google Sheet data (Status ${proxyResp.status})`);
      }
      const proxyJson = await proxyResp.json();
      csvData = proxyJson.csv || proxyJson.data;
    }

    const parsedArticles = this.parseGoogleSheetCsv(csvData);
    if (parsedArticles.length === 0) {
      throw new Error('No valid news articles found in the provided Google Sheet.');
    }

    this.saveArticles(parsedArticles);
    const config = this.getConfig();
    config.sheetUrl = sheetUrl;
    config.lastSyncTime = new Date().toISOString();
    this.saveConfig(config);

    return parsedArticles;
  }
}

// Global Singleton Instance
window.NewsSync = new NewsSyncEngine();
