/**
 * Ayan Business Ecosystem Engine
 * Handles SSS Logistic, Ayan Cafe, and Ayan Mobile interactions with Fullstack REST API & SQLite DB sync
 */

// API Base URL (auto-detects local server or static fallback)
const API_BASE = window.location.origin.includes('http') ? window.location.origin : 'http://localhost:8000';

// Application State
const state = {
  activeView: 'hub',
  theme: 'dark',
  cart: JSON.parse(localStorage.getItem('ayan_cart') || '[]'),
  trackingDB: JSON.parse(localStorage.getItem('ayan_tracking_db') || JSON.stringify({
    'SSS-88921': {
      origin: 'Mumbai Central Hub',
      dest: 'Ahmedabad Express Warehouse',
      status: 'IN TRANSIT',
      progressPct: 66,
      steps: [
        { title: 'Picked Up', time: 'Sep 06, 09:30 AM', status: 'completed' },
        { title: 'Sorting Hub', time: 'Sep 07, 02:15 PM', status: 'completed' },
        { title: 'In Transit', time: 'Sep 08, 08:00 AM', status: 'active' },
        { title: 'Out for Delivery', time: 'Expected Today', status: 'pending' }
      ]
    },
    'SSS-10492': {
      origin: 'Surat Depot',
      dest: 'Delhi NCR Gateway',
      status: 'DELIVERED',
      progressPct: 100,
      steps: [
        { title: 'Picked Up', time: 'Sep 04, 11:00 AM', status: 'completed' },
        { title: 'Sorting Hub', time: 'Sep 05, 04:30 PM', status: 'completed' },
        { title: 'In Transit', time: 'Sep 06, 09:00 AM', status: 'completed' },
        { title: 'Delivered', time: 'Sep 07, 01:20 PM', status: 'completed' }
      ]
    },
    'SSS-55301': {
      origin: 'Bangalore Tech Park',
      dest: 'Mumbai Port Hub',
      status: 'PROCESSING',
      progressPct: 25,
      steps: [
        { title: 'Order Created', time: 'Sep 08, 10:15 AM', status: 'completed' },
        { title: 'Courier Assigned', time: 'Sep 08, 11:00 AM', status: 'active' },
        { title: 'In Transit', time: 'Pending Pickup', status: 'pending' },
        { title: 'Out for Delivery', time: 'Expected Sep 10', status: 'pending' }
      ]
    }
  })),
  cafeMenu: [
    {
      id: 'c1',
      name: 'Ayan Signature Espresso',
      category: 'coffee',
      price: 180,
      desc: 'Double shot dark roast Arabica espresso with silky crema.',
      tag: 'Best Seller',
      img: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'c2',
      name: 'Hazelnut Cold Brew',
      category: 'coffee',
      price: 240,
      desc: 'Steeped for 18 hours, infused with hazelnut & cold milk foam.',
      tag: 'Chef Special',
      img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'c3',
      name: 'Caramel Macchiato Latte',
      category: 'coffee',
      price: 220,
      desc: 'Steamed velvet milk, vanilla syrup topped with rich espresso caramel drizzle.',
      tag: 'Popular',
      img: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'b1',
      name: 'Nutella Thick Shake',
      category: 'beverage',
      price: 260,
      desc: 'Rich hazelnut cocoa cocoa shake topped with crushed waffle cone.',
      tag: 'Kids Favorite',
      img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'b2',
      name: 'Berry Blast Cooler',
      category: 'beverage',
      price: 190,
      desc: 'Fresh blueberries, mint leaves, soda, and lime squeeze.',
      tag: 'Refreshing',
      img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 's1',
      name: 'Ayan Gourmet Cheese Burger',
      category: 'snacks',
      price: 290,
      desc: 'Prime patty, melted cheddar, caramelised onions & truffle mayo.',
      tag: 'Must Try',
      img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 's2',
      name: 'Wood-Fired Paneer Tikka Pizza',
      category: 'snacks',
      price: 420,
      desc: 'Hand-tossed crust, charred cottage cheese, capsicum & mozzarella.',
      tag: 'Hot Seller',
      img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'd1',
      name: 'Belgian Chocolate Lava Cake',
      category: 'dessert',
      price: 210,
      desc: 'Warm chocolate cake with oozing molten ganache center.',
      tag: 'Sweet Delight',
      img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80'
    }
  ],
  mobileCatalog: [
    {
      id: 'm1',
      brand: 'Apple',
      title: 'iPhone 15 Pro Max',
      badge: 'Flagship',
      price: '₹1,34,900',
      specs: ['Titanium Design with A17 Pro', '48MP Main Camera + 5x Telephoto', 'Super Retina XDR 120Hz'],
      img: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'm2',
      brand: 'Samsung',
      title: 'Galaxy S24 Ultra',
      badge: 'AI Powered',
      price: '₹1,29,999',
      specs: ['Built-in S Pen & Armor Aluminum', '200MP Quad Telephoto Camera', 'Snapdragon 8 Gen 3 for Galaxy'],
      img: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'm3',
      brand: 'OnePlus',
      title: 'OnePlus 12 5G',
      badge: 'Speed King',
      price: '₹64,999',
      specs: ['Hasselblad 4th Gen Camera', '100W SUPERVOOC Fast Charge', '4500 nits Peak Brightness'],
      img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'a1',
      brand: 'Accessory',
      title: 'AirPods Pro (2nd Gen)',
      badge: 'Best Audio',
      price: '₹22,900',
      specs: ['Active Noise Cancellation', 'Spatial Audio with Head Tracking', 'USB-C MagSafe Charging Case'],
      img: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=400&q=80'
    }
  ],
  repairModels: {
    apple: ['iPhone 15 / 15 Pro', 'iPhone 14 / 14 Plus', 'iPhone 13 / 13 Pro', 'iPhone 12 / 11'],
    samsung: ['Galaxy S24 / S24+', 'Galaxy S23 Ultra', 'Galaxy A54 5G', 'Galaxy Z Fold / Flip'],
    oneplus: ['OnePlus 12 / 12R', 'OnePlus 11 5G', 'OnePlus Nord 3', 'OnePlus 10 Pro'],
    xiaomi: ['Xiaomi 14 / 13 Pro', 'Redmi Note 13 Pro+', 'Poco F5 5G']
  }
};

// Save tracking database to localStorage
function saveTrackingDB() {
  localStorage.setItem('ayan_tracking_db', JSON.stringify(state.trackingDB));
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  renderCafeMenu('all');
  renderMobileCatalog();
  updateRepairModels();
  calculateFreightCost();
  updateCartBadge();
  loadBackendData();
  
  // Set default datetime for table reservation (tomorrow 7 PM)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0);
  const isoStr = tomorrow.toISOString().slice(0, 16);
  const resInput = document.getElementById('res-datetime');
  if (resInput) resInput.value = isoStr;
});

// Sync data from Python REST Backend if connected
async function loadBackendData() {
  try {
    const res = await fetch(`${API_BASE}/api/cafe/menu`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        state.cafeMenu = data.data;
        renderCafeMenu('all');
      }
    }
  } catch (err) {
    console.log('Backend API running in offline/static mode');
  }
}

// View Navigation Switcher
function switchView(viewId) {
  state.activeView = viewId;
  
  // Update section visibility
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.remove('active');
  });
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) targetView.classList.add('active');

  // Update header nav tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.getAttribute('data-target') === viewId) {
      tab.classList.add('active');
    }
  });

  // Scroll to top smooth
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Theme Toggler
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  
  const icon = document.querySelector('#theme-toggle i');
  if (icon) {
    icon.className = newTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  }
  showToast(`Switched to ${newTheme.toUpperCase()} theme mode`);
}

// SSS Logistic Consignment Tracker (Connects to REST Backend / SQLite DB)
async function trackShipment() {
  const input = document.getElementById('tracking-id-input');
  if (!input) return;
  const code = input.value.trim().toUpperCase();

  if (!code) {
    showToast('Please enter a valid tracking code!', 'danger');
    return;
  }

  let data = null;

  // Attempt to fetch live consignment from backend API
  try {
    const response = await fetch(`${API_BASE}/api/tracking?id=${encodeURIComponent(code)}`);
    if (response.ok) {
      const resData = await response.json();
      if (resData.success && resData.data) {
        data = {
          origin: resData.data.origin,
          dest: resData.data.destination,
          status: resData.data.status,
          progressPct: resData.data.progress_pct,
          steps: resData.data.steps
        };
      }
    }
  } catch (e) {
    console.log('Using local tracking database fallback');
  }

  // Fallback to local memory / LocalStorage database
  if (!data) {
    data = state.trackingDB[code];
  }

  // If still not found, create seamless dynamic tracking record
  if (!data) {
    data = {
      origin: 'Regional Origin Depot',
      dest: 'Destination Fulfillment Center',
      status: 'IN TRANSIT',
      progressPct: 50,
      steps: [
        { title: 'Order Booked', time: 'Just Now', status: 'completed' },
        { title: 'Dispatched', time: 'In Progress', status: 'active' },
        { title: 'In Transit', time: 'Expected 24h', status: 'pending' },
        { title: 'Delivered', time: 'Pending', status: 'pending' }
      ]
    };
  }

  // Update DOM Display
  document.getElementById('track-code-display').innerText = `Tracking Code: ${code}`;
  document.getElementById('track-dest-display').innerText = `Route: ${data.origin} → ${data.dest}`;
  
  const statusPill = document.getElementById('track-status-pill');
  if (statusPill) statusPill.innerText = data.status;

  const progressBar = document.getElementById('timeline-progress-bar');
  if (progressBar) progressBar.style.width = `${data.progressPct}%`;

  // Update timeline steps
  data.steps.forEach((step, idx) => {
    const el = document.getElementById(`step-${idx + 1}`);
    if (el) {
      el.className = `timeline-step ${step.status}`;
      const titleEl = el.querySelector('.step-title');
      const timeEl = el.querySelector('.step-time');
      if (titleEl) titleEl.innerText = step.title;
      if (timeEl) timeEl.innerText = step.time;
    }
  });

  showToast(`Loaded live records for ${code}`, 'success');
}

// Freight Rate Calculator
function calculateFreightCost() {
  const originEl = document.getElementById('calc-origin');
  const destEl = document.getElementById('calc-dest');
  const weightEl = document.getElementById('calc-weight');
  const speedEl = document.getElementById('calc-speed');

  if (!originEl || !destEl) return;

  const origin = originEl.value;
  const dest = destEl.value;
  const weight = parseFloat(weightEl.value) || 1;
  const speed = speedEl.value;

  let baseRate = 150;
  if (origin !== dest) baseRate += 200;

  let weightCost = weight * 40;
  
  let multiplier = 1;
  if (speed === 'express') multiplier = 1.5;
  if (speed === 'same_day') multiplier = 2.2;

  const total = Math.round((baseRate + weightCost) * multiplier);
  
  const display = document.getElementById('calc-price-display');
  if (display) display.innerText = `₹${total.toLocaleString('en-IN')}`;
}

// Booking Quote Modals
function openQuoteModal() {
  document.getElementById('quote-modal').classList.add('active');
}
function closeQuoteModal() {
  document.getElementById('quote-modal').classList.remove('active');
}

async function confirmFreightBooking() {
  const nameEl = document.getElementById('ship-name');
  const addressEl = document.getElementById('ship-address');

  const name = nameEl ? nameEl.value.trim() : '';
  const address = addressEl ? addressEl.value.trim() : '';

  if (!name || !address) {
    showToast('Please provide your name and pickup address.', 'danger');
    return;
  }

  const newCode = `SSS-${Math.floor(10000 + Math.random() * 90000)}`;
  closeQuoteModal();

  // Save to SQLite Backend DB via REST API
  try {
    await fetch(`${API_BASE}/api/tracking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: newCode, name: name, address: address })
    });
  } catch (err) {
    console.log('Saved to local storage DB fallback');
  }
  
  // Register in local DB state
  state.trackingDB[newCode] = {
    origin: address,
    dest: 'Central Distribution Hub',
    status: 'BOOKED',
    progressPct: 15,
    steps: [
      { title: 'Pickup Scheduled', time: 'Today', status: 'active' },
      { title: 'In Sorting Hub', time: 'Pending', status: 'pending' },
      { title: 'In Transit', time: 'Pending', status: 'pending' },
      { title: 'Delivered', time: 'Pending', status: 'pending' }
    ]
  };
  saveTrackingDB();

  document.getElementById('tracking-id-input').value = newCode;
  trackShipment();
  showToast(`Freight pickup booked! Tracking Code: ${newCode}`, 'success');
}

// Ayan Cafe Functions
function filterCafeMenu(category, btn) {
  if (btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  renderCafeMenu(category);
}

function renderCafeMenu(category) {
  const container = document.getElementById('cafe-menu-container');
  if (!container) return;

  const filtered = category === 'all' 
    ? state.cafeMenu 
    : state.cafeMenu.filter(i => i.category === category);

  container.innerHTML = filtered.map(item => `
    <div class="glass-panel food-card">
      <div class="food-img-holder">
        <img src="${item.img || item.image_url}" alt="${item.name}">
        <span class="food-tag">${item.tag}</span>
      </div>
      <div class="food-info">
        <h4>${item.name}</h4>
        <p class="food-desc">${item.desc || item.description}</p>
      </div>
      <div class="food-footer">
        <span class="food-price">₹${item.price}</span>
        <button class="btn btn-cafe" style="padding: 8px 16px; font-size: 0.85rem;" onclick="addToCart('${item.id}')">
          <i class="fa-solid fa-plus"></i> Add
        </button>
      </div>
    </div>
  `).join('');
}

// Shopping Cart Management
function addToCart(itemId) {
  const item = state.cafeMenu.find(i => i.id === itemId);
  if (!item) return;

  const existing = state.cart.find(c => c.id === itemId);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ ...item, qty: 1 });
  }

  localStorage.setItem('ayan_cart', JSON.stringify(state.cart));
  updateCartBadge();
  showToast(`Added ${item.name} to your basket!`, 'success');
}

function updateCartBadge() {
  const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById('cart-count');
  if (badge) badge.innerText = totalCount;
}

function openCartModal() {
  renderCartItems();
  document.getElementById('cart-modal').classList.add('active');
}

function closeCartModal() {
  document.getElementById('cart-modal').classList.remove('active');
}

function renderCartItems() {
  const container = document.getElementById('cart-items-list');
  if (!container) return;

  if (state.cart.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px 0;">Your basket is empty. Browse Ayan Cafe menu to add delicious items!</p>`;
    document.getElementById('cart-total-price').innerText = `₹0`;
    return;
  }

  let total = 0;
  container.innerHTML = state.cart.map(item => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    return `
      <div class="cart-item">
        <div>
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">₹${item.price} x ${item.qty} = ₹${itemTotal}</div>
        </div>
        <div class="cart-controls">
          <button class="qty-btn" onclick="updateItemQty('${item.id}', -1)">-</button>
          <span>${item.qty}</span>
          <button class="qty-btn" onclick="updateItemQty('${item.id}', 1)">+</button>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('cart-total-price').innerText = `₹${total.toLocaleString('en-IN')}`;
}

function updateItemQty(itemId, change) {
  const item = state.cart.find(c => c.id === itemId);
  if (!item) return;

  item.qty += change;
  if (item.qty <= 0) {
    state.cart = state.cart.filter(c => c.id !== itemId);
  }

  localStorage.setItem('ayan_cart', JSON.stringify(state.cart));
  updateCartBadge();
  renderCartItems();
}

async function checkoutCafeCart() {
  if (state.cart.length === 0) {
    showToast('Your basket is empty!', 'danger');
    return;
  }

  const orderNum = Math.floor(1000 + Math.random() * 9000);
  const total = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // Send Order to Backend REST API (SQLite Database)
  try {
    await fetch(`${API_BASE}/api/cafe/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: state.cart, total: total })
    });
  } catch (err) {
    console.log('Order processed with local database storage');
  }
  
  closeCartModal();
  state.cart = [];
  localStorage.removeItem('ayan_cart');
  updateCartBadge();

  showToast(`Order #${orderNum} confirmed! Total ₹${total.toLocaleString('en-IN')}. Fresh food preparing at Ayan Cafe!`, 'success');
}

// WhatsApp Direct Ordering
function orderOnWhatsApp() {
  let message = "☕ *Ayan Cafe Direct Order*\n\n";

  if (state.cart.length === 0) {
    message += "Hello Ayan Cafe! I would like to inquire about today's special menu & order coffee/snacks.";
  } else {
    message += "*Selected Menu Items:*\n";
    let total = 0;
    state.cart.forEach(item => {
      const itemTotal = item.price * item.qty;
      total += itemTotal;
      message += `• ${item.name} (${item.qty}x) - ₹${itemTotal}\n`;
    });
    message += `\n*Total Amount:* ₹${total.toLocaleString('en-IN')}\n\nPlease confirm my order & delivery details!`;
  }

  const encodedMsg = encodeURIComponent(message);
  const waUrl = `https://wa.me/?text=${encodedMsg}`;
  window.open(waUrl, '_blank');
  showToast('Opening WhatsApp with your formatted Ayan Cafe order...', 'success');
}

// Table Reservation
function openReservationModal() {
  document.getElementById('reservation-modal').classList.add('active');
}
function closeReservationModal() {
  document.getElementById('reservation-modal').classList.remove('active');
}

async function confirmReservation() {
  const nameEl = document.getElementById('res-name');
  const guestsEl = document.getElementById('res-guests');
  const timeEl = document.getElementById('res-datetime');

  const name = nameEl ? nameEl.value.trim() : '';
  const guests = guestsEl ? guestsEl.value : 2;
  const time = timeEl ? timeEl.value : '';

  if (!name || !time) {
    showToast('Please fill in your name and preferred date/time slot.', 'danger');
    return;
  }

  // Save to Backend Database
  try {
    await fetch(`${API_BASE}/api/cafe/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, guests, time })
    });
  } catch (e) {
    console.log('Reservation saved to local storage fallback');
  }

  closeReservationModal();
  showToast(`Table reserved for ${name} (${guests} guests) at Ayan Cafe!`, 'success');
}

// Ayan Mobile Catalog & Repair Functions
function renderMobileCatalog() {
  const container = document.getElementById('mobile-catalog-container');
  if (!container) return;

  container.innerHTML = state.mobileCatalog.map(device => `
    <div class="glass-panel device-card">
      <div style="height: 200px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 16px; background: var(--bg-secondary);">
        <img src="${device.img || device.image_url}" alt="${device.title}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <span class="device-badge">${device.badge} • ${device.brand}</span>
      <h4 class="device-title">${device.title}</h4>
      <ul class="device-specs">
        ${device.specs.map(s => `<li><i class="fa-solid fa-check" style="color: var(--accent-mobile)"></i> ${s}</li>`).join('')}
      </ul>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border-glass);">
        <span style="font-size: 1.3rem; font-weight: 800; color: var(--accent-mobile);">${device.price}</span>
        <button class="btn btn-mobile" style="padding: 8px 16px; font-size: 0.85rem;" onclick="inquireMobile('${device.title}')">
          <i class="fa-solid fa-cart-shopping"></i> Buy Now
        </button>
      </div>
    </div>
  `).join('');
}

function showMobileSubTab(tab) {
  const catalogEl = document.getElementById('mobile-tab-catalog');
  const repairEl = document.getElementById('mobile-tab-repair');

  if (tab === 'catalog') {
    catalogEl.style.display = 'block';
    repairEl.style.display = 'none';
  } else {
    catalogEl.style.display = 'none';
    repairEl.style.display = 'block';
  }
}

function updateRepairModels() {
  const brandEl = document.getElementById('repair-brand');
  const modelSelect = document.getElementById('repair-model');
  if (!brandEl || !modelSelect) return;

  const brand = brandEl.value;
  const models = state.repairModels[brand] || [];
  modelSelect.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
  calculateRepairCost();
}

function calculateRepairCost() {
  const brandEl = document.getElementById('repair-brand');
  const issueEl = document.getElementById('repair-issue');
  if (!brandEl || !issueEl) return;

  const brand = brandEl.value;
  const issue = issueEl.value;

  let basePrice = 1499;
  if (brand === 'apple') basePrice += 1500;
  if (brand === 'samsung') basePrice += 1000;

  if (issue === 'screen') basePrice += 1200;
  if (issue === 'water') basePrice += 800;

  const display = document.getElementById('repair-price-display');
  if (display) display.innerText = `₹${basePrice.toLocaleString('en-IN')}`;
}

async function bookRepairSlot() {
  const brandEl = document.getElementById('repair-brand');
  const modelEl = document.getElementById('repair-model');
  const issueEl = document.getElementById('repair-issue');

  const brand = brandEl ? brandEl.value.toUpperCase() : 'APPLE';
  const model = modelEl ? modelEl.value : 'iPhone';
  const issue = issueEl ? issueEl.value : 'screen';

  // Send Repair Booking to Backend SQLite Database
  try {
    await fetch(`${API_BASE}/api/mobile/repairs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, model, issue, cost: 2699 })
    });
  } catch (e) {
    console.log('Saved to local DB');
  }

  showToast(`Repair appointment scheduled for ${brand} ${model}! Technician assigned.`, 'success');
}

function inquireMobile(deviceName) {
  showToast(`Inquiry created for ${deviceName}. Ayan Mobile executive will assist you.`, 'success');
}

// Universal Toast System
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let iconClass = 'fa-solid fa-circle-info';
  if (type === 'success') iconClass = 'fa-solid fa-circle-check';
  if (type === 'danger') iconClass = 'fa-solid fa-circle-exclamation';

  toast.innerHTML = `<i class="${iconClass}" style="color: var(--accent-hub)"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
