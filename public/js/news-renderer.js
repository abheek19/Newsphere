/**
 * NewsRenderer - Handles UI rendering, Category grouping, Card views, Reader Modal, Bookmarks, and Interactions.
 * Ensures 100% reliable direct navigation to original article URLs in all browsers (Safari, Chrome, Firefox).
 */

class NewsRenderer {
  constructor() {
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.sortBy = 'latest'; // 'latest' | 'author' | 'headline'
    this.currentViewMode = 'magazine'; // 'magazine' | 'categories' | 'compact'
    this.bookmarksKey = 'newssphere_bookmarks_v4';
    this.speechUtterance = null;
    this.isSpeaking = false;

    this.categoryMeta = {
      'all': { label: 'All Headlines', icon: '📰', color: '#dc2626' },
      'Political: National': { label: 'National Politics & City', icon: '🏛️', color: '#2563eb' },
      'Political: International': { label: 'International Affairs', icon: '🌐', color: '#7c3aed' },
      'Sports': { label: 'Sports', icon: '⚽', color: '#059669' },
      'Entertainment': { label: 'Entertainment & Cinema', icon: '🎬', color: '#db2777' },
      'Science & Tech': { label: 'Science & Health', icon: '🚀', color: '#0284c7' },
      'Books & Education': { label: 'Books & Education', icon: '📚', color: '#ea580c' },
      'Lifestyle & Food': { label: 'Lifestyle & Culture', icon: '🍽️', color: '#16a34a' },
      'General News': { label: 'Special Dispatches', icon: '📌', color: '#475569' }
    };

    // Attach global click delegation for card backgrounds
    this.initGlobalCardClickDelegation();
  }

  // Helper to safely get the full valid article URL
  getArticleUrl(article) {
    if (!article) return '#';
    let url = article['Article URL'] || article.articleUrl || article.url || article.link || '#';
    url = String(url).trim();
    if (!url || url === '#') return '#';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url.replace(/^\/\//, '');
    }
    return url;
  }

  // Global click delegation so clicking any card background also navigates to article URL
  initGlobalCardClickDelegation() {
    document.addEventListener('click', (e) => {
      // Don't trigger if clicked on an anchor, bookmark button, reader button, or modal controls
      if (e.target.closest('a, button, input, textarea, select, .bookmark-btn, .tts-btn, .modal-close-btn, .delete-bookmark-btn')) {
        return;
      }
      const card = e.target.closest('.news-card, .hero-primary-card, .trending-card-item, .compact-news-row, .ticker-item');
      if (card) {
        const url = card.getAttribute('data-article-url');
        if (url && url !== '#') {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }
    });
  }

  // Open original article directly
  openArticleUrl(url) {
    if (!url || url === '#') {
      this.showToast('Article URL not available', 'error');
      return;
    }
    const targetUrl = url.startsWith('http') ? url : `https://${url.replace(/^\/\//, '')}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
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
      this.showToast('Article saved to bookmarks!', 'success');
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

  // Filter articles
  getFilteredArticles() {
    const all = window.NewsSync.getAllArticles();
    let filtered = all.filter(article => {
      if (this.currentCategory !== 'all') {
        const catA = (article.Category || '').toLowerCase();
        const catB = this.currentCategory.toLowerCase();
        if (!catA.includes(catB) && !catB.includes(catA)) {
          return false;
        }
      }

      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        const matchHeadline = (article.Headline || '').toLowerCase().includes(q);
        const matchAuthor = (article.Author || '').toLowerCase().includes(q);
        const matchCategory = (article.Category || '').toLowerCase().includes(q);
        return matchHeadline || matchAuthor || matchCategory;
      }

      return true;
    });

    filtered.sort((a, b) => {
      if (this.sortBy === 'author') return (a.Author || '').localeCompare(b.Author || '');
      if (this.sortBy === 'headline') return (a.Headline || '').localeCompare(b.Headline || '');
      return 0;
    });

    return filtered;
  }

  // Render Breaking Ticker
  renderTicker() {
    const tickerTrack = document.getElementById('tickerTrack');
    if (!tickerTrack) return;

    const all = window.NewsSync.getAllArticles().slice(0, 10);
    if (all.length === 0) {
      tickerTrack.innerHTML = `<span class="ticker-item">Live Google Sheet News Wire Connected</span>`;
      return;
    }

    const itemsHtml = all.map(a => {
      const url = this.getArticleUrl(a);
      return `
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="ticker-item" data-article-url="${url}">
          <span class="ticker-tag">${a.Category || 'HEADLINE'}</span>
          <span class="ticker-text">${this.escapeHtml(a.Headline)}</span>
          <span class="ticker-author">by ${this.escapeHtml(a.Author || 'The Hindu Bureau')}</span>
          <span class="ticker-link-hint">↗</span>
        </a>
      `;
    }).join(' <span class="ticker-sep">✦</span> ');

    tickerTrack.innerHTML = itemsHtml + ' <span class="ticker-sep">✦</span> ' + itemsHtml;
  }

  // Render Category Navigation Pills
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
      'Books & Education',
      'Lifestyle & Food',
      'General News'
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

      if (count === 0 && catKey !== 'all') return '';

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

  // Render Main News Content
  renderMainContent() {
    const container = document.getElementById('newsMainContainer');
    if (!container) return;

    const articles = this.getFilteredArticles();

    if (articles.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon">🔍</div>
          <h3>No matching news articles found</h3>
          <p>Try refining your search query or selecting a different category from the top bar.</p>
          <div class="empty-actions">
            <button class="btn btn-primary" onclick="window.NewsUI.clearSearchAndFilters()">
              Clear Filters
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

  // 1. Magazine Layout
  renderMagazineLayout(container, articles) {
    const featured = articles[0];
    const topPicks = articles.slice(1, 4);
    const rest = articles.slice(4);
    const featuredUrl = this.getArticleUrl(featured);

    let html = `
      <section class="editorial-hero-section">
        <div class="hero-primary-card" data-article-url="${featuredUrl}">
          <a href="${featuredUrl}" target="_blank" rel="noopener noreferrer" class="hero-image-wrap" title="Read full article on original website">
            <img src="${this.escapeHtml(featured['Image URL'])}" 
                 alt="${this.escapeHtml(featured.Headline)}"
                 onerror="window.NewsUI.handleImageFallback(this, '${featured.Category}')"
                 loading="lazy">
            <div class="hero-badge-overlay">
              <span class="badge-category" style="background:${this.getCategoryColor(featured.Category)}">
                ${featured.Category || 'Lead Story'}
              </span>
              <span class="badge-read">${featured.ReadTime || '3 min'}</span>
            </div>
          </a>
          <div class="hero-content">
            <span class="hero-kicker">🔥 Top Story</span>
            <h2 class="hero-headline">
              <a href="${featuredUrl}" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 class="headline-link" 
                 title="Open article on actual website">
                ${this.escapeHtml(featured.Headline)}
              </a>
            </h2>
            <div class="card-byline">
              <div class="author-avatar">${this.getAuthorInitials(featured.Author)}</div>
              <div class="author-info">
                <span class="author-name">By ${this.escapeHtml(featured.Author || 'The Hindu Bureau')}</span>
                <span class="article-date">Google Sheet Verified Source</span>
              </div>
            </div>
            <div class="hero-action-bar">
              <a href="${featuredUrl}" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 class="btn btn-sm btn-primary read-article-btn">
                Read Full Article ↗
              </a>
              <button class="btn btn-sm btn-outline" onclick="window.NewsUI.openReaderModal('${featured.id}')" title="Quick Voice & Preview Reader">
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
        <h3 class="section-title">📰 Complete Coverage Dispatches (${articles.length} Stories)</h3>
        <span class="section-subtitle">Click any headline, image, or button to open the actual news article</span>
      </div>

      <div class="news-cards-grid">
        ${rest.map(a => this.renderCardHtml(a)).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  // 2. Grouped Category Swimlanes
  renderGroupedCategoriesLayout(container, articles) {
    const categories = [
      'Political: National',
      'Political: International',
      'Sports',
      'Entertainment',
      'Science & Tech',
      'Books & Education',
      'Lifestyle & Food',
      'General News'
    ];

    let html = `<div class="categories-view-wrapper">`;

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
                <span class="swimlane-count">${catArticles.length} stories in this section</span>
              </div>
            </div>
            <button class="btn btn-sm btn-ghost" onclick="window.NewsUI.setCategory('${catName}')">
              View All ${meta.label} (${catArticles.length}) →
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

  // 3. Standard Grid View
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
            <p>${articles.length} article${articles.length === 1 ? '' : 's'} found ${this.searchQuery ? `matching "${this.escapeHtml(this.searchQuery)}"` : ''}</p>
          </div>
          ${this.searchQuery || this.currentCategory !== 'all' ? `
            <button class="btn btn-sm btn-secondary" onclick="window.NewsUI.clearSearchAndFilters()">
              ✕ Reset to All Stories
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

  // Card HTML - Every headline, image, and CTA has a direct valid href
  renderCardHtml(article) {
    const isSaved = this.isBookmarked(article.id);
    const catColor = this.getCategoryColor(article.Category);
    const articleUrl = this.getArticleUrl(article);

    return `
      <article class="news-card" data-id="${article.id}" data-article-url="${articleUrl}">
        <a href="${articleUrl}" 
           target="_blank" 
           rel="noopener noreferrer" 
           class="card-image-wrap" 
           title="Open original article in new tab">
          <img src="${this.escapeHtml(article['Image URL'])}" 
               alt="${this.escapeHtml(article.Headline)}"
               onerror="window.NewsUI.handleImageFallback(this, '${article.Category}')"
               loading="lazy">
          <div class="card-badges">
            <span class="badge-category" style="background:${catColor}">${article.Category || 'News'}</span>
            <span class="badge-read">${article.ReadTime || '3 min'}</span>
          </div>
        </a>

        <div class="card-body">
          <h4 class="card-title">
            <a href="${articleUrl}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="headline-link"
               title="${this.escapeHtml(article.Headline)}">
              ${this.highlightQuery(article.Headline)}
            </a>
          </h4>

          <div class="card-footer">
            <div class="card-byline">
              <div class="author-avatar">${this.getAuthorInitials(article.Author)}</div>
              <div class="author-info">
                <span class="author-name">${this.highlightQuery(article.Author || 'The Hindu Bureau')}</span>
                <span class="article-date">Google Sheet Source</span>
              </div>
            </div>

            <div class="card-actions">
              <a href="${articleUrl}" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 class="btn btn-sm btn-primary read-article-btn" 
                 title="Open Original Article Link (New Tab)">
                Read ↗
              </a>
              <button class="btn-icon" 
                      title="Quick Voice & Preview Reader" 
                      onclick="window.NewsUI.openReaderModal('${article.id}')">
                📖
              </button>
              <button class="btn-icon bookmark-btn ${isSaved ? 'bookmarked' : ''}" 
                      title="${isSaved ? 'Remove Bookmark' : 'Bookmark Article'}"
                      onclick="window.NewsUI.toggleBookmark('${article.id}')">
                ${isSaved ? '★' : '☆'}
              </button>
              <button class="btn-icon share-btn" 
                      title="Share Article Link" 
                      onclick="window.NewsUI.shareArticle('${article.id}')">
                🔗
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  // Compact Card HTML
  renderCompactCardHtml(article) {
    const isSaved = this.isBookmarked(article.id);
    const catColor = this.getCategoryColor(article.Category);
    const articleUrl = this.getArticleUrl(article);

    return `
      <article class="compact-news-row" data-id="${article.id}" data-article-url="${articleUrl}">
        <a href="${articleUrl}" target="_blank" rel="noopener noreferrer" class="compact-thumb" title="Open original article">
          <img src="${this.escapeHtml(article['Image URL'])}" 
               alt="${this.escapeHtml(article.Headline)}"
               onerror="window.NewsUI.handleImageFallback(this, '${article.Category}')"
               loading="lazy">
        </a>
        <div class="compact-body">
          <div class="compact-meta">
            <span class="badge-category-mini" style="color:${catColor}; background:${catColor}15">
              ${article.Category || 'News'}
            </span>
            <span class="compact-read">${article.ReadTime || '3 min'}</span>
          </div>
          <h4 class="compact-title">
            <a href="${articleUrl}" target="_blank" rel="noopener noreferrer" class="headline-link">
              ${this.highlightQuery(article.Headline)}
            </a>
          </h4>
          <span class="compact-author">By <strong>${this.highlightQuery(article.Author || 'The Hindu Bureau')}</strong></span>
        </div>
        <div class="compact-actions">
          <a href="${articleUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary" title="Open original article link">
            Read ↗
          </a>
          <button class="btn-icon ${isSaved ? 'bookmarked' : ''}" onclick="window.NewsUI.toggleBookmark('${article.id}')">
            ${isSaved ? '★' : '☆'}
          </button>
        </div>
      </article>
    `;
  }

  // Trending Card HTML
  renderTrendingCardHtml(article) {
    const catColor = this.getCategoryColor(article.Category);
    const articleUrl = this.getArticleUrl(article);

    return `
      <div class="trending-card-item" data-article-url="${articleUrl}">
        <a href="${articleUrl}" target="_blank" rel="noopener noreferrer" class="trending-img-wrap" title="Open story">
          <img src="${this.escapeHtml(article['Image URL'])}" 
               alt="${this.escapeHtml(article.Headline)}"
               onerror="window.NewsUI.handleImageFallback(this, '${article.Category}')"
               loading="lazy">
        </a>
        <div class="trending-content">
          <span class="badge-category-mini" style="color:${catColor}; background:${catColor}15">
            ${article.Category || 'Trending'}
          </span>
          <h4 class="trending-title">
            <a href="${articleUrl}" target="_blank" rel="noopener noreferrer" class="headline-link">
              ${this.escapeHtml(article.Headline)}
            </a>
          </h4>
          <span class="trending-author">By ${this.escapeHtml(article.Author || 'The Hindu Bureau')}</span>
        </div>
      </div>
    `;
  }

  // Bookmarks Drawer
  renderBookmarksDrawer() {
    const container = document.getElementById('bookmarksList');
    if (!container) return;

    const bookmarks = this.getBookmarks();

    if (bookmarks.length === 0) {
      container.innerHTML = `
        <div class="empty-bookmarks">
          <div class="empty-icon">🔖</div>
          <h4>No Saved Articles</h4>
          <p>Click the star (☆) icon on any news card to save articles for quick reading.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = bookmarks.map(a => {
      const url = this.getArticleUrl(a);
      return `
        <div class="bookmark-item-row" data-article-url="${url}">
          <a href="${url}" target="_blank" rel="noopener noreferrer" style="display:flex; align-items:center; gap:0.85rem; flex:1; text-decoration:none; color:inherit;">
            <img src="${this.escapeHtml(a['Image URL'])}" onerror="window.NewsUI.handleImageFallback(this, '${a.Category}')">
            <div class="bookmark-item-info">
              <span class="badge-category-mini">${a.Category || 'News'}</span>
              <h5>${this.escapeHtml(a.Headline)}</h5>
              <span class="bookmark-byline">By ${this.escapeHtml(a.Author || 'The Hindu Bureau')}</span>
            </div>
          </a>
          <button class="btn-icon delete-bookmark-btn" 
                  title="Remove" 
                  onclick="event.stopPropagation(); window.NewsUI.toggleBookmark('${a.id}')">
            ✕
          </button>
        </div>
      `;
    }).join('');
  }

  // Reader Modal
  openReaderModal(articleId) {
    const all = window.NewsSync.getAllArticles();
    const article = all.find(a => a.id === articleId);
    if (!article) return;

    const modal = document.getElementById('readerModal');
    const content = document.getElementById('readerModalBody');
    if (!modal || !content) return;

    const isSaved = this.isBookmarked(article.id);
    const catColor = this.getCategoryColor(article.Category);
    const articleUrl = this.getArticleUrl(article);

    this.stopSpeech();

    content.innerHTML = `
      <div class="reader-header">
        <div class="reader-meta-bar">
          <span class="badge-category" style="background:${catColor}">${article.Category || 'News'}</span>
          <span class="reader-date">Google Sheet Live Item</span>
          <span class="reader-readtime">⏱️ ${article.ReadTime || '3 min read'}</span>
        </div>
        <h1 class="reader-headline">
          <a href="${articleUrl}" target="_blank" rel="noopener noreferrer" class="headline-link" title="Open actual article on publisher website">
            ${this.escapeHtml(article.Headline)}
          </a>
        </h1>
        
        <div class="reader-author-strip">
          <div class="author-avatar reader-avatar-lg">${this.getAuthorInitials(article.Author)}</div>
          <div>
            <div class="reader-author-name">By <strong>${this.escapeHtml(article.Author || 'The Hindu Bureau')}</strong></div>
            <div class="reader-source-tag">Source: <a href="${articleUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--brand-primary); text-decoration:underline;">${this.escapeHtml(article.Source || 'The Hindu')} ↗</a></div>
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
        <a href="${articleUrl}" target="_blank" rel="noopener noreferrer" title="Click to open original article">
          <img src="${this.escapeHtml(article['Image URL'])}" 
               alt="${this.escapeHtml(article.Headline)}"
               onerror="window.NewsUI.handleImageFallback(this, '${article.Category}')">
        </a>
        <div class="reader-image-caption">Image via Editorial News Wire • Click image to open original article</div>
      </div>

      <div class="reader-article-content font-size-normal">
        <p class="reader-lead">
          ${this.escapeHtml(article.Headline)}
        </p>
        <p>
          This verified story is sourced directly from the Google Sheet and published on <strong>${this.escapeHtml(article.Source || 'The Hindu')}</strong> under <strong>${this.escapeHtml(article.Category || 'General')}</strong>.
        </p>
      </div>

      <div class="reader-bottom-cta">
        <div>
          <h4>Read the complete original article on the publisher website?</h4>
          <p>Click below to jump directly to the live article page.</p>
        </div>
        <a href="${articleUrl}" 
           target="_blank" 
           rel="noopener noreferrer" 
           class="btn btn-primary btn-lg">
          Visit Original Article Page ↗
        </a>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.activeReaderArticle = article;
  }

  closeReaderModal() {
    const modal = document.getElementById('readerModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    this.stopSpeech();
  }

  toggleSpeech() {
    if (this.isSpeaking) {
      this.stopSpeech();
      return;
    }

    if (!this.activeReaderArticle || !('speechSynthesis' in window)) {
      this.showToast('Speech synthesis not supported on this browser', 'info');
      return;
    }

    const text = `${this.activeReaderArticle.Headline}. Reporting by ${this.activeReaderArticle.Author || 'our news desk'}.`;
    this.speechUtterance = new SpeechSynthesisUtterance(text);
    this.speechUtterance.rate = 1.0;

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

  async shareArticle(articleId) {
    const all = window.NewsSync.getAllArticles();
    const article = all.find(a => a.id === articleId);
    if (!article) return;

    const url = this.getArticleUrl(article);
    if (navigator.share) {
      try {
        await navigator.share({ title: article.Headline, url });
        return;
      } catch (e) {}
    }
    try {
      await navigator.clipboard.writeText(url);
      this.showToast('Article URL copied to clipboard!', 'success');
    } catch (e) {
      prompt('Copy article URL:', url);
    }
  }

  getCategoryColor(category = '') {
    const match = Object.keys(this.categoryMeta).find(k => k.toLowerCase() === category.toLowerCase());
    return match ? this.categoryMeta[match].color : '#64748b';
  }

  getAuthorInitials(author = '') {
    if (!author) return 'HB';
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
