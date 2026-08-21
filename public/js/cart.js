/**
 * UrbanNest Lifestyle Store - Shopping Cart & Checkout Manager
 */

class CartManager {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('urbannest_cart') || '[]');
    this.discountCode = '';
    this.discountPercent = 0;
    this.shippingThreshold = 35.00;
    this.shippingRate = 4.99;
    
    this.bindEvents();
    this.render();
  }

  save() {
    localStorage.setItem('urbannest_cart', JSON.stringify(this.items));
  }

  bindEvents() {
    // Open & close cart drawer
    const openBtn = document.getElementById('cartOpenBtn');
    const closeBtn = document.getElementById('cartCloseBtn');
    const overlay = document.getElementById('cartOverlay');
    const drawer = document.getElementById('cartDrawer');

    if (openBtn) {
      openBtn.addEventListener('click', () => this.openCart());
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeCart());
    }
    if (overlay) {
      overlay.addEventListener('click', () => this.closeCart());
    }

    // Promo code apply
    const promoBtn = document.getElementById('applyPromoBtn');
    const promoInput = document.getElementById('promoCodeInput');
    if (promoBtn && promoInput) {
      promoBtn.addEventListener('click', () => {
        const code = promoInput.value.trim().toUpperCase();
        this.applyPromoCode(code);
      });
    }

    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => this.openCheckoutModal());
    }
  }

  openCart() {
    document.getElementById('cartOverlay')?.classList.add('active');
    document.getElementById('cartDrawer')?.classList.add('active');
  }

  closeCart() {
    document.getElementById('cartOverlay')?.classList.remove('active');
    document.getElementById('cartDrawer')?.classList.remove('active');
  }

  addItem(productId, qty = 1) {
    const product = PRODUCTS_DATA.find(p => p.id === productId);
    if (!product) return;

    const existing = this.items.find(i => i.id === productId);
    if (existing) {
      existing.quantity += qty;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.categoryName,
        quantity: qty
      });
    }

    this.save();
    this.render();
    this.openCart();
    window.showToast(`Added "${product.name}" to your bag!`, 'success');
  }

  updateQuantity(productId, delta) {
    const item = this.items.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    this.save();
    this.render();
  }

  removeItem(productId) {
    this.items = this.items.filter(i => i.id !== productId);
    this.save();
    this.render();
    window.showToast('Item removed from bag', 'info');
  }

  applyPromoCode(code) {
    if (code === 'URBAN10') {
      this.discountCode = 'URBAN10';
      this.discountPercent = 0.10;
      window.showToast('10% discount applied!', 'success');
    } else if (code === 'WELCOME20') {
      this.discountCode = 'WELCOME20';
      this.discountPercent = 0.20;
      window.showToast('20% Welcome discount applied!', 'success');
    } else if (!code) {
      window.showToast('Please enter a coupon code', 'info');
    } else {
      window.showToast('Invalid promo code. Try URBAN10 or WELCOME20', 'error');
    }
    this.render();
  }

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getTotalCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  render() {
    // Update badge counters
    const badge = document.getElementById('cartBadgeCount');
    const totalCount = this.getTotalCount();
    if (badge) {
      badge.textContent = totalCount;
      badge.style.display = totalCount > 0 ? 'flex' : 'none';
    }

    const body = document.getElementById('cartBody');
    const subtotalEl = document.getElementById('cartSubtotal');
    const discountRow = document.getElementById('cartDiscountRow');
    const discountValEl = document.getElementById('cartDiscountVal');
    const shippingEl = document.getElementById('cartShipping');
    const totalEl = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (!body) return;

    if (this.items.length === 0) {
      body.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🛍️</div>
          <h4 style="font-family: var(--font-serif); font-size: 1.3rem; margin-bottom: 0.5rem;">Your shopping bag is empty</h4>
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem;">Explore our curated lifestyle collection and fill your space with beauty.</p>
          <button class="btn btn-secondary" onclick="window.cart.closeCart(); document.getElementById('catalog').scrollIntoView({behavior: 'smooth'});">
            Browse Catalog
          </button>
        </div>
      `;
      if (checkoutBtn) checkoutBtn.disabled = true;
      if (subtotalEl) subtotalEl.textContent = '$0.00';
      if (totalEl) totalEl.textContent = '$0.00';
      if (discountRow) discountRow.style.display = 'none';
      if (shippingEl) shippingEl.textContent = '$0.00';
      return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;

    body.innerHTML = this.items.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
        <div class="cart-item-info">
          <h5 class="cart-item-title">${item.name}</h5>
          <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
          <div class="cart-qty-row">
            <div class="qty-control">
              <button class="qty-btn" onclick="window.cart.updateQuantity('${item.id}', -1)">-</button>
              <span class="qty-val">${item.quantity}</span>
              <button class="qty-btn" onclick="window.cart.updateQuantity('${item.id}', 1)">+</button>
            </div>
            <button class="remove-item-btn" onclick="window.cart.removeItem('${item.id}')">Remove</button>
          </div>
        </div>
      </div>
    `).join('');

    const subtotal = this.getSubtotal();
    const discountAmount = subtotal * this.discountPercent;
    const isFreeShipping = subtotal >= this.shippingThreshold;
    const shipping = isFreeShipping ? 0 : this.shippingRate;
    const total = subtotal - discountAmount + shipping;

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    
    if (discountRow && discountValEl) {
      if (this.discountPercent > 0) {
        discountRow.style.display = 'flex';
        discountValEl.textContent = `-$${discountAmount.toFixed(2)} (${this.discountCode})`;
      } else {
        discountRow.style.display = 'none';
      }
    }

    if (shippingEl) {
      shippingEl.innerHTML = isFreeShipping 
        ? `<span style="color: var(--success); font-weight: 700;">FREE</span>` 
        : `$${shipping.toFixed(2)}`;
    }

    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  }

  openCheckoutModal() {
    this.closeCart();
    const modal = document.getElementById('checkoutModal');
    const modalBody = document.getElementById('checkoutModalBody');
    if (!modal || !modalBody) return;

    const subtotal = this.getSubtotal();
    const discountAmount = subtotal * this.discountPercent;
    const shipping = subtotal >= this.shippingThreshold ? 0 : this.shippingRate;
    const total = subtotal - discountAmount + shipping;

    modalBody.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="font-size: 2.8rem; margin-bottom: 0.5rem;">🌿</div>
        <h3 style="font-family: var(--font-serif); font-size: 1.6rem; font-weight: 700;">UrbanNest Order Summary</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem;">Review your artisanal order before completing simulated checkout.</p>
      </div>

      <div style="background: var(--bg-secondary); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem; max-height: 200px; overflow-y: auto;">
        ${this.items.map(i => `
          <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.5rem;">
            <span>${i.name} × <strong>${i.quantity}</strong></span>
            <strong>$${(i.price * i.quantity).toFixed(2)}</strong>
          </div>
        `).join('')}
      </div>

      <div style="border-top: 1px dashed var(--border-strong); padding-top: 1rem; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.4rem;">
          <span>Subtotal:</span>
          <span>$${subtotal.toFixed(2)}</span>
        </div>
        ${this.discountPercent > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.4rem; color: var(--success);">
            <span>Discount (${this.discountCode}):</span>
            <span>-$${discountAmount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.4rem;">
          <span>Shipping:</span>
          <span>${shipping === 0 ? 'FREE' : '$' + shipping.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 1.3rem; font-weight: 800; color: var(--accent-terracotta); margin-top: 0.5rem; border-top: 1px solid var(--border-subtle); padding-top: 0.5rem;">
          <span>Total:</span>
          <span>$${total.toFixed(2)}</span>
        </div>
      </div>

      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-secondary" style="flex: 1;" onclick="document.getElementById('checkoutModal').classList.remove('active')">
          Continue Shopping
        </button>
        <button class="btn btn-primary" style="flex: 1.2;" onclick="window.cart.completeCheckout()">
          Confirm Order
        </button>
      </div>
    `;

    modal.classList.add('active');
  }

  completeCheckout() {
    this.items = [];
    this.discountCode = '';
    this.discountPercent = 0;
    this.save();
    this.render();

    document.getElementById('checkoutModal')?.classList.remove('active');
    window.showToast('🎉 Order placed successfully! Thank you for supporting UrbanNest.', 'success');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.cart = new CartManager();
});
