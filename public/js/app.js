/**
 * UrbanNest Lifestyle Store - Main App Controller
 * Theme management, navigation, counters, toasts, webhook config modal
 */

// Toast notification helper
window.showToast = function(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-30px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// Copy Coupon Code Helper
window.copyCoupon = function(code) {
  navigator.clipboard.writeText(code).then(() => {
    window.showToast(`Coupon code "${code}" copied to clipboard!`, 'success');
  }).catch(() => {
    window.showToast(`Coupon code: ${code}`, 'info');
  });
};

class AppManager {
  constructor() {
    this.currentTheme = localStorage.getItem('urbannest_theme') || 'light';
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.bindThemeToggle();
    this.bindNavigation();
    this.bindStatsCounter();
    this.bindWebhookConfigModal();
    this.bindMobileMenu();
    this.bindModalClosers();
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('urbannest_theme', theme);
    
    const themeIcon = document.getElementById('themeToggleIcon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  bindThemeToggle() {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(nextTheme);
        window.showToast(`Switched to ${nextTheme} mode`, 'info');
      });
    }
  }

  bindMobileMenu() {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const mobileDrawer = document.getElementById('mobileMenuDrawer');
    if (mobileBtn && mobileDrawer) {
      mobileBtn.addEventListener('click', () => {
        mobileDrawer.classList.toggle('active');
      });
    }
  }

  bindNavigation() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
      let scrollY = window.pageYOffset;

      sections.forEach(current => {
        const sectionHeight = current.offsetHeight;
        const sectionTop = current.offsetTop - 120;
        const sectionId = current.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
              link.classList.add('active');
            }
          });
        }
      });
    });
  }

  bindStatsCounter() {
    const stats = document.querySelectorAll('.stat-number');
    let hasAnimated = false;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          stats.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const duration = 1800;
            const step = target / (duration / 25);
            let current = 0;

            const timer = setInterval(() => {
              current += step;
              if (current >= target) {
                counter.textContent = target.toLocaleString();
                clearInterval(timer);
              } else {
                counter.textContent = Math.floor(current).toLocaleString();
              }
            }, 25);
          });
        }
      });
    }, { threshold: 0.5 });

    const statsSection = document.querySelector('.hero-stats-bar');
    if (statsSection) observer.observe(statsSection);
  }

  bindWebhookConfigModal() {
    const modal = document.getElementById('webhookConfigModal');
    const openBtn = document.getElementById('openWebhookSettingsBtn');
    const saveBtn = document.getElementById('saveWebhookSettingsBtn');
    const queryInput = document.getElementById('cfgQueryWebhook');
    const chatInput = document.getElementById('cfgChatWebhook');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        if (queryInput) queryInput.value = localStorage.getItem('littlejoys_query_webhook') || localStorage.getItem('urbannest_query_webhook') || '';
        if (chatInput) chatInput.value = localStorage.getItem('littlejoys_chat_webhook') || localStorage.getItem('urbannest_chat_webhook') || '';
        modal.classList.add('active');
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const qUrl = queryInput ? queryInput.value.trim() : '';
        const cUrl = chatInput ? chatInput.value.trim() : '';

        localStorage.setItem('littlejoys_query_webhook', qUrl);
        localStorage.setItem('littlejoys_chat_webhook', cUrl);
        localStorage.setItem('urbannest_query_webhook', qUrl);
        localStorage.setItem('urbannest_chat_webhook', cUrl);

        if (window.queryForm) window.queryForm.webhookUrl = qUrl;
        if (window.chatbot) window.chatbot.webhookUrl = cUrl;

        modal?.classList.remove('active');
        window.showToast('N8N Webhook endpoints successfully updated!', 'success');
      });
    }
  }

  bindModalClosers() {
    // Close modals on overlay or close button clicks
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.currentTarget.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppManager();
});
