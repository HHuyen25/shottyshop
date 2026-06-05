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
  const container = document.getElementById('productList');
  if (!container) return;
  
  // Sử dụng window.products từ common.js
  const allProducts = window.products || [];
  
  let filtered = category !== 'all' ? allProducts.filter(p => p.category === category) : allProducts;
  
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state">No products</div>';
    return;
  }
  
  let html = '';
  filtered.forEach(p => {
    const priceDisplay = convertPrice(p.price);
    let img = p.image && p.image.trim() !== '' ? getImageUrl(p.image) : 'https://picsum.photos/300/300?random=1';
    const isWished = wishlistMap[p._id] || false;
    const wishIcon = isWished ? '❤️' : '🤍';
    const wishClass = isWished ? 'active' : '';
    html += `
      <div class="product-card" data-id="${p._id}">
        <div class="wishlist-icon ${wishClass}" data-id="${p._id}">${wishIcon}</div>
        <img src="${img}" alt="${escapeHtml(p.name)}" onerror="this.src='https://picsum.photos/300/300?random=2'">
        <div class="product-info">
          <div class="product-name">${escapeHtml(p.name)}</div>
          <div class="category-badge">${escapeHtml(p.category).toUpperCase()}</div>
          <div class="price">${p.preorder ? '<span class="preorder-badge">' + (translations[currentLanguage]?.preorder || 'PRE-ORDER') + '</span>' : ''}${priceDisplay}</div>
          ${p.hanteo ? `<div class="shipping-info">${translations[currentLanguage]?.hanteo || 'HANTEO | Shipped from KR'}</div>` : ''}
          <button class="add-to-cart" data-id="${p._id}" data-name="${escapeHtml(p.name)}" data-price="${p.price}" data-image="${img}">${translations[currentLanguage]?.add_to_cart || 'ADD TO CART'}</button>
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
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      const productId = icon.dataset.id;
      toggleWishlist(productId, icon);
    });
  });
}

// ==================== HELPER: thẻ sản phẩm dùng chung ====================
function productCardHTML(p) {
  const priceDisplay = convertPrice(p.price);
  const img = p.image && p.image.trim() !== '' ? getImageUrl(p.image) : 'https://picsum.photos/300/300?random=1';
  const isWished = wishlistMap[p._id] || false;
  return `
    <div class="product-card" data-id="${p._id}">
      <div class="wishlist-icon ${isWished ? 'active' : ''}" data-id="${p._id}">${isWished ? '❤️' : '🤍'}</div>
      <img src="${img}" alt="${escapeHtml(p.name)}" onerror="this.src='https://picsum.photos/300/300?random=2'">
      <div class="product-info">
        <div class="product-name">${escapeHtml(p.name)}</div>
        <div class="category-badge">${escapeHtml(p.category).toUpperCase()}</div>
        <div class="price">${p.preorder ? '<span class="preorder-badge">' + (translations[currentLanguage]?.preorder || 'PRE-ORDER') + '</span>' : ''}${priceDisplay}</div>
        ${p.hanteo ? `<div class="shipping-info">${translations[currentLanguage]?.hanteo || 'HANTEO | Shipped from KR'}</div>` : ''}
        <button class="add-to-cart" data-id="${p._id}" data-name="${escapeHtml(p.name)}" data-price="${p.price}" data-image="${img}">${translations[currentLanguage]?.add_to_cart || 'ADD TO CART'}</button>
      </div>
    </div>`;
}

function bindCards(scope) {
  scope = scope || document;
  scope.querySelectorAll('.add-to-cart').forEach(btn => { btn.removeEventListener('click', addToCartHandler); btn.addEventListener('click', addToCartHandler); });
  scope.querySelectorAll('.product-card').forEach(card => { card.removeEventListener('click', productCardHandler); card.addEventListener('click', productCardHandler); });
  scope.querySelectorAll('.wishlist-icon').forEach(icon => { icon.addEventListener('click', (e) => { e.stopPropagation(); toggleWishlist(icon.dataset.id, icon); }); });
}

// ==================== HOME: nổi bật + theo thành viên ====================
const HOME_MEMBERS = ['OHYUL', 'RYUL', 'WOOJIN', 'LOUIS'];

const WS_PER_PAGE = 4;

function wsCardHTML(p) {
  const img = p.image && p.image.trim() ? getImageUrl(p.image) : 'https://picsum.photos/300/300?random=1';
  const isWished = wishlistMap[p._id] || false;
  let tags = '';
  if (p.featured) tags += '<span class="ws-tag tag-exclusive">EXCLUSIVE</span>';
  if (p.preorder) tags += `<span class="ws-tag tag-preorder">${translations[currentLanguage]?.preorder || 'PRE-ORDER'}</span>`;
  if (p.hanteo) tags += '<span class="ws-tag tag-ship">Shipped from KR</span>';
  return `
    <div class="ws-card" data-id="${p._id}">
      <div class="ws-img">
        <img src="${img}" onerror="this.src='https://picsum.photos/300/300?random=2'" alt="${escapeHtml(p.name)}">
        <span class="ws-wish ${isWished ? 'active' : ''}" data-id="${p._id}">${isWished ? '❤️' : '🤍'}</span>
      </div>
      <div class="ws-name">${escapeHtml(p.name)}</div>
      <div class="ws-price"><span class="cur">${currentCurrency || 'USD'}</span>${convertPrice(p.price)}</div>
      ${tags ? `<div class="ws-tags">${tags}</div>` : ''}
    </div>`;
}

function bindWsCards(scope) {
  scope.querySelectorAll('.ws-card').forEach(card => {
    card.onclick = () => { const id = card.dataset.id; if (id) window.location.href = `/crud/product-detail.html?id=${id}`; };
  });
  scope.querySelectorAll('.ws-wish').forEach(icon => {
    icon.onclick = (e) => { e.stopPropagation(); toggleWishlist(icon.dataset.id, icon); };
  });
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

// Khi vào index với ?search= -> hiển thị kết quả tìm kiếm
function applySearchFromURL() {
  const term = (new URLSearchParams(location.search).get('search') || '').trim();
  if (!term) return false;
  const input = document.getElementById('searchInput');
  if (input) input.value = term;
  // Khi tìm kiếm: hiện lại nút ALL (để quay về xem tất cả / thoát tìm kiếm)
  const allBtn = document.getElementById('catAllBtn');
  if (allBtn) allBtn.style.display = '';
  const t = term.toLowerCase();
  const filtered = (window.products || []).filter(p =>
    (p.name || '').toLowerCase().includes(t) ||
    (p.category || '').toLowerCase().includes(t) ||
    (p.member || '').toLowerCase().includes(t)
  );
  const container = document.getElementById('productList');
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
  let cart = JSON.parse(localStorage.getItem('shotyCart')) || [];
  const id = btn.dataset.id, name = btn.dataset.name, price = parseFloat(btn.dataset.price), image = btn.dataset.image;
  let existing = cart.find(i => i.id === id);
  
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ id, name, price, quantity: 1, image });
  }
  
  localStorage.setItem('shotyCart', JSON.stringify(cart));
  updateCartCount();
  
  const original = btn.textContent;
  btn.textContent = translations[currentLanguage]?.added || '✓ ADDED!';
  if (window.toast) toast.success(`Added "${name}" to cart!`);
  setTimeout(() => btn.textContent = original, 1000);
}

function shopNowHandler(e) {
  const link = e.currentTarget.dataset.link;
  if (link && link !== '#') window.location.href = link;
}

function renderSlider() {
  const slider = document.getElementById('slider'), dotsContainer = document.getElementById('sliderDots');
  if (!slider) return;
  
  // Sử dụng window.banners từ common.js
  const allBanners = window.banners || [];
  
  if (!allBanners.length) { renderSliderFallback(); return; }
  
  slider.innerHTML = ''; 
  dotsContainer.innerHTML = '';
  
  allBanners.forEach((b, idx) => {
    const slide = document.createElement('div'); 
    slide.className = `slide ${idx === 0 ? 'active' : ''}`;
    const mediaUrl = getImageUrl(b.image);
    const isVideo = b.mediaType === 'video' || (mediaUrl && mediaUrl.match(/\.(mp4|webm|mov)$/i));
    
    if (isVideo) {
      slide.innerHTML = `<video autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;"><source src="${mediaUrl}" type="video/mp4"></video><div class="slide-content"><h1>${escapeHtml(b.title)}</h1><p>${escapeHtml(b.subtitle)}</p><button class="shop-now" data-link="${b.buttonLink}">${escapeHtml(b.buttonText) || (translations[currentLanguage]?.shop_now || 'SHOP NOW →')}</button></div>`;
    } else {
      slide.innerHTML = `<div class="slide-bg" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url('${mediaUrl}'); background-size: cover; background-position: center;"></div><div class="slide-content"><h1>${escapeHtml(b.title)}</h1><p>${escapeHtml(b.subtitle)}</p><button class="shop-now" data-link="${b.buttonLink}">${escapeHtml(b.buttonText) || (translations[currentLanguage]?.shop_now || 'SHOP NOW →')}</button></div>`;
    }
    slider.appendChild(slide);
    const dot = document.createElement('span'); 
    dot.className = `dot ${idx === 0 ? 'active' : ''}`; 
    dot.addEventListener('click', () => goToSlide(idx)); 
    dotsContainer.appendChild(dot);
  });
  
  slides = document.querySelectorAll('.slide'); 
  dots = document.querySelectorAll('.dot'); 
  startAutoSlide();
  document.querySelectorAll('.shop-now').forEach(btn => {
    btn.removeEventListener('click', shopNowHandler);
    btn.addEventListener('click', shopNowHandler);
  });
}

function renderSliderFallback() {
  const slider = document.getElementById('slider');
  if (!slider) return;
  slider.innerHTML = '<div class="slide active"><div class="slide-bg" style="background: linear-gradient(135deg, #667eea, #764ba2);"></div><div class="slide-content"><h1>SHOTTYSHOP</h1><p>Official Store</p><button class="shop-now" data-link="#">SHOP NOW →</button></div></div>';
  slides = document.querySelectorAll('.slide'); 
  startAutoSlide();
  const shopBtn = document.querySelector('.shop-now');
  if (shopBtn) shopBtn.addEventListener('click', shopNowHandler);
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
function startAutoSlide() { if(slideInterval) clearInterval(slideInterval); slideInterval = setInterval(nextSlide,5000); } 
function stopAutoSlide() { if(slideInterval) clearInterval(slideInterval); }

// ==================== CATEGORY FILTER ====================
function setupCategoryFilter() {
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click',function(){
      document.querySelectorAll('.category-btn').forEach(b=>b.classList.remove('active'));
      this.classList.add('active');
      renderProducts(this.dataset.category);
    });
  });
}

// ==================== SEARCH ====================
function setupSearch() {
  const searchInput = document.getElementById('searchInput'), searchBtn = document.getElementById('searchBtn');
  if (!searchInput || !searchBtn) return;
  
  const performSearch = () => {
    const term = searchInput.value.toLowerCase().trim();
    if (!term) return renderProducts(document.querySelector('.category-btn.active')?.dataset.category || 'all');
    
    const allProducts = window.products || [];
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term));
    const container = document.getElementById('productList');
    if (!filtered.length) { 
      container.innerHTML = '<div class="empty-state">No results</div>'; 
      return; 
    }
    
    let html = '';
    filtered.forEach(p => { 
      const priceDisplay = convertPrice(p.price); 
      let img = p.image && p.image.trim() !== '' ? getImageUrl(p.image) : 'https://picsum.photos/300/300?random=1';
      const isWished = wishlistMap[p._id] || false;
      const wishIcon = isWished ? '❤️' : '🤍';
      const wishClass = isWished ? 'active' : '';
      html += `<div class="product-card" data-id="${p._id}">
        <div class="wishlist-icon ${wishClass}" data-id="${p._id}">${wishIcon}</div>
        <img src="${img}" alt="${escapeHtml(p.name)}">
        <div class="product-info">
          <div class="product-name">${escapeHtml(p.name)}</div>
          <div class="category-badge">${escapeHtml(p.category).toUpperCase()}</div>
          <div class="price">${p.preorder ? '<span class="preorder-badge">PRE-ORDER</span>' : ''}${priceDisplay}</div>
          ${p.hanteo ? '<div class="shipping-info">HANTEO | Shipped from KR</div>' : ''}
          <button class="add-to-cart" data-id="${p._id}" data-name="${escapeHtml(p.name)}" data-price="${p.price}" data-image="${img}">ADD TO CART</button>
        </div>
      </div>`; 
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
      icon.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = icon.dataset.id;
        toggleWishlist(productId, icon);
      });
    });
  };
  
  searchBtn.addEventListener('click',performSearch);
  searchInput.addEventListener('keypress',e=>e.key==='Enter'&&performSearch());
}

// ==================== STICKY NAV ====================
function setupStickyNav() { 
  const nav = document.getElementById('categoryNav'), slider = document.querySelector('.slider-container'); 
  if(!nav||!slider) return; 
  const observer = new IntersectionObserver(([e])=>nav.classList.toggle('sticky',!e.isIntersecting),{threshold:[0]}); 
  observer.observe(slider); 
}

// ==================== MODAL FUNCTIONS ====================
function openLoginModal() { 
  const modal = document.getElementById('loginModal');
  if (modal) modal.style.display = 'flex'; 
} 
function closeLoginModal() { 
  const modal = document.getElementById('loginModal');
  if (modal) modal.style.display = 'none'; 
} 
function openSignupModal() { 
  const modal = document.getElementById('signupModal');
  if (modal) modal.style.display = 'flex'; 
} 
function closeSignupModal() { 
  const modal = document.getElementById('signupModal');
  if (modal) modal.style.display = 'none'; 
}

// ==================== AUTH ====================
async function login() {
  const email = document.getElementById('loginEmail').value, password = document.getElementById('loginPassword').value;
  if (!email || !password) {
    if (window.toast) toast.error('Please enter email and password');
    return;
  }
  try {
    showLoading();
    const res = await fetch(`${API_URL}/users/login`, { 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body:JSON.stringify({email,password}) 
    });
    if(res.ok) { 
      const {user,token}=await res.json();
      localStorage.setItem('authToken',token);
      localStorage.setItem('currentUserId',user._id);
      if (window.toast) toast.success(`Welcome back, ${user.name}!`);
      // Điều hướng theo role: admin/staff vào dashboard, khách hàng ở lại trang chủ
      if (user.role === 'admin') setTimeout(() => window.location.href = '/admin/admin.html', 500);
      else if (user.role === 'staff') setTimeout(() => window.location.href = '/staff/staff.html', 500);
      else setTimeout(() => window.location.reload(), 500);
    } else { 
      const err=await res.json(); 
      if (window.toast) toast.error(err.message || 'Login failed');
    }
  } catch(e) { 
    if (window.toast) toast.error('Cannot connect to server!');
  } finally {
    hideLoading();
  }
}

async function register() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirmPassword').value;
  if(!name||!email||!password) {
    if (window.toast) toast.error('Please fill all fields');
    return;
  }
  if(password!==confirm) {
    if (window.toast) toast.error('Passwords do not match');
    return;
  }
  if(password.length<6) {
    if (window.toast) toast.error('Password must be at least 6 characters');
    return;
  }
  try {
    showLoading();
    const res = await fetch(`${API_URL}/users/register`, { 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body:JSON.stringify({name,email,password,role:'customer'}) 
    });
    if(res.ok) { 
      if (window.toast) toast.success('Registration successful! Please login.');
      closeSignupModal(); 
      openLoginModal(); 
    } else { 
      const err=await res.json(); 
      if (window.toast) toast.error(err.error || 'Registration failed');
    }
  } catch(e) { 
    if (window.toast) toast.error('Cannot connect to server!');
  } finally {
    hideLoading();
  }
}

// ==================== LANGUAGE & CURRENCY ====================
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
  const cat = document.querySelector('.category-btn.active')?.dataset.category || 'all';
  renderProducts(cat);
  renderSlider();
  if (window.toast) toast.success(`Language changed to ${lang.toUpperCase()}`);
}

function setCurrency(currency) {
  currentCurrency = currency;
  localStorage.setItem('shopCurrency', currency);
  if (typeof window.onCurrencyChange === 'function') window.onCurrencyChange();
  const cat = document.querySelector('.category-btn.active')?.dataset.category || 'all';
  renderProducts(cat);
  if (window.toast) toast.success(`Currency changed to ${currency}`);
}

// ==================== INITIALIZATION ====================
window.onLanguageChange = () => { 
  const cat = document.querySelector('.category-btn.active')?.dataset.category || 'all'; 
  renderProducts(cat); 
  renderSlider(); 
};

window.onCurrencyChange = () => { 
  const cat = document.querySelector('.category-btn.active')?.dataset.category || 'all'; 
  renderProducts(cat); 
};

// ==================== HÀM initPage ====================
let pageInitialized = false;

window.initPage = async () => {
  if (pageInitialized) {
    console.log('Page already initialized, skipping...');
    return;
  }
  pageInitialized = true;
  
  const savedLang = localStorage.getItem('shopLanguage');
  if (savedLang && translations[savedLang]) currentLanguage = savedLang;
  const savedCurr = localStorage.getItem('shopCurrency');
  if (savedCurr === 'VND') setCurrency('VND');
  else setCurrency('USD');
  
  await Promise.all([
    window.loadProducts(),
    window.loadBanners()
  ]);
  
  if (window.products && window.products.length > 0) {
    renderProducts(document.querySelector('.category-btn.active')?.dataset.category || 'all');
  }
  
  if (window.banners && window.banners.length > 0) {
    renderSlider();
  } else {
    renderSliderFallback();
  }
  
  await loadWishlistStatus();
  setupCategoryFilter();
  setupStickyNav();
  setupEventListeners();
  setupModalHandlers();
  // Section nổi bật + theo thành viên, và xử lý ?search= (đặt CUỐI vì loadWishlistStatus render lại grid)
  renderHomeSections();
  applySearchFromURL();
};

// Cập nhật lại section khi đổi tiền tệ/ngôn ngữ
const _origCurrencyChange = window.onCurrencyChange;
window.onCurrencyChange = () => { if (typeof _origCurrencyChange === 'function') _origCurrencyChange(); renderHomeSections(); };

function setupEventListeners() {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const sliderContainer = document.querySelector('.slider-container');
  
  if (prevBtn) {
    const newPrevBtn = prevBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    newPrevBtn.addEventListener('click', () => { 
      prevSlide(); 
      stopAutoSlide(); 
      startAutoSlide(); 
    });
  }
  
  if (nextBtn) {
    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    newNextBtn.addEventListener('click', () => { 
      nextSlide(); 
      stopAutoSlide(); 
      startAutoSlide(); 
    });
  }
  
  if (sliderContainer) {
    const newContainer = sliderContainer.cloneNode(true);
    sliderContainer.parentNode.replaceChild(newContainer, sliderContainer);
    newContainer.addEventListener('mouseenter', stopAutoSlide);
    newContainer.addEventListener('mouseleave', startAutoSlide);
  }
}

function setupModalHandlers() {
  if (!window.modalHandlersSetup) {
    document.getElementById('closeLoginModal')?.addEventListener('click', closeLoginModal);
    document.getElementById('closeSignupModal')?.addEventListener('click', closeSignupModal);
    document.getElementById('showSignupBtn')?.addEventListener('click', (e) => { 
      e.preventDefault(); 
      closeLoginModal(); 
      openSignupModal(); 
    });
    document.getElementById('showLoginBtn')?.addEventListener('click', (e) => { 
      e.preventDefault(); 
      closeSignupModal(); 
      openLoginModal(); 
    });
    document.getElementById('doLoginBtn')?.addEventListener('click', login);
    document.getElementById('doRegisterBtn')?.addEventListener('click', register);
    
    window.addEventListener('click', (e) => { 
      if(e.target === document.getElementById('loginModal')) closeLoginModal(); 
      if(e.target === document.getElementById('signupModal')) closeSignupModal(); 
    });
    
    window.modalHandlersSetup = true;
  }
}

// Prevent multiple DOMContentLoaded listeners
if (!window._domReadyExecuted) {
  window._domReadyExecuted = true;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { 
      if(window.initPage) window.initPage(); 
    });
  } else if(window.initPage) {
    window.initPage();
  }
}
