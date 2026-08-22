/**
 * Main Application Controller - Coordinates Event Handlers, Modals, Theme, and Integrations
 */

class NewsAppUI {
  constructor() {
    this.initTheme();
    this.initEventListeners();
    this.initLiveDate();
    this.init();
  }

  init() {
    window.NewsRenderer.updateBookmarkBadges();
    window.NewsRenderer.refreshCurrentView();

    // Check if URL has category or query parameter
    const params = new URLSearchParams(window.location.search);
    if (params.has('cat')) {
      this.setCategory(params.get('cat'));
    }
    if (params.has('q')) {
      const q = params.get('q');
      const searchInput = document.getElementById('globalSearchInput');
      if (searchInput) searchInput.value = q;
      window.NewsRenderer.searchQuery = q;
      window.NewsRenderer.refreshCurrentView();
    }
  }

  // Theme Management (Dark / Light)
  initTheme() {
    const savedTheme = localStorage.getItem('newssphere_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeToggleIcon(savedTheme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('newssphere_theme', next);
    this.updateThemeToggleIcon(next);
    window.NewsRenderer.showToast(`Switched to ${next} mode`, 'info');
  }

  updateThemeToggleIcon(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
  }

  // Header Live Date
  initLiveDate() {
    const dateEl = document.getElementById('headerLiveDate');
    if (!dateEl) return;

    const updateDate = () => {
      const now = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      dateEl.textContent = now.toLocaleDateString('en-US', options);
    };

    updateDate();
    setInterval(updateDate, 60000);
  }

  // Setup Event Listeners
  initEventListeners() {
    // Live Search
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          window.NewsRenderer.searchQuery = e.target.value;
          window.NewsRenderer.renderMainContent();
        }, 150);
      });
    }

    // Sort Dropdown
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        window.NewsRenderer.sortBy = e.target.value;
        window.NewsRenderer.renderMainContent();
      });
    }

    // View Switcher Buttons
    const viewBtns = document.querySelectorAll('.view-toggle-btn');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-view');
        window.NewsRenderer.currentViewMode = mode;
        window.NewsRenderer.renderMainContent();
      });
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const s = document.getElementById('globalSearchInput');
        if (s) {
          s.focus();
          s.select();
        }
      } else if (e.key === 'Escape') {
        this.closeAllModals();
      } else if ((e.key === 'b' || e.key === 'B') && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        this.toggleBookmarksDrawer();
      }
    });

    // Close Modals on Backdrop Click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeAllModals();
        }
      });
    });
  }

  // Set Category Filter
  setCategory(categoryKey) {
    window.NewsRenderer.currentCategory = categoryKey;
    window.NewsRenderer.renderCategoryPills();
    window.NewsRenderer.renderMainContent();

    // Scroll smoothly to main news section
    const mainSection = document.getElementById('newsMainContainer');
    if (mainSection) {
      mainSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Clear Search and Filters
  clearSearchAndFilters() {
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) searchInput.value = '';
    window.NewsRenderer.searchQuery = '';
    window.NewsRenderer.currentCategory = 'all';
    window.NewsRenderer.renderCategoryPills();
    window.NewsRenderer.renderMainContent();
  }

  // Reader Modal Controls
  openReaderModal(id) {
    window.NewsRenderer.openReaderModal(id);
  }

  closeReaderModal() {
    window.NewsRenderer.closeReaderModal();
  }

  toggleSpeech() {
    window.NewsRenderer.toggleSpeech();
  }

  toggleBookmark(id) {
    window.NewsRenderer.toggleBookmark(id);
  }

  shareArticle(id) {
    window.NewsRenderer.shareArticle(id);
  }

  // Bookmarks Drawer
  toggleBookmarksDrawer() {
    const drawer = document.getElementById('bookmarksDrawer');
    if (!drawer) return;
    drawer.classList.toggle('active');
    if (drawer.classList.contains('active')) {
      window.NewsRenderer.renderBookmarksDrawer();
    }
  }

  closeBookmarksDrawer() {
    const drawer = document.getElementById('bookmarksDrawer');
    if (drawer) drawer.classList.remove('active');
  }

  clearAllBookmarks() {
    if (confirm('Are you sure you want to clear all bookmarked articles?')) {
      localStorage.removeItem(window.NewsRenderer.bookmarksKey);
      window.NewsRenderer.updateBookmarkBadges();
      window.NewsRenderer.renderBookmarksDrawer();
      window.NewsRenderer.refreshCurrentView();
      window.NewsRenderer.showToast('Bookmarks cleared', 'info');
    }
  }

  // Sync Hub Modal
  openSyncModal(activeTab = 'sheet') {
    const modal = document.getElementById('syncHubModal');
    if (!modal) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Populate existing config
    const config = window.NewsSync.getConfig();
    const sheetInput = document.getElementById('sheetUrlInput');
    const webhookInput = document.getElementById('webhookUrlInput');
    if (sheetInput && config.sheetUrl) sheetInput.value = config.sheetUrl;
    if (webhookInput && config.n8nWebhookUrl) webhookInput.value = config.n8nWebhookUrl;

    this.switchSyncTab(activeTab);
  }

  closeSyncModal() {
    const modal = document.getElementById('syncHubModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  switchSyncTab(tabId) {
    document.querySelectorAll('.sync-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.sync-tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });
  }

  // 1. Trigger Google Sheet Live Sync
  async handleGoogleSheetSync() {
    const input = document.getElementById('sheetUrlInput');
    const statusBox = document.getElementById('sheetSyncStatus');
    const syncBtn = document.getElementById('sheetSyncBtn');
    if (!input || !statusBox || !syncBtn) return;

    const url = input.value.trim();
    if (!url) {
      statusBox.innerHTML = `<div class="status-badge error">Please enter a valid Google Sheet or CSV URL.</div>`;
      return;
    }

    try {
      syncBtn.disabled = true;
      syncBtn.innerHTML = `⏳ Syncing Articles...`;
      statusBox.innerHTML = `<div class="status-badge loading">Fetching and parsing Google Sheet data...</div>`;

      const articles = await window.NewsSync.syncFromGoogleSheet(url);

      statusBox.innerHTML = `
        <div class="status-badge success">
          ✓ Successfully synced <strong>${articles.length}</strong> news articles from Google Sheet!
        </div>
      `;

      window.NewsRenderer.refreshCurrentView();
      window.NewsRenderer.showToast(`Synced ${articles.length} articles from Google Sheet!`, 'success');

      setTimeout(() => {
        this.closeSyncModal();
      }, 1200);

    } catch (err) {
      statusBox.innerHTML = `
        <div class="status-badge error">
          ⚠️ Sync failed: ${window.NewsRenderer.escapeHtml(err.message)}
        </div>
      `;
    } finally {
      syncBtn.disabled = false;
      syncBtn.innerHTML = `📥 Sync Google Sheet Now`;
    }
  }

  // 2. Trigger N8N Webhook Sync
  async handleN8NWebhookSync() {
    const input = document.getElementById('webhookUrlInput');
    const statusBox = document.getElementById('n8nSyncStatus');
    const syncBtn = document.getElementById('n8nSyncBtn');
    if (!input || !statusBox || !syncBtn) return;

    const url = input.value.trim();
    if (!url) {
      statusBox.innerHTML = `<div class="status-badge error">Please enter an N8N Webhook endpoint URL.</div>`;
      return;
    }

    try {
      syncBtn.disabled = true;
      syncBtn.innerHTML = `⏳ Connecting to N8N...`;
      statusBox.innerHTML = `<div class="status-badge loading">Querying N8N workflow webhook...</div>`;

      const articles = await window.NewsSync.syncFromN8NWebhook(url);

      statusBox.innerHTML = `
        <div class="status-badge success">
          ✓ Successfully pulled <strong>${articles.length}</strong> news articles from N8N!
        </div>
      `;

      window.NewsRenderer.refreshCurrentView();
      window.NewsRenderer.showToast(`Pulled ${articles.length} news articles from N8N pipeline!`, 'success');

      setTimeout(() => {
        this.closeSyncModal();
      }, 1200);

    } catch (err) {
      statusBox.innerHTML = `
        <div class="status-badge error">
          ⚠️ N8N sync failed: ${window.NewsRenderer.escapeHtml(err.message)}
        </div>
      `;
    } finally {
      syncBtn.disabled = false;
      syncBtn.innerHTML = `⚡ Sync from N8N Pipeline`;
    }
  }

  // 3. Test Raw HTML Scraper Regex Playground
  handleRunRegexScraper() {
    const input = document.getElementById('rawHtmlInput');
    const previewContainer = document.getElementById('scraperResultsPreview');
    const importBtn = document.getElementById('importScrapedBtn');
    if (!input || !previewContainer) return;

    const rawHtml = input.value.trim();
    if (!rawHtml) {
      previewContainer.innerHTML = `<div class="status-badge error">Please paste some HTML content to test the scraper regex.</div>`;
      return;
    }

    const results = window.NewsSync.parseHtmlUsingRegex(rawHtml);
    this.cachedScrapedResults = results;

    if (results.length === 0) {
      previewContainer.innerHTML = `
        <div class="status-badge error">
          ⚠️ No matching articles found. Ensure the HTML contains headlines matching:<br>
          <code>&lt;h3 class="title..."&gt;&lt;a href="URL"&gt;HEADLINE&lt;/a&gt;&lt;/h3&gt;</code>
        </div>
      `;
      if (importBtn) importBtn.style.display = 'none';
      return;
    }

    let previewHtml = `
      <div class="status-badge success">
        ✓ Extracted <strong>${results.length}</strong> articles using regex parser!
      </div>
      <div class="scraped-results-list">
    `;

    results.slice(0, 5).forEach((item, i) => {
      previewHtml += `
        <div class="scraped-item-preview">
          <span class="preview-num">#${i + 1}</span>
          <div class="preview-details">
            <strong>${window.NewsRenderer.escapeHtml(item.Headline)}</strong>
            <div class="preview-meta">
              <span>✍️ ${window.NewsRenderer.escapeHtml(item.Author)}</span>
              <span>🏷️ ${item.Category}</span>
              <span>🔗 <a href="${item['Article URL']}" target="_blank">Source Link</a></span>
            </div>
          </div>
        </div>
      `;
    });

    if (results.length > 5) {
      previewHtml += `<div class="preview-more">+ ${results.length - 5} more articles found</div>`;
    }

    previewHtml += `</div>`;
    previewContainer.innerHTML = previewHtml;

    if (importBtn) {
      importBtn.style.display = 'inline-flex';
      importBtn.textContent = `📥 Import ${results.length} Scraped Articles to Feed`;
    }
  }

  // Import Scraped articles into main news storage
  importScrapedArticles() {
    if (!this.cachedScrapedResults || this.cachedScrapedResults.length === 0) return;

    const existing = window.NewsSync.getAllArticles();
    const merged = [...this.cachedScrapedResults, ...existing];
    window.NewsSync.saveArticles(merged);

    window.NewsRenderer.refreshCurrentView();
    window.NewsRenderer.showToast(`Imported ${this.cachedScrapedResults.length} articles to main news feed!`, 'success');
    this.closeSyncModal();
  }

  // Reset to default sample dataset
  handleResetDefaults() {
    if (confirm('Reset news feed back to the original pre-loaded curated articles?')) {
      window.NewsSync.resetToDefaults();
      window.NewsRenderer.refreshCurrentView();
      window.NewsRenderer.showToast('Reset to default news dataset', 'info');
      this.closeSyncModal();
    }
  }

  // Image fallback handler (generates category specific fallback)
  handleImageFallback(imgElement, category = 'General') {
    imgElement.onerror = null; // prevent infinite loops
    imgElement.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';
    imgElement.classList.add('fallback-loaded');
  }

  // Close all modals
  closeAllModals() {
    this.closeReaderModal();
    this.closeSyncModal();
    this.closeBookmarksDrawer();
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.NewsUI = new NewsAppUI();
});
