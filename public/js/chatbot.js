/**
 * UrbanNest Lifestyle Store - N8N AI Chatbot Widget Manager
 */

class ChatbotManager {
  constructor() {
    this.isOpen = false;
    this.sessionId = 'session_' + Math.random().toString(36).substring(2, 9);
    this.webhookUrl = localStorage.getItem('urbannest_chat_webhook') || '';
    
    this.widgetContainer = document.getElementById('chatbotWidget');
    this.windowEl = document.getElementById('chatbotWindow');
    this.triggerBtn = document.getElementById('chatbotTriggerBtn');
    this.closeBtn = document.getElementById('chatbotCloseBtn');
    this.chatBody = document.getElementById('chatBody');
    this.chatInput = document.getElementById('chatInput');
    this.sendBtn = document.getElementById('chatSendBtn');

    this.bindEvents();
  }

  bindEvents() {
    if (this.triggerBtn) {
      this.triggerBtn.addEventListener('click', () => this.toggleChat());
    }
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.toggleChat(false));
    }

    if (this.sendBtn && this.chatInput) {
      this.sendBtn.addEventListener('click', () => this.sendMessage());
      this.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });
    }

    // Preset chip clicks
    const chips = document.querySelectorAll('.chip-btn');
    chips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        const text = e.currentTarget.textContent.trim();
        if (this.chatInput) {
          this.chatInput.value = text;
          this.sendMessage();
        }
      });
    });
  }

  toggleChat(forceState) {
    this.isOpen = forceState !== undefined ? forceState : !this.isOpen;
    if (this.isOpen) {
      this.windowEl?.classList.add('open');
      this.chatInput?.focus();
    } else {
      this.windowEl?.classList.remove('open');
    }
  }

  formatMarkdown(text) {
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');
    return formatted;
  }

  appendMessage(text, sender = 'bot') {
    if (!this.chatBody) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${sender}`;

    msgDiv.innerHTML = `
      <div class="chat-bubble">${this.formatMarkdown(text)}</div>
      <span class="chat-timestamp">${timeStr}</span>
    `;

    this.chatBody.appendChild(msgDiv);
    this.chatBody.scrollTop = this.chatBody.scrollHeight;
  }

  showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'chatTypingIndicator';
    indicator.className = 'chat-msg bot';
    indicator.innerHTML = `
      <div class="chat-bubble" style="background: var(--bg-card); font-style: italic; color: var(--text-muted);">
        UrbanNest AI is thinking<span class="typing-indicator"></span>
      </div>
    `;
    this.chatBody.appendChild(indicator);
    this.chatBody.scrollTop = this.chatBody.scrollHeight;
  }

  removeTypingIndicator() {
    const ind = document.getElementById('chatTypingIndicator');
    if (ind) ind.remove();
  }

  async sendMessage() {
    const text = this.chatInput.value.trim();
    if (!text) return;

    // User message
    this.appendMessage(text, 'user');
    this.chatInput.value = '';
    this.showTypingIndicator();

    try {
      const response = await fetch('/api/n8n/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: this.sessionId,
          webhookUrl: this.webhookUrl
        })
      });

      const data = await response.json();
      this.removeTypingIndicator();

      if (data.success && data.reply) {
        this.appendMessage(data.reply, 'bot');
      } else {
        this.appendMessage("I'm sorry, I couldn't reach the assistant server. Please check the query form for direct inquiries!", 'bot');
      }
    } catch (err) {
      console.error('Chat error:', err);
      this.removeTypingIndicator();
      this.appendMessage("Thank you for your message! Our boutique team has received your note and will be happy to assist.", 'bot');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.chatbot = new ChatbotManager();
});
