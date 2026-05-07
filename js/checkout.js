// Tsukiyo Gems — Checkout Page Logic
// Renders cart summary, validates the form, shows the confirmation modal.

document.addEventListener('DOMContentLoaded', () => {
  const summaryItemsEl = document.getElementById('summary-items');
  const summarySubtotalEl = document.getElementById('summary-subtotal');
  const summaryDiscountEl = document.getElementById('summary-discount');
  const summaryTotalEl = document.getElementById('summary-total');

  const PROMO_RATE = 0.10; // 10% off — matches the announcement bar promo

  // ---------------------------------------------------------------
  // Render the cart on the right rail.
  // ---------------------------------------------------------------
  function renderSummary() {
    const cart = getCart();

    if (!cart.length) {
      summaryItemsEl.innerHTML = '<p class="summary-empty">Your bag is empty. <a href="catalog.html">Browse rings &rarr;</a></p>';
      summarySubtotalEl.textContent = formatPrice(0);
      summaryDiscountEl.textContent = '–' + formatPrice(0);
      summaryTotalEl.textContent = formatPrice(0);
      return 0;
    }

    summaryItemsEl.innerHTML = cart.map(item => {
      const cfg = [];
      if (item.quality) cfg.push(item.quality);
      if (item.carat)   cfg.push(`${item.carat} ct.tw`);
      if (item.metal)   cfg.push(item.metal);
      if (item.size)    cfg.push(`Size ${item.size}`);
      return `
        <div class="summary-item">
          <div class="summary-item-img">
            <img src="${item.image}" alt="${item.name}">
            <span class="qty-pill">${item.qty}</span>
          </div>
          <div class="summary-item-info">
            <p class="summary-item-name">${item.name}</p>
            <p class="summary-item-cfg">${cfg.join(' &middot; ')}</p>
            <p class="summary-item-price">${formatPrice(item.price * item.qty)}</p>
          </div>
        </div>
      `;
    }).join('');

    const subtotal = getCartTotal();
    const discount = Math.round(subtotal * PROMO_RATE);
    const total = subtotal - discount;
    summarySubtotalEl.textContent = formatPrice(subtotal);
    summaryDiscountEl.textContent = '–' + formatPrice(discount);
    summaryTotalEl.textContent = formatPrice(total);
    return total;
  }

  renderSummary();

  // ---------------------------------------------------------------
  // Form submission.
  // ---------------------------------------------------------------
  const form = document.getElementById('checkout-form');
  const submitBtn = document.getElementById('checkout-submit');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Quick validation — required fields
    const required = ['firstName','lastName','email','phone','address1','city','region','postcode','country'];
    let firstInvalid = null;
    required.forEach(name => {
      const el = form.elements[name];
      if (el && !el.value.trim()) {
        el.classList.add('invalid');
        if (!firstInvalid) firstInvalid = el;
      } else if (el) {
        el.classList.remove('invalid');
      }
    });
    if (!form.elements['agree'].checked) {
      form.elements['agree'].classList.add('invalid');
      if (!firstInvalid) firstInvalid = form.elements['agree'];
    } else {
      form.elements['agree'].classList.remove('invalid');
    }

    // Email format check
    const email = form.elements['email'].value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      form.elements['email'].classList.add('invalid');
      if (!firstInvalid) firstInvalid = form.elements['email'];
    }

    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid.focus({ preventScroll: true });
      return;
    }

    // Build the request payload (this is what would normally POST to a server).
    const cart = getCart();
    const subtotal = getCartTotal();
    const discount = Math.round(subtotal * PROMO_RATE);
    const total = subtotal - discount;
    const reference = generateReference();

    const requestPayload = {
      reference,
      submittedAt: new Date().toISOString(),
      customer: {
        firstName: form.elements['firstName'].value.trim(),
        lastName:  form.elements['lastName'].value.trim(),
        email:     form.elements['email'].value.trim(),
        phone:     form.elements['phone'].value.trim(),
        address: {
          line1:    form.elements['address1'].value.trim(),
          line2:    form.elements['address2'].value.trim(),
          city:     form.elements['city'].value.trim(),
          region:   form.elements['region'].value.trim(),
          postcode: form.elements['postcode'].value.trim(),
          country:  form.elements['country'].value,
        },
      },
      sizing: {
        standard: form.elements['sizeCountry'].value,
        size:     form.elements['ringSize'].value.trim(),
      },
      engraving:   form.elements['engraving'].value.trim(),
      notes:       form.elements['notes'].value.trim(),
      contactPref: {
        method: form.elements['contactMethod'].value,
        time:   form.elements['contactTime'].value,
      },
      newsletter: form.elements['newsletter'].checked,
      cart,
      totals: { subtotal, discount, total }
    };

    // Persist locally so the user (and ops) can see history. In production
    // this would be a fetch() POST to the server.
    try {
      const all = JSON.parse(localStorage.getItem('tsukiyo_requests') || '[]');
      all.push(requestPayload);
      localStorage.setItem('tsukiyo_requests', JSON.stringify(all));
    } catch (e) { /* storage unavailable - ignore */ }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    // Tiny delay to make the action feel intentional, then show confirmation
    setTimeout(() => {
      showConfirmation(requestPayload);
      // Clear the cart after a successful submission
      try { localStorage.removeItem('angara_cart'); updateCartBadge(); } catch (e) {}
    }, 600);
  });

  // ---------------------------------------------------------------
  // Confirmation modal.
  // ---------------------------------------------------------------
  function showConfirmation(payload) {
    document.getElementById('confirm-name').textContent = payload.customer.firstName || 'friend';
    document.getElementById('confirm-ref').textContent = payload.reference;
    document.getElementById('confirm-items').textContent =
      payload.cart.reduce((s, i) => s + i.qty, 0) || 0;
    document.getElementById('confirm-total').textContent = formatPrice(payload.totals.total);
    document.getElementById('confirm-channel').textContent = payload.contactPref.method.toLowerCase();

    const overlay = document.getElementById('confirmation-overlay');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Mark progress step 3 active
    document.querySelectorAll('.checkout-progress .step').forEach((s, i) => {
      s.classList.remove('active');
      if (i <= 2) s.classList.add('done');
    });
  }

  function generateReference() {
    const stamp = Date.now().toString().slice(-6);
    const rand  = Math.floor(Math.random() * 900 + 100);
    return `TG-${stamp}${rand}`;
  }

  // Live validation — clear .invalid as user types
  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', () => el.classList.remove('invalid'));
    el.addEventListener('change', () => el.classList.remove('invalid'));
  });
});
