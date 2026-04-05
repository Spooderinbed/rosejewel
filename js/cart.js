// ANGARA CLONE — Cart Manager (localStorage)

const CART_KEY = 'angara_cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
  updateCartDrawer();
}

function addToCart(ring, metal, quality, carat, size) {
  const cart = getCart();
  const price = calculatePrice(ring, metal, quality, carat);
  const existingIdx = cart.findIndex(i =>
    i.ringId === ring.id && i.metal === metal && i.quality === quality &&
    i.carat === carat && i.size === size
  );
  if (existingIdx >= 0) {
    cart[existingIdx].qty += 1;
  } else {
    cart.push({
      cartId: Date.now() + Math.random(),
      ringId: ring.id,
      name: ring.name,
      image: ring.images[0],
      metal, quality, carat, size, price, qty: 1
    });
  }
  saveCart(cart);
  openCartDrawer();
}

function removeFromCart(cartId) {
  const cart = getCart().filter(i => i.cartId !== cartId);
  saveCart(cart);
}

function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function getCartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function updateCartBadge() {
  const count = getCartCount();
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  if (drawer) drawer.classList.add('open');
  if (overlay) overlay.classList.add('active');
  updateCartDrawer();
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

function updateCartDrawer() {
  const itemsEl = document.getElementById('cart-items');
  if (!itemsEl) return;
  const cart = getCart();
  if (cart.length === 0) {
    itemsEl.innerHTML = `<div class="cart-empty"><p>Your bag is empty.</p><a href="catalog.html" class="btn-shop-now">Continue Shopping</a></div>`;
  } else {
    itemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${item.image}" alt="${item.name}" style="filter:${getMetalFilter(item.metal)}">
        </div>
        <div class="cart-item-info">
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-config">${item.quality} | ${item.carat}ct | ${item.metal} | Size ${item.size}</p>
          <div class="cart-item-bottom">
            <span class="cart-item-price">${formatPrice(item.price)}</span>
            <button class="cart-item-remove" onclick="removeFromCart(${item.cartId})">Remove</button>
          </div>
        </div>
      </div>
    `).join('');
  }
  const totalEl = document.getElementById('cart-total');
  if (totalEl) totalEl.textContent = formatPrice(getCartTotal());
  const countEl = document.getElementById('cart-count-label');
  if (countEl) countEl.textContent = `${getCartCount()} Item${getCartCount()!==1?'s':''}`;
}

// Initialize badge on page load
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  const overlay = document.getElementById('cart-overlay');
  if (overlay) overlay.addEventListener('click', closeCartDrawer);
});
