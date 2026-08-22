/**
 * NewsSphere / Apex Chronicle - Node.js Express Server
 * Serves frontend static assets and provides proxy endpoints for Google Sheets CSV & N8N webhooks.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { DEFAULT_NEWS_ARTICLES } = require('./public/js/news-data.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory news store initialized with default articles
let newsDatabase = [...DEFAULT_NEWS_ARTICLES];

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'NewsSphere Express Server',
    total_articles: newsDatabase.length,
    timestamp: new Date().toISOString()
  });
});

// REST API: Get News Articles (with category & search filtering)
app.get('/api/news', (req, res) => {
  const { category, q, limit } = req.query;
  let results = [...newsDatabase];

  if (category && category !== 'all') {
    results = results.filter(a => (a.Category || '').toLowerCase().includes(category.toLowerCase()));
  }

  if (q && q.trim()) {
    const term = q.toLowerCase().trim();
    results = results.filter(a => 
      (a.Headline || '').toLowerCase().includes(term) ||
      (a.Author || '').toLowerCase().includes(term) ||
      (a.Category || '').toLowerCase().includes(term) ||
      (a.Summary || '').toLowerCase().includes(term)
    );
  }

  if (limit && !isNaN(parseInt(limit, 10))) {
    results = results.slice(0, parseInt(limit, 10));
  }

  res.json({
    success: true,
    total: results.length,
    articles: results
  });
});

// Google Sheets CSV Proxy (bypasses browser CORS when fetching Google Sheet publish links)
app.get('/api/sync/sheet', async (req, res) => {
  const sheetUrl = req.query.url;
  if (!sheetUrl) {
    return res.status(400).json({ error: 'Missing required "url" parameter.' });
  }

  try {
    const response = await fetch(sheetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Remote sheet returned HTTP ${response.status}: ${response.statusText}`
      });
    }

    const csvText = await response.text();
    res.json({
      success: true,
      url: sheetUrl,
      csv: csvText
    });
  } catch (err) {
    console.error('[Node Proxy Error - Sheet Fetch]:', err.message);
    res.status(500).json({ error: `Failed to fetch Google Sheet: ${err.message}` });
  }
});

// Web Scraper Proxy Endpoint (fetches HTML and runs regex extraction matching user code)
app.post('/api/sync/scrape', async (req, res) => {
  const { targetUrl, rawHtml } = req.body;
  let html = rawHtml;

  if (!html && targetUrl) {
    try {
      const resp = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      html = await resp.text();
    } catch (err) {
      return res.status(500).json({ error: `Failed to scrape target URL: ${err.message}` });
    }
  }

  if (!html) {
    return res.status(400).json({ error: 'Provide either "targetUrl" or "rawHtml" payload.' });
  }

  const results = [];
  const seenUrls = new Set();
  const titleRegex = /<h3 class="title[^"]*">\s*<a href="([^"]+)">\s*([\s\S]*?)\s*<\/a>\s*<\/h3>/g;

  let match;
  while ((match = titleRegex.exec(html)) !== null) {
    const articleUrl = match[1].replace(/&amp;/g, '&');
    const headline = match[2].replace(/\s+/g, ' ').trim();

    if (!headline || seenUrls.has(articleUrl)) continue;
    seenUrls.add(articleUrl);

    const windowStart = Math.max(0, match.index - 3000);
    const context = html.slice(windowStart, match.index);

    const imgMatches = [...context.matchAll(/data-original="([^"]+)"/g)];
    const imageUrl = imgMatches.length ? imgMatches[imgMatches.length - 1][1].replace(/&amp;/g, '&') : 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';

    const authorMatches = [...context.matchAll(/class="person-name[^"]*"[^>]*>\s*([^<]+?)\s*<\/a>/g)];
    const author = authorMatches.length ? authorMatches[authorMatches.length - 1][1].trim() : 'News Desk';

    results.push({
      id: `scraped-${Date.now()}-${results.length + 1}`,
      "Headline": headline,
      "Image URL": imageUrl,
      "Author": author,
      "Article URL": articleUrl,
      "Category": "General News",
      "Date": new Date().toISOString().split('T')[0],
      "Source": "Scraped Feed"
    });
  }

  res.json({
    success: true,
    count: results.length,
    articles: results
  });
});

// N8N Inbound Webhook: Receives scraped news batches from N8N workflows
app.post('/api/webhook/news', (req, res) => {
  const incoming = Array.isArray(req.body) ? req.body : (req.body.articles || [req.body]);
  let addedCount = 0;

  incoming.forEach((item, i) => {
    const obj = item.json || item;
    if (obj.Headline || obj.headline) {
      newsDatabase.unshift({
        id: `webhook-${Date.now()}-${i}`,
        "Headline": obj.Headline || obj.headline,
        "Image URL": obj["Image URL"] || obj.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
        "Author": obj.Author || obj.author || 'N8N News Desk',
        "Article URL": obj["Article URL"] || obj.articleUrl || '#',
        "Category": obj.Category || obj.category || 'General News',
        "Date": obj.Date || new Date().toISOString().split('T')[0],
        "Summary": obj.Summary || obj.summary || obj.Headline || '',
        "Source": 'N8N Live Webhook'
      });
      addedCount++;
    }
  });

  res.json({
    success: true,
    added: addedCount,
    total_in_database: newsDatabase.length,
    message: `Received ${addedCount} articles from N8N pipeline.`
  });
});

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 NewsSphere Server running at http://localhost:${PORT}`);
});
