// Sistema de ventas e inventario con autenticación
const STORAGE_KEY = 'pyme_inventory_v1';
const AUTH_USER_KEY = 'pyme_current_user';

// Verificar autenticación al cargar
function checkAuthentication() {
  const currentUser = localStorage.getItem(AUTH_USER_KEY);
  // Permitir acceso a index.html a cualquier usuario autenticado (incluido 'Invitado').
  if (!currentUser) {
    window.location.href = 'login.html';
  }
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).substring(2, 8); }

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { products: [], sales: [], withdrawals: [] };
  try { return JSON.parse(raw); } catch (e) { return { products: [], sales: [] }; }
}

function saveState(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

let state = loadState();

// Asegurar estructura mínima
if (!state.products) state.products = [];
if (!state.sales) state.sales = [];
if (!state.withdrawals) state.withdrawals = [];

// Cargar estado existente sin resetear (mantener inventario entre sesiones)

// UI elements
const productForm = document.getElementById('product-form');
const productId = document.getElementById('product-id');
const productName = document.getElementById('product-name');
const productSku = document.getElementById('product-sku');
const productCost = document.getElementById('product-cost');
const productPrice = document.getElementById('product-price');
const productStock = document.getElementById('product-stock');
const productWarranty = document.getElementById('product-warranty');
const productImage = document.getElementById('product-image');
const productClear = document.getElementById('product-clear');
const productsList = document.getElementById('products-list');

const saleForm = document.getElementById('sale-form');
const saleProduct = document.getElementById('sale-product');
const saleQty = document.getElementById('sale-qty');
const saleDiscount = document.getElementById('sale-discount');
const saleWarranty = document.getElementById('sale-warranty');
const salesList = document.getElementById('sales-list');

const statProducts = document.getElementById('stat-products');
const statInventory = document.getElementById('stat-inventory');
const statSales = document.getElementById('stat-sales');
const lowStock = document.getElementById('low-stock');

// Auth elements
const logoutBtn = document.getElementById('logout-btn');
const userArea = document.getElementById('user-area');
const userNameDisplay = document.getElementById('user-name');

// Search element
const searchProduct = document.getElementById('search-product');

function getCurrentUser() { return localStorage.getItem(AUTH_USER_KEY); }

function logoutUser() { localStorage.removeItem(AUTH_USER_KEY); }

function updateAuthUI() {
  const user = getCurrentUser();
  if (user) {
    if (userArea) userArea.style.display = 'block';
    if (userNameDisplay) userNameDisplay.textContent = user;
  }

  // Si es invitado, ocultar formularios y deshabilitar acciones
  if (user === 'Invitado') {
    if (productForm) productForm.style.display = 'none';
    if (saleForm) saleForm.style.display = 'none';
    // Ocultar controles de administración
    const adminControls = document.querySelector('.admin-controls');
    if (adminControls) adminControls.style.display = 'none';
      // Ocultar panel de dashboard para invitado (no ver ventas/ganancias)
      const dashboardPanel = document.querySelector('.dashboard-panel');
      if (dashboardPanel) dashboardPanel.style.display = 'none';
  } else {
    // Siempre habilitado si está autenticado
    if (productForm) productForm.querySelectorAll('input,button,select').forEach(el => {
      if (el.id !== 'product-clear') el.disabled = false;
    });
    if (saleForm) saleForm.querySelectorAll('select,input,button').forEach(el => el.disabled = false);
    const adminControls = document.querySelector('.admin-controls');
    if (adminControls) adminControls.style.display = '';
    if (productForm) productForm.style.display = '';
    if (saleForm) saleForm.style.display = '';
      const dashboardPanel = document.querySelector('.dashboard-panel');
      if (dashboardPanel) dashboardPanel.style.display = '';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Render
function renderProducts(filtered = null) {
  const productsToShow = filtered || state.products;
  
  if (productsToShow.length === 0) {
    if (productsList) productsList.innerHTML = '<div style="text-align:center;padding:40px;color:#999">No hay productos</div>';
    return;
  }

  const user = getCurrentUser();
  const cards = productsToShow.map(p => {
    const imageUrl = p.image || 'https://via.placeholder.com/200?text=Sin+imagen';
    const currentPrice = Number(p.price);
    const cost = Number(p.cost || 0);
    const profit = currentPrice - cost;
    const specs = p.sku ? p.sku.substring(0, 10) : '';
    const stockStatus = Number(p.stock) <= 5 ? 'low-stock' : 'good-stock';
    if (user === 'Invitado') {
      // Solo mostrar nombre, precio y disponibilidad
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
              <span class="stock-value ${stockStatus}">${p.stock > 0 ? 'Disponible' : 'Agotado'}</span>
            </div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="product-card">
          <div class="product-image-container">
            <img src="${imageUrl}" alt="${escapeHtml(p.name)}" class="product-image" onerror="this.src='https://via.placeholder.com/200?text=Error'">
            ${specs ? `<span class="product-spec-badge">${specs}</span>` : ''}
          </div>
          <div class="product-card-body">
            <h3 class="product-name">${escapeHtml(p.name)}</h3>
            <p class="product-price">$${currentPrice.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            <p class="product-profit">Ganancia: <strong style="color:#22c55e">$${profit.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong></p>
            <div class="stock-container">
              <span class="stock-value ${stockStatus}">${p.stock}</span>
            </div>
            ${p.warranty ? `<p class="product-warranty">Garantía: <strong>${p.warranty} meses</strong></p>` : ''}
            <div class="product-actions">
              <button class="edit" data-id="${p.id}">Editar</button>
              <button class="del" data-id="${p.id}">Eliminar</button>
              <button class="add-cart-btn" data-id="${p.id}">Carrito</button>
            </div>
          </div>
        </div>
      `;
    }
  }).join('');

  if (productsList) productsList.innerHTML = cards;
  if (productsList) {
    productsList.querySelectorAll('.edit').forEach(b => b.addEventListener('click', () => startEditProduct(b.dataset.id)));
    productsList.querySelectorAll('.del').forEach(b => b.addEventListener('click', () => deleteProduct(b.dataset.id)));
    productsList.querySelectorAll('.add-cart-btn').forEach(b => b.addEventListener('click', () => addToCart(b.dataset.id)));
  }

  populateSaleSelect();
  renderDashboard();
}

function renderSales() {
  const rows = state.sales.map(s => `<tr><td>${new Date(s.date).toLocaleString()}</td><td>${escapeHtml(s.name)} (${escapeHtml(s.sku)})</td><td>${s.qty}</td><td>$${Number(s.price).toFixed(2)}</td><td>$${Number(s.total).toFixed(2)}</td></tr>`).join('') || '<tr><td colspan="5">No hay ventas registradas</td></tr>';
  if (salesList) salesList.innerHTML = `<table><thead><tr><th>Fecha</th><th>Producto</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>`;
  renderDashboard();
}

function populateSaleSelect() {
  if (!saleProduct) return;
  saleProduct.innerHTML = state.products.length ? state.products.map(p => `<option value="${p.id}" data-warranty="${p.warranty || 0}">${escapeHtml(p.name)} — ${escapeHtml(p.sku)} ($${Number(p.price).toFixed(2)}) — stock: ${p.stock}</option>`).join('') : '<option value="">-- Sin productos --</option>';
  
  // Actualizar garantías cuando cambia el producto seleccionado
  saleProduct.addEventListener('change', () => {
    const selectedOption = saleProduct.options[saleProduct.selectedIndex];
    const warranty = selectedOption.dataset.warranty;
    const warrantyMonths = parseInt(warranty) || 0;
    
    if (warrantyMonths > 0) {
      saleWarranty.style.display = 'block';
      saleWarranty.innerHTML = `<option value="">-- Garantía --</option><option value="normal">Venta Normal</option><option value="warranty">Bajo Garantía (${warrantyMonths} meses)</option>`;
    } else {
      saleWarranty.style.display = 'none';
      saleWarranty.value = '';
    }
  });
}

function renderDashboard() {
  if (statProducts) statProducts.textContent = state.products.length;
  const inv = state.products.reduce((s, p) => s + (Number(p.price) * Number(p.stock)), 0);
  if (statInventory) statInventory.textContent = inv.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const salesTotal = state.sales.reduce((s, x) => s + Number(x.total), 0);
  if (statSales) statSales.textContent = salesTotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  // Calcular ganancia total (usar SKU para encontrar costo)
  let totalProfit = 0;
  state.sales.forEach(sale => {
    const sku = sale.sku;
    const prod = state.products.find(p => p.sku === sku);
    if (prod) {
      const cost = Number(prod.cost || 0);
      const profitUnit = Number(sale.price) - cost;
      totalProfit += profitUnit * Number(sale.qty);
    }
  });
  const totalWithdrawn = (state.withdrawals || []).filter(w => !w.returned).reduce((s, w) => s + Number(w.amount || 0), 0);
  const netProfit = totalProfit - totalWithdrawn;
  const statProfit = document.getElementById('stat-profit');
  if (statProfit) {
    statProfit.innerHTML = `${netProfit.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    // Mostrar desglose debajo (ganancia bruta y retiros)
    let detail = document.getElementById('stat-profit-detail');
    if (!detail) {
      detail = document.createElement('div');
      detail.id = 'stat-profit-detail';
      detail.style.fontSize = '12px';
      detail.style.color = '#6b7280';
      statProfit.parentNode.appendChild(detail);
    }
    detail.innerHTML = `Bruta: $${totalProfit.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} • Retiros: $${totalWithdrawn.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  // Total retirado (usar valor ya calculado más arriba)
  const statWithdrawn = document.getElementById('stat-withdrawn');
  if (statWithdrawn) statWithdrawn.textContent = totalWithdrawn.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const lows = state.products.filter(p => Number(p.stock) <= 5);
  if (lowStock) lowStock.innerHTML = lows.length ? lows.map(p => `<li>${escapeHtml(p.name)} (${p.stock} unidades)</li>`).join('') : '<li>Sin alertas</li>';
}

// Render lista de retiros en administración
function renderWithdrawList() {
  const container = document.getElementById('withdraw-list');
  if (!container) return;
  if (!state.withdrawals || state.withdrawals.length === 0) {
    container.innerHTML = '<small>No hay retiros registrados</small>';
    return;
  }
  const items = state.withdrawals.slice().reverse().map(w => {
    const dateStr = new Date(w.date).toLocaleString();
    const user = w.user || '';
    const reason = w.reason ? ` - ${escapeHtml(w.reason)}` : '';
    const returnedLabel = w.returned ? ` <span style="color:#9ca3af">(DEVUELTO)</span>` : ` <button class="btn-return" data-id="${w.id}" style="margin-left:8px;background:#fff;border:1px solid #16a34a;color:#16a34a;padding:4px 6px;border-radius:4px;cursor:pointer">Devolver</button>`;
    return `<div style="margin-bottom:6px">${dateStr} - <strong style="color:#16a34a">$${Number(w.amount).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>${returnedLabel}${reason} ${user ? `(${escapeHtml(user)})` : ''}</div>`;
  }).join('');
  container.innerHTML = items;
  // attach listeners for devolver
  container.querySelectorAll('.btn-return').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      returnWithdrawal(id);
    });
  });
}

function returnWithdrawal(id) {
  if (!id) return;
  const idx = state.withdrawals.findIndex(w => w.id === id);
  if (idx === -1) return alert('Retiro no encontrado');
  const w = state.withdrawals[idx];
  if (w.returned) return alert('Este retiro ya fue devuelto');
  if (!confirm(`¿Confirmas devolver el retiro de $${Number(w.amount).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}?`)) return;
  w.returned = true;
  w.returnedAt = new Date().toISOString();
  w.returnedBy = getCurrentUser() || 'Desconocido';
  saveState(state);
  renderWithdrawList();
  renderDashboard();
  alert('Retiro marcado como devuelto');
}

function recordWithdrawal(ev) {
  ev.preventDefault();
  const amtEl = document.getElementById('withdraw-amount');
  const reasonEl = document.getElementById('withdraw-reason');
  if (!amtEl) return;
  const amount = Number(amtEl.value) || 0;
  const reason = reasonEl ? reasonEl.value.trim() : '';
  if (amount <= 0) return alert('Ingresa una cantidad válida a retirar');
  state.withdrawals = state.withdrawals || [];
  state.withdrawals.push({ date: new Date().toISOString(), amount: amount, reason: reason, user: getCurrentUser() || 'Desconocido' });
  // asignar id y estado de devolución
  state.withdrawals[state.withdrawals.length-1].id = uid();
  state.withdrawals[state.withdrawals.length-1].returned = false;
  saveState(state);
  if (amtEl) amtEl.value = '';
  if (reasonEl) reasonEl.value = '';
  renderWithdrawList();
  renderDashboard();
  alert(`Retiro registrado: $${amount}`);
}

// Actions
function startEditProduct(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  if (productId) productId.value = p.id;
  if (productName) productName.value = p.name;
  if (productSku) productSku.value = p.sku;
  if (productCost) productCost.value = p.cost || 0;
  if (productPrice) productPrice.value = p.price;
  if (productStock) productStock.value = p.stock;
  if (productWarranty) productWarranty.value = p.warranty || 0;
  // No llenamos el input file por razones de seguridad
}

function clearProductForm() {
  if (productId) productId.value = '';
  if (productForm) productForm.reset();
}

function addOrUpdateProduct(ev) {
  ev.preventDefault();
  const id = productId ? productId.value : '';
  const name = productName ? productName.value.trim() : '';
  const sku = productSku ? productSku.value.trim() : '';
  const cost = productCost ? Number(productCost.value) || 0 : 0;
  const price = productPrice ? Number(productPrice.value) || 0 : 0;
  const stock = productStock ? Number(productStock.value) || 0 : 0;
  const warranty = productWarranty ? Number(productWarranty.value) || 0 : 0;

  if (!name || !sku) return alert('Nombre y SKU requeridos');

  const fileInput = productImage;
  if (fileInput && fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const image = e.target.result; // base64 string
      
      if (id) {
        const p = state.products.find(x => x.id === id);
        if (p) {
          p.name = name;
          p.sku = sku;
          p.cost = cost;
          p.price = price;
          p.stock = stock;
          p.warranty = warranty;
          p.image = image;
        }
      } else {
        state.products.push({
          id: uid(),
          name,
          sku,
          cost,
          price,
          stock,
          warranty,
          image
        });
      }
      
      saveState(state);
      clearProductForm();
      renderProducts();
    };
    
    reader.readAsDataURL(file);
  } else {
    // Si no hay imagen nueva, mantener la anterior o dejar vacía
    const currentImage = id ? (state.products.find(x => x.id === id)?.image || '') : '';
    
    if (id) {
      const p = state.products.find(x => x.id === id);
      if (p) {
        p.name = name;
        p.sku = sku;
        p.cost = cost;
        p.price = price;
        p.stock = stock;
        p.warranty = warranty;
        // p.image se mantiene igual
      }
    } else {
      state.products.push({
        id: uid(),
        name,
        sku,
        cost,
        price,
        stock,
        warranty,
        image: ''
      });
    }
    
    saveState(state);
    clearProductForm();
    renderProducts();
  }
}

function deleteProduct(id) {
  if (!confirm('¿Eliminar producto?')) return;
  state.products = state.products.filter(p => p.id !== id);
  saveState(state);
  clearProductForm();
  renderProducts();
}

function recordSale(ev) {
  ev.preventDefault();

  const productId = saleProduct ? saleProduct.value : '';
  const qty = saleQty ? Number(saleQty.value) || 0 : 0;
  const discount = saleDiscount ? Number(saleDiscount.value) || 0 : 0;

  if (!productId || qty <= 0) return alert('Selecciona producto y cantidad válida');

  const p = state.products.find(x => x.id === productId);
  if (!p) return alert('Producto no encontrado');
  if (p.stock < qty) return alert(`Stock insuficiente. Disponible: ${p.stock}`);

  const subtotal = p.price * qty;
  const total = subtotal - discount;

  if (discount < 0) return alert('El descuento no puede ser negativo');
  if (discount > subtotal) return alert(`El descuento no puede ser mayor al total ($${subtotal.toFixed(2)})`);

  p.stock -= qty;
  const warrantyType = saleWarranty ? saleWarranty.value : '';
  state.sales.push({
    date: new Date().toISOString(),
    name: p.name,
    sku: p.sku,
    qty,
    price: p.price,
    subtotal: subtotal,
    discount: discount,
    total: total,
    warranty: warrantyType || 'normal',
    productWarrantyMonths: p.warranty || 0
  });

  saveState(state);
  if (saleForm) saleForm.reset();
  renderProducts();
  renderSales();
  renderDashboard();
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

  // Añadir al carrito (registrar venta)
function addToCart(productId) {
  const p = state.products.find(x => x.id === productId);
  if (!p) return alert('Producto no encontrado');
  if (p.stock <= 0) return alert('Producto sin stock');

  const subtotal = p.price * 1;
  p.stock -= 1;
  state.sales.push({
    date: new Date().toISOString(),
    name: p.name,
    sku: p.sku,
    qty: 1,
    price: p.price,
    subtotal: subtotal,
    discount: 0,
    total: subtotal,
    warranty: 'normal',
    productWarrantyMonths: p.warranty || 0
  });  saveState(state);
  renderProducts();
  renderSales();
  alert(`"${p.name}" agregado al carrito`);
}

// Historial de ventas
function renderSalesHistory() {
  const salesHistoryContainer = document.getElementById('sales-history-container');
  const salesHistoryList = document.getElementById('sales-history-list');
  
  if (!salesHistoryList) return;

  if (state.sales.length === 0) {
    salesHistoryList.innerHTML = '<div style="text-align:center;padding:40px;color:#999">No hay ventas registradas</div>';
    return;
  }

  const salesHTML = state.sales.map((s, index) => {
    const saleDate = new Date(s.date);
    const dateStr = saleDate.toLocaleString('es-CO', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    const discount = s.discount || 0;
    const subtotal = s.subtotal || (s.price * s.qty);
    const total = s.total || (s.price * s.qty);
    const warrantyType = s.warranty || 'normal';
    const warrantyMonths = s.productWarrantyMonths || 0;
    const discountDisplay = discount > 0 ? `<p class="sale-discount">Descuento: -$${Number(discount).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>` : '';
    const warrantyDisplay = warrantyType === 'warranty' ? `<p class="sale-warranty">🛡️ Bajo Garantía (${warrantyMonths} meses)</p>` : '<p class="sale-type">Venta Normal</p>';
    
    return `
      <div class="sale-item sale-item-${warrantyType}">
        <div class="sale-info">
          <p class="sale-date">${dateStr}</p>
          <p class="sale-product">${escapeHtml(s.name)} (${escapeHtml(s.sku)})</p>
          <p class="sale-details">Cantidad: ${s.qty} × $${Number(s.price).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} = $${Number(subtotal).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}${discountDisplay}</p>
          ${warrantyDisplay}
          <p class="sale-total">Total: <strong>$${Number(total).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong></p>
        </div>
        <button class="btn-delete-sale" data-index="${index}">🗑️ Eliminar</button>
      </div>
    `;
  }).join('');

  salesHistoryList.innerHTML = salesHTML;
  
  // Agregar event listeners a los botones de eliminar
  salesHistoryList.querySelectorAll('.btn-delete-sale').forEach(btn => {
    btn.addEventListener('click', (e) => deleteSale(parseInt(e.target.dataset.index)));
  });
}

function deleteSale(index) {
  const sale = state.sales[index];
  if (!sale) return;
  
  // Crear modal para seleccionar razón de eliminación
  const modal = document.createElement('div');
  modal.className = 'deletion-modal-overlay';
  modal.innerHTML = `
    <div class="deletion-modal">
      <h3>¿Por qué se elimina esta venta?</h3>
      <p class="sale-info-modal">${escapeHtml(sale.name)} (${escapeHtml(sale.sku)}) - ${sale.qty} unidades - Total: $${Number(sale.total).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
      <div class="modal-buttons">
        <button class="btn-delete-reason" data-reason="error">❌ Eliminada por Error</button>
        <button class="btn-delete-reason" data-reason="warranty">🛡️ Garantía / Devolución</button>
        <button class="btn-cancel">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  const handleReason = (reason) => {
    const product = state.products.find(p => p.name === sale.name);
    if (product) {
      product.stock += sale.qty;
    }
    
    sale.deletionReason = reason;
    sale.deletedAt = new Date().toISOString();
    
    state.sales.splice(index, 1);
    saveState(state);
    renderSalesHistory();
    renderProducts();
    renderDashboard();
    document.body.removeChild(modal);
    
    const reasonText = reason === 'error' ? 'Error' : 'Garantía / Devolución';
    alert(`Venta eliminada por: ${reasonText}\nStock restaurado: +${sale.qty} ${sale.name}`);
  };
  
  modal.querySelectorAll('.btn-delete-reason').forEach(btn => {
    btn.addEventListener('click', () => handleReason(btn.dataset.reason));
  });
  
  modal.querySelector('.btn-cancel').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) document.body.removeChild(modal);
  });
}

function toggleSalesHistory() {
  const container = document.getElementById('sales-history-container');
  const button = document.getElementById('toggle-sales-history');
  
  if (!container) return;

  const isHidden = container.style.display === 'none';
  container.style.display = isHidden ? 'block' : 'none';
  button.textContent = isHidden ? '📋 Ocultar Historial' : '📋 Ver Historial';
  
  if (isHidden) {
    renderSalesHistory();
  }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  // Verificar que está autenticado
  checkAuthentication();

  updateAuthUI();
  renderProducts();
  renderSales();

  // Events
  if (productForm) productForm.addEventListener('submit', addOrUpdateProduct);
  if (productClear) productClear.addEventListener('click', clearProductForm);
  if (saleForm) saleForm.addEventListener('submit', recordSale);
  const withdrawForm = document.getElementById('withdraw-form');
  if (withdrawForm) withdrawForm.addEventListener('submit', recordWithdrawal);
  renderWithdrawList();
  
  if (searchProduct) searchProduct.addEventListener('input', (e) => {
    searchProducts(e.target.value);
  });
  
  const toggleButton = document.getElementById('toggle-sales-history');
  if (toggleButton) toggleButton.addEventListener('click', toggleSalesHistory);
  
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    logoutUser();
    window.location.href = 'login.html';
  });
});
