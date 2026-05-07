// ANGARA CLONE — Catalog Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Parse URL parameters for initial filters
  const params = new URLSearchParams(window.location.search);
  
  let activeFilters = {
    metal: params.get('metal') ? [params.get('metal')] : [],
    gemstone: params.get('gemstone') ? [params.get('gemstone')] : [],
    shape: params.get('shape') ? [params.get('shape')] : [],
    style: params.get('style') ? [params.get('style')] : [],
    price: params.get('price') ? [params.get('price')] : [],
  };
  
  let sortBy = 'featured';
  let displayCount = 20;

  // ---- Filter Data ----
  const filterConfig = [
    {
      key: 'metal', label: 'Metal Type',
      options: ['Yellow Gold','White Gold','Rose Gold','Sterling Silver','Platinum'],
    },
    {
      key: 'gemstone', label: 'Gemstone',
      options: ['Diamond','Sapphire','Opal','Tourmaline','Citrine','Smoky Quartz','Topaz','Amethyst','Turquoise','Pearl','Amber','Ruby','Chalcedony','None'],
    },
    {
      key: 'shape', label: 'Gemstone Shape',
      options: ['Round','Oval','Pear','Emerald Cut','Cushion','Cluster','Band','Signet'],
    },
    {
      key: 'style', label: 'Jewelry Style',
      options: ['Solitaire','Halo','Cluster','Cocktail','Vintage','Fashion','Eternity','Stackable','Statement','Wedding Band'],
    },
    {
      key: 'price', label: 'Price Range',
      options: ['Under $750','$750 - $1,200','$1,200 - $2,000','$2,000 - $3,000','$3,000+'],
    },
  ];

  // ---- Gem category images (using real product photos) ----
  const gemCategories = [
    { name: 'All',         img: img('opalCat') },
    { name: 'Opal',        img: img('opalCat') },
    { name: 'Sapphire',    img: img('sapphireCat') },
    { name: 'Citrine',     img: img('citrineCat') },
    { name: 'Smoky Quartz',img: img('smokyCat') },
    { name: 'Amethyst',    img: img('amethystCat') },
    { name: 'Turquoise',   img: img('turquoiseCat') },
    { name: 'Tourmaline',  img: img('pinkCat') },
    { name: 'Pearl',       img: img('pearlCat') },
    { name: 'Diamond',     img: img('bandCat') },
  ];
  let activeGemCat = 'All';

  // ============================================================
  // BUILD SIDEBAR
  // ============================================================
  const sidebar = document.getElementById('sidebar-filters');
  if (sidebar) {
    let html = `<p class="sidebar-title">Filter By</p>`;
    filterConfig.forEach(group => {
      html += `
        <div class="filter-group open" data-key="${group.key}">
          <div class="filter-group-header">
            <span>${group.label}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div class="filter-group-body">
            ${group.options.map(opt => {
              const isActive = activeFilters[group.key].includes(opt) || 
                               (params.get(group.key) && opt.toLowerCase().includes(params.get(group.key).toLowerCase()));
              if (isActive && !activeFilters[group.key].includes(opt)) {
                activeFilters[group.key].push(opt); // auto-select if mapped
              }
              return `
              <label class="filter-option">
                <input type="checkbox" data-key="${group.key}" value="${opt}" ${isActive ? 'checked' : ''}>
                ${opt}
              </label>
              `;
            }).join('')}
          </div>
        </div>`;
    });
    sidebar.innerHTML = html;

    // Accordion toggle
    sidebar.querySelectorAll('.filter-group-header').forEach(header => {
      header.addEventListener('click', () => {
        header.closest('.filter-group').classList.toggle('open');
      });
    });

    // Filter checkbox events
    sidebar.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const key = cb.dataset.key;
        const val = cb.value;
        if (cb.checked) {
          if (!activeFilters[key].includes(val)) activeFilters[key].push(val);
        } else {
          activeFilters[key] = activeFilters[key].filter(v => v !== val);
        }
        displayCount = 20;
        renderAll();
      });
    });
  }

  // ============================================================
  // BUILD GEM CATEGORY ROW
  // ============================================================
  const gemCatEl = document.getElementById('gem-categories');
  if (gemCatEl) {
    gemCatEl.innerHTML = gemCategories.map(cat => `
      <div class="gem-cat-item ${cat.name === activeGemCat ? 'active' : ''}" data-name="${cat.name}">
        <div class="gem-cat-circle">
          <img src="${cat.img}" alt="${cat.name}">
        </div>
        <span class="gem-cat-name">${cat.name}</span>
      </div>
    `).join('');
    gemCatEl.querySelectorAll('.gem-cat-item').forEach(item => {
      item.addEventListener('click', () => {
        activeGemCat = item.dataset.name;
        gemCatEl.querySelectorAll('.gem-cat-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        displayCount = 20;
        renderAll();
      });
    });
  }

  // ============================================================
  // SORT
  // ============================================================
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      sortBy = sortSelect.value;
      renderAll();
    });
  }

  // ============================================================
  // FILTER LOGIC
  // ============================================================
  function filterRings() {
    let results = [...RINGS];

    // Gem category
    if (activeGemCat !== 'All') {
      results = results.filter(r => r.gemstone.toLowerCase().includes(activeGemCat.toLowerCase()));
    }

    // Metal filter (match partial string in ring's metals array)
    if (activeFilters.metal.length) {
      results = results.filter(r =>
        activeFilters.metal.some(m => r.metals.some(rm => rm.toLowerCase().includes(m.toLowerCase())))
      );
    }

    // Gemstone filter
    if (activeFilters.gemstone.length) {
      results = results.filter(r =>
        activeFilters.gemstone.some(g => r.gemstone.toLowerCase().includes(g.toLowerCase()))
      );
    }

    // Shape
    if (activeFilters.shape.length) {
      results = results.filter(r =>
        activeFilters.shape.some(s => r.shape.toLowerCase() === s.toLowerCase())
      );
    }

    // Style
    if (activeFilters.style.length) {
      results = results.filter(r =>
        activeFilters.style.some(s => r.style.toLowerCase() === s.toLowerCase())
      );
    }

    // Price (using base price as reference)
    if (activeFilters.price.length) {
      results = results.filter(r => {
        return activeFilters.price.some(range => {
          const p = r.basePrice;
          if (range === 'Under $750') return p < 750;
          if (range === '$750 - $1,200') return p >= 750 && p < 1200;
          if (range === '$1,200 - $2,000') return p >= 1200 && p < 2000;
          if (range === '$2,000 - $3,000') return p >= 2000 && p < 3000;
          if (range === '$3,000+') return p >= 3000;
          return false;
        });
      });
    }

    return results;
  }

  function sortRings(rings) {
    switch (sortBy) {
      case 'price-asc': return [...rings].sort((a, b) => a.basePrice - b.basePrice);
      case 'price-desc': return [...rings].sort((a, b) => b.basePrice - a.basePrice);
      case 'rating': return [...rings].sort((a, b) => b.rating - a.rating);
      case 'new': return [...rings].reverse();
      default: return rings; // featured
    }
  }

  // ============================================================
  // RENDER PRODUCT GRID
  // ============================================================
  function renderProductCard(ring) {
    const minPrice = formatPrice(ring.basePrice);
    const maxPrice = formatPrice(Math.round(ring.basePrice * 1.9));
    const badgeClass = ring.badge === 'NEW ARRIVAL' ? 'badge-new' : ring.badge === 'BEST SELLER' ? 'badge-best' : '';
    const swatchDots = ring.swatchColors.slice(0, 4).map((c, i) =>
      `<div class="swatch-dot ${i===0?'active':''}" style="background:${c}" data-idx="${i}"></div>`
    ).join('');

    return `
      <div class="product-card" data-id="${ring.id}">
        <div class="product-card-inner">
          <div class="product-img-wrapper">
            ${ring.badge ? `<span class="product-badge ${badgeClass}">${ring.badge}</span>` : ''}
            <button class="product-wishlist" aria-label="Add to wishlist">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <img class="product-img-primary" src="${ring.images[0]}" alt="${ring.name}" loading="lazy">
            <img class="product-img-hover" src="${ring.images[1] || ring.images[0]}" alt="${ring.name} lifestyle" loading="lazy">
            <div class="product-swatches">${swatchDots}</div>
          </div>
          <div class="product-info">
            <p class="product-name">${ring.name}</p>
            <p class="product-price-range">${minPrice} – ${maxPrice}</p>
          </div>
        </div>
      </div>
    `;
  }

  function renderAll() {
    const filtered = filterRings();
    const sorted = sortRings(filtered);
    const visible = sorted.slice(0, displayCount);

    const grid = document.getElementById('product-grid');
    const countEl = document.getElementById('result-count');
    const loadMoreBtn = document.getElementById('load-more-btn');

    if (countEl) countEl.innerHTML = `<strong>${filtered.length}</strong> Custom Rings`;

    if (grid) {
      if (visible.length === 0) {
        grid.innerHTML = `<div class="no-results"><p>No rings match your filters.</p><button onclick="clearAllFilters()">Clear All Filters</button></div>`;
      } else {
        grid.innerHTML = visible.map(renderProductCard).join('');

        // Card click → product page
        grid.querySelectorAll('.product-card').forEach(card => {
          card.addEventListener('click', (e) => {
            if (e.target.closest('.product-wishlist') || e.target.closest('.swatch-dot')) return;
            const id = card.dataset.id;
            window.location.href = `product.html?id=${id}`;
          });
        });

        // Gem color swatches on card
        grid.querySelectorAll('.product-card').forEach(card => {
          const id = parseInt(card.dataset.id);
          const ring = getRingById(id);
          if (!ring) return;
          card.querySelectorAll('.swatch-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
              e.stopPropagation();
              const idx = parseInt(dot.dataset.idx);
              card.querySelectorAll('.swatch-dot').forEach(d => d.classList.remove('active'));
              dot.classList.add('active');
              // Tint the primary image based on swatch index (approximate metal mapping)
              const metals = ['14K White Gold','14K Yellow Gold','14K Rose Gold','Platinum'];
              const metal = metals[idx % metals.length];
              const primaryImg = card.querySelector('.product-img-primary');
              if (primaryImg) primaryImg.style.filter = getMetalFilter(metal);
            });
          });
        });
      }
    }

    // Load more
    if (loadMoreBtn) {
      loadMoreBtn.style.display = displayCount >= filtered.length ? 'none' : 'block';
    }
  }

  // Load more
  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      displayCount += 20;
      renderAll();
    });
  }

  // Expose for inline handlers
  window.clearAllFilters = function() {
    activeFilters = { metal: [], gemstone: [], shape: [], style: [], price: [] };
    document.querySelectorAll('#sidebar-filters input[type="checkbox"]').forEach(cb => cb.checked = false);
    displayCount = 20;
    renderAll();  };

  // Initial render
  renderAll();
});
