/**
 * NewsRenderer - Handles UI rendering, Category grouping, Card views, Reader Modal, Bookmarks, and Interactions.
 */

class NewsRenderer {
  constructor() {
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.sortBy = 'latest'; // 'latest' | 'oldest' | 'author' | 'headline'
    this.currentViewMode = 'magazine'; // 'magazine' | 'categories' | 'compact'
    this.bookmarksKey = 'newssphere_bookmarks_v1';
    this.speechUtterance = null;
    this.isSpeaking = false;
    this.fontSizeLevel = 1; // 0 = small, 1 = normal, 2 = large

    this.categoryMeta = {
      'all': { label: 'All Headlines', icon: '📰', color: '#dc2626' },
      'Political: National': { label: 'National Politics', icon: '🏛️', color: '#2563eb' },
      'Political: International': { label: 'International Politics', icon: '🌐', color: '#7c3aed' },
      'Sports': { label: 'Sports', icon: '⚽', color: '#059669' },
      'Entertainment': { label: 'Entertainment', icon: '🎬', color: '#db2777' },
      'Science & Tech': { label: 'Science & Tech', icon: '🚀', color: '#0284c7' },
      'Business & Economy': { label: 'Business & Economy', icon: '💼', color: '#d97706' },
      'Climate & World': { label: 'Climate & World', icon: '🌍', color: '#16a34a' }
    };
  }

  // Bookmarks Management
  getBookmarks() {
    try {
      const raw = localStorage.getItem(this.bookmarksKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  isBookmarked(articleId) {
    const bookmarks = this.getBookmarks();
    return bookmarks.some(b => b.id === articleId);
  }

  toggleBookmark(articleId) {
    const all = window.NewsSync.getAllArticles();
    const article = all.find(a => a.id === articleId);
    if (!article) return false;

    let bookmarks = this.getBookmarks();
    const existingIndex = bookmarks.findIndex(b => b.id === articleId);

    if (existingIndex >= 0) {
      bookmarks.splice(existingIndex, 1);
      this.showToast('Article removed from bookmarks', 'info');
    } else {
      bookmarks.unshift(article);
      this.showToast('Article saved to your bookmarks!', 'success');
    }

    localStorage.setItem(this.bookmarksKey, JSON.stringify(bookmarks));
    this.updateBookmarkBadges();
    this.renderBookmarksDrawer();
    this.refreshCurrentView();
    return true;
  }

  updateBookmarkBadges() {
    const count = this.getBookmarks().length;
    const badges = document.querySelectorAll('.bookmark-count-badge');
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'inline-flex' : 'none';
    });
  }

  // Get articles filtered by current active category, search term, and sorting
  getFilteredArticles() {
    const all = window.NewsSync.getAllArticles();
    let filtered = all.filter(article => {
      // Category check
      if (this.currentCategory !== 'all') {
        const catA = (article.Category || '').toLowerCase();
        const catB = this.currentCategory.toLowerCase();
        if (!catA.includes(catB) && !catB.includes(catA)) {
          return false;
        }
      }

      // Search check
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        const matchHeadline = (article.Headline || '').toLowerCase().includes(q);
        const matchAuthor = (article.Author || '').toLowerCase().includes(q);
        const matchCategory = (article.Category || '').toLowerCase().includes(q);
        const matchSummary = (article.Summary || '').toLowerCase().includes(q);
        return matchHeadline || matchAuthor || matchCategory || matchSummary;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      if (this.sortBy === 'latest') return new Date(b.Date || 0) - new Date(a.Date || 0);
      if (this.sortBy === 'oldest') return new Date(a.Date || 0) - new Date(b.Date || 0);
      if (this.sortBy === 'author') return (a.Author || '').localeCompare(b.Author || '');
      if (this.sortBy === 'headline') return (a.Headline || '').localeCompare(b.Headline || '');
      return 0;
    });

    return filtered;
  }

  // Render the Breaking News Ticker in the header
  renderTicker() {
    const tickerTrack = document.getElementById('tickerTrack');
    if (!tickerTrack) return;

    const all = window.NewsSync.getAllArticles().slice(0, 8);
    if (all.length === 0) {
      tickerTrack.innerHTML = `<span class="ticker-item">Live Global Feed Connected • Stay Updated 24/7</span>`;
      return;
    }

    const itemsHtml = all.map(a => `
      <div class="ticker-item" onclick="window.NewsUI.openReaderModal('${a.id}')">
        <span class="ticker-tag">${a.Category || 'BREAKING'}</span>
        <span class="ticker-text">${this.escapeHtml(a.Headline)}</span>
        <span class="ticker-author">by ${this.escapeHtml(a.Author || 'News Desk')}</span>
      </div>
    `).join(' <span class="ticker-sep">✦</span> ');

    tickerTrack.innerHTML = itemsHtml + ' <span class="ticker-sep">✦</span> ' + itemsHtml; // duplicated for smooth loop
  }

  // Render Category Navigation Pills with article counters
  renderCategoryPills() {
    const container = document.getElementById('categoryPillsContainer');
    if (!container) return;

    const allArticles = window.NewsSync.getAllArticles();
    const categories = [
      'all',
      'Political: National',
      'Political: International',
      'Sports',
      'Entertainment',
      'Science & Tech',
      'Business & Economy',
      'Climate & World'
    ];

    const html = categories.map(catKey => {
      const meta = this.categoryMeta[catKey] || { label: catKey, icon: '📌', color: '#64748b' };
      const isActive = this.currentCategory === catKey;
      
      let count = 0;
      if (catKey === 'all') {
        count = allArticles.length;
      } else {
        count = allArticles.filter(a => (a.Category || '').toLowerCase().includes(catKey.toLowerCase())).length;
      }

      return `
        <button class="cat-pill-btn ${isActive ? 'active' : ''}" 
                data-category="${catKey}" 
                onclick="window.NewsUI.setCategory('${catKey}')">
          <span class="cat-icon">${meta.icon}</span>
          <span class="cat-label">${meta.label}</span>
          <span class="cat-badge">${count}</span>
        </button>
      `;
    }).join('');

    container.innerHTML = html;
  }

  // Render Main Content according to active view mode
  renderMainContent() {
    const container = document.getElementById('newsMainContainer');
    if (!container) return;

    const articles = this.getFilteredArticles();

    if (articles.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon">🔍</div>
          <h3>No matching news articles found</h3>
          <p>Try refining your search query or selecting a different news category.</p>
          <div class="empty-actions">
            <button class="btn btn-secondary" onclick="window.NewsUI.clearSearchAndFilters()">
              Clear Filters
            </button>
            <button class="btn btn-primary" onclick="window.NewsUI.openSyncModal()">
              📥 Sync Live Google Sheet / N8N
            </button>
          </div>
        </div>
      `;
      return;
    }

    if (this.currentViewMode === 'magazine' && this.currentCategory === 'all' && !this.searchQuery) {
      this.renderMagazineLayout(container, articles);
    } else if (this.currentViewMode === 'categories' && this.currentCategory === 'all' && !this.searchQuery) {
      this.renderGroupedCategoriesLayout(container, articles);
    } else {
      this.renderStandardGridLayout(container, articles);
    }
  }

  // 1. Magazine / Editorial Layout
  renderMagazineLayout(container, articles) {
    const featured = articles[0];
    const topPicks = articles.slice(1, 4);
    const rest = articles.slice(4);

    let html = `
      <section class="editorial-hero-section">
        <div class="hero-primary-card" onclick="window.NewsUI.openReaderModal('${featured.id}')">
          <div class="hero-image-wrap">
            <img src="${this.escapeHtml(featured['Image URL'])}" 
                 alt="${this.escapeHtml(featured.Headline)}"
                 onerror="window.NewsUI.handleImageFallback(this, '${featured.Category}')"
                 loading="lazy">
            <div class="hero-badge-overlay">
              <span class="badge-category" style="background:${this.getCategoryColor(featured.Category)}">
                ${featured.Category || 'Lead Story'}
              </span>
              <span class="badge-read">${featured.ReadTime || '4 min'}</span>
            </div>
          </div>
          <div class="hero-content">
            <span class="hero-kicker">🔥 Top Story of the Day</span>
            <h2 class="hero-headline">${this.escapeHtml(featured.Headline)}</h2>
            <p class="hero-summary">${this.escapeHtml(featured.Summary || '')}</p>
            <div class="card-byline">
              <div class="author-avatar">${this.getAuthorInitials(featured.Author)}</div>
              <div class="author-info">
                <span class="author-name">By ${this.escapeHtml(featured.Author || 'News Desk')}</span>
                <span class="article-date">${featured.Date || 'Today'} • ${featured.Source || 'Apex News'}</span>
              </div>
            </div>
            <div class="hero-action-bar" onclick="event.stopPropagation()">
              <a href="${this.escapeHtml(featured['Article URL'])}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">
                Read Full Source ↗
              </a>
              <button class="btn btn-sm btn-outline" onclick="window.NewsUI.openReaderModal('${featured.id}')">
                📖 Quick Reader
              </button>
              <button class="btn-icon bookmark-btn ${this.isBookmarked(featured.id) ? 'bookmarked' : ''}" 
                      title="Save Article" 
                      onclick="window.NewsUI.toggleBookmark('${featured.id}')">
                ${this.isBookmarked(featured.id) ? '★' : '☆'}
              </button>
              <button class="btn-icon share-btn" title="Share Article" onclick="window.NewsUI.shareArticle('${featured.id}')">
                🔗
              </button>
            </div>
          </div>
        </div>

        <div class="hero-secondary-column">
          <h3 class="column-header">⚡ Trending Spotlights</h3>
          <div class="trending-cards-stack">
            ${topPicks.map(a => this.renderTrendingCardHtml(a)).join('')}
          </div>
        </div>
      </section>

      <div class="section-divider">
        <h3 class="section-title">📰 All Latest Dispatches (${articles.length})</h3>
        <span class="section-subtitle">Real-time reports sorted by relevance and publication</span>
      </div>

      <div class="news-cards-grid">
        ${rest.map(a => this.renderCardHtml(a)).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  // 2. Grouped Category Swimlanes Layout
  renderGroupedCategoriesLayout(container, articles) {
    const categories = [
      'Political: National',
      'Political: International',
      'Sports',
      'Entertainment',
      'Science & Tech',
      'Business & Economy',
      'Climate & World'
    ];

    let html = `
      <div class="categories-view-wrapper">
    `;

    categories.forEach(catName => {
      const catArticles = articles.filter(a => (a.Category || '').toLowerCase().includes(catName.toLowerCase()));
      if (catArticles.length === 0) return;

      const meta = this.categoryMeta[catName] || { icon: '📌', label: catName, color: '#2563eb' };

      html += `
        <section class="category-swimlane-section" id="cat-${catName.replace(/[^a-zA-Z0-9]/g, '-')}">
          <div class="swimlane-header">
            <div class="swimlane-title-group">
              <span class="swimlane-icon" style="background:${meta.color}20; color:${meta.color}">${meta.icon}</span>
              <div>
                <h3 class="swimlane-title">${meta.label}</h3>
                <span class="swimlane-count">${catArticles.length} active coverage stories</span>
              </div>
            </div>
            <button class="btn btn-sm btn-ghost" onclick="window.NewsUI.setCategory('${catName}')">
              View All ${meta.label} →
            </button>
          </div>

          <div class="swimlane-grid">
            ${catArticles.map(a => this.renderCardHtml(a)).join('')}
          </div>
        </section>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  // 3. Standard Grid / Filter Layout
  renderStandardGridLayout(container, articles) {
    const isCompact = this.currentViewMode === 'compact';
    const gridClass = isCompact ? 'news-cards-compact-feed' : 'news-cards-grid';

    let headerHtml = '';
    if (this.currentCategory !== 'all' || this.searchQuery) {
      const catMeta = this.categoryMeta[this.currentCategory] || { label: this.currentCategory, icon: '📌' };
      headerHtml = `
        <div class="filter-results-header">
          <div>
            <h2>${catMeta.icon} ${catMeta.label}</h2>
            <p>${articles.length} article${articles.length === 1 ? '' : 's'} available ${this.searchQuery ? `matching "${this.escapeHtml(this.searchQuery)}"` : ''}</p>
          </div>
          ${this.searchQuery || this.currentCategory !== 'all' ? `
            <button class="btn btn-sm btn-secondary" onclick="window.NewsUI.clearSearchAndFilters()">
              ✕ Reset to All News
            </button>
          ` : ''}
        </div>
      `;
    }

    const cardsHtml = articles.map(a => isCompact ? this.renderCompactCardHtml(a) : this.renderCardHtml(a)).join('');

    container.innerHTML = `
      ${headerHtml}
      <div class="${gridClass}">
        ${cardsHtml}
      </div>
    `;
  }

  // Render Single Standard News Card
  renderCardHtml(article) {
    const isSaved = this.isBookmarked(article.id);
    const catColor = this.getCategoryColor(article.Category);

    return `
      <article class="news-card" data-id="${article.id}" onclick="window.NewsUI.openReaderModal('${article.id}')">
        <div class="card-image-wrap">
          <img src="${this.escapeHtml(article['Image URL'])}" 
               alt="${this.escapeHtml(article.Headline)}"
               onerror="window.NewsUI.handleImageFallback(this, '${article.Category}')"
               loading="lazy">
          <div class="card-badges">
            <span class="badge-category" style="background:${catColor}">${article.Category || 'News'}</span>
            <span class="badge-read">${article.ReadTime || '3 min'}</span>
          </div>
        </div>

        <div class="card-body">
          <h4 class="card-title" title="${this.escapeHtml(article.Headline)}">
            ${this.highlightQuery(article.Headline)}
          </h4>
          <p class="card-excerpt">
            ${this.highlightQuery(article.Summary || article.Headline)}
          </p>

          <div class="card-footer">
            <div class="card-byline">
              <div class="author-avatar">${this.getAuthorInitials(article.Author)}</div>
              <div class="author-info">
                <span class="author-name">${this.highlightQuery(article.Author || 'News Desk')}</span>
                <span class="article-date">${article.Date || 'Today'} • ${article.Source || 'Apex'}</span>
              </div>
            </div>

            <div class="card-actions" onclick="event.stopPropagation()">
              <a href="${this.escapeHtml(article['Article URL'])}" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 class="btn-icon external-link-btn" 
                 title="Open Original Article in New Tab">
                ↗
              </a>
              <button class="btn-icon bookmark-btn ${isSaved ? 'bookmarked' : ''}" 
                      title="${isSaved ? 'Remove Bookmark' : 'Bookmark Article'}"
                      onclick="window.NewsUI.toggleBookmark('${article.id}')">
                ${isSaved ? '★' : '☆'}
              </button>
              <button class="btn-icon share-btn" 
                      title="Share Article" 
                      onclick="window.NewsUI.shareArticle('${article.id}')">
                🔗
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  // Render Compact Feed Card
  renderCompactCardHtml(article) {
    const isSaved = this.isBookmarked(article.id);
    const catColor = this.getCategoryColor(article.Category);

    return `
      <article class="compact-news-row" data-id="${article.id}" onclick="window.NewsUI.openReaderModal('${article.id}')">
        <div class="compact-thumb">
          <img src="${this.escapeHtml(article['Image URL'])}" 
               alt="${this.escapeHtml(article.Headline)}"
               onerror="window.NewsUI.handleImageFallback(this, '${article.Category}')"
               loading="lazy">
        </div>
        <div class="compact-body">
          <div class="compact-meta">
            <span class="badge-category-mini" style="color:${catColor}; background:${catColor}15">
              ${article.Category || 'News'}
            </span>
            <span class="compact-date">${article.Date || 'Today'}</span>
            <span class="compact-read">${article.ReadTime || '3 min'}</span>
          </div>
          <h4 class="compact-title">${this.highlightQuery(article.Headline)}</h4>
          <span class="compact-author">By <strong>${this.highlightQuery(article.Author || 'News Desk')}</strong></span>
        </div>
        <div class="compact-actions" onclick="event.stopPropagation()">
          <a href="${this.escapeHtml(article['Article URL'])}" target="_blank" rel="noopener noreferrer" class="btn-icon" title="Original Link">
            ↗
          </a>
          <button class="btn-icon ${isSaved ? 'bookmarked' : ''}" onclick="window.NewsUI.toggleBookmark('${article.id}')">
            ${isSaved ? '★' : '☆'}
          </button>
        </div>
      </article>
    `;
  }

  // Render Trending Side Card
  renderTrendingCardHtml(article) {
    const catColor = this.getCategoryColor(article.Category);

    return `
      <div class="trending-card-item" onclick="window.NewsUI.openReaderModal('${article.id}')">
        <div class="trending-img-wrap">
          <img src="${this.escapeHtml(article['Image URL'])}" 
               alt="${this.escapeHtml(article.Headline)}"
               onerror="window.NewsUI.handleImageFallback(this, '${article.Category}')"
               loading="lazy">
        </div>
        <div class="trending-content">
          <span class="badge-category-mini" style="color:${catColor}; background:${catColor}15">
            ${article.Category || 'Trending'}
          </span>
          <h4 class="trending-title">${this.escapeHtml(article.Headline)}</h4>
          <span class="trending-author">By ${this.escapeHtml(article.Author || 'News Desk')} • ${article.ReadTime || '3 min'}</span>
        </div>
      </div>
    `;
  }

  // Render Saved Bookmarks in Slide-Over Drawer
  renderBookmarksDrawer() {
    const container = document.getElementById('bookmarksList');
    if (!container) return;

    const bookmarks = this.getBookmarks();

    if (bookmarks.length === 0) {
      container.innerHTML = `
        <div class="empty-bookmarks">
          <div class="empty-icon">🔖</div>
          <h4>No Saved Articles Yet</h4>
          <p>Click the star (☆) icon on any news card to save articles for quick access anytime.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = bookmarks.map(a => `
      <div class="bookmark-item-row" onclick="window.NewsUI.openReaderModal('${a.id}')">
        <img src="${this.escapeHtml(a['Image URL'])}" onerror="window.NewsUI.handleImageFallback(this, '${a.Category}')">
        <div class="bookmark-item-info">
          <span class="badge-category-mini">${a.Category || 'News'}</span>
          <h5>${this.escapeHtml(a.Headline)}</h5>
          <span class="bookmark-byline">By ${this.escapeHtml(a.Author || 'News Desk')}</span>
        </div>
        <button class="btn-icon delete-bookmark-btn" 
                title="Remove" 
                onclick="event.stopPropagation(); window.NewsUI.toggleBookmark('${a.id}')">
          ✕
        </button>
      </div>
    `).join('');
  }

  // Reader Modal Functionality with Speech Reader
  openReaderModal(articleId) {
    const all = window.NewsSync.getAllArticles();
    const article = all.find(a => a.id === articleId);
    if (!article) return;

    const modal = document.getElementById('readerModal');
    const content = document.getElementById('readerModalBody');
    if (!modal || !content) return;

    const isSaved = this.isBookmarked(article.id);
    const catColor = this.getCategoryColor(article.Category);

    // Stop existing speech if any
    this.stopSpeech();

    content.innerHTML = `
      <div class="reader-header">
        <div class="reader-meta-bar">
          <span class="badge-category" style="background:${catColor}">${article.Category || 'News'}</span>
          <span class="reader-date">Published ${article.Date || 'Recently'}</span>
          <span class="reader-readtime">⏱️ ${article.ReadTime || '4 min read'}</span>
        </div>
        <h1 class="reader-headline">${this.escapeHtml(article.Headline)}</h1>
        
        <div class="reader-author-strip">
          <div class="author-avatar reader-avatar-lg">${this.getAuthorInitials(article.Author)}</div>
          <div>
            <div class="reader-author-name">Reporting by <strong>${this.escapeHtml(article.Author || 'News Desk')}</strong></div>
            <div class="reader-source-tag">Source: ${this.escapeHtml(article.Source || 'Global News Network')}</div>
          </div>
          
          <div class="reader-controls">
            <button class="btn-icon" id="ttsBtn" title="Listen with Text-to-Speech" onclick="window.NewsUI.toggleSpeech()">
              🔊 Listen
            </button>
            <button class="btn-icon ${isSaved ? 'bookmarked' : ''}" 
                    title="Bookmark" 
                    onclick="window.NewsUI.toggleBookmark('${article.id}')">
              ${isSaved ? '★ Saved' : '☆ Save'}
            </button>
            <button class="btn-icon" title="Share" onclick="window.NewsUI.shareArticle('${article.id}')">
              🔗 Share
            </button>
          </div>
        </div>
      </div>

      <div class="reader-hero-image">
        <img src="${this.escapeHtml(article['Image URL'])}" 
             alt="${this.escapeHtml(article.Headline)}"
             onerror="window.NewsUI.handleImageFallback(this, '${article.Category}')">
        <div class="reader-image-caption">Image via ${article.Source || 'News Wire Service'} • Editorial Archive</div>
      </div>

      <div class="reader-article-content font-size-normal" id="readerArticleContent">
        <p class="reader-lead">
          <strong>${this.escapeHtml(article.Headline.split(' ')[0] || 'REPORT')}</strong> — ${this.escapeHtml(article.Summary || article.Headline)}
        </p>
        <p>
          Correspondents report extensive development regarding this ongoing coverage. Key stakeholders have voiced diverse perspectives, signaling critical policy and socioeconomic considerations moving forward.
        </p>
        <p>
          "This marks a decisive transition point in our strategic evaluation," stated senior industry and governance observers. "The data clearly indicates that proactive measures are yielding measurable results across multiple regional indicators."
        </p>
        <div class="reader-callout">
          <h4>📌 Key Highlights</h4>
          <ul>
            <li>Verified investigative report filed by <strong>${this.escapeHtml(article.Author || 'News Desk')}</strong>.</li>
            <li>Category Classification: <strong>${this.escapeHtml(article.Category || 'General')}</strong>.</li>
            <li>Direct live coverage archived on primary editorial server.</li>
          </ul>
        </div>
      </div>

      <div class="reader-bottom-cta">
        <div>
          <h4>Want to read the full original unedited story?</h4>
          <p>Visit the official publisher source page to explore complete interviews and multimedia.</p>
        </div>
        <a href="${this.escapeHtml(article['Article URL'])}" 
           target="_blank" 
           rel="noopener noreferrer" 
           class="btn btn-primary btn-lg">
          Visit Original Article Page ↗
        </a>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Store active article for speech
    this.activeReaderArticle = article;
  }

  closeReaderModal() {
    const modal = document.getElementById('readerModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    this.stopSpeech();
  }

  // Text-To-Speech Synthesis
  toggleSpeech() {
    if (this.isSpeaking) {
      this.stopSpeech();
      return;
    }

    if (!this.activeReaderArticle || !('speechSynthesis' in window)) {
      this.showToast('Speech synthesis not supported on this browser', 'info');
      return;
    }

    const text = `${this.activeReaderArticle.Headline}. Reporting by ${this.activeReaderArticle.Author || 'our news desk'}. ${this.activeReaderArticle.Summary || ''}`;
    this.speechUtterance = new SpeechSynthesisUtterance(text);
    this.speechUtterance.rate = 1.0;
    this.speechUtterance.pitch = 1.0;

    this.speechUtterance.onstart = () => {
      this.isSpeaking = true;
      const btn = document.getElementById('ttsBtn');
      if (btn) {
        btn.innerHTML = '⏹️ Stop Reading';
        btn.classList.add('speaking');
      }
    };

    this.speechUtterance.onend = () => {
      this.isSpeaking = false;
      const btn = document.getElementById('ttsBtn');
      if (btn) {
        btn.innerHTML = '🔊 Listen';
        btn.classList.remove('speaking');
      }
    };

    this.speechUtterance.onerror = () => {
      this.isSpeaking = false;
      const btn = document.getElementById('ttsBtn');
      if (btn) {
        btn.innerHTML = '🔊 Listen';
        btn.classList.remove('speaking');
      }
    };

    window.speechSynthesis.speak(this.speechUtterance);
  }

  stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    const btn = document.getElementById('ttsBtn');
    if (btn) {
      btn.innerHTML = '🔊 Listen';
      btn.classList.remove('speaking');
    }
  }

  // Share Modal / Clipboard
  async shareArticle(articleId) {
    const all = window.NewsSync.getAllArticles();
    const article = all.find(a => a.id === articleId);
    if (!article) return;

    const shareData = {
      title: article.Headline,
      text: `${article.Headline} (by ${article.Author || 'News Desk'})`,
      url: article['Article URL'] || window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // user dismissed or not allowed, fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      this.showToast('Article URL copied to clipboard!', 'success');
    } catch (e) {
      prompt('Copy article URL:', shareData.url);
    }
  }

  // Helpers
  getCategoryColor(category = '') {
    const match = Object.keys(this.categoryMeta).find(k => k.toLowerCase() === category.toLowerCase());
    return match ? this.categoryMeta[match].color : '#64748b';
  }

  getAuthorInitials(author = '') {
    if (!author) return 'ND';
    const parts = author.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  highlightQuery(text = '') {
    if (!this.searchQuery || !text) return this.escapeHtml(text);
    const escapedText = this.escapeHtml(text);
    const q = this.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${q})`, 'gi');
    return escapedText.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-up`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
      <span class="toast-message">${this.escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  refreshCurrentView() {
    this.renderCategoryPills();
    this.renderMainContent();
    this.renderTicker();
  }
}

window.NewsRenderer = new NewsRenderer();
