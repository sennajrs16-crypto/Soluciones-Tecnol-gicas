// Sistema de ventas para vendedor (solo lectura de inventario)
const STORAGE_KEY = 'pyme_inventory_v1';
const AUTH_USER_KEY = 'pyme_current_user';

// Verificar autenticación
function checkAuthentication() {
  const currentUser = localStorage.getItem(AUTH_USER_KEY);
  if (!currentUser || currentUser !== 'Milton Fernando Quintero Lozano') {
    window.location.href = 'login.html';
  }
}

checkAuthentication();

function uid() { return Date.now().toString(36) + Math.random().toString(36).substring(2, 8); }

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { products: [], sales: [] };
  try { return JSON.parse(raw); } catch (e) { return { products: [], sales: [] }; }
}

function saveState(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

let state = loadState();

// UI elements
const saleForm = document.getElementById('sale-form');
const saleProduct = document.getElementById('sale-product');
const saleQty = document.getElementById('sale-qty');
const saleWarranty = document.getElementById('sale-warranty');

const statProducts = document.getElementById('stat-products');
const statSales = document.getElementById('stat-sales');
const statTotalSales = document.getElementById('stat-total-sales');
const lowStock = document.getElementById('low-stock');

const productsList = document.getElementById('products-list');
const searchProduct = document.getElementById('search-product');

// Auth elements
const logoutBtn = document.getElementById('logout-btn');
const userNameDisplay = document.getElementById('user-name');

function getCurrentUser() { return localStorage.getItem(AUTH_USER_KEY); }

function logoutUser() { 
  localStorage.removeItem(AUTH_USER_KEY);
  window.location.href = 'login.html';
}

function updateAuthUI() {
  const user = getCurrentUser();
  if (user && userNameDisplay) {
    userNameDisplay.textContent = user;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Render products (solo visualización, sin editar/eliminar)
function renderProducts(filtered = null) {
  const productsToShow = filtered || state.products;
  
  if (productsToShow.length === 0) {
    if (productsList) productsList.innerHTML = '<div style="text-align:center;padding:40px;color:#999">No hay productos disponibles</div>';
    return;
  }

  const cards = productsToShow.map(p => {
    const imageUrl = p.image || 'https://via.placeholder.com/200?text=Sin+imagen';
    const currentPrice = Number(p.price);
    const specs = p.sku ? p.sku.substring(0, 10) : '';
    const stockStatus = Number(p.stock) <= 5 ? 'low-stock' : 'good-stock';
    return `
      <div class="product-card">
        <div class="product-image-container">
          <img src="${imageUrl}" alt="${escapeHtml(p.name)}" class="product-image" onerror="this.src='https://via.placeholder.com/200?text=Error'">
          ${specs ? `<span class="product-spec-badge">${specs}</span>` : ''}
        </div>
        <div class="product-card-body">
          <h3 class="product-name">${escapeHtml(p.name)}</h3>
          <p class="product-price">$${currentPrice.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <div class="stock-container">
            <span class="stock-value ${stockStatus}">${p.stock}</span>
          </div>
          <div class="product-actions">
            <button class="add-cart-btn" data-id="${p.id}">Vender</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (productsList) productsList.innerHTML = cards;
  if (productsList) {
    productsList.querySelectorAll('.add-cart-btn').forEach(b => b.addEventListener('click', () => addToCart(b.dataset.id)));
  }
}

function renderDashboard() {
  if (statProducts) statProducts.textContent = state.products.length;
  const today = new Date();
  let todaySales = 0;
  let todayProfit = 0;
  state.sales.forEach(s => {
    const saleDate = new Date(s.date);
    if (saleDate.toDateString() === today.toDateString()) {
      todaySales += Number(s.total);
      // Buscar producto para calcular ganancia
      const prod = state.products.find(p => p.id === s.productId);
      if (prod) {
        const cost = Number(prod.cost || 0);
        const profitUnit = Number(s.price) - cost;
        todayProfit += profitUnit * Number(s.qty);
      }
    }
  });
  if (statSales) statSales.textContent = todaySales.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const statProfit = document.getElementById('stat-profit');
  if (statProfit) statProfit.textContent = todayProfit.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const totalSales = state.sales.reduce((s, x) => s + Number(x.total), 0);
  if (statTotalSales) statTotalSales.textContent = state.sales.length;
  const lows = state.products.filter(p => Number(p.stock) <= 5);
  if (lowStock) lowStock.innerHTML = lows.length ? lows.map(p => `<li>${escapeHtml(p.name)} (${p.stock} unidades)</li>`).join('') : '<li>Sin alertas</li>';
}

function populateSaleSelect() {
  if (!saleProduct) return;
  saleProduct.innerHTML = state.products.length ? state.products.map(p => `<option value="${p.id}">${escapeHtml(p.name)} — ${escapeHtml(p.sku)} ($${Number(p.price).toFixed(0)}) — stock: ${p.stock}</option>`).join('') : '<option value="">-- Sin productos --</option>';
}

function recordSale(ev) {
  ev.preventDefault();

  const productId = saleProduct ? saleProduct.value : '';
  const qty = saleQty ? Number(saleQty.value) || 0 : 0;

  if (!productId || qty <= 0) return alert('Selecciona producto y cantidad válida');

  const p = state.products.find(x => x.id === productId);
  if (!p) return alert('Producto no encontrado');
  if (p.stock < qty) return alert(`Stock insuficiente. Disponible: ${p.stock}`);

  p.stock -= qty;
  state.sales.push({
    date: new Date().toISOString(),
    name: p.name,
    sku: p.sku,
    qty,
    price: p.price,
    total: p.price * qty
  });

  saveState(state);
  if (saleForm) saleForm.reset();
  renderProducts();
  populateSaleSelect();
  renderDashboard();
  alert(`Venta registrada: ${qty} x ${p.name}`);
}

// Búsqueda de productos
function searchProducts(query) {
  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) {
    renderProducts();
    return;
  }

  const filtered = state.products.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) || 
    p.sku.toLowerCase().includes(lowerQuery)
  );

  renderProducts(filtered);
}

// Vender una unidad
function addToCart(productId) {
  const p = state.products.find(x => x.id === productId);
  if (!p) return alert('Producto no encontrado');
  if (p.stock <= 0) return alert('Producto sin stock');

  p.stock -= 1;
  state.sales.push({
    date: new Date().toISOString(),
    name: p.name,
    sku: p.sku,
    qty: 1,
    price: p.price,
    total: p.price * 1
  });

  saveState(state);
  renderProducts();
  populateSaleSelect();
  renderDashboard();
  alert(`Venta registrada: 1 x ${p.name}`);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  checkAuthentication();
  updateAuthUI();
  renderProducts();
  populateSaleSelect();
  renderDashboard();

  if (saleForm) saleForm.addEventListener('submit', recordSale);
  if (searchProduct) searchProduct.addEventListener('input', (e) => searchProducts(e.target.value));
  if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
});
