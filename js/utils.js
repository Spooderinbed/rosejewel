// Tsukiyo Gems - Utility Functions

// ============================================================
// RING LOOKUP
// ============================================================
function getRingById(id) {
  return RINGS.find(r => r.id === id);
}

function getRingBySlug(slug) {
  return RINGS.find(r => r.slug === slug);
}

// ============================================================
// PRICING CALCULATIONS
// ============================================================
function calculatePrice(ring, metal, quality, carat) {
  let basePrice = ring.basePrice || 1500;

  // Apply metal multiplier
  const metalMultiplier = METAL_MULTIPLIERS[metal] || 1.0;
  basePrice *= metalMultiplier;

  // Apply quality multiplier (if applicable)
  if (quality) {
    // Extract just the letter part (AA, AAA, AAAA, A)
    let qualityKey = quality;
    // Handle full names like "Better (AA)" -> extract "AA"
    if (quality.includes('(')) {
      qualityKey = quality.match(/\((.*?)\)/)[1];
    }
    const qualityMultiplier = QUALITY_MULTIPLIERS[qualityKey] || 1.0;
    basePrice *= qualityMultiplier;
  }

  // Apply carat multiplier (if applicable)
  if (carat) {
    const caratMultiplier = CARAT_MULTIPLIERS[carat] || 1.0;
    basePrice *= caratMultiplier;
  }

  return Math.round(basePrice);
}

function getOriginalPrice(ring, metal, quality, carat) {
  const price = calculatePrice(ring, metal, quality, carat);
  const discountPercent = (ring.originalPrice && ring.basePrice)
    ? Math.round((1 - ring.basePrice / ring.originalPrice) * 100)
    : 20;
  return Math.round(price / (1 - discountPercent / 100));
}

// ============================================================
// FORMATTING
// ============================================================
function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

// ============================================================
// METAL STYLING
// ============================================================
function getMetalSwatchColor(metal) {
  const colorMap = {
    '14K White Gold':  '#e8e8e8',
    '18K White Gold':  '#f0f0f0',
    '14K Yellow Gold': '#daa520',
    '18K Yellow Gold': '#ffd700',
    '14K Rose Gold':   '#f4a460',
    '18K Rose Gold':   '#ff69b4',
    'Sterling Silver': '#cfd1d4',
    'Platinum':        '#cccccc',
  };
  return colorMap[metal] || '#ffffff';
}

function getMetalFilter(metal) {
  // For real product photos we keep neutral; only tint slightly to simulate metal change.
  const filterMap = {
    '14K White Gold':  'brightness(0.99) saturate(0.95)',
    '18K White Gold':  'brightness(1.00) saturate(0.92)',
    '14K Yellow Gold': 'brightness(0.98) sepia(0.18) hue-rotate(-8deg) saturate(1.05)',
    '18K Yellow Gold': 'brightness(1.00) sepia(0.22) hue-rotate(-4deg) saturate(1.08)',
    '14K Rose Gold':   'brightness(0.96) sepia(0.18) hue-rotate(350deg)',
    '18K Rose Gold':   'brightness(0.98) sepia(0.22) hue-rotate(355deg)',
    'Sterling Silver': 'brightness(0.96) saturate(0.85)',
    'Platinum':        'brightness(1.00) saturate(0.92)',
  };
  return filterMap[metal] || '';
}

// ============================================================
// UI HELPERS
// ============================================================
function updateConfigLabel(elementId, label, value) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = label + (value ? value : '');
  }
}

// IMAGES + img() are defined in data.js and shared globally; nothing to add here.
