/**
 * UrbanNest Lifestyle Store - AI Product Recommender & Gift Matcher
 */

class RecommenderManager {
  constructor() {
    this.currentStep = 1;
    this.answers = {
      recipient: '',
      vibe: '',
      budget: ''
    };
    this.modal = document.getElementById('aiRecommenderModal');
    this.container = document.getElementById('quizStepContainer');
    this.bindEvents();
  }

  bindEvents() {
    const triggerBtn = document.getElementById('openQuizBtn');
    const heroQuizBtn = document.getElementById('heroQuizBtn');
    const closeBtn = document.getElementById('closeQuizBtn');

    if (triggerBtn) triggerBtn.addEventListener('click', () => this.open());
    if (heroQuizBtn) heroQuizBtn.addEventListener('click', () => this.open());
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
  }

  open() {
    this.currentStep = 1;
    this.answers = { recipient: '', vibe: '', budget: '' };
    this.renderStep();
    this.modal?.classList.add('active');
  }

  close() {
    this.modal?.classList.remove('active');
  }

  selectOption(key, value) {
    this.answers[key] = value;
    if (this.currentStep < 3) {
      this.currentStep++;
      this.renderStep();
    } else {
      this.renderResults();
    }
  }

  renderStep() {
    if (!this.container) return;

    if (this.currentStep === 1) {
      this.container.innerHTML = `
        <div class="quiz-step-progress">
          <div class="quiz-progress-bar active"></div>
          <div class="quiz-progress-bar"></div>
          <div class="quiz-progress-bar"></div>
        </div>
        <span class="section-tag">Step 1 of 3 • Recipient</span>
        <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem;">Who are you shopping for today?</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Let us tailor recommendations tailored to the recipient's lifestyle.</p>
        
        <div class="quiz-option-grid">
          <div class="quiz-option-card" onclick="window.recommender.selectOption('recipient', 'self')">
            <div class="quiz-option-icon">🏡</div>
            <strong style="font-size: 0.95rem;">Myself / My Home</strong>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Sprucing up my personal living space</p>
          </div>
          <div class="quiz-option-card" onclick="window.recommender.selectOption('recipient', 'gift')">
            <div class="quiz-option-icon">🎁</div>
            <strong style="font-size: 0.95rem;">Loved One / Friend</strong>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">A thoughtful birthday or anniversary gift</p>
          </div>
          <div class="quiz-option-card" onclick="window.recommender.selectOption('recipient', 'work')">
            <div class="quiz-option-icon">✍️</div>
            <strong style="font-size: 0.95rem;">Work & Productivity</strong>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Desk & stationery aesthetics</p>
          </div>
          <div class="quiz-option-card" onclick="window.recommender.selectOption('recipient', 'host')">
            <div class="quiz-option-icon">☕</div>
            <strong style="font-size: 0.95rem;">Housewarming Host</strong>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Cozy hosting & kitchen treasures</p>
          </div>
        </div>
      `;
    } else if (this.currentStep === 2) {
      this.container.innerHTML = `
        <div class="quiz-step-progress">
          <div class="quiz-progress-bar active"></div>
          <div class="quiz-progress-bar active"></div>
          <div class="quiz-progress-bar"></div>
        </div>
        <span class="section-tag">Step 2 of 3 • Atmosphere</span>
        <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem;">What's the desired mood & aesthetic?</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Choose the feeling you want to evoke.</p>
        
        <div class="quiz-option-grid">
          <div class="quiz-option-card" onclick="window.recommender.selectOption('vibe', 'cozy')">
            <div class="quiz-option-icon">🕯️</div>
            <strong style="font-size: 0.95rem;">Warm & Cozy</strong>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Earthy tones, soft scents & candlelight</p>
          </div>
          <div class="quiz-option-card" onclick="window.recommender.selectOption('vibe', 'artisan')">
            <div class="quiz-option-icon">🏺</div>
            <strong style="font-size: 0.95rem;">Artisan & Handcrafted</strong>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Sculptural ceramics and tactile materials</p>
          </div>
          <div class="quiz-option-card" onclick="window.recommender.selectOption('vibe', 'minimal')">
            <div class="quiz-option-icon">✨</div>
            <strong style="font-size: 0.95rem;">Minimalist Zen</strong>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Clean lines, refined brass & linen</p>
          </div>
          <div class="quiz-option-card" onclick="window.recommender.selectOption('vibe', 'botanical')">
            <div class="quiz-option-icon">🌿</div>
            <strong style="font-size: 0.95rem;">Nature & Botanical</strong>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Herbal teas, silk leaves & organic cotton</p>
          </div>
        </div>
      `;
    } else if (this.currentStep === 3) {
      this.container.innerHTML = `
        <div class="quiz-step-progress">
          <div class="quiz-progress-bar active"></div>
          <div class="quiz-progress-bar active"></div>
          <div class="quiz-progress-bar active"></div>
        </div>
        <span class="section-tag">Step 3 of 3 • Budget</span>
        <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem;">What is your target budget?</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Find the best value within your range.</p>
        
        <div class="quiz-option-grid">
          <div class="quiz-option-card" onclick="window.recommender.selectOption('budget', 'under30')">
            <div class="quiz-option-icon">🌱</div>
            <strong style="font-size: 0.95rem;">Under $30</strong>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Charming everyday essentials</p>
          </div>
          <div class="quiz-option-card" onclick="window.recommender.selectOption('budget', '30to50')">
            <div class="quiz-option-icon">🪴</div>
            <strong style="font-size: 0.95rem;">$30 – $50</strong>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Mid-range signature pieces</p>
          </div>
          <div class="quiz-option-card" onclick="window.recommender.selectOption('budget', 'above50')">
            <div class="quiz-option-icon">👑</div>
            <strong style="font-size: 0.95rem;">$50 and above</strong>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Luxury curated sets & hampers</p>
          </div>
          <div class="quiz-option-card" onclick="window.recommender.selectOption('budget', 'any')">
            <div class="quiz-option-icon">🌟</div>
            <strong style="font-size: 0.95rem;">Any Budget</strong>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Show me the absolute best matches</p>
          </div>
        </div>
      `;
    }
  }

  renderResults() {
    let matches = [...PRODUCTS_DATA];

    if (this.answers.recipient === 'gift') {
      matches = matches.filter(p => p.category === 'gift-items' || p.tag === 'bestseller');
    } else if (this.answers.recipient === 'work') {
      matches = matches.filter(p => p.category === 'stationery' || p.category === 'accessories');
    } else if (this.answers.recipient === 'host') {
      matches = matches.filter(p => p.category === 'household' || p.category === 'home-decor');
    }

    if (this.answers.budget === 'under30') {
      matches = matches.filter(p => p.price <= 30);
    } else if (this.answers.budget === '30to50') {
      matches = matches.filter(p => p.price > 25 && p.price <= 50);
    } else if (this.answers.budget === 'above50') {
      matches = matches.filter(p => p.price >= 45);
    }

    // Fallback if filter is too narrow
    if (matches.length === 0) {
      matches = PRODUCTS_DATA.slice(0, 3);
    } else {
      matches = matches.slice(0, 3);
    }

    this.container.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="font-size: 2.8rem; margin-bottom: 0.4rem;">✨</div>
        <span class="section-tag">AI Lifestyle Match</span>
        <h3 style="font-family: var(--font-serif); font-size: 1.6rem; font-weight: 700; margin-top: 0.4rem;">Here are your curated recommendations!</h3>
        <p style="font-size: 0.88rem; color: var(--text-muted);">Hand-selected based on your lifestyle preferences.</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
        ${matches.map(item => `
          <div style="display: flex; gap: 1rem; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem; align-items: center;">
            <img src="${item.image}" alt="${item.name}" style="width: 75px; height: 75px; border-radius: var(--radius-sm); object-fit: cover;" />
            <div style="flex: 1;">
              <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--accent-terracotta); font-weight: 700;">${item.categoryName}</span>
              <h5 style="font-size: 0.95rem; font-weight: 700; margin: 0.1rem 0;">${item.name}</h5>
              <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary);">$${item.price.toFixed(2)}</div>
            </div>
            <button class="btn btn-primary" style="padding: 0.45rem 0.95rem; font-size: 0.8rem;" onclick="window.cart.addItem('${item.id}'); window.recommender.close();">
              Add to Bag
            </button>
          </div>
        `).join('')}
      </div>

      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-secondary" style="flex: 1;" onclick="window.recommender.open()">
          🔄 Retake Quiz
        </button>
        <button class="btn btn-olive" style="flex: 1;" onclick="window.recommender.close()">
          Done
        </button>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.recommender = new RecommenderManager();
});
