/**
 * UrbanNest Lifestyle Store - N8N Query Form Integration Manager
 */

class QueryFormManager {
  constructor() {
    this.form = document.getElementById('n8nQueryForm');
    this.webhookUrl = localStorage.getItem('urbannest_query_webhook') || '';
    this.selectedCategory = 'Product Inquiry';
    this.resultBox = document.getElementById('queryResultBox');
    this.bindEvents();
  }

  bindEvents() {
    if (!this.form) return;

    // Category radio pills
    const catPills = document.querySelectorAll('.cat-pill-radio');
    catPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        catPills.forEach(p => p.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        this.selectedCategory = e.currentTarget.getAttribute('data-cat-value');
      });
    });

    // Form submission
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  async handleSubmit() {
    const submitBtn = document.getElementById('querySubmitBtn');
    const nameInput = document.getElementById('queryName');
    const emailInput = document.getElementById('queryEmail');
    const phoneInput = document.getElementById('queryPhone');
    const messageInput = document.getElementById('queryMessage');

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const message = messageInput.value.trim();
    const category = this.selectedCategory;

    // Validation
    if (!name || !email || !message) {
      window.showToast('Please fill in all required fields (Name, Email, Message)', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      window.showToast('Please enter a valid email address', 'error');
      return;
    }

    // Set loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>⏳ Submitting to N8N Workflow...</span>`;
    }

    const payload = {
      name,
      email,
      phone,
      category,
      message,
      webhookUrl: this.webhookUrl
    };

    try {
      const response = await fetch('/api/n8n/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        // Render Result and payload inspection
        if (this.resultBox) {
          this.resultBox.classList.add('active');
          this.resultBox.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem;">
              <div style="font-size: 2rem;">✅</div>
              <div>
                <h4 style="font-family: var(--font-serif); font-size: 1.25rem; color: var(--success); margin-bottom: 0.3rem;">Query Successfully Submitted!</h4>
                <p style="font-size: 0.9rem; color: var(--text-secondary);">${data.confirmation}</p>
              </div>
            </div>
            <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 0.85rem; font-size: 0.82rem; margin-bottom: 0.75rem;">
              <div><strong>Ticket Reference:</strong> <code>${data.ticket_id}</code></div>
              <div><strong>Target Pipeline:</strong> <code>${data.webhook_target}</code></div>
              <div><strong>N8N Forwarded:</strong> ${data.forwarded_to_n8n ? '<span style="color: var(--success); font-weight: 700;">Yes (Live N8N Webhook)</span>' : '<span style="color: var(--accent-amber); font-weight: 700;">Simulated Workflow (Default)</span>'}</div>
            </div>
            <details>
              <summary style="cursor: pointer; font-size: 0.8rem; font-weight: 700; color: var(--accent-terracotta);">🔍 View Transmitted JSON Payload</summary>
              <pre class="payload-inspector-pre">${JSON.stringify(data, null, 2)}</pre>
            </details>
          `;
        }

        window.showToast(`Query ${data.ticket_id} received! Our team will respond shortly.`, 'success');
        this.form.reset();
      } else {
        window.showToast('Failed to submit query. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Query form submission error:', err);
      window.showToast('Network error submitting to N8N endpoint.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Submit Query via N8N →</span>`;
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.queryForm = new QueryFormManager();
});
