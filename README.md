# 🌐 NewsSphere — Global Real-time Editorial Portal

> **"Independent Global Journalism Powered by Open Automations."**  
> A high-performance, responsive, and categorized news portal integrated with **Google Sheets Live Sync**, **N8N Automated Webhook Pipelines**, and **Client/Server HTML Regex Scrapers**.

---

## 📌 1. Project Overview

**NewsSphere** is a modern editorial news application engineered to consume, normalize, categorize, and render real-time news articles from multiple data streams:
- **Google Sheets published CSV/JSON streams** (live 1-click sync)
- **N8N Automation Workflows** with HTML scraping Code nodes
- **Client & Server Regex Extraction Engines** using custom regular expressions to extract `Headline`, `Image URL`, `Author`, and `Article URL`
- **Categorization Engine**: Groups articles into **Political (National & International)**, **Sports**, **Entertainment**, **Science & Tech**, **Business & Economy**, and **Climate & World**.

---

## 📋 2. Article Data Schema

Each news article complies with the following structured JSON schema:

```json
{
  "id": "pol-nat-1",
  "Headline": "Parliament Passes Landmark Clean Energy Transition Bill",
  "Image URL": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
  "Author": "Alistair Vance",
  "Article URL": "https://apnews.com/hub/politics",
  "Category": "Political: National",
  "Date": "2026-08-22",
  "ReadTime": "4 min read",
  "Summary": "Lawmakers reached a historic consensus on the National Renewable Modernization Act...",
  "Source": "Capitol Dispatch"
}
```

---

## 🧩 3. Key Features

### 📰 Editorial Layouts & News Cards
1. **Interactive News Cards**:
   - High-resolution cover photo with automated fallback handling.
   - Headline prominently displayed as the card title.
   - Author byline with avatar and timestamp.
   - Direct external link button opening the original publisher URL (`target="_blank"`).
   - Instant Quick Reader preview with Text-to-Speech (TTS) voice synthesis.
   - Bookmarking and native Web Share API support.
2. **Category Swimlanes & Filter Pills**:
   - 🏛️ **National Politics**
   - 🌐 **International Politics**
   - ⚽ **Sports**
   - 🎬 **Entertainment**
   - 🚀 **Science & Tech**
   - 💼 **Business & Economy**
   - 🌍 **Climate & World**
3. **Multi-View Modes**:
   - **Magazine Layout**: Hero lead story + 3 trending spotlights + multi-column grid.
   - **Category Swimlanes**: Dedicated categorized sections with story count badges.
   - **Compact Feed**: High-density reading layout.
4. **Live Search & Sort**: Real-time debounced search by headline, author, or topic + sorting (Latest, Oldest, Author A-Z, Headline).
5. **Dark / Light Theme Switcher**: Persistent theme toggle.

---

## ⚡ 4. Google Sheets & N8N.io Integration

### A. Google Sheets Live Sync
1. In Google Sheets, prepare columns: `Headline`, `Image URL`, `Author`, `Article URL`, `Category`.
2. Click **File ➔ Share ➔ Publish to web ➔ CSV**.
3. In NewsSphere, click **📥 Connect Sheet / N8N**, paste the CSV URL, and click **Sync Google Sheet Now**.

### B. N8N Webhook Pipeline (`n8n-workflows/news-scraper-workflow.json`)
The included N8N workflow automates:
1. **HTTP Request Node**: Fetches raw HTML from target news publications.
2. **Code Node**: Uses the regex pattern to extract `Headline`, `Image URL`, `Author`, and `Article URL`:
```javascript
const html = $input.first().json.data;
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
  const imageUrl = imgMatches.length ? imgMatches[imgMatches.length - 1][1].replace(/&amp;/g, '&') : null;
  const authorMatches = [...context.matchAll(/class="person-name[^"]*"[^>]*>\s*([^<]+?)\s*<\/a>/g)];
  const author = authorMatches.length ? authorMatches[authorMatches.length - 1][1].trim() : null;

  results.push({ "Headline": headline, "Image URL": imageUrl, "Author": author, "Article URL": articleUrl });
}
return results.map(item => ({ json: item }));
```
3. **Google Sheets Node**: Appends extracted articles directly into your Google Sheet.
4. **Webhook Output**: Forwards new dispatches in real-time to the `/api/webhook/news` endpoint on the server.

---

## 🚀 5. Running Locally

### Option 1: Node.js (Express)
```bash
npm install
npm start
```
Open [http://localhost:3000](http://localhost:3000)

### Option 2: Python (Zero External Dependencies)
```bash
python3 app.py
```
Open [http://localhost:3000](http://localhost:3000)

---

## ☁️ 6. Deployment on Render

This repository is pre-configured for Render deployment via `render.yaml` or manual Web Service creation:
- **Build Command**: *(empty)*
- **Start Command**: `node server.js` or `python3 app.py`
- **Environment**: Node / Python 3

---

## 📄 License
MIT License © 2026 NewsSphere Media.
