/**
 * UrbanNest Lifestyle Store - Products Data & Catalog Manager
 */

const PRODUCTS_DATA = [
  // 1. Home Décor
  {
    id: 'un-hd-01',
    name: 'Artisan Ceramic Ribbed Vase',
    category: 'home-decor',
    categoryName: 'Home Décor',
    price: 34.00,
    rating: 4.9,
    tag: 'bestseller',
    tagText: 'Bestseller',
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    description: 'Hand-thrown terracotta ceramic vase with matte ribbed finish. Perfect for dry florals or minimalist centerpieces.',
    details: ['Material: 100% Terracotta Clay', 'Dimensions: 8.5" H x 4.2" W', 'Finish: Matte Sand Glaze', 'Handcrafted in limited batches']
  },
  {
    id: 'un-hd-02',
    name: 'Wild Amber & Cedar Soy Candle',
    category: 'home-decor',
    categoryName: 'Home Décor',
    price: 24.50,
    rating: 4.8,
    tag: 'artisan',
    tagText: 'Handmade',
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
    description: 'Hand-poured 100% natural soy wax candle infused with organic cedarwood, warm amber, and smoked vanilla.',
    details: ['Burn Time: 55+ Hours', 'Wax: Organic Soy Wax', 'Wick: Lead-free Cotton Wick', 'Reusable Amber Glass Jar']
  },
  {
    id: 'un-hd-03',
    name: 'Nordic Brass Arch Table Mirror',
    category: 'home-decor',
    categoryName: 'Home Décor',
    price: 48.00,
    rating: 4.7,
    tag: 'new',
    tagText: 'New In',
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=800&q=80',
    description: 'Minimalist arched tabletop mirror set in solid brushed brass with dual-angle tilt for bedroom vanities or console tables.',
    details: ['Frame: Solid Brushed Brass', 'Glass: High-Definition Beveled', 'Base: Heavy Weighted Brass', 'Dimensions: 11" x 7"']
  },
  {
    id: 'un-hd-04',
    name: 'Handwoven Jute Wall Tapestry',
    category: 'home-decor',
    categoryName: 'Home Décor',
    price: 39.00,
    rating: 4.9,
    tag: 'artisan',
    tagText: 'Handwoven',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    description: 'Textured geometric wall hanging woven from raw sustainable jute fiber on a polished ash wood dowel.',
    details: ['Fiber: 100% Natural Jute', 'Dowel: Solid Ash Wood', 'Height: 28 Inches', 'Crafted by Local Weavers']
  },

  // 2. Gift Items
  {
    id: 'un-gi-01',
    name: 'The UrbanNest Botanica Gift Hamper',
    category: 'gift-items',
    categoryName: 'Gift Items',
    price: 68.00,
    rating: 5.0,
    tag: 'bestseller',
    tagText: 'Curated Gift',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
    description: 'Our signature gift curation containing a mini soy candle, botanical mist, brass tea infuser, and custom handwritten note.',
    details: ['Includes: 4 Curated Products', 'Packaging: Keepsake Wood Box', 'Includes: Custom Letterpress Note', 'Eco-friendly Ribbon']
  },
  {
    id: 'un-gi-02',
    name: 'Vintage Engraved Brass Bookmark Set',
    category: 'gift-items',
    categoryName: 'Gift Items',
    price: 18.00,
    rating: 4.8,
    tag: 'artisan',
    tagText: 'Artisan',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    description: 'Set of 3 slender bookmarks etched with botanical leaf motifs and finished with raw silk tassels.',
    details: ['Set of 3 Bookmarks', 'Material: Antiqued Solid Brass', 'Tassel: 100% Pure Mulberry Silk', 'Gift Box Included']
  },
  {
    id: 'un-gi-03',
    name: 'Artisan Herbal Tea Infusion Kit',
    category: 'gift-items',
    categoryName: 'Gift Items',
    price: 29.00,
    rating: 4.9,
    tag: 'new',
    tagText: 'Popular',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    description: 'Trio of organic botanical loose leaf teas (Lavender Chamomile, Citrus Earl, Spiced Mint) with stainless steel gold strainer.',
    details: ['3x 40g Glass Jars', 'Organic Whole Herb Blends', 'Gold Mesh Sphere Infuser', 'Caffeine-free options included']
  },

  // 3. Stationery
  {
    id: 'un-st-01',
    name: 'Linen Hardcover Daily Journal',
    category: 'stationery',
    categoryName: 'Stationery',
    price: 22.00,
    rating: 4.9,
    tag: 'bestseller',
    tagText: 'Bestseller',
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80',
    description: 'Natural woven oatmeal linen notebook featuring 120gsm fountain-pen friendly bleedproof dotted paper.',
    details: ['Cover: Natural Woven Linen', 'Paper: 192 Pages, 120gsm Cream', 'Grid: 5mm Dot Grid', 'Lay-flat 180° Binding']
  },
  {
    id: 'un-st-02',
    name: 'Handcrafted Bamboo Fountain Pen',
    category: 'stationery',
    categoryName: 'Stationery',
    price: 32.00,
    rating: 4.8,
    tag: 'artisan',
    tagText: 'Eco Craft',
    image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80',
    description: 'Ergonomic refillable fountain pen carved from aged bamboo with an iridium-tipped fine nib for effortless writing.',
    details: ['Body: Carved Natural Bamboo', 'Nib: German Iridium Fine 0.5mm', 'Includes: Ink Piston Converter', 'Bamboo Presentation Case']
  },
  {
    id: 'un-st-03',
    name: 'Brass Wax Seal Stamp & Beads Kit',
    category: 'stationery',
    categoryName: 'Stationery',
    price: 26.00,
    rating: 4.7,
    tag: 'new',
    tagText: 'New',
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80',
    description: 'Heirloom botanical wax seal stamp with rosewood handle, melting spoon, and jar of metallic bronze sealing beads.',
    details: ['Stamp: Solid Brass Olive Branch', 'Handle: Turned Rosewood', 'Wax: 120 Metallic Beads', 'Melting Spoon Included']
  },

  // 4. Lifestyle Accessories
  {
    id: 'un-la-01',
    name: 'Heavyweight Organic Canvas Tote',
    category: 'accessories',
    categoryName: 'Lifestyle Accessories',
    price: 28.00,
    rating: 4.9,
    tag: 'bestseller',
    tagText: 'Organic',
    image: 'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?auto=format&fit=crop&w=800&q=80',
    description: '16oz heavy organic cotton canvas tote bag with reinforced double stitching, interior zippered pocket, and key leash.',
    details: ['Fabric: 100% GOTS Certified Cotton', 'Weight: 16oz Heavy Canvas', 'Internal Zippered Pocket', 'Dimensions: 16" x 14" x 5"']
  },
  {
    id: 'un-la-02',
    name: 'Vegan Leather Minimalist Cardholder',
    category: 'accessories',
    categoryName: 'Lifestyle Accessories',
    price: 21.00,
    rating: 4.8,
    tag: 'artisan',
    tagText: 'Cruelty-Free',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    description: 'Slimline pocket cardholder made from durable cactus-derived vegan leather with RFID blocking inner lining.',
    details: ['Material: Sustainable Cactus Leather', 'Capacity: 6 Cards + Cash Slot', 'RFID Blocking Shielding', 'Hand-stitched Edges']
  },
  {
    id: 'un-la-03',
    name: 'Botanical Print Silk Square Scarf',
    category: 'accessories',
    categoryName: 'Lifestyle Accessories',
    price: 36.00,
    rating: 4.9,
    tag: 'artisan',
    tagText: 'Pure Silk',
    image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=800&q=80',
    description: 'Lightweight hand-rolled silk foulard scarf illustrated with wildflower botanicals in warm earthy tones.',
    details: ['Fabric: 100% Pure Mulberry Silk', 'Dimensions: 22" x 22"', 'Edges: Hand-rolled & Sewn', 'Dry Clean or Gentle Hand Wash']
  },

  // 5. Small Household Products
  {
    id: 'un-hh-01',
    name: 'Reclaimed Teak Wood Coaster Set',
    category: 'household',
    categoryName: 'Household Essentials',
    price: 22.00,
    rating: 4.8,
    tag: 'bestseller',
    tagText: 'Eco Teak',
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
    description: 'Set of 4 geometric coasters crafted from reclaimed plantation teak wood, treated with organic food-safe beeswax oil.',
    details: ['Set of 4 Coasters', 'Wood: 100% Reclaimed Teak', 'Protective Non-slip Cork Base', 'Dimensions: 4" Diameter']
  },
  {
    id: 'un-hh-02',
    name: 'Speckled Stoneware Mug Pair',
    category: 'household',
    categoryName: 'Household Essentials',
    price: 32.00,
    rating: 5.0,
    tag: 'artisan',
    tagText: 'Pair',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    description: 'Set of two 12oz hand-glazed ceramic coffee mugs with comfortable thumb rest and natural unglazed raw base.',
    details: ['Set of 2 Ceramic Mugs', 'Capacity: 12 oz (350ml)', 'Microwave & Dishwasher Safe', 'Lead-free & Food-safe Glaze']
  },
  {
    id: 'un-hh-03',
    name: 'Washed Linen Kitchen Apron',
    category: 'household',
    categoryName: 'Household Essentials',
    price: 38.00,
    rating: 4.7,
    tag: 'new',
    tagText: 'New',
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
    description: 'Japanese cross-back style apron crafted from stonewashed European flax linen with deep dual front pockets.',
    details: ['Fabric: 100% French Flax Linen', 'Design: No-tie Cross Back', 'Two Roomy Front Pockets', 'Pre-washed for Ultra Softness']
  }
];

// Catalog Controller
class CatalogManager {
  constructor() {
    this.products = PRODUCTS_DATA;
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.sortBy = 'featured';
    this.gridElement = document.getElementById('productsGrid');
  }

  init() {
    this.render();
    this.bindEvents();
  }

  bindEvents() {
    // Category pill clicks
    const pills = document.querySelectorAll('.category-btn');
    pills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        pills.forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentCategory = e.currentTarget.getAttribute('data-category');
        this.render();
      });
    });

    // Real-time search input
    const searchInput = document.getElementById('productSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    // Sort select
    const sortSelect = document.getElementById('productSortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.render();
      });
    }
  }

  getFilteredProducts() {
    let list = this.products.filter(item => {
      const matchCat = this.currentCategory === 'all' || item.category === this.currentCategory;
      const matchSearch = !this.searchQuery || 
        item.name.toLowerCase().includes(this.searchQuery) ||
        item.description.toLowerCase().includes(this.searchQuery) ||
        item.categoryName.toLowerCase().includes(this.searchQuery);
      return matchCat && matchSearch;
    });

    if (this.sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (this.sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }

  render() {
    if (!this.gridElement) return;

    const filtered = this.getFilteredProducts();

    if (filtered.length === 0) {
      this.gridElement.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 0.75rem;">🔍</div>
          <h3 style="font-family: var(--font-serif); font-size: 1.4rem; margin-bottom: 0.5rem; color: var(--text-primary);">No matching items found</h3>
          <p>Try refining your search keyword or selecting another category.</p>
        </div>
      `;
      return;
    }

    this.gridElement.innerHTML = filtered.map(product => `
      <div class="product-card" data-id="${product.id}">
        <div class="product-img-wrap">
          <img src="${product.image}" alt="${product.name}" loading="lazy" />
          <span class="product-tag ${product.tag}">${product.tagText}</span>
          <button class="quick-view-btn" onclick="openProductQuickView('${product.id}')">
            Quick View
          </button>
        </div>
        <div class="product-info">
          <span class="product-cat">${product.categoryName}</span>
          <h4 class="product-title">${product.name}</h4>
          <p class="product-desc">${product.description}</p>
          <div class="product-meta">
            <span class="product-price">$${product.price.toFixed(2)}</span>
            <button class="add-cart-btn" onclick="window.cart.addItem('${product.id}')">
              <span>+ Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }
}

// Quick View Modal
window.openProductQuickView = function(productId) {
  const item = PRODUCTS_DATA.find(p => p.id === productId);
  if (!item) return;

  const modal = document.getElementById('quickViewModal');
  const modalBody = document.getElementById('quickViewModalBody');
  if (!modal || !modalBody) return;

  modalBody.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: center;">
      <div style="border-radius: var(--radius-md); overflow: hidden; height: 320px;">
        <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
      <div>
        <span class="section-tag" style="margin-bottom: 0.5rem;">${item.categoryName}</span>
        <h2 style="font-family: var(--font-serif); font-size: 1.8rem; margin-bottom: 0.6rem;">${item.name}</h2>
        <div style="color: var(--accent-amber); font-size: 0.95rem; margin-bottom: 0.8rem;">
          ${'★'.repeat(Math.floor(item.rating))} <span style="color: var(--text-muted); font-size: 0.85rem;">(${item.rating} / 5.0)</span>
        </div>
        <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 1.2rem; line-height: 1.6;">${item.description}</p>
        <ul style="list-style: none; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.85rem; color: var(--text-muted);">
          ${item.details.map(d => `<li>✔ ${d}</li>`).join('')}
        </ul>
        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 1.2rem;">
          <span style="font-size: 1.7rem; font-weight: 800; color: var(--accent-terracotta);">$${item.price.toFixed(2)}</span>
          <button class="btn btn-primary" onclick="window.cart.addItem('${item.id}'); document.getElementById('quickViewModal').classList.remove('active');">
            Add to Bag
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
};

document.addEventListener('DOMContentLoaded', () => {
  window.catalog = new CatalogManager();
  window.catalog.init();
});
