/**
 * SyncEngine - Handles Data Ingestion from Google Sheets, N8N Webhooks, and Raw HTML Regex Scrapers.
 */

class NewsSyncEngine {
  constructor() {
    this.storageKey = 'newssphere_custom_articles_v1';
    this.configKey = 'newssphere_sync_config_v1';
    this.activeSourceKey = 'newssphere_source_type_v1'; // 'default' | 'custom' | 'sheet'
  }

  // Load saved config
  getConfig() {
    try {
      const raw = localStorage.getItem(this.configKey);
      return raw ? JSON.parse(raw) : {
        sheetUrl: '',
        n8nWebhookUrl: '',
        autoSyncInterval: 0, // 0 = manual, >0 in minutes
        lastSyncTime: null
      };
    } catch (e) {
      return { sheetUrl: '', n8nWebhookUrl: '', autoSyncInterval: 0, lastSyncTime: null };
    }
  }

  saveConfig(config) {
    try {
      localStorage.setItem(this.configKey, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to persist sync config:', e);
    }
  }

  // Retrieve all articles (custom + defaults)
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
      localStorage.setItem(this.activeSourceKey, 'custom');
      return true;
    } catch (e) {
      console.error('Error saving articles:', e);
      return false;
    }
  }

  // Reset to default curated dataset
  resetToDefaults() {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.setItem(this.activeSourceKey, 'default');
      return (window.DEFAULT_NEWS_ARTICLES || []);
    } catch (e) {
      return (window.DEFAULT_NEWS_ARTICLES || []);
    }
  }

  /**
   * Intelligently classify article into standard news categories if not provided.
   */
  classifyCategory(headline = '', context = '') {
    const text = `${headline} ${context}`.toLowerCase();
    
    // Sports
    if (/\b(cup|championship|match|tournament|goal|league|fifa|atp|slam|score|player|stadium|coach|cricket|tennis|football|soccer|nba|f1|grand prix|marathon|olympic|athletics|sprinter|trophy|penalty)\b/i.test(text)) {
      return 'Sports';
    }
    
    // Entertainment
    if (/\b(movie|film|cinema|actor|actress|grammy|oscar|emmy|album|song|music|singer|concert|festival|box office|trailer|streaming|netflix|hollywood|celebrity|theatre|premiere)\b/i.test(text)) {
      return 'Entertainment';
    }
    
    // Science & Tech
    if (/\b(ai|artificial intelligence|algorithm|quantum|telescope|nasa|spacex|exoplanet|physics|chip|semiconductor|battery|robot|software|cyber|biotech|genetics|gadget|astronomy|computing|model|neural|lab|device)\b/i.test(text)) {
      return 'Science & Tech';
    }

    // Business & Economy
    if (/\b(stock|market|shares|central bank|inflation|economy|gdp|invest|venture|startup|billion|trillion|nasdaq|crypto|fed|trade|tariff|profit|revenue|acquisition|fintech)\b/i.test(text)) {
      return 'Business & Economy';
    }

    // Climate & World
    if (/\b(climate|coral|reef|ocean|forest|green|emissions|biodiversity|earthquake|volcano|wildfire|antarctica|renewable|solar|wind energy|drought|flood|species|ecology)\b/i.test(text)) {
      return 'Climate & World';
    }

    // International Politics
    if (/\b(un|united nations|treaty|foreign minister|diplomacy|summit|cross-border|geopolitical|ambassador|sanction|nato|eu|european union|bilateral|pact|treaties|sovereignty)\b/i.test(text)) {
      return 'Political: International';
    }

    // Default to National Politics or general
    if (/\b(parliament|senate|congress|court|ruling|election|lawmaker|governor|legislation|minister|bill|poll|ballot|civic|federal|justice|presidential|constitution)\b/i.test(text)) {
      return 'Political: National';
    }

    return 'General News';
  }

  /**
   * Scrapes / Parses Raw HTML using the EXACT regex pattern provided in the prompt:
   * 
   * const titleRegex = /<h3 class="title[^"]*">\s*<a href="([^"]+)">\s*([\s\S]*?)\s*<\/a>\s*<\/h3>/g;
   * Look at a window of HTML *before* this headline to find its image + author
   * img: data-original="..."
   * author: <a class="person-name...">NAME</a>
   */
  parseHtmlUsingRegex(html) {
    if (!html || typeof html !== 'string') return [];

    const results = [];
    const seenUrls = new Set();
    const titleRegex = /<h3 class="title[^"]*">\s*<a href="([^"]+)">\s*([\s\S]*?)\s*<\/a>\s*<\/h3>/g;

    let match;
    let indexCount = 1;

    while ((match = titleRegex.exec(html)) !== null) {
      const articleUrl = match[1].replace(/&amp;/g, '&');
      const headline = match[2].replace(/\s+/g, ' ').trim();

      if (!headline || seenUrls.has(articleUrl)) continue; // skip empty/dupe
      seenUrls.add(articleUrl);

      // Look at a window of HTML *before* this headline to find its image + author
      const windowStart = Math.max(0, match.index - 3000);
      const context = html.slice(windowStart, match.index);

      // Image: last <img ... data-original="..."> before the headline (with fallback to src)
      const imgMatches = [...context.matchAll(/data-original="([^"]+)"/g)];
      let imageUrl = imgMatches.length ? imgMatches[imgMatches.length - 1][1].replace(/&amp;/g, '&') : null;

      if (!imageUrl) {
        const srcMatches = [...context.matchAll(/<img[^>]+src="([^">]+)"/g)];
        if (srcMatches.length) {
          imageUrl = srcMatches[srcMatches.length - 1][1].replace(/&amp;/g, '&');
        }
      }

      // Fallback placeholder image if none found
      if (!imageUrl || imageUrl.startsWith('data:image')) {
        imageUrl = `https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80`;
      }

      // Author: last <a class="person-name...">NAME</a> before the headline
      const authorMatches = [...context.matchAll(/class="person-name[^"]*"[^>]*>\s*([^<]+?)\s*<\/a>/g)];
      let author = authorMatches.length ? authorMatches[authorMatches.length - 1][1].trim() : null;

      if (!author) {
        const bylineMatches = [...context.matchAll(/class="[^"]*byline[^"]*"[^>]*>\s*([^<]+?)\s*<\//g)];
        if (bylineMatches.length) author = bylineMatches[bylineMatches.length - 1][1].trim();
      }

      if (!author) {
        author = "News Desk Staff";
      }

      const category = this.classifyCategory(headline, context);

      results.push({
        id: `scraped-${Date.now()}-${indexCount++}`,
        "Headline": headline,
        "Image URL": imageUrl,
        "Author": author,
        "Article URL": articleUrl.startsWith('http') ? articleUrl : `https://${articleUrl.replace(/^\/\//, '')}`,
        Category: category,
        Date: new Date().toISOString().split('T')[0],
        ReadTime: `${Math.max(2, Math.min(8, Math.round(headline.length / 15)))} min read`,
        Summary: headline,
        Source: "Live Scraped Feed"
      });
    }

    return results;
  }

  /**
   * Parse CSV content from Google Sheets published link
   */
  parseGoogleSheetCsv(csvText) {
    if (!csvText || typeof csvText !== 'string') return [];

    const lines = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;

    // Standard robust CSV state machine for quotes & multiline
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
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

    // Header matching (case-insensitive & whitespace tolerant)
    const headers = lines[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    const findIndex = (aliases) => {
      return headers.findIndex(h => aliases.some(alias => h === alias || h.includes(alias)));
    };

    const headlineIdx = findIndex(['headline', 'title', 'articletitle', 'name', 'heading']);
    const imageIdx = findIndex(['imageurl', 'image', 'imgurl', 'img', 'photo', 'picture', 'thumbnail']);
    const authorIdx = findIndex(['author', 'writer', 'reporter', 'byline', 'journalist', 'creator']);
    const urlIdx = findIndex(['articleurl', 'link', 'url', 'sourceurl', 'articlelink', 'weburl']);
    const categoryIdx = findIndex(['category', 'type', 'section', 'topic', 'group', 'tag']);
    const dateIdx = findIndex(['date', 'published', 'time', 'publishdate', 'timestamp']);
    const summaryIdx = findIndex(['summary', 'description', 'excerpt', 'snippet', 'body']);

    if (headlineIdx === -1) {
      throw new Error('Google Sheet missing required "Headline" (or "Title") column header.');
    }

    const articles = [];
    for (let r = 1; r < lines.length; r++) {
      const row = lines[r];
      if (!row || row.length === 0) continue;

      const headline = row[headlineIdx] || '';
      if (!headline || headline.length < 3) continue;

      let imageUrl = (imageIdx !== -1 && row[imageIdx]) ? row[imageIdx].trim() : '';
      if (!imageUrl || (!imageUrl.startsWith('http') && !imageUrl.startsWith('//'))) {
        imageUrl = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';
      }

      let author = (authorIdx !== -1 && row[authorIdx]) ? row[authorIdx].trim() : 'Editorial Team';
      let articleUrl = (urlIdx !== -1 && row[urlIdx]) ? row[urlIdx].trim() : '#';
      if (articleUrl && !articleUrl.startsWith('http') && !articleUrl.startsWith('#')) {
        articleUrl = `https://${articleUrl}`;
      }

      let category = (categoryIdx !== -1 && row[categoryIdx]) ? row[categoryIdx].trim() : '';
      if (!category) {
        category = this.classifyCategory(headline);
      }

      const date = (dateIdx !== -1 && row[dateIdx]) ? row[dateIdx].trim() : new Date().toISOString().split('T')[0];
      const summary = (summaryIdx !== -1 && row[summaryIdx]) ? row[summaryIdx].trim() : headline;

      articles.push({
        id: `sheet-${Date.now()}-${r}`,
        "Headline": headline,
        "Image URL": imageUrl,
        "Author": author,
        "Article URL": articleUrl,
        Category: category,
        Date: date,
        ReadTime: `${Math.max(2, Math.min(8, Math.round(headline.length / 14)))} min read`,
        Summary: summary,
        Source: 'Google Sheet Feed'
      });
    }

    return articles;
  }

  /**
   * Helper to normalize Google Sheets URL to a direct CSV export link
   */
  normalizeGoogleSheetUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const cleanUrl = url.trim();

    // Direct CSV export link already
    if (cleanUrl.includes('export?format=csv') || cleanUrl.includes('pub?output=csv')) {
      return cleanUrl;
    }

    // Published to web format: /spreadsheets/d/e/.../pubhtml -> /pub?output=csv
    if (cleanUrl.includes('/pubhtml')) {
      return cleanUrl.replace(/\/pubhtml.*$/, '/pub?output=csv');
    }

    // Edit format: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
    const match = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const sheetId = match[1];
      const gidMatch = cleanUrl.match(/[#&?]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    }

    return cleanUrl;
  }

  /**
   * Fetch and sync live data from Google Sheet URL
   */
  async syncFromGoogleSheet(rawSheetUrl) {
    const csvUrl = this.normalizeGoogleSheetUrl(rawSheetUrl);
    if (!csvUrl) throw new Error('Invalid Google Sheet URL provided.');

    let csvData = null;

    // First try direct fetch
    try {
      const directResp = await fetch(csvUrl, { cache: 'no-store' });
      if (directResp.ok) {
        csvData = await directResp.text();
      }
    } catch (e) {
      console.info('Direct fetch CORS restricted, trying proxy endpoint...');
    }

    // If direct fetch fails, fallback to local backend proxy endpoint
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

    // Save and update config
    this.saveArticles(parsedArticles);
    const config = this.getConfig();
    config.sheetUrl = rawSheetUrl;
    config.lastSyncTime = new Date().toISOString();
    this.saveConfig(config);

    return parsedArticles;
  }

  /**
   * Fetch and sync live data from N8N Webhook endpoint
   */
  async syncFromN8NWebhook(webhookUrl) {
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      throw new Error('Invalid N8N Webhook URL.');
    }

    const resp = await fetch(webhookUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!resp.ok) {
      throw new Error(`N8N Webhook returned HTTP ${resp.status}`);
    }

    const data = await resp.json();
    let rawItems = [];

    if (Array.isArray(data)) {
      rawItems = data;
    } else if (data.results && Array.isArray(data.results)) {
      rawItems = data.results;
    } else if (data.data && Array.isArray(data.data)) {
      rawItems = data.data;
    } else if (data.items && Array.isArray(data.items)) {
      rawItems = data.items;
    } else {
      rawItems = [data];
    }

    const normalized = rawItems.map((item, idx) => {
      const obj = item.json || item;
      const headline = obj.Headline || obj.headline || obj.title || obj.Title || 'Untitled Story';
      const imageUrl = obj['Image URL'] || obj.imageUrl || obj.image || obj.Image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80';
      const author = obj.Author || obj.author || obj.byline || 'N8N News Desk';
      const articleUrl = obj['Article URL'] || obj.articleUrl || obj.url || obj.link || '#';
      const category = obj.Category || obj.category || this.classifyCategory(headline);

      return {
        id: `n8n-${Date.now()}-${idx}`,
        "Headline": headline,
        "Image URL": imageUrl,
        "Author": author,
        "Article URL": articleUrl,
        Category: category,
        Date: obj.Date || new Date().toISOString().split('T')[0],
        ReadTime: obj.ReadTime || `${Math.max(2, Math.min(8, Math.round(headline.length / 15)))} min read`,
        Summary: obj.Summary || headline,
        Source: 'N8N Automated Pipeline'
      };
    });

    this.saveArticles(normalized);
    const config = this.getConfig();
    config.n8nWebhookUrl = webhookUrl;
    config.lastSyncTime = new Date().toISOString();
    this.saveConfig(config);

    return normalized;
  }
}

// Global Singleton Instance
window.NewsSync = new NewsSyncEngine();
