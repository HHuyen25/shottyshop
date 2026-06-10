let wishlistMap = {};
let currentSlide = 0, slides = [], dots = [], slideInterval;

// ==================== WISHLIST ====================
async function loadWishlistStatus() {
  if (!currentUser) return;
  try {
    const res = await fetch(`${API_URL}/wishlist`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.ok) {
      const wishlist = await res.json();
      wishlistMap = {};
      if (wishlist.items && Array.isArray(wishlist.items)) {
        wishlist.items.forEach(item => {
          const pid = item.productId?._id || item.productId;
          if (pid) wishlistMap[pid] = true;
        });
      }
      const currentCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
      renderProducts(currentCategory);
    }
  } catch(e) { console.error(e); }
}

async function toggleWishlist(productId, element) {
  if (!currentUser) {
    if (window.toast) toast.warning('Please login to add to wishlist');
    openLoginModal();
    return;
  }
  const isWished = wishlistMap[productId];
  try {
    if (isWished) {
      const res = await fetch(`${API_URL}/wishlist/remove/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        delete wishlistMap[productId];
        if (window.toast) toast.success('Removed from wishlist');
        if (element) {
          element.classList.remove('active');
          element.textContent = '🤍';
        }
        const currentCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
        renderProducts(currentCategory);
      } else throw new Error('Remove failed');
    } else {
      const res = await fetch(`${API_URL}/wishlist/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ productId })
      });
      if (res.ok) {
        wishlistMap[productId] = true;
        if (window.toast) toast.success('Added to wishlist');
        if (element) {
          element.classList.add('active');
          element.textContent = '❤️';
        }
        const currentCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
        renderProducts(currentCategory);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Add failed');
      }
    }
  } catch(e) {
    if (window.toast) toast.error(e.message);
  }
}

// ==================== CART HANDLERS ====================
function addToCartHandler(e) {
  e.stopPropagation();
  const btn = e.currentTarget;
  addToCart(btn);
}

function productCardHandler(e) {
  const card = e.currentTarget;
  const id = card.dataset.id;
  if (id) window.location.href = `/crud/product-detail.html?id=${id}`;
}

// ==================== RENDER PRODUCTS ====================
function renderProducts(category) {
  const container = document.getElementById('productsGrid') || document.getElementById('productList');
  if (!container) return;
  
  let allProducts = window.products || [];
  let filtered = category !== 'all' ? allProducts.filter(p => p.category === category) : allProducts;
  
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state">No products</div>';
    return;
  }
  
  let html = '';
  filtered.forEach(p => {
    const priceDisplay = convertPrice(p.price);
    let img = p.image && p.image.trim() !== '' ? getImageUrl(p.image) : 'https://picsum.photos/300/300'; 
    const isWished = wishlistMap[p._id] || false;
    const wishIcon = isWished ? '❤️' : '🤍';
    const wishClass = isWished ? 'active' : '';
    html += `
      <div class="product-card" data-id="${p._id}">
        <div class="wishlist-icon ${wishClass}" data-id="${p._id}">${wishIcon}</div>
        <img src="${img}" alt="${escapeHtml(p.name)}">
        <div class="product-info">
          <div class="product-name">${escapeHtml(p.name)}</div>
          <div class="category-badge">${escapeHtml(p.category).toUpperCase()}</div>
          <div class="price">${p.preorder ? '<span class="preorder-badge">' + (translations[currentLanguage]?.preorder || 'PRE-ORDER') + '</span>' : ''}${priceDisplay}</div>
          ${p.hanteo ? `<div class="shipping-info">${translations[currentLanguage]?.hanteo || 'HANTEO | Shipped from KR'}</div>` : ''}
          <button class="add-to-cart" data-id="${p._id}" data-name="${escapeHtml(p.name)}" data-price="${p.price}" data-image="${img}" data-has-options="${(p.options && p.options.length) ? 1 : 0}">${translations[currentLanguage]?.add_to_cart || 'ADD TO CART'}</button>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;

  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.removeEventListener('click', addToCartHandler);
    btn.addEventListener('click', addToCartHandler);
  });
  document.querySelectorAll('.product-card').forEach(card => {
    card.removeEventListener('click', productCardHandler);
    card.addEventListener('click', productCardHandler);
  });
  document.querySelectorAll('.wishlist-icon').forEach(icon => {
    icon.onclick = (e) => {
      e.stopPropagation();
      toggleWishlist(icon.dataset.id, icon);
    };
  });
}

function productCardHTML(p) {
  const priceDisplay = convertPrice(p.price);
  const img = p.image && p.image.trim() !== '' ? getImageUrl(p.image) : 'https://picsum.photos/300/300';
  const isWished = wishlistMap[p._id] || false;
  return `
    <div class="product-card" data-id="${p._id}">
      <div class="wishlist-icon ${isWished ? 'active' : ''}" data-id="${p._id}">${isWished ? '❤️' : '🤍'}</div>
      <img src="${img}" alt="${escapeHtml(p.name)}">
      <div class="product-info">
        <div class="product-name">${escapeHtml(p.name)}</div>
        <div class="category-badge">${escapeHtml(p.category).toUpperCase()}</div>
        <div class="price">${p.preorder ? '<span class="preorder-badge">' + (translations[currentLanguage]?.preorder || 'PRE-ORDER') + '</span>' : ''}${priceDisplay}</div>
        ${p.hanteo ? `<div class="shipping-info">${translations[currentLanguage]?.hanteo || 'HANTEO | Shipped from KR'}</div>` : ''}
        <button class="add-to-cart" data-id="${p._id}" data-name="${escapeHtml(p.name)}" data-price="${p.price}" data-image="${img}" data-has-options="${(p.options && p.options.length) ? 1 : 0}">${translations[currentLanguage]?.add_to_cart || 'ADD TO CART'}</button>
      </div>
    </div>`;
}

function bindCards(scope) {
  scope = scope || document;
  scope.querySelectorAll('.add-to-cart').forEach(btn => { btn.removeEventListener('click', addToCartHandler); btn.addEventListener('click', addToCartHandler); });
  scope.querySelectorAll('.product-card').forEach(card => { card.removeEventListener('click', productCardHandler); card.addEventListener('click', productCardHandler); });
  scope.querySelectorAll('.wishlist-icon').forEach(icon => { icon.onclick = (e) => { e.stopPropagation(); toggleWishlist(icon.dataset.id, icon); }; });
}

// ==================== HOME SECTIONS (WEVERSE STYLE) ====================
const HOME_MEMBERS = ['OHYUL', 'RYUL', 'WOOJIN', 'LOUIS'];
const WS_PER_PAGE = 4;

function wsCardHTML(p) {
  const img = p.image && p.image.trim() ? getImageUrl(p.image) : 'https://picsum.photos/300/300';
  const isWished = wishlistMap[p._id] || false;
  let tags = '';
  if (p.featured) tags += '<span class="ws-tag tag-exclusive">EXCLUSIVE</span>';
  if (p.preorder) tags += `<span class="ws-tag tag-preorder">${translations[currentLanguage]?.preorder || 'PRE-ORDER'}</span>`;
  if (p.hanteo) tags += '<span class="ws-tag tag-ship">Shipped from KR</span>';
  return `
    <div class="ws-card" data-id="${p._id}">
      <div class="ws-img">
        <img src="${img}" alt="${escapeHtml(p.name)}">
        <span class="ws-wish ${isWished ? 'active' : ''}" data-id="${p._id}">${isWished ? '❤️' : '🤍'}</span>
      </div>
      <div class="ws-name">${escapeHtml(p.name)}</div>
      <div class="ws-price"><span class="cur">${currentCurrency || 'USD'}</span>${convertPrice(p.price)}</div>
      ${tags ? `<div class="ws-tags">${tags}</div>` : ''}
      <button class="add-to-cart ws-add" data-id="${p._id}" data-name="${escapeHtml(p.name)}" data-price="${p.price}" data-image="${img}" data-has-options="${(p.options && p.options.length) ? 1 : 0}">🛒 ${translations[currentLanguage]?.add_to_cart || 'ADD TO CART'}</button>
    </div>`;
}

function bindWsCards(scope) {
  scope.querySelectorAll('.ws-card').forEach(card => {
    card.onclick = () => { const id = card.dataset.id; if (id) window.location.href = `/crud/product-detail.html?id=${id}`; };
  });
  scope.querySelectorAll('.ws-wish').forEach(icon => {
    icon.onclick = (e) => { e.stopPropagation(); toggleWishlist(icon.dataset.id, icon); };
  });
  scope.querySelectorAll('.ws-card .add-to-cart').forEach(btn => { btn.removeEventListener('click', addToCartHandler); btn.addEventListener('click', addToCartHandler); });
}

function wsSectionHTML(title, items, idx) {
  const pages = Math.ceil(items.length / WS_PER_PAGE);
  return `
    <div class="ws-section" data-idx="${idx}" data-page="0">
      <div class="ws-banner"><span class="ws-now">Now</span><h2 class="ws-title">${escapeHtml(title)} ›</h2></div>
      <div class="ws-body">
        <div class="ws-grid">${items.slice(0, WS_PER_PAGE).map(wsCardHTML).join('')}</div>
        ${pages > 1 ? `<div class="ws-pager"><button class="ws-prev" disabled>‹</button><span class="ws-pageinfo"><b>01</b> | ${String(pages).padStart(2, '0')}</span><button class="ws-next">›</button></div>` : ''}
      </div>
    </div>`;
}

function setupWsSection(sec, items) {
  if (!sec) return;
  const grid = sec.querySelector('.ws-grid');
  const pages = Math.ceil(items.length / WS_PER_PAGE);
  const info = sec.querySelector('.ws-pageinfo');
  const prev = sec.querySelector('.ws-prev');
  const next = sec.querySelector('.ws-next');
  function renderPage() {
    const pg = Math.max(0, Math.min(pages - 1, parseInt(sec.dataset.page) || 0));
    sec.dataset.page = pg;
    grid.innerHTML = items.slice(pg * WS_PER_PAGE, pg * WS_PER_PAGE + WS_PER_PAGE).map(wsCardHTML).join('');
    bindWsCards(grid);
    if (info) info.innerHTML = `<b>${String(pg + 1).padStart(2, '0')}</b> | ${String(pages).padStart(2, '0')}`;
    if (prev) prev.disabled = pg === 0;
    if (next) next.disabled = pg >= pages - 1;
  }
  if (prev) prev.onclick = () => { sec.dataset.page = (parseInt(sec.dataset.page) || 0) - 1; renderPage(); };
  if (next) next.onclick = () => { sec.dataset.page = (parseInt(sec.dataset.page) || 0) + 1; renderPage(); };
  bindWsCards(grid);
}

function renderHomeSections() {
  const wrap = document.getElementById('homeSections');
  if (!wrap) return;
  const all = window.products || [];
  const sections = [];
  const featured = all.filter(p => p.featured);
  if (featured.length) sections.push({ title: translations[currentLanguage]?.featured_products || 'Sản phẩm nổi bật', items: featured });
  HOME_MEMBERS.forEach(m => { const items = all.filter(p => p.member === m); if (items.length) sections.push({ title: m, items }); });
  if (!sections.length) { wrap.style.display = 'none'; wrap.innerHTML = ''; return; }
  wrap.style.display = 'block';
  wrap.innerHTML = sections.map((s, i) => wsSectionHTML(s.title, s.items, i)).join('');
  sections.forEach((s, i) => setupWsSection(wrap.querySelector(`.ws-section[data-idx="${i}"]`), s.items));
}

// ==================== SEARCH URL HANDLING ====================
// Mở trang chủ với ?category=... (vd từ nút banner) -> lọc đúng danh mục
function applyCategoryFromURL() {
  const cat = (new URLSearchParams(location.search).get('category') || '').trim();
  if (!cat) return false;
  document.querySelectorAll('.category-btn').forEach(b => b.classList.toggle('active', b.dataset.category === cat));
  renderProducts(cat);
  const hs = document.getElementById('homeSections'); if (hs) hs.style.display = 'none';
  document.getElementById('categoryNav')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}

function applySearchFromURL() {
  const term = (new URLSearchParams(location.search).get('search') || '').trim();
  if (!term) return false;
  const input = document.getElementById('searchInput');
  if (input) input.value = term;
  const t = term.toLowerCase();
  const filtered = (window.products || []).filter(p =>
    (p.name || '').toLowerCase().includes(t) ||
    (p.category || '').toLowerCase().includes(t) ||
    (p.member || '').toLowerCase().includes(t)
  );
  const container = document.getElementById('productsGrid') || document.getElementById('productList');
  if (container) {
    container.innerHTML = filtered.length
      ? `<div class="search-result-head" style="grid-column:1/-1;margin-bottom:.5rem;font-weight:600;">Kết quả cho "${escapeHtml(term)}" (${filtered.length})</div>` + filtered.map(productCardHTML).join('')
      : `<div class="empty-state">Không tìm thấy sản phẩm cho "${escapeHtml(term)}"</div>`;
    bindCards(container);
  }
  const hs = document.getElementById('homeSections'); if (hs) hs.style.display = 'none';
  document.getElementById('categoryNav')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}

function addToCart(btn) {
  // Sản phẩm có phân loại (Size, Màu...) -> mở hộp thoại chọn phân loại + số lượng
  if (btn.dataset.hasOptions === '1') {
    openVariantModal(btn.dataset.id);
    return;
  }
  let cart = JSON.parse(localStorage.getItem('shotyCart')) || [];
  const id = btn.dataset.id, name = btn.dataset.name, price = parseFloat(btn.dataset.price), image = btn.dataset.image;
  let existing = cart.find(i => i.id === id);
  if (existing) { existing.quantity++; } else { cart.push({ id, name, price, quantity: 1, image }); }
  localStorage.setItem('shotyCart', JSON.stringify(cart));
  if (typeof updateCartCount === 'function') updateCartCount();
  const original = btn.textContent;
  btn.textContent = translations[currentLanguage]?.added || '✓ ADDED!';
  if (window.toast) toast.success(`Added "${name}" to cart!`);
  setTimeout(() => btn.textContent = original, 1000);
}

// ==================== HỘP THOẠI CHỌN PHÂN LOẠI + SỐ LƯỢNG (trang chủ) ====================
let _vmState = { product: null, qty: 1, selected: {} };

function openVariantModal(productId) {
  const product = (window.products || []).find(p => p._id === productId);
  if (!product) return;
  if (!product.options || !product.options.length) { return; } // không có phân loại thì thôi
  _vmState = { product, qty: 1, selected: {} };
  ensureVariantModal();
  renderVariantModal();
  document.getElementById('variantModal').classList.add('show');
}

function ensureVariantModal() {
  if (document.getElementById('variantModal')) return;
  const div = document.createElement('div');
  div.id = 'variantModal';
  div.className = 'vm-overlay';
  div.innerHTML = `
    <div class="vm-box">
      <button class="vm-close" onclick="closeVariantModal()">&times;</button>
      <div class="vm-head">
        <img id="vmImg" class="vm-img" src="" alt="">
        <div><div id="vmName" class="vm-name"></div><div id="vmPrice" class="vm-price"></div></div>
      </div>
      <div id="vmOptions"></div>
      <div class="vm-qty-row">
        <span class="vm-qty-label">Số lượng</span>
        <div class="vm-qty"><button type="button" onclick="vmChangeQty(-1)">−</button><span id="vmQty">1</span><button type="button" onclick="vmChangeQty(1)">+</button></div>
      </div>
      <button class="vm-add" type="button" onclick="vmConfirm()">🛒 Thêm vào giỏ</button>
    </div>`;
  div.onclick = (e) => { if (e.target === div) closeVariantModal(); };
  document.body.appendChild(div);
}

function renderVariantModal() {
  const p = _vmState.product;
  document.getElementById('vmImg').src = (p.image && p.image.trim() ? getImageUrl(p.image) : 'https://picsum.photos/120/120');
  document.getElementById('vmName').textContent = p.name;
  document.getElementById('vmPrice').textContent = (currentCurrency || 'USD') + ' ' + convertPrice(p.price);
  document.getElementById('vmQty').textContent = _vmState.qty;
  // Gộp tên trùng -> 1 tên duy nhất, giá trị nằm ngang
  const merged = {}; const order = [];
  (p.options || []).forEach(o => {
    const name = (o.name || '').trim(); if (!name) return;
    if (!merged[name]) { merged[name] = []; order.push(name); }
    (o.values || []).forEach(v => { v = (v || '').trim(); if (v && !merged[name].includes(v)) merged[name].push(v); });
  });
  document.getElementById('vmOptions').innerHTML = order.map(name => `
    <div class="vm-opt-row">
      <div class="vm-opt-name">${escapeHtml(name)}</div>
      <div class="vm-opt-vals">${merged[name].map(v => `<button type="button" class="vm-val ${_vmState.selected[name] === v ? 'active' : ''}" data-name="${escapeHtml(name)}" data-value="${escapeHtml(v)}" onclick="vmSelect(this)">${escapeHtml(v)}</button>`).join('')}</div>
    </div>`).join('');
}

function vmSelect(btn) {
  const name = btn.dataset.name, value = btn.dataset.value;
  if (_vmState.selected[name] === value) delete _vmState.selected[name]; // bấm lại = bỏ chọn
  else _vmState.selected[name] = value;
  renderVariantModal();
}
function vmChangeQty(d) { _vmState.qty = Math.max(1, _vmState.qty + d); document.getElementById('vmQty').textContent = _vmState.qty; }
function closeVariantModal() { const m = document.getElementById('variantModal'); if (m) m.classList.remove('show'); }

function vmConfirm() {
  const p = _vmState.product;
  const names = [...new Set((p.options || []).map(o => (o.name || '').trim()).filter(Boolean))];
  if (names.some(n => !_vmState.selected[n])) {
    if (window.toast) toast.error('Vui lòng chọn đầy đủ phân loại'); else alert('Vui lòng chọn đầy đủ phân loại');
    return;
  }
  const cart = JSON.parse(localStorage.getItem('shotyCart')) || [];
  const price = p.salePrice || p.price || 0;
  const image = p.image || (p.images && p.images[0]) || '';
  const opts = { ..._vmState.selected };
  const existing = cart.find(i => i.id === p._id && JSON.stringify(i.options || {}) === JSON.stringify(opts));
  if (existing) existing.quantity += _vmState.qty;
  else cart.push({ id: p._id, name: p.name, price, quantity: _vmState.qty, image, options: opts });
  localStorage.setItem('shotyCart', JSON.stringify(cart));
  if (typeof updateCartCount === 'function') updateCartCount();
  if (window.toast) toast.success('Đã thêm vào giỏ hàng!');
  closeVariantModal();
}

// ==================== BANNER SLIDER RUNNING ====================
function renderSlider() {
  // Dùng div #slider bên trong (KHÔNG dùng #mainSlider) để không xóa mất nút ❮ ❯ và dots
  const slider = document.getElementById('slider') || document.getElementById('mainSlider');
  const dotsContainer = document.getElementById('sliderDots');
  if (!slider) return;
  
  // Sửa lỗi: Hỗ trợ map linh hoạt cả thuộc tính b.image, b.imageUrl hoặc b.url từ database trả về
  const allBanners = window.banners || [];
  if (!allBanners.length) { renderSliderFallback(); return; }
  
  slider.innerHTML = ''; 
  if (dotsContainer) dotsContainer.innerHTML = '';
  
  allBanners.forEach((b, idx) => {
    const slide = document.createElement('div'); 
    slide.className = `slide ${idx === 0 ? 'active' : ''}`;
    
    // Đảm bảo lấy đúng link ảnh bất kể tên biến backend trả về
    const _rawMedia = b.image || b.imageUrl || b.url || '';
    const mediaUrl = (typeof getImageUrl === 'function' ? getImageUrl(_rawMedia) : _rawMedia) || '';
    const isVideo = b.mediaType === 'video' || (mediaUrl && mediaUrl.match(/\.(mp4|webm|mov)$/i));
    
    if (isVideo) {
      slide.innerHTML = `<video autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;"><source src="${mediaUrl}" type="video/mp4"></video><div class="slide-content"><h1>${escapeHtml(b.title || '')}</h1><p>${escapeHtml(b.subtitle || '')}</p><button class="shop-now" data-link="${b.buttonLink || '#'}">${escapeHtml(b.buttonText) || 'SHOP NOW →'}</button></div>`;
    } else {
      // FIX LỖI ẢNH: Sử dụng thẻ <img> hoặc áp thuộc tính CSS chuẩn trực tiếp vào thẻ nền
      slide.innerHTML = `<div class="slide-bg" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url('${mediaUrl}'); background-size: cover; background-position: center; width: 100%; height: 100%; position: absolute; top:0; left:0; z-index:-1;"></div><div class="slide-content"><h1>${escapeHtml(b.title || '')}</h1><p>${escapeHtml(b.subtitle || '')}</p><button class="shop-now" data-link="${b.buttonLink || '#'}">${escapeHtml(b.buttonText) || 'SHOP NOW →'}</button></div>`;
    }
    slider.appendChild(slide);
    
    if (dotsContainer) {
      const dot = document.createElement('span'); 
      dot.className = `dot ${idx === 0 ? 'active' : ''}`; 
      dot.style.cursor = 'pointer'; // Thêm trỏ chuột tương tác cho dấu chấm
      dot.addEventListener('click', () => { goToSlide(idx); resetAutoSlide(); }); 
      dotsContainer.appendChild(dot);
    }
  });
  
  slides = slider.querySelectorAll('.slide'); 
  dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : []; 
  startAutoSlide();
  
  slider.querySelectorAll('.shop-now').forEach(btn => {
    btn.onclick = () => { if (btn.dataset.link) window.location.href = btn.dataset.link; };
  });
}

function renderSliderFallback() {
  const slider = document.getElementById('slider') || document.getElementById('mainSlider');
  if (!slider) return;
  slider.innerHTML = '<div class="slide active"><div class="slide-bg" style="background: linear-gradient(135deg, #667eea, #764ba2); width:100%; height:100%; position:absolute; top:0; left:0; z-index:-1;"></div><div class="slide-content"><h1>SHOTTYSHOP</h1><p>Official Store</p><button class="shop-now" data-link="#">SHOP NOW →</button></div></div>';
  slides = slider.querySelectorAll('.slide'); 
  startAutoSlide();
}

function goToSlide(index) { 
  if (!slides.length) return; 
  if (index < 0) currentSlide = slides.length-1; 
  else if (index >= slides.length) currentSlide = 0; 
  else currentSlide = index; 
  slides.forEach((s,i)=>s.classList.toggle('active',i===currentSlide)); 
  dots.forEach((d,i)=>d.classList.toggle('active',i===currentSlide)); 
}
function nextSlide() { goToSlide(currentSlide+1); } 
function prevSlide() { goToSlide(currentSlide-1); } 
function startAutoSlide() { if(slideInterval) clearInterval(slideInterval); slideInterval = setInterval(nextSlide,3000); } 
function stopAutoSlide() { if(slideInterval) clearInterval(slideInterval); }
function resetAutoSlide() { stopAutoSlide(); startAutoSlide(); }

// ==================== TRANSLATIONS / CURRENCY ====================
function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('shopLanguage', lang);
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.dataset.key;
    if (translations[lang] && translations[lang][key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = translations[lang][key];
      else el.innerText = translations[lang][key];
    }
  });
}

function setCurrency(currency) {
  currentCurrency = currency;
  localStorage.setItem('shopCurrency', currency);
}

// ==================== INITIALIZATION ====================
let pageInitialized = false;
window.initPage = async () => {
  if (pageInitialized) return;
  pageInitialized = true;
  
  const savedLang = localStorage.getItem('shopLanguage') || 'vi';
  setLanguage(savedLang);
  const savedCurr = localStorage.getItem('shopCurrency') || 'USD';
  setCurrency(savedCurr);
  
  // Tải dữ liệu song song từ API
  await Promise.all([
    window.loadProducts ? window.loadProducts() : Promise.resolve(),
    window.loadBanners ? window.loadBanners() : Promise.resolve()
  ]);
  
  // Khởi tạo render các thành phần giao diện
  const currentCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
  renderProducts(currentCategory);
  renderSlider();
  renderHomeSections();
  if (!applySearchFromURL()) applyCategoryFromURL();
  
  await loadWishlistStatus();
  
  // Gắn hành động lọc danh mục sản phẩm 
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.onclick = function() {
      document.querySelectorAll('.category-btn').forEach(b=>b.classList.remove('active'));
      this.classList.add('active');
      renderProducts(this.dataset.category);
    };
  });
  
  // Cài đặt thanh Menu sticky khi trượt
  const nav = document.getElementById('categoryNav'), sliderContainer = document.querySelector('.slider-container') || document.querySelector('.slider'); 
  if(nav && sliderContainer) {
    new IntersectionObserver(([e])=>nav.classList.toggle('sticky',!e.isIntersecting),{threshold:[0]}).observe(sliderContainer); 
  }
  
  // Điều khiển các nút Slider thủ công (Hỗ trợ nút <> và dấu ... đổi slide khác)
  document.getElementById('prevBtn')?.addEventListener('click', () => { prevSlide(); resetAutoSlide(); });
  document.getElementById('nextBtn')?.addEventListener('click', () => { nextSlide(); resetAutoSlide(); });
  
  if (sliderContainer) {
    sliderContainer.addEventListener('mouseenter', stopAutoSlide);
    sliderContainer.addEventListener('mouseleave', startAutoSlide);
  }
  setupModalHandlers();
};

// ==================== AUTH MODAL HANDLERS ====================
function openLoginModal() { const m = document.getElementById('loginModal'); if(m) m.style.display='flex'; }
function closeLoginModal() { const m = document.getElementById('loginModal'); if(m) m.style.display='none'; }
function openSignupModal() { const m = document.getElementById('signupModal'); if(m) m.style.display='flex'; }
function closeSignupModal() { const m = document.getElementById('signupModal'); if(m) m.style.display='none'; }

function setupModalHandlers() {
  if (!window.modalHandlersSetup) {
    document.getElementById('closeLoginModal')?.addEventListener('click', closeLoginModal);
    document.getElementById('closeSignupModal')?.addEventListener('click', closeSignupModal);
    document.getElementById('showSignupBtn')?.addEventListener('click', (e) => { e.preventDefault(); closeLoginModal(); openSignupModal(); });
    document.getElementById('showLoginBtn')?.addEventListener('click', (e) => { e.preventDefault(); closeSignupModal(); openLoginModal(); });
    
    // Nút đăng nhập/đăng ký điều hướng phân quyền admin/staff từ dữ liệu gốc
    document.getElementById('doLoginBtn')?.addEventListener('click', async () => {
      const email = document.getElementById('loginEmail').value, password = document.getElementById('loginPassword').value;
      if (!email || !password) return;
      try {
        if(typeof showLoading === 'function') showLoading();
        const res = await fetch(`${API_URL}/users/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) });
        if(res.ok) {
          const {user,token} = await res.json();
          localStorage.setItem('authToken',token);
          localStorage.setItem('currentUserId',user._id);
          if (user.role === 'admin') window.location.href = '/admin/admin.html';
          else if (user.role === 'staff') window.location.href = '/staff/staff.html';
          else window.location.reload();
        }
      } catch(e) { console.error(e); } finally { if(typeof hideLoading === 'function') hideLoading(); }
    });
    
    window.addEventListener('click', (e) => { 
      if(e.target === document.getElementById('loginModal')) closeLoginModal(); 
      if(e.target === document.getElementById('signupModal')) closeSignupModal(); 
    });
    window.modalHandlersSetup = true;
  }
}

// Bắt đầu chạy khi tải trang
if (!window._domReadyExecuted) {
  window._domReadyExecuted = true;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.initPage());
  } else {
    window.initPage();
  }
}