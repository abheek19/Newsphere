/**
 * Main Application Controller - Coordinates Event Handlers, Modals, Theme, and Google Sheets Sync
 */

class NewsAppUI {
  constructor() {
    this.initTheme();
    this.initEventListeners();
    this.initLiveDate();
    this.init();
  }

  async init() {
    window.NewsRenderer.updateBookmarkBadges();
    window.NewsRenderer.refreshCurrentView();

    // Check URL parameters
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

    // Try fetching fresh data from Google Sheet in the background
    try {
      await window.NewsSync.syncFromGoogleSheet();
      window.NewsRenderer.refreshCurrentView();
    } catch (e) {
      console.info('Loaded cached Google Sheet articles');
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

  // Event Listeners
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

    // Modal Backdrop Clicks
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeAllModals();
        }
      });
    });
  }

  // Category Filter
  setCategory(categoryKey) {
    window.NewsRenderer.currentCategory = categoryKey;
    window.NewsRenderer.renderCategoryPills();
    window.NewsRenderer.renderMainContent();

    const mainSection = document.getElementById('newsMainContainer');
    if (mainSection) {
      mainSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  clearSearchAndFilters() {
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) searchInput.value = '';
    window.NewsRenderer.searchQuery = '';
    window.NewsRenderer.currentCategory = 'all';
    window.NewsRenderer.renderCategoryPills();
    window.NewsRenderer.renderMainContent();
  }

  // Reader Modal
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

  // Google Sheet Modal
  openSyncModal() {
    const modal = document.getElementById('syncHubModal');
    if (!modal) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const input = document.getElementById('sheetUrlInput');
    if (input) {
      input.value = 'https://docs.google.com/spreadsheets/d/1MolkiancFTaDSWEW1rYtg0yY7XP6R65pJh7iPsRtpXs/edit?usp=sharing';
    }
  }

  closeSyncModal() {
    const modal = document.getElementById('syncHubModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Sync Google Sheet Now
  async handleGoogleSheetSync() {
    const statusBox = document.getElementById('sheetSyncStatus');
    const syncBtn = document.getElementById('sheetSyncBtn');
    const input = document.getElementById('sheetUrlInput');
    if (!statusBox || !syncBtn) return;

    const url = (input && input.value.trim()) ? input.value.trim() : window.NewsSync.defaultSheetUrl;

    try {
      syncBtn.disabled = true;
      syncBtn.innerHTML = `⏳ Refreshing from Google Sheet...`;
      statusBox.innerHTML = `<div class="status-badge loading">Fetching live rows from Google Sheet...</div>`;

      const articles = await window.NewsSync.syncFromGoogleSheet(url);

      statusBox.innerHTML = `
        <div class="status-badge success">
          ✓ Successfully loaded <strong>${articles.length}</strong> live articles from Google Sheet!
        </div>
      `;

      window.NewsRenderer.refreshCurrentView();
      window.NewsRenderer.showToast(`Updated ${articles.length} articles from Google Sheet!`, 'success');

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
      syncBtn.innerHTML = `🔄 Refresh from Google Sheet`;
    }
  }

  // Reset to default dataset
  handleResetDefaults() {
    window.NewsSync.resetToDefaults();
    window.NewsRenderer.refreshCurrentView();
    window.NewsRenderer.showToast('Reset to original Google Sheet dataset', 'info');
    this.closeSyncModal();
  }

  // Image fallback handler
  handleImageFallback(imgElement, category = 'General') {
    imgElement.onerror = null;
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

document.addEventListener('DOMContentLoaded', () => {
  window.NewsUI = new NewsAppUI();
});
