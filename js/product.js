// ANGARA CLONE — Product Detail Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // ---- Parse product ID from URL ----
  const params = new URLSearchParams(window.location.search);
  const ringId = parseInt(params.get('id')) || 1;
  const ring = getRingById(ringId);

  if (!ring) {
    document.querySelector('.product-page').innerHTML = '<p style="padding:4rem;text-align:center;">Product not found. <a href="catalog.html">Browse all rings →</a></p>';
    return;
  }

  // ---- Configuration State ----
  let config = {
    metal: ring.defaultMetal,
    quality: ring.defaultQuality,
    carat: ring.defaultCarat,
    size: ring.sizeOptions[2] || ring.sizeOptions[0],
  };

  // ---- Page title ----
  document.title = `${ring.name} | Tsukiyo Gems`;

  // ---- Breadcrumb ----
  const breadcrumb = document.getElementById('breadcrumb');
  if (breadcrumb) {
    breadcrumb.innerHTML = `
      <a href="catalog.html">Home</a> /
      <a href="catalog.html">Jewelry</a> /
      <a href="catalog.html">Rings</a> /
      <span>${ring.name}</span>
    `;
  }

  // ============================================================
  //  GALLERY
  // ============================================================
  function captionFor(i) {
    const parts = [];
    if (config.quality) parts.push(config.quality);
    if (config.carat)   parts.push(`${config.carat} ct.tw`);
    parts.push(config.metal);
    const live = parts.join(' | ');
    if (i === 0) return `Selected: ${live}`;
    return ['Shown on hand', 'Profile view', 'Dimension detail', 'Top view', 'Side view', 'Detail'][i-1] || `View ${i+1}`;
  }

  function buildGallery() {
    const galleryEl = document.getElementById('gallery-grid');
    if (!galleryEl) return;

    const filter = getMetalFilter(config.metal);
    galleryEl.innerHTML = ring.images.map((src, i) => `
      <div class="gallery-img-item" data-src="${src}">
        <img src="${src}" alt="${ring.name}" style="filter:${filter}">
        <div class="gallery-caption">${captionFor(i)}</div>
      </div>
    `).join('');

    // Lightbox
    galleryEl.querySelectorAll('.gallery-img-item').forEach(item => {
      item.addEventListener('click', () => {
        const lightbox = document.getElementById('lightbox');
        const lbImg = document.getElementById('lightbox-img');
        lbImg.src = item.dataset.src;
        lbImg.style.filter = filter;
        lightbox.classList.add('active');
      });
    });
  }

  function updateGalleryFilters() {
    const filter = getMetalFilter(config.metal);
    document.querySelectorAll('.gallery-img-item img, #lightbox-img').forEach(img => {
      img.style.filter = filter;
    });
    // Update caption
    const firstCaption = document.querySelector('.gallery-img-item:first-child .gallery-caption');
    if (firstCaption) {
      firstCaption.textContent = `Selected: ${config.quality} | ${config.carat} ct.tw | ${config.metal}`;
    }
  }

  // Lightbox close
  const lightbox = document.getElementById('lightbox');
  document.getElementById('lightbox-close')?.addEventListener('click', () => lightbox?.classList.remove('active'));
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('active'); });

  // ============================================================
  //  CONFIG PANEL
  // ============================================================
  function updatePriceDisplay() {
    const price = calculatePrice(ring, config.metal, config.quality, config.carat);
    const orig = getOriginalPrice(ring, config.metal, config.quality, config.carat);
    const pct = Math.round((1 - price / orig) * 100);

    document.getElementById('cfg-price').textContent = formatPrice(price);
    document.getElementById('cfg-original').textContent = formatPrice(orig);
    document.getElementById('cfg-discount').textContent = `(${pct}% OFF)`;
    document.getElementById('cfg-monthly').textContent = formatPrice(Math.round(price / 3));

    // Add to bag button prices
    const bagPrice = document.getElementById('bag-price');
    const bagOrig = document.getElementById('bag-orig');
    if (bagPrice) bagPrice.textContent = formatPrice(price);
    if (bagOrig) bagOrig.textContent = formatPrice(orig);
  }

  // ---- Quality Swatches ----
  function buildQualitySwatches() {
    const el = document.getElementById('quality-swatches');
    if (!el) return;
    const section = el.closest('.config-section');
    if (!ring.qualities || ring.qualities.length === 0) {
      if (section) section.style.display = 'none';
      return;
    }
    if (section) section.style.display = '';
    el.innerHTML = ring.qualities.map(q => `
      <div class="quality-swatch-item ${q === config.quality ? 'active' : ''}" data-quality="${q}">
        <div class="quality-swatch-circle">
          <img src="${ring.images[0]}" alt="${q}" style="filter:${getMetalFilter(config.metal)}">
        </div>
        <span class="quality-swatch-name">${q}</span>
      </div>
    `).join('');
    el.querySelectorAll('.quality-swatch-item').forEach(item => {
      item.addEventListener('click', () => {
        config.quality = item.dataset.quality;
        buildQualitySwatches();
        updateConfigLabel('quality-label', `Gemstone Quality: `, config.quality);
        updatePriceDisplay();
        updateGalleryFilters();
      });
    });
  }

  // ---- Carat Buttons ----
  function buildCaratBtns() {
    const el = document.getElementById('carat-btns');
    if (!el) return;
    const section = el.closest('.config-section');
    if (!ring.caratOptions || ring.caratOptions.length === 0) {
      if (section) section.style.display = 'none';
      return;
    }
    if (section) section.style.display = '';
    el.innerHTML = ring.caratOptions.map(c => `
      <button class="carat-btn ${c === config.carat ? 'active' : ''}" data-carat="${c}">${c} Ct</button>
    `).join('');
    el.querySelectorAll('.carat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        config.carat = btn.dataset.carat;
        buildCaratBtns();
        updateConfigLabel('carat-label', `Total Carat Weight: `, `${config.carat} Ct`);
        updatePriceDisplay();
      });
    });
  }

  // ---- Metal Swatches ----
  function buildMetalSwatches() {
    const el = document.getElementById('metal-swatches');
    if (!el) return;
    el.innerHTML = ring.metals.map(m => `
      <div class="metal-swatch-item ${m === config.metal ? 'active' : ''}" data-metal="${m}">
        <div class="metal-swatch-circle" style="background:${getMetalSwatchColor(m)}"></div>
        <span class="metal-swatch-label">${m.replace('14K ','14K\n').replace('18K ','18K\n')}</span>
      </div>
    `).join('');

    el.querySelectorAll('.metal-swatch-item').forEach(item => {
      item.addEventListener('click', () => {
        config.metal = item.dataset.metal;
        buildMetalSwatches();
        updateConfigLabel('metal-label', `Metal Type: `, config.metal);
        updatePriceDisplay();
        updateGalleryFilters();
        buildQualitySwatches(); // Update gemstone preview images with new filter
      });
    });

    // Scroll arrows
    const leftArrow = document.getElementById('metal-arrow-left');
    const rightArrow = document.getElementById('metal-arrow-right');
    const scrollEl = el;
    if (leftArrow) leftArrow.addEventListener('click', () => { scrollEl.scrollBy({ left: -100, behavior: 'smooth' }); });
    if (rightArrow) rightArrow.addEventListener('click', () => { scrollEl.scrollBy({ left: 100, behavior: 'smooth' }); });
  }

  // ---- Size Buttons ----
  function buildSizeBtns() {
    const el = document.getElementById('size-btns');
    if (!el) return;
    el.innerHTML = ring.sizeOptions.map(s => `
      <button class="size-btn ${s === config.size ? 'active' : ''}" data-size="${s}">${s}</button>
    `).join('');
    el.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        config.size = parseFloat(btn.dataset.size);
        buildSizeBtns();
      });
    });
  }

  function updateConfigLabel(elemId, prefix, value) {
    const el = document.getElementById(elemId);
    if (el) el.innerHTML = `${prefix}<strong>${value}</strong>`;
  }

  // ---- Fill static content ----
  function populateStatic() {
    const titleEl = document.getElementById('product-title');
    if (titleEl) titleEl.textContent = ring.name;

    const reviewsEl = document.getElementById('product-reviews');
    if (reviewsEl) {
      const fullStars = Math.floor(ring.rating);
      const halfStar = ring.rating % 1 >= 0.5;
      let starsHtml = '';
      for (let i = 0; i < fullStars; i++) starsHtml += `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      if (halfStar) starsHtml += `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="opacity:0.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      reviewsEl.innerHTML = `<div class="stars">${starsHtml}</div><span class="config-review-count">${ring.reviewCount} Reviews</span>`;
    }

    if (config.quality) updateConfigLabel('quality-label', 'Gemstone Quality: ', config.quality);
    if (config.carat)   updateConfigLabel('carat-label', 'Total Carat Weight: ', `${config.carat} Ct`);
    updateConfigLabel('metal-label', 'Metal Type: ', config.metal);

    // Gemstone explore
    const gemNameEl = document.getElementById('gem-name');
    if (gemNameEl) gemNameEl.textContent = ring.gemstone;
    const gemDotEl = document.getElementById('gem-dot');
    if (gemDotEl) gemDotEl.style.background = ring.gemColor;

    // Product details accordion
    const detailsBody = document.getElementById('details-body');
    if (detailsBody) {
      const specRows = ring.specifications
        ? Object.entries(ring.specifications).map(([k, v]) =>
            `<tr><td>${k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</td><td>${v}</td></tr>`
          ).join('')
        : '';
      detailsBody.innerHTML = `
        <p><strong>About this ring</strong></p>
        <p>${ring.description}</p>
        <br>
        <table>
          <tr><td>SKU</td><td>${ring.sku}</td></tr>
          <tr><td>Metal</td><td>${config.metal}</td></tr>
          <tr><td>Gemstone</td><td>${ring.gemstone}</td></tr>
          <tr><td>Shape</td><td>${ring.shape}</td></tr>
          <tr><td>Style</td><td>${ring.style}</td></tr>
          ${config.carat ? `<tr><td>Carat Weight</td><td>${config.carat} ct.tw</td></tr>` : ''}
          ${specRows}
          <tr><td>Certificate</td><td>Certificate of Authenticity</td></tr>
        </table>
      `;
    }
  }

  // ---- Add to Bag ----
  const addToBagBtn = document.getElementById('add-to-bag-btn');
  if (addToBagBtn) {
    addToBagBtn.addEventListener('click', () => {
      addToCart(ring, config.metal, config.quality, config.carat, config.size);
      // Flash button
      addToBagBtn.style.background = '#27ae60';
      setTimeout(() => { addToBagBtn.style.background = ''; }, 1200);
    });
  }

  // ---- Wishlist ----
  const wishlistBtn = document.getElementById('wishlist-btn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      wishlistBtn.classList.toggle('active');
    });
  }

  // ---- Engraving toggle ----
  const engravingHeader = document.querySelector('.engraving-header');
  if (engravingHeader) {
    engravingHeader.addEventListener('click', () => {
      document.querySelector('.engraving-body').classList.toggle('open');
    });
  }

  // ---- Accordion ----
  document.querySelectorAll('.accord-header').forEach(h => {
    h.addEventListener('click', () => {
      h.closest('.accord-item').classList.toggle('open');
    });
  });

  // ---- Delivery timer ----
  function updateTimer() {
    const timerEl = document.getElementById('delivery-timer');
    if (!timerEl) return;
    const now = new Date();
    const cutoff = new Date();
    cutoff.setHours(18, 0, 0, 0);
    if (now > cutoff) cutoff.setDate(cutoff.getDate() + 1);
    const diff = cutoff - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    timerEl.textContent = `${String(h).padStart(2,'0')}h : ${String(m).padStart(2,'0')}m : ${String(s).padStart(2,'0')}s`;
  }
  updateTimer();
  setInterval(updateTimer, 1000);

  // ---- Initialize ----
  populateStatic();
  buildGallery();
  buildQualitySwatches();
  buildCaratBtns();
  buildMetalSwatches();
  buildSizeBtns();
  updatePriceDisplay();
});
