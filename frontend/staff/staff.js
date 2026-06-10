const API_URL = '/api';
let authToken = null;
let currentUser = null;
let allProducts = [];
let allOrders = [];
let allBanners = [];
let allCoupons = [];
let allPosts = [];
let currentLanguage = localStorage.getItem('preferredLanguage') || 'vi';
let currentCurrency = 'USD';
let currentPage = 'dashboard';

const exchangeRates = { USD: 1, VND: 25500 };
const currencySymbols = { USD: '$', VND: '₫' };

// Chuẩn hóa URL ảnh: bỏ host localhost cũ -> đường dẫn tương đối (chạy đúng local & hosting)
function getImageUrl(path) {
  if (!path) return '';
  path = String(path).replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return path.replace('/uploads', '/image');
  if (path.startsWith('/')) return path;
  return '/' + path;
}

const translations = {
  vi: {
    dashboard: 'Dashboard', products: 'Sản phẩm', banners: 'Banner', orders: 'Đơn hàng',
    coupons: 'Mã giảm giá', posts: 'Bài viết', reports: 'Báo cáo', total_revenue: 'Tổng doanh thu',
    pending_orders: 'Đơn chờ', products_count: 'Sản phẩm', view_all: 'Xem tất cả',
    search: 'Tìm kiếm...', add: 'Thêm', edit: 'Sửa', delete: 'Xóa', view: 'Xem',
    save: 'Lưu', cancel: 'Hủy', order_id: 'Mã đơn', customer: 'Khách hàng', total: 'Tổng',
    status: 'Trạng thái', date: 'Ngày', pending: 'Chờ xử lý', processing: 'Đang xử lý',
    shipped: 'Đã gửi', delivered: 'Đã giao', cancelled: 'Đã hủy', product_name: 'Tên SP',
    price: 'Giá', category: 'Danh mục', stock: 'Tồn kho', image: 'Ảnh',
    coupon_code: 'Mã code', discount: 'Giảm', min_order: 'Đơn tối thiểu',
    used: 'Đã dùng', expiry: 'Hạn dùng', unlimited: 'Vô hạn', never: 'Không giới hạn',
    actions: 'Thao tác', title: 'Tiêu đề', subtitle: 'Phụ đề', order: 'Thứ tự',
    active: 'Kích hoạt', customers: 'Khách hàng', completed_orders: 'Đơn hoàn thành',
    avg_order: 'Giá trị TB/đơn'
  },
  en: {
    dashboard: 'Dashboard', products: 'Products', banners: 'Banners', orders: 'Orders',
    coupons: 'Coupons', posts: 'Posts', reports: 'Reports', total_revenue: 'Total Revenue',
    pending_orders: 'Pending Orders', products_count: 'Products', view_all: 'View All',
    search: 'Search...', add: 'Add', edit: 'Edit', delete: 'Delete', view: 'View',
    save: 'Save', cancel: 'Cancel', order_id: 'Order ID', customer: 'Customer',
    total: 'Total', status: 'Status', date: 'Date', pending: 'Pending',
    processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered',
    cancelled: 'Cancelled', product_name: 'Product Name', price: 'Price',
    category: 'Category', stock: 'Stock', image: 'Image', coupon_code: 'Code',
    discount: 'Discount', min_order: 'Min Order', used: 'Used', expiry: 'Expiry',
    unlimited: 'Unlimited', never: 'Never', actions: 'Actions', title: 'Title',
    subtitle: 'Subtitle', order: 'Order', active: 'Active', customers: 'Customers',
    completed_orders: 'Completed', avg_order: 'Avg Order'
  },
  ko: {
    dashboard: '대시보드', products: '상품', banners: '배너', orders: '주문',
    coupons: '쿠폰', posts: '게시물', reports: '보고서', total_revenue: '총 매출',
    pending_orders: '대기 주문', products_count: '상품 수', view_all: '전체보기',
    search: '검색...', add: '추가', edit: '수정', delete: '삭제', view: '보기',
    save: '저장', cancel: '취소', order_id: '주문번호', customer: '고객',
    total: '합계', status: '상태', date: '날짜', pending: '대기',
    processing: '처리중', shipped: '발송됨', delivered: '배송완료',
    cancelled: '취소됨', product_name: '상품명', price: '가격',
    category: '카테고리', stock: '재고', image: '이미지', coupon_code: '코드',
    discount: '할인', min_order: '최소주문', used: '사용됨', expiry: '만료일',
    unlimited: '무제한', never: '없음', actions: '작업', title: '제목',
    subtitle: '부제목', order: '순서', active: '활성', customers: '고객',
    completed_orders: '완료됨', avg_order: '평균 주문'
  },
  ja: {
    dashboard: 'ダッシュボード', products: '商品', banners: 'バナー', orders: '注文',
    coupons: 'クーポン', posts: '投稿', reports: 'レポート', total_revenue: '総売上',
    pending_orders: '保留中', products_count: '商品数', view_all: '全て表示',
    search: '検索...', add: '追加', edit: '編集', delete: '削除', view: '表示',
    save: '保存', cancel: 'キャンセル', order_id: '注文ID', customer: '顧客',
    total: '合計', status: 'ステータス', date: '日付', pending: '保留',
    processing: '処理中', shipped: '発送済', delivered: '配達完了',
    cancelled: 'キャンセル', product_name: '商品名', price: '価格',
    category: 'カテゴリー', stock: '在庫', image: '画像', coupon_code: 'コード',
    discount: '割引', min_order: '最小注文', used: '使用済', expiry: '有効期限',
    unlimited: '無制限', never: 'なし', actions: '操作', title: 'タイトル',
    subtitle: 'サブタイトル', order: '順序', active: 'アクティブ', customers: '顧客',
    completed_orders: '完了', avg_order: '平均注文'
  }
};

function t(key) {
  return translations[currentLanguage]?.[key] || translations.en[key] || key;
}

function convertPrice(usd) {
  if (!usd) usd = 0;
  const val = usd * (exchangeRates[currentCurrency] || 1);
  const sym = currencySymbols[currentCurrency] || '$';
  return currentCurrency === 'VND' ? `${sym}${Math.round(val).toLocaleString()}` : `${sym}${val.toFixed(2)}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);
}

function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.style.cssText = `position:fixed;bottom:32px;right:32px;background:${type === 'error' ? '#dc2626' : type === 'warning' ? '#d97706' : '#0f172a'};color:white;padding:12px 20px;border-radius:40px;z-index:9999;font-size:14px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,.15);`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✗' : ''}</span> ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showLoading() {
  const el = document.getElementById('globalLoading');
  if (el) el.style.display = 'flex';
}

function hideLoading() {
  const el = document.getElementById('globalLoading');
  if (el) el.style.display = 'none';
}

async function fetchWithAuth(url, options = {}) {
  authToken = localStorage.getItem('authToken');
  const opts = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${authToken}`
    }
  };
  const res = await fetch(url, opts);
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    showToast('Session expired, please login again', 'error');
    setTimeout(() => showLoginScreen(), 1500);
    throw new Error('Unauthorized');
  }
  return res;
}

// ========== UPLOAD ẢNH ==========
async function uploadFile(file, type) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetchWithAuth(`${API_URL}/upload?type=${type}`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url;
}

// Gắn nút "Chọn ảnh" -> tải lên -> lưu URL vào input ẩn + hiện preview
function setupImageUpload(btnId, fileId, previewId, hiddenId, type) {
  const btn = document.getElementById(btnId), file = document.getElementById(fileId);
  const preview = document.getElementById(previewId), hidden = document.getElementById(hiddenId);
  if (!btn || !file) return;
  btn.onclick = () => file.click();
  file.onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (preview) preview.innerHTML = '<small>Đang tải ảnh...</small>';
    try {
      const url = await uploadFile(f, type);
      if (hidden) hidden.value = url;
      const src = (typeof getImageUrl === 'function') ? getImageUrl(url) : url;
      if (preview) preview.innerHTML = isVideoUrl(url)
        ? `<video src="${src}" controls style="max-width:200px;border-radius:10px;border:1px solid var(--border);"></video>`
        : `<img src="${src}" style="max-width:160px;border-radius:10px;border:1px solid var(--border);">`;
      showToast('Đã tải lên');
    } catch (err) {
      if (preview) preview.innerHTML = '<small style="color:#dc2626">Tải ảnh thất bại</small>';
      if (err.message !== 'Unauthorized') showToast('Tải ảnh thất bại', 'error');
    }
  };
}

// Hiện preview ảnh sẵn có (khi mở form sửa)
function showImagePreview(previewId, url) {
  const preview = document.getElementById(previewId);
  if (!preview) return;
  if (!url) { preview.innerHTML = ''; return; }
  const src = (typeof getImageUrl === 'function') ? getImageUrl(url) : url;
  preview.innerHTML = isVideoUrl(url)
    ? `<video src="${src}" controls style="max-width:200px;border-radius:10px;border:1px solid var(--border);"></video>`
    : `<img src="${src}" style="max-width:160px;border-radius:10px;border:1px solid var(--border);">`;
}

async function loadData() {
  if (!authToken) return;
  showLoading();
  try {
    const [productsRes, ordersRes, bannersRes, couponsRes, postsRes] = await Promise.all([
      fetch(`${API_URL}/products`),
      fetchWithAuth(`${API_URL}/orders`),
      fetch(`${API_URL}/banners`),
      fetchWithAuth(`${API_URL}/coupons`),
      fetchWithAuth(`${API_URL}/posts/admin/all`)
    ]);
    const productsData = await productsRes.json();
    const ordersData = await ordersRes.json();
    const bannersData = await bannersRes.json();
    const couponsData = await couponsRes.json();
    const postsData = await postsRes.json();
    allProducts = Array.isArray(productsData) ? productsData : (productsData.products || []);
    allOrders = Array.isArray(ordersData) ? ordersData : (ordersData.orders || []);
    allBanners = Array.isArray(bannersData) ? bannersData : (bannersData.banners || []);
    allCoupons = Array.isArray(couponsData) ? couponsData : (couponsData.coupons || []);
    allPosts = Array.isArray(postsData) ? postsData : (postsData.posts || []);
  } catch (err) {
    if (err.message !== 'Unauthorized') showToast('Failed to load data', 'error');
  } finally {
    hideLoading();
  }
}

// ========== AUTH ==========
async function doLogin(username, password) {
  showLoading();
  try {
    const res = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Invalid credentials');
    }
    const data = await res.json();
    if (data.user.role !== 'staff' && data.user.role !== 'admin') {
      throw new Error('You do not have staff access');
    }
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUserId', currentUser._id);
    document.getElementById('staffName').innerText = currentUser.name;
    hideLoginScreen();
    await loadData();
    showPage('dashboard');
    showToast(`Welcome ${currentUser.name}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

function doLogout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUserId');
  authToken = null;
  currentUser = null;
  showLoginScreen();
}

function showLoginScreen() {
  const adminContainer = document.querySelector('.admin-container');
  const loginScreen = document.getElementById('loginScreen');
  if (adminContainer) adminContainer.style.display = 'none';
  if (loginScreen) loginScreen.style.display = 'flex';
}

function hideLoginScreen() {
  const adminContainer = document.querySelector('.admin-container');
  const loginScreen = document.getElementById('loginScreen');
  if (adminContainer) adminContainer.style.display = 'flex';
  if (loginScreen) loginScreen.style.display = 'none';
}

async function checkLogin() {
  authToken = localStorage.getItem('authToken');
  if (!authToken) {
    showLoginScreen();
    return false;
  }
  showLoading();
  try {
    const userId = localStorage.getItem('currentUserId');
    const res = await fetch(`${API_URL}/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error('invalid-token');
    currentUser = await res.json();
    if (currentUser.role !== 'staff' && currentUser.role !== 'admin') {
      showToast('You do not have staff access', 'error');
      setTimeout(() => showLoginScreen(), 1500);
      return false;
    }
    document.getElementById('staffName').innerText = currentUser.name;
    hideLoginScreen();
    await loadData();
    showPage('dashboard');
    return true;
  } catch (e) {
    localStorage.removeItem('authToken');
    authToken = null;
    showLoginScreen();
    return false;
  } finally {
    hideLoading();
  }
}

// ========== PRODUCTS ==========
// ==================== MEDIA (nhiều ảnh + video) & PHÂN LOẠI (options) ====================
let productMediaList = [];   // [{url, type:'image'|'video'}]
let productOptionsList = []; // [{name, values:[]}]
function isVideoUrl(u){ return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(u || ''); }
function pImgUrl(u){ return (typeof getImageUrl === 'function') ? getImageUrl(u) : u; }

function renderProductMedia() {
  const box = document.getElementById('productMediaPreview');
  if (!box) return;
  box.innerHTML = productMediaList.map((m, i) => {
    const src = pImgUrl(m.url);
    const thumb = m.type === 'video'
      ? `<video src="${src}" muted style="width:74px;height:74px;object-fit:cover;border-radius:8px;border:1px solid #ddd;"></video>`
      : `<img src="${src}" style="width:74px;height:74px;object-fit:cover;border-radius:8px;border:1px solid #ddd;">`;
    const tag = i === 0 ? '<span style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.6);color:#fff;font-size:9px;text-align:center;border-radius:0 0 8px 8px;">Đại diện</span>' : '';
    return `<div style="position:relative;width:74px;height:74px;">${thumb}${tag}<button type="button" onclick="removeProductMedia(${i})" title="Xóa" style="position:absolute;top:-7px;right:-7px;background:#dc2626;color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:12px;line-height:1;">×</button></div>`;
  }).join('') || '<small style="color:#888">Chưa có ảnh/video nào</small>';
  const firstImg = productMediaList.find(m => m.type === 'image');
  const imgInput = document.getElementById('productImage');
  if (imgInput) imgInput.value = firstImg ? firstImg.url : (productMediaList[0] ? productMediaList[0].url : '');
}
window.removeProductMedia = (i) => { productMediaList.splice(i, 1); renderProductMedia(); };

function renderProductOptions() {
  const box = document.getElementById('productOptionsEditor');
  if (!box) return;
  box.innerHTML = productOptionsList.map((o, i) => `
    <div style="display:flex;gap:6px;margin-bottom:6px;align-items:center;">
      <input class="form-input" style="flex:0 0 32%;" placeholder="Tên (VD: Size)" value="${(o.name||'').replace(/"/g,'&quot;')}" oninput="updateOptionName(${i}, this.value)">
      <input class="form-input" style="flex:1;" placeholder="Giá trị, cách nhau dấu phẩy (VD: S, M, L)" value="${(o.values||[]).join(', ').replace(/"/g,'&quot;')}" oninput="updateOptionValues(${i}, this.value)">
      <button type="button" onclick="removeProductOption(${i})" class="btn-delete" style="flex:0 0 auto;padding:6px 10px;">×</button>
    </div>`).join('') || '<small style="color:#888">Chưa có phân loại. VD: Size = S,M,L · Màu = Đỏ,Xanh</small>';
}
window.updateOptionName = (i, v) => { if (productOptionsList[i]) productOptionsList[i].name = v; };
window.updateOptionValues = (i, v) => { if (productOptionsList[i]) productOptionsList[i].values = v.split(',').map(s => s.trim()).filter(Boolean); };
window.removeProductOption = (i) => { productOptionsList.splice(i, 1); renderProductOptions(); };

// ── Media nhiều ảnh + video cho BÀI VIẾT ──
let postMediaList = [];
function renderPostMedia() {
  const box = document.getElementById('postMediaPreview');
  if (!box) return;
  box.innerHTML = postMediaList.map((m, i) => {
    const src = pImgUrl(m.url);
    const thumb = m.type === 'video'
      ? `<video src="${src}" muted style="width:74px;height:74px;object-fit:cover;border-radius:8px;border:1px solid #ddd;"></video>`
      : `<img src="${src}" style="width:74px;height:74px;object-fit:cover;border-radius:8px;border:1px solid #ddd;">`;
    const tag = i === 0 ? '<span style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.6);color:#fff;font-size:9px;text-align:center;border-radius:0 0 8px 8px;">Đại diện</span>' : '';
    return `<div style="position:relative;width:74px;height:74px;">${thumb}${tag}<button type="button" onclick="removePostMedia(${i})" style="position:absolute;top:-7px;right:-7px;background:#dc2626;color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:12px;line-height:1;">×</button></div>`;
  }).join('') || '<small style="color:#888">Chưa có ảnh/video nào</small>';
  const firstImg = postMediaList.find(m => m.type === 'image');
  const imgInput = document.getElementById('postImage');
  if (imgInput) imgInput.value = firstImg ? firstImg.url : '';
}
window.removePostMedia = (i) => { postMediaList.splice(i, 1); renderPostMedia(); };

async function saveProduct(editingId) {
  const data = {
    name: document.getElementById('productName').value.trim(),
    price: parseFloat(document.getElementById('productPrice').value),
    stock: parseInt(document.getElementById('productStock').value),
    category: document.getElementById('productCategory').value,
    member: document.getElementById('productMember')?.value || '',
    featured: document.getElementById('productFeatured')?.checked || false,
    image: (productMediaList.find(m => m.type === 'image') || productMediaList[0] || {}).url || document.getElementById('productImage').value.trim() || '',
    images: productMediaList.filter(m => m.type === 'image').map(m => m.url),
    youtubeLink: document.getElementById('productYoutube')?.value.trim() || '',
    videoLinks: [
      ...((document.getElementById('productVideoLinks')?.value || '').split(/[\n,]/).map(s => s.trim()).filter(Boolean)),
      ...productMediaList.filter(m => m.type === 'video').map(m => m.url)
    ],
    options: productOptionsList.filter(o => (o.name || '').trim() && (o.values || []).length).map(o => ({ name: o.name.trim(), values: o.values })),
    specifications: {
      type: document.getElementById('specType')?.value.trim() || '',
      brand: document.getElementById('specBrand')?.value.trim() || '',
      country: document.getElementById('specCountry')?.value.trim() || '',
      size: document.getElementById('specSize')?.value.trim() || '',
      weight: document.getElementById('specWeight')?.value.trim() || '',
      material: document.getElementById('specMaterial')?.value.trim() || ''
    },
    preorder: document.getElementById('productPreorder').checked,
    hanteo: document.getElementById('productHanteo').checked
  };
  if (!data.name || isNaN(data.price) || data.price <= 0) {
    showToast('Please enter valid name and price', 'error');
    return;
  }
  showLoading();
  try {
    let url = `${API_URL}/products`, method = 'POST';
    if (editingId) {
      url = `${API_URL}/products/${editingId}`;
      method = 'PUT';
    }
    const res = await fetchWithAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      closeProductModal();
      await loadData();
      renderProducts();
      showToast(editingId ? 'Product updated' : 'Product created');
    } else {
      showToast('Failed to save product', 'error');
    }
  } catch (e) {
    if (e.message !== 'Unauthorized') showToast('Connection error', 'error');
  } finally {
    hideLoading();
  }
}

async function deleteProduct(id) {
  if (confirm('Delete this product?')) {
    showLoading();
    try {
      await fetchWithAuth(`${API_URL}/products/${id}`, { method: 'DELETE' });
      await loadData();
      renderProducts();
      showToast('Product deleted');
    } catch (e) {
      if (e.message !== 'Unauthorized') showToast('Delete failed', 'error');
    } finally {
      hideLoading();
    }
  }
}

function editProduct(id) {
  const p = allProducts.find(x => x._id === id);
  if (p) {
    document.getElementById('productModalTitle').innerText = 'Edit Product';
    document.getElementById('productName').value = p.name;
    document.getElementById('productPrice').value = p.price;
    document.getElementById('productStock').value = p.stock;
    document.getElementById('productCategory').value = p.category;
    const mEl = document.getElementById('productMember'); if (mEl) mEl.value = p.member || '';
    const fEl = document.getElementById('productFeatured'); if (fEl) fEl.checked = p.featured || false;
    document.getElementById('productImage').value = p.image || '';
    productMediaList = [];
    (p.images && p.images.length ? p.images : (p.image ? [p.image] : [])).forEach(u => { if (u) productMediaList.push({ url: u, type: isVideoUrl(u) ? 'video' : 'image' }); });
    (p.videoLinks || []).forEach(u => { if (u && isVideoUrl(u)) productMediaList.push({ url: u, type: 'video' }); });
    const ytEl = document.getElementById('productYoutube'); if (ytEl) ytEl.value = p.youtubeLink || '';
    const vlEl = document.getElementById('productVideoLinks'); if (vlEl) vlEl.value = (p.videoLinks || []).filter(u => !isVideoUrl(u)).join('\n');
    productOptionsList = (p.options || []).map(o => ({ name: o.name || '', values: [...(o.values || [])] }));
    renderProductMedia();
    renderProductOptions();
    const sp = p.specifications || {};
    ['Type','Brand','Country','Size','Weight','Material'].forEach(k => { const el = document.getElementById('spec' + k); if (el) el.value = sp[k.toLowerCase()] || ''; });
    document.getElementById('productPreorder').checked = p.preorder || false;
    document.getElementById('productHanteo').checked = p.hanteo || false;
    window._editingProductId = p._id;
    document.getElementById('productModal').style.display = 'flex';
  } else {
    window._editingProductId = null;
  }
}

function closeProductModal() {
  document.getElementById('productModal').style.display = 'none';
  window._editingProductId = null;
}

function renderProducts() {
  document.getElementById('pageContent').innerHTML = `
    <div class="toolbar">
      <h2>${t('products')}</h2>
      <div style="display:flex;gap:12px;">
        <input id="productSearch" class="search-input" placeholder="${t('search')}">
        <select id="productCatFilter" class="filter-select">
          <option value="all">All Categories</option>
          <option value="Album">Album</option>
          <option value="Card">Card</option>
          <option value="Áo">Áo (Clothing)</option>
          <option value="Sản phẩm liên quan">Sản phẩm liên quan</option>
        </select>
        <button id="addProductBtn" class="btn-primary">+ ${t('add')}</button>
      </div>
    </div>
    <div class="section-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr><th>${t('image')}</th><th>${t('product_name')}</th><th>${t('price')}</th><th>${t('category')}</th><th>${t('stock')}</th><th>${t('actions')}</th></tr>
          </thead>
          <tbody id="productsTableBody"></tbody>
        </table>
      </div>
    </div>
    <div id="productModal" class="modal">
      <div class="modal-content" style="max-width:560px;">
        <div class="modal-header"><h3 id="productModalTitle">${t('add')} ${t('products')}</h3><span class="close" onclick="closeProductModal()">&times;</span></div>
        <div class="modal-body">
          <div class="form-group"><label>${t('product_name')} *</label><input id="productName" class="form-input"></div>
          <div class="form-row-2">
            <div class="form-group"><label>${t('price')} (USD) *</label><input id="productPrice" type="number" class="form-input" step="0.01"></div>
            <div class="form-group"><label>${t('stock')}</label><input id="productStock" type="number" class="form-input" value="10"></div>
          </div>
          <div class="form-row-2">
            <div class="form-group"><label>${t('category')}</label><select id="productCategory" class="form-input"><option value="Album">Album</option><option value="Card">Card</option><option value="Áo">Áo (Clothing)</option><option value="Sản phẩm liên quan">Sản phẩm liên quan</option></select></div>
            <div class="form-group"><label>Thành viên</label><select id="productMember" class="form-input"><option value="">— Không / Nhóm —</option><option value="OHYUL">OHYUL</option><option value="RYUL">RYUL</option><option value="WOOJIN">WOOJIN</option><option value="LOUIS">LOUIS</option><option value="GROUP">GROUP (cả nhóm)</option></select></div>
          </div>
          <div class="form-group"><label>Ảnh & Video (có thể chọn nhiều)</label><button type="button" class="btn-secondary" id="productUploadBtn">+ Thêm ảnh/video</button><input type="file" id="productFileInput" accept="image/*,video/*" multiple style="display:none"><div id="productMediaPreview" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;"></div><input type="hidden" id="productImage"><small style="color:#888;display:block;margin-top:4px;">Ảnh đầu là ảnh đại diện. Hỗ trợ nhiều ảnh + video.</small></div>
          <div class="form-group"><label>Phân loại (Size, Màu... giống Shopee)</label><div id="productOptionsEditor"></div><button type="button" class="btn-secondary" id="addOptionBtn" style="margin-top:8px;">+ Thêm phân loại</button></div>
          <div class="form-group"><label>Link video / nhúng — YouTube, TikTok, Facebook, Zalo (mỗi link 1 dòng)</label><textarea id="productVideoLinks" class="form-input" rows="3" placeholder="https://youtube.com/watch?v=...&#10;https://tiktok.com/@user/video/..."></textarea></div>
          <input type="hidden" id="productYoutube">
          <div class="form-group"><label>Thông số kỹ thuật</label>
            <div class="form-row-2"><input id="specType" class="form-input" placeholder="Loại (Type)"><input id="specBrand" class="form-input" placeholder="Thương hiệu (Brand)"></div>
            <div class="form-row-2" style="margin-top:10px"><input id="specCountry" class="form-input" placeholder="Xuất xứ (Country)"><input id="specSize" class="form-input" placeholder="Kích thước (Size)"></div>
            <div class="form-row-2" style="margin-top:10px"><input id="specWeight" class="form-input" placeholder="Trọng lượng (Weight)"><input id="specMaterial" class="form-input" placeholder="Chất liệu (Material)"></div>
          </div>
          <div class="checkbox-group"><label><input type="checkbox" id="productPreorder"> Pre-order</label><label><input type="checkbox" id="productHanteo"> Hanteo Chart</label><label><input type="checkbox" id="productFeatured"> Nổi bật</label></div>
        </div>
        <div class="modal-footer"><button class="btn-secondary" onclick="closeProductModal()">${t('cancel')}</button><button class="btn-primary" id="saveProductBtn">${t('save')}</button></div>
      </div>
    </div>
  `;
  const filter = () => {
    const search = document.getElementById('productSearch')?.value.toLowerCase() || '';
    const cat = document.getElementById('productCatFilter')?.value || 'all';
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(search) && (cat === 'all' || p.category === cat));
    document.getElementById('productsTableBody').innerHTML = filtered.map(p => `
      <tr>
        <td><img src="${p.image || 'https://picsum.photos/48/48'}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;"></td>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td>${convertPrice(p.price)}</td>
        <td><span class="status-badge status-delivered">${p.category}</span></td>
        <td>${p.stock}</td>
        <td><button class="btn-edit" onclick="editProduct('${p._id}')">${t('edit')}</button> <button class="btn-delete" onclick="deleteProduct('${p._id}')">${t('delete')}</button></td>
      </tr>
    `).join('');
  };
  document.getElementById('addProductBtn').onclick = () => {
    window._editingProductId = null;
    document.getElementById('productModalTitle').innerText = `${t('add')} ${t('products')}`;
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = 10;
    document.getElementById('productCategory').value = 'Album';
    const mEl = document.getElementById('productMember'); if (mEl) mEl.value = '';
    const fEl = document.getElementById('productFeatured'); if (fEl) fEl.checked = false;
    document.getElementById('productImage').value = '';
    productMediaList = [];
    productOptionsList = [];
    renderProductMedia();
    renderProductOptions();
    const vlEl = document.getElementById('productVideoLinks'); if (vlEl) vlEl.value = '';
    const ytEl = document.getElementById('productYoutube'); if (ytEl) ytEl.value = '';
    ['specType','specBrand','specCountry','specSize','specWeight','specMaterial'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('productPreorder').checked = false;
    document.getElementById('productHanteo').checked = false;
    document.getElementById('productModal').style.display = 'flex';
  };
  document.getElementById('saveProductBtn').onclick = () => saveProduct(window._editingProductId);
  const _pUp = document.getElementById('productUploadBtn'), _pFile = document.getElementById('productFileInput');
  if (_pUp && _pFile) {
    _pUp.onclick = () => _pFile.click();
    _pFile.onchange = async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      showToast('Đang tải lên...');
      for (const file of files) {
        try { const url = await uploadFile(file, 'products'); productMediaList.push({ url, type: file.type.startsWith('video') ? 'video' : 'image' }); renderProductMedia(); }
        catch (err) { if (err.message !== 'Unauthorized') showToast('Tải lỗi: ' + file.name, 'error'); }
      }
      _pFile.value = '';
      showToast('Đã tải lên ' + files.length + ' tệp');
    };
  }
  const _addOpt = document.getElementById('addOptionBtn');
  if (_addOpt) _addOpt.onclick = () => { productOptionsList.push({ name: '', values: [] }); renderProductOptions(); };
  document.getElementById('productSearch')?.addEventListener('keyup', filter);
  document.getElementById('productCatFilter')?.addEventListener('change', filter);
  filter();
}

// ========== BANNERS ==========
async function saveBanner(editingId) {
  const data = {
    title: document.getElementById('bannerTitle').value.trim(),
    subtitle: document.getElementById('bannerSubtitle').value.trim(),
    image: document.getElementById('bannerImage').value.trim(),
    buttonText: (document.getElementById('bannerButtonText')?.value.trim()) || 'SHOP NOW',
    buttonLink: bannerButtonLinkValue(),
    order: parseInt(document.getElementById('bannerOrder').value) || 0,
    active: document.getElementById('bannerActive').checked
  };
  if (!data.title) {
    showToast('Please enter banner title', 'error');
    return;
  }
  showLoading();
  try {
    let url = `${API_URL}/banners`, method = 'POST';
    if (editingId) {
      url = `${API_URL}/banners/${editingId}`;
      method = 'PUT';
    }
    const res = await fetchWithAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      closeBannerModal();
      await loadData();
      renderBanners();
      showToast(editingId ? 'Banner updated' : 'Banner created');
    } else {
      showToast('Failed to save banner', 'error');
    }
  } catch (e) {
    if (e.message !== 'Unauthorized') showToast('Connection error', 'error');
  } finally {
    hideLoading();
  }
}

async function deleteBanner(id) {
  if (confirm('Delete this banner?')) {
    showLoading();
    try {
      await fetchWithAuth(`${API_URL}/banners/${id}`, { method: 'DELETE' });
      await loadData();
      renderBanners();
      showToast('Banner deleted');
    } catch (e) {
      if (e.message !== 'Unauthorized') showToast('Delete failed', 'error');
    } finally {
      hideLoading();
    }
  }
}

function editBanner(id) {
  const b = allBanners.find(x => x._id === id);
  if (b) {
    document.getElementById('bannerTitle').value = b.title || '';
    document.getElementById('bannerSubtitle').value = b.subtitle || '';
    document.getElementById('bannerImage').value = b.image || '';
    showImagePreview('bannerPreview', b.image);
    const btEl = document.getElementById('bannerButtonText'); if (btEl) btEl.value = b.buttonText || 'SHOP NOW';
    setBannerLinkFromUrl(b.buttonLink || '');
    document.getElementById('bannerOrder').value = b.order || 0;
    document.getElementById('bannerActive').checked = b.active !== false;
    window._editingBannerId = b._id;
    document.getElementById('bannerModal').style.display = 'flex';
  } else {
    window._editingBannerId = null;
  }
}

function closeBannerModal() {
  document.getElementById('bannerModal').style.display = 'none';
  window._editingBannerId = null;
}

// Đổi loại link -> hiện ô tương ứng (sản phẩm / danh mục / URL)
function bannerLinkTypeChange() {
  const ty = document.getElementById('bannerLinkType')?.value;
  const show = (id, on) => { const el = document.getElementById(id); if (el) el.style.display = on ? '' : 'none'; };
  show('bannerLinkProductWrap', ty === 'product');
  show('bannerLinkCategoryWrap', ty === 'category');
  show('bannerLinkCustomWrap', ty === 'custom');
}
window.bannerLinkTypeChange = bannerLinkTypeChange;

// Đổ danh sách TẤT CẢ sản phẩm vào dropdown
function populateBannerProducts(selectedId) {
  const sel = document.getElementById('bannerLinkProduct');
  if (!sel) return;
  sel.innerHTML = (allProducts || []).map(p => `<option value="${p._id}" ${p._id === selectedId ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('') || '<option value="">(chưa có sản phẩm)</option>';
}

// Tính buttonLink từ lựa chọn
function bannerButtonLinkValue() {
  const ty = document.getElementById('bannerLinkType')?.value;
  if (ty === 'product') { const id = document.getElementById('bannerLinkProduct')?.value; return id ? `/crud/product-detail.html?id=${id}` : '#'; }
  if (ty === 'category') { return `/?category=${encodeURIComponent(document.getElementById('bannerLinkCategory').value)}`; }
  return (document.getElementById('bannerLinkCustom')?.value.trim()) || '#';
}

// Khôi phục lựa chọn từ buttonLink khi sửa
function setBannerLinkFromUrl(link) {
  link = link || '';
  let ty = 'product', pid = '', cat = '', custom = '';
  if (link.includes('product-detail.html?id=')) { ty = 'product'; pid = (link.split('id=')[1] || '').split('&')[0]; }
  else if (link.includes('category=')) { ty = 'category'; cat = decodeURIComponent((link.split('category=')[1] || '').split('&')[0]); }
  else if (link && link !== '#') { ty = 'custom'; custom = link; }
  const tEl = document.getElementById('bannerLinkType'); if (tEl) tEl.value = ty;
  populateBannerProducts(pid);
  if (cat) { const c = document.getElementById('bannerLinkCategory'); if (c) c.value = cat; }
  const cu = document.getElementById('bannerLinkCustom'); if (cu) cu.value = custom;
  bannerLinkTypeChange();
}

function renderBanners() {
  document.getElementById('pageContent').innerHTML = `
    <div class="toolbar">
      <h2>${t('banners')}</h2>
      <button id="addBannerBtn" class="btn-primary">+ ${t('add')}</button>
    </div>
    <div class="banners-grid" id="bannersGrid"></div>
    <div id="bannerModal" class="modal">
      <div class="modal-content" style="max-width:540px;">
        <div class="modal-header"><h3>${t('banners')}</h3><span class="close" onclick="closeBannerModal()">&times;</span></div>
        <div class="modal-body">
          <div class="form-group"><label>${t('title')}</label><input id="bannerTitle" class="form-input"></div>
          <div class="form-group"><label>${t('subtitle')}</label><input id="bannerSubtitle" class="form-input"></div>
          <div class="form-group"><label>Ảnh hoặc Video (1 tệp)</label><button type="button" class="btn-secondary" id="bannerUploadBtn">Chọn ảnh/video từ máy</button><input type="file" id="bannerFileInput" accept="image/*,video/*" style="display:none"><div id="bannerPreview" style="margin-top:8px;"></div><input type="hidden" id="bannerImage"></div>
          <div class="form-group"><label>Chữ trên nút</label><input id="bannerButtonText" class="form-input" placeholder="SHOP NOW" value="SHOP NOW"></div>
          <div class="form-group"><label>Nút bấm dẫn tới</label><select id="bannerLinkType" class="form-input" onchange="bannerLinkTypeChange()"><option value="product">Sản phẩm</option><option value="category">Danh mục</option><option value="custom">Tùy chỉnh (URL)</option></select></div>
          <div class="form-group" id="bannerLinkProductWrap"><label>Chọn sản phẩm</label><select id="bannerLinkProduct" class="form-input"></select></div>
          <div class="form-group" id="bannerLinkCategoryWrap" style="display:none"><label>Chọn danh mục</label><select id="bannerLinkCategory" class="form-input"><option value="Album">Album</option><option value="Card">Card</option><option value="Áo">Áo (Clothing)</option><option value="Sản phẩm liên quan">Sản phẩm liên quan</option></select></div>
          <div class="form-group" id="bannerLinkCustomWrap" style="display:none"><label>URL tùy chỉnh</label><input id="bannerLinkCustom" class="form-input" placeholder="https://..."></div>
          <div class="form-group"><label>${t('order')}</label><input id="bannerOrder" type="number" class="form-input" value="0"></div>
          <div class="checkbox-group"><label><input type="checkbox" id="bannerActive" checked> ${t('active')}</label></div>
        </div>
        <div class="modal-footer"><button class="btn-secondary" onclick="closeBannerModal()">${t('cancel')}</button><button class="btn-primary" id="saveBannerBtn">${t('save')}</button></div>
      </div>
    </div>
  `;
  function renderList() {
    const grid = document.getElementById('bannersGrid');
    if (!allBanners.length) {
      grid.innerHTML = '<div class="empty-message">No banners available</div>';
      return;
    }
    grid.innerHTML = allBanners.map(b => `
      <div class="banner-card">
        <div class="banner-media"><img src="${b.image || 'https://picsum.photos/400/200'}" onerror="this.src='https://picsum.photos/400/200'"></div>
        <div class="banner-info"><h4>${escapeHtml(b.title)}</h4><p>${escapeHtml(b.subtitle || '')}</p></div>
        <div class="banner-actions"><button class="btn-edit" onclick="editBanner('${b._id}')">${t('edit')}</button><button class="btn-delete" onclick="deleteBanner('${b._id}')">${t('delete')}</button></div>
      </div>
    `).join('');
  }
  document.getElementById('addBannerBtn').onclick = () => {
    window._editingBannerId = null;
    document.getElementById('bannerTitle').value = '';
    document.getElementById('bannerSubtitle').value = '';
    document.getElementById('bannerImage').value = '';
    showImagePreview('bannerPreview', '');
    const btEl = document.getElementById('bannerButtonText'); if (btEl) btEl.value = 'SHOP NOW';
    document.getElementById('bannerLinkType').value = 'product';
    populateBannerProducts('');
    document.getElementById('bannerLinkCustom').value = '';
    bannerLinkTypeChange();
    document.getElementById('bannerOrder').value = 0;
    document.getElementById('bannerActive').checked = true;
    document.getElementById('bannerModal').style.display = 'flex';
  };
  document.getElementById('saveBannerBtn').onclick = () => saveBanner(window._editingBannerId);
  setupImageUpload('bannerUploadBtn', 'bannerFileInput', 'bannerPreview', 'bannerImage', 'banners');
  populateBannerProducts('');
  bannerLinkTypeChange();
  renderList();
}

// ========== ORDERS ==========
async function updateOrderStatus(orderId, status) {
  showLoading();
  try {
    const res = await fetchWithAuth(`${API_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      await loadData();
      renderOrders();
      showToast(`Status updated to ${status}`);
    } else {
      showToast('Failed to update status', 'error');
    }
  } catch (e) {
    if (e.message !== 'Unauthorized') showToast('Connection error', 'error');
  } finally {
    hideLoading();
  }
}

function viewOrderDetail(id) {
  const o = allOrders.find(x => x._id === id);
  if (!o) return;
  document.getElementById('orderDetailBody').innerHTML = `
    <div style="margin-bottom:20px;">
      <div class="detail-row"><strong>Order ID:</strong> ${o.orderId || o._id.slice(-8)}</div>
      <div class="detail-row"><strong>Customer:</strong> ${escapeHtml(o.customerName)}</div>
      <div class="detail-row"><strong>Email:</strong> ${escapeHtml(o.customerEmail)}</div>
      <div class="detail-row"><strong>Phone:</strong> ${escapeHtml(o.customerPhone || '-')}</div>
      <div class="detail-row"><strong>Address:</strong> ${escapeHtml(o.shippingAddress?.street || o.address || '-')}</div>
      <div class="detail-row"><strong>Total:</strong> ${convertPrice(o.total)}</div>
      <div class="detail-row"><strong>Status:</strong> <span class="status-badge status-${o.status}">${t(o.status)}</span></div>
      <div class="detail-row"><strong>Date:</strong> ${new Date(o.date).toLocaleString()}</div>
    </div>
    <div><strong>Items:</strong></div>
    <div style="border:1px solid var(--border);border-radius:12px;margin-top:8px;">
      ${o.items.map((item, i) => `<div style="padding:12px;${i < o.items.length - 1 ? 'border-bottom:1px solid var(--border);' : ''}">${escapeHtml(item.name)} x ${item.quantity} = ${convertPrice(item.price * item.quantity)}</div>`).join('')}
      <div style="padding:12px;background:var(--surface2);font-weight:700;">Total: ${convertPrice(o.total)}</div>
    </div>
    <div style="margin-top:20px;">
      <strong>Update Status:</strong>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
        ${['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => `<button onclick="updateOrderStatus('${o._id}','${s}');closeOrderDetailModal();" class="btn-secondary" style="padding:6px 14px;font-size:12px;">${t(s)}</button>`).join('')}
      </div>
    </div>
  `;
  document.getElementById('orderDetailModal').style.display = 'flex';
}

function closeOrderDetailModal() {
  document.getElementById('orderDetailModal').style.display = 'none';
}

function renderOrders() {
  document.getElementById('pageContent').innerHTML = `
    <div class="toolbar">
      <h2>${t('orders')}</h2>
      <div style="display:flex;gap:12px;">
        <input id="orderSearch" class="search-input" placeholder="${t('search')}">
        <select id="orderStatusFilter" class="filter-select">
          <option value="all">${t('all')}</option>
          <option value="pending">${t('pending')}</option>
          <option value="processing">${t('processing')}</option>
          <option value="shipped">${t('shipped')}</option>
          <option value="delivered">${t('delivered')}</option>
          <option value="cancelled">${t('cancelled')}</option>
        </select>
      </div>
    </div>
    <div class="section-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead><tr><th>${t('order_id')}</th><th>${t('customer')}</th><th>${t('total')}</th><th>${t('status')}</th><th>${t('date')}</th><th>${t('actions')}</th></tr></thead>
          <tbody id="ordersTableBody"></tbody>
        </table>
      </div>
    </div>
    <div id="orderDetailModal" class="modal">
      <div class="modal-content" style="max-width:680px;">
        <div class="modal-header"><h3>${t('order_detail')}</h3><span class="close" onclick="closeOrderDetailModal()">&times;</span></div>
        <div class="modal-body" id="orderDetailBody"></div>
        <div class="modal-footer"><button class="btn-secondary" onclick="closeOrderDetailModal()">${t('close')}</button></div>
      </div>
    </div>
  `;
  const filter = () => {
    const search = document.getElementById('orderSearch')?.value.toLowerCase() || '';
    const status = document.getElementById('orderStatusFilter')?.value || 'all';
    const filtered = allOrders.filter(o => (status === 'all' || o.status === status) && (o.customerName?.toLowerCase().includes(search) || (o.orderId || '').toLowerCase().includes(search)));
    document.getElementById('ordersTableBody').innerHTML = filtered.map(o => `
      <tr>
        <td><strong>${o.orderId || o._id.slice(-8)}</strong></td>
        <td>${escapeHtml(o.customerName)}</td>
        <td>${convertPrice(o.total)}</td>
        <td><span class="status-badge status-${o.status}">${t(o.status)}</span></td>
        <td>${new Date(o.date).toLocaleDateString()}</td>
        <td><button class="btn-view" onclick="viewOrderDetail('${o._id}')">${t('view')}</button> <select class="status-select-inline" data-id="${o._id}" style="padding:4px 8px;border:1px solid var(--border);border-radius:8px;">${['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${t(s)}</option>`).join('')}</select></td>
      </tr>
    `).join('');
    document.querySelectorAll('.status-select-inline').forEach(sel => {
      sel.onchange = () => updateOrderStatus(sel.dataset.id, sel.value);
    });
  };
  document.getElementById('orderSearch')?.addEventListener('keyup', filter);
  document.getElementById('orderStatusFilter')?.addEventListener('change', filter);
  filter();
}

// ========== COUPONS (localStorage) ==========
function saveCouponsToLocal() {
  localStorage.setItem('staff_coupons', JSON.stringify(allCoupons));
}

function renderCoupons() {
  document.getElementById('pageContent').innerHTML = `
    <div class="toolbar"><h2>${t('coupons')}</h2><button id="addCouponBtn" class="btn-primary">+ ${t('add')}</button></div>
    <div class="section-card"><div class="table-responsive"><table class="data-table"><thead><tr><th>${t('coupon_code')}</th><th>${t('discount')}</th><th>${t('min_order')}</th><th>${t('used')}</th><th>${t('expiry')}</th><th>${t('actions')}</th></tr></thead><tbody id="couponsTbody"></tbody></table></div></div>
    <div id="couponModal" class="modal"><div class="modal-content" style="max-width:500px;"><div class="modal-header"><h3 id="couponModalTitle">${t('add')} ${t('coupons')}</h3><span class="close" onclick="closeCouponModal()">&times;</span></div><div class="modal-body"><div class="form-group"><label>${t('coupon_code')}</label><input id="couponCode" class="form-input" style="text-transform:uppercase;"></div><div class="form-group"><label>${t('discount_type')}</label><select id="couponType" class="form-input"><option value="percentage">Percentage (%)</option><option value="fixed">Fixed Amount ($)</option></select></div><div class="form-row-2"><div class="form-group"><label>${t('discount_value')}</label><input id="couponDiscountValue" type="number" class="form-input" step="0.01"></div><div class="form-group"><label>${t('min_order')} (USD)</label><input id="couponMinOrder" type="number" class="form-input" value="0"></div></div><div class="form-group"><label>${t('expiry')}</label><input id="couponExpiry" type="date" class="form-input"></div></div><div class="modal-footer"><button class="btn-secondary" onclick="closeCouponModal()">${t('cancel')}</button><button class="btn-primary" id="saveCouponBtn">${t('save')}</button></div></div></div>
  `;
  function renderList() {
    const tbody = document.getElementById('couponsTbody');
    tbody.innerHTML = allCoupons.map(c => `
      <tr>
        <td><code style="background:var(--surface2);padding:4px 10px;border-radius:6px;">${c.code}</code></td>
        <td>${c.discountType === 'percentage' ? c.discountValue + '%' : convertPrice(c.discountValue)}</td>
        <td>${c.minOrder > 0 ? convertPrice(c.minOrder) : '-'}</td>
        <td>${c.usedCount || 0}</td>
        <td>${c.expiry ? new Date(c.expiry).toLocaleDateString() : t('unlimited')}</td>
        <td><button class="btn-edit" onclick="editCoupon('${c._id}')">${t('edit')}</button> <button class="btn-delete" onclick="deleteCoupon('${c._id}')">${t('delete')}</button></td>
      </tr>
    `).join('');
  }
  window.editCoupon = (id) => {
    const c = allCoupons.find(x => x._id === id);
    if (c) {
      document.getElementById('couponModalTitle').innerText = 'Edit Coupon';
      document.getElementById('couponCode').value = c.code;
      document.getElementById('couponCode').readOnly = true;
      document.getElementById('couponType').value = c.discountType;
      document.getElementById('couponDiscountValue').value = c.discountValue;
      document.getElementById('couponMinOrder').value = c.minOrder || 0;
      document.getElementById('couponExpiry').value = c.expiry ? c.expiry.slice(0, 10) : '';
      window._editingCouponId = c._id;
      document.getElementById('couponModal').style.display = 'flex';
    }
  };
  window.deleteCoupon = (id) => {
    if (confirm('Delete this coupon?')) {
      allCoupons = allCoupons.filter(c => c._id !== id);
      saveCouponsToLocal();
      renderList();
      showToast('Coupon deleted');
    }
  };
  document.getElementById('addCouponBtn').onclick = () => {
    window._editingCouponId = null;
    document.getElementById('couponModalTitle').innerText = 'Add Coupon';
    document.getElementById('couponCode').value = '';
    document.getElementById('couponCode').readOnly = false;
    document.getElementById('couponType').value = 'percentage';
    document.getElementById('couponDiscountValue').value = '';
    document.getElementById('couponMinOrder').value = 0;
    document.getElementById('couponExpiry').value = '';
    document.getElementById('couponModal').style.display = 'flex';
  };
  document.getElementById('saveCouponBtn').onclick = () => {
    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    const discountValue = parseFloat(document.getElementById('couponDiscountValue').value);
    const minOrder = parseFloat(document.getElementById('couponMinOrder').value) || 0;
    const expiry = document.getElementById('couponExpiry').value;
    if (!code || isNaN(discountValue)) {
      showToast('Please fill all fields', 'error');
      return;
    }
    const data = {
      discountType: document.getElementById('couponType').value,
      discountValue,
      minOrder,
      expiry: expiry ? new Date(expiry).toISOString() : null,
      usedCount: 0
    };
    if (window._editingCouponId) {
      const idx = allCoupons.findIndex(c => c._id === window._editingCouponId);
      if (idx !== -1) allCoupons[idx] = { ...allCoupons[idx], ...data };
    } else {
      if (allCoupons.find(c => c.code === code)) {
        showToast('Coupon code already exists', 'error');
        return;
      }
      allCoupons.push({ _id: 'coupon_' + Date.now(), code, ...data });
    }
    saveCouponsToLocal();
    closeCouponModal();
    renderList();
    showToast('Coupon saved');
  };
  renderList();
}

function closeCouponModal() {
  document.getElementById('couponModal').style.display = 'none';
  window._editingCouponId = null;
}

// ========== POSTS ==========
const POST_CAT = { news: 'News', event: 'Event', guide: 'Guide', review: 'Review', announcement: 'Announcement', update: 'Update' };

function renderPosts() {
  document.getElementById('pageContent').innerHTML = `
    <div class="toolbar"><h2>${t('posts')}</h2><div style="display:flex;gap:.6rem;"><select id="postStatusFilter" class="filter-select"><option value="all">Tất cả</option><option value="published">Đã xuất bản</option><option value="draft">Bản nháp</option></select><button id="addPostBtn" class="btn-primary">+ Bài viết mới</button></div></div>
    <div class="section-card"><div class="table-responsive"><table class="data-table"><thead><tr><th>Ảnh</th><th>Tiêu đề</th><th>Danh mục</th><th>Trạng thái</th><th>Lượt xem</th><th>Ngày</th><th>Thao tác</th></tr></thead><tbody id="postsTbody"></tbody></table></div></div>
    <div id="postModal" class="modal"><div class="modal-content" style="max-width:680px;"><div class="modal-header"><h3 id="postModalTitle">Bài viết</h3><span class="close" onclick="closePostModal()">&times;</span></div><div class="modal-body">
      <div class="form-group"><label>Tiêu đề *</label><input id="postTitle" class="form-input"></div>
      <div class="form-row-2">
        <div class="form-group"><label>Danh mục</label><select id="postCategory" class="form-input"><option value="news">News</option><option value="event">Event</option><option value="guide">Guide</option><option value="review">Review</option><option value="announcement">Announcement</option><option value="update">Update</option></select></div>
        <div class="form-group"><label>Trạng thái</label><select id="postStatus" class="form-input"><option value="published">Xuất bản</option><option value="draft">Nháp</option></select></div>
      </div>
      <div class="form-group"><label>Ảnh & Video (có thể chọn nhiều)</label><button type="button" class="btn-secondary" id="postUploadBtn">+ Thêm ảnh/video</button><input type="file" id="postFileInput" accept="image/*,video/*" multiple style="display:none"><div id="postMediaPreview" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;"></div><input type="hidden" id="postImage"><small style="color:#888;display:block;margin-top:4px;">Ảnh đầu là ảnh đại diện.</small></div>
      <div class="form-group"><label>Tags (cách nhau bằng dấu phẩy)</label><input id="postTags" class="form-input" placeholder="kpop, album"></div>
      <div class="form-group"><label>Tóm tắt</label><textarea id="postExcerpt" rows="2" class="form-input"></textarea></div>
      <div class="form-group"><label>Nội dung *</label><textarea id="postContent" rows="8" class="form-input"></textarea></div>
      <div class="form-group"><label>Link video nhúng (mỗi link 1 dòng)</label><textarea id="postVideoLinks" rows="2" class="form-input" placeholder="https://youtube.com/..."></textarea></div>
      <div class="form-row-2"><div class="form-group"><label>Facebook</label><input id="postFacebook" class="form-input"></div><div class="form-group"><label>Zalo</label><input id="postZalo" class="form-input"></div></div>
      <div class="form-row-2"><div class="form-group"><label>TikTok</label><input id="postTiktok" class="form-input"></div><div class="form-group"><label>YouTube</label><input id="postYoutube" class="form-input"></div></div>
    </div><div class="modal-footer"><button class="btn-secondary" onclick="closePostModal()">Hủy</button><button class="btn-primary" id="savePostBtn">Lưu</button></div></div></div>
  `;
  const imgUrl = (u) => u ? (typeof getImageUrl === 'function' ? getImageUrl(u) : u) : 'https://picsum.photos/48/48';
  function renderList() {
    const tbody = document.getElementById('postsTbody');
    const filter = document.getElementById('postStatusFilter')?.value || 'all';
    const data = filter === 'all' ? allPosts : allPosts.filter(p => p.status === filter);
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-message">Chưa có bài viết</td></tr>'; return; }
    tbody.innerHTML = data.map(p => `
      <tr>
        <td><img src="${imgUrl(p.featuredImage)}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;"></td>
        <td><strong>${escapeHtml(p.title)}</strong></td>
        <td>${POST_CAT[p.category] || p.category || ''}</td>
        <td>${p.status === 'published' ? '<span class="status-badge status-delivered">Xuất bản</span>' : '<span class="status-badge status-pending">Nháp</span>'}</td>
        <td>${p.views || 0}</td>
        <td>${new Date(p.publishedAt || p.createdAt).toLocaleDateString('vi-VN')}</td>
        <td><button class="btn-edit" onclick="editPost('${p._id}')">Sửa</button> <button class="btn-delete" onclick="deletePost('${p._id}')">Xóa</button></td>
      </tr>`).join('');
  }
  window.editPost = (id) => {
    const p = allPosts.find(x => x._id === id);
    if (!p) return;
    document.getElementById('postModalTitle').innerText = 'Sửa bài viết';
    document.getElementById('postTitle').value = p.title || '';
    document.getElementById('postCategory').value = p.category || 'news';
    document.getElementById('postStatus').value = p.status || 'published';
    document.getElementById('postImage').value = p.featuredImage || '';
    postMediaList = [];
    (p.images && p.images.length ? p.images : (p.featuredImage ? [p.featuredImage] : [])).forEach(u => { if (u) postMediaList.push({ url: u, type: isVideoUrl(u) ? 'video' : 'image' }); });
    (p.videoLinks || []).forEach(u => { if (u && isVideoUrl(u)) postMediaList.push({ url: u, type: 'video' }); });
    renderPostMedia();
    document.getElementById('postTags').value = (p.tags || []).join(', ');
    document.getElementById('postExcerpt').value = p.excerpt || '';
    document.getElementById('postContent').value = p.content || '';
    document.getElementById('postVideoLinks').value = (p.videoLinks || []).filter(u => !isVideoUrl(u)).join('\n');
    const s = p.socialLinks || {};
    document.getElementById('postFacebook').value = s.facebook || '';
    document.getElementById('postZalo').value = s.zalo || '';
    document.getElementById('postTiktok').value = s.tiktok || '';
    document.getElementById('postYoutube').value = s.youtube || '';
    window._editingPostId = p._id;
    document.getElementById('postModal').style.display = 'flex';
  };
  window.deletePost = async (id) => {
    if (!confirm('Xóa bài viết này?')) return;
    showLoading();
    try { await fetchWithAuth(`${API_URL}/posts/${id}`, { method: 'DELETE' }); await loadData(); renderList(); showToast('Đã xóa bài viết'); }
    catch (e) { if (e.message !== 'Unauthorized') showToast('Xóa thất bại', 'error'); }
    finally { hideLoading(); }
  };
  document.getElementById('addPostBtn').onclick = () => {
    window._editingPostId = null;
    document.getElementById('postModalTitle').innerText = 'Bài viết mới';
    ['postTitle', 'postImage', 'postTags', 'postExcerpt', 'postContent', 'postVideoLinks', 'postFacebook', 'postZalo', 'postTiktok', 'postYoutube'].forEach(i => { const el = document.getElementById(i); if (el) el.value = ''; });
    postMediaList = [];
    renderPostMedia();
    document.getElementById('postCategory').value = 'news';
    document.getElementById('postStatus').value = 'published';
    document.getElementById('postModal').style.display = 'flex';
  };
  document.getElementById('savePostBtn').onclick = savePost;
  const _postUp = document.getElementById('postUploadBtn'), _postFile = document.getElementById('postFileInput');
  if (_postUp && _postFile) {
    _postUp.onclick = () => _postFile.click();
    _postFile.onchange = async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      showToast('Đang tải lên...');
      for (const file of files) {
        try { const url = await uploadFile(file, 'posts'); postMediaList.push({ url, type: file.type.startsWith('video') ? 'video' : 'image' }); renderPostMedia(); }
        catch (err) { if (err.message !== 'Unauthorized') showToast('Tải lỗi: ' + file.name, 'error'); }
      }
      _postFile.value = '';
      showToast('Đã tải lên ' + files.length + ' tệp');
    };
  }
  document.getElementById('postStatusFilter')?.addEventListener('change', renderList);
  renderList();
}

async function savePost() {
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();
  if (!title || !content) { showToast('Vui lòng nhập tiêu đề và nội dung', 'error'); return; }
  const data = {
    title, content,
    category: document.getElementById('postCategory').value,
    status: document.getElementById('postStatus').value,
    featuredImage: (postMediaList.find(m => m.type === 'image') || {}).url || document.getElementById('postImage').value.trim() || '',
    images: postMediaList.filter(m => m.type === 'image').map(m => m.url),
    excerpt: document.getElementById('postExcerpt').value.trim(),
    tags: document.getElementById('postTags').value.split(',').map(s => s.trim()).filter(Boolean),
    videoLinks: [
      ...((document.getElementById('postVideoLinks').value || '').split(/[\n,]/).map(s => s.trim()).filter(Boolean)),
      ...postMediaList.filter(m => m.type === 'video').map(m => m.url)
    ],
    socialLinks: {
      facebook: document.getElementById('postFacebook').value.trim(),
      zalo: document.getElementById('postZalo').value.trim(),
      tiktok: document.getElementById('postTiktok').value.trim(),
      youtube: document.getElementById('postYoutube').value.trim()
    }
  };
  showLoading();
  try {
    let url = `${API_URL}/posts`, method = 'POST';
    if (window._editingPostId) { url = `${API_URL}/posts/${window._editingPostId}`; method = 'PUT'; }
    const res = await fetchWithAuth(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) { closePostModal(); await loadData(); renderPosts(); showToast(window._editingPostId ? 'Đã cập nhật bài viết' : 'Đã tạo bài viết'); }
    else { const e = await res.json(); showToast(e.error || 'Lưu thất bại', 'error'); }
  } catch (e) { if (e.message !== 'Unauthorized') showToast('Lỗi kết nối', 'error'); }
  finally { hideLoading(); }
}

function closePostModal() {
  document.getElementById('postModal').style.display = 'none';
  window._editingPostId = null;
}

// ========== DASHBOARD ==========
function renderDashboard() {
  const totalRevenue = allOrders.reduce((s, o) => s + (o.total || 0), 0);
  const pendingOrders = allOrders.filter(o => o.status === 'pending').length;
  const deliveredOrders = allOrders.filter(o => o.status === 'delivered').length;
  const totalCustomers = new Set(allOrders.map(o => o.customerEmail)).size;
  const avgOrderValue = allOrders.length ? totalRevenue / allOrders.length : 0;
  const statusCount = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
  allOrders.forEach(o => statusCount[o.status]++);
  const catCount = {};
  allProducts.forEach(p => catCount[p.category] = (catCount[p.category] || 0) + 1);
  const topByStock = [...allProducts].sort((a, b) => b.stock - a.stock).slice(0, 5);
  document.getElementById('pageContent').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div><div class="stat-value">${convertPrice(totalRevenue)}</div><div class="stat-label">${t('total_revenue')}</div></div></div>
      <div class="stat-card"><div><div class="stat-value">${pendingOrders}</div><div class="stat-label">${t('pending_orders')}</div></div></div>
      <div class="stat-card"><div><div class="stat-value">${allProducts.length}</div><div class="stat-label">${t('products_count')}</div></div></div>
      <div class="stat-card"><div><div class="stat-value">${totalCustomers}</div><div class="stat-label">${t('customers')}</div></div></div>
      <div class="stat-card"><div><div class="stat-value">${deliveredOrders}</div><div class="stat-label">${t('completed_orders')}</div></div></div>
      <div class="stat-card"><div><div class="stat-value">${convertPrice(avgOrderValue)}</div><div class="stat-label">${t('avg_order')}</div></div></div>
    </div>
    <div class="two-columns">
      <div class="section-card"><div class="card-header"><h3>Recent Orders</h3><button class="link-btn" onclick="showPage('orders')">${t('view_all')}</button></div><div class="table-responsive"><table class="data-table"><thead><tr><th>${t('order_id')}</th><th>${t('customer')}</th><th>${t('total')}</th><th>${t('status')}</th></tr></thead><tbody>${allOrders.slice(0, 5).map(o => `<tr><td><strong>${o.orderId || o._id.slice(-8)}</strong></td><td>${escapeHtml(o.customerName)}</td><td>${convertPrice(o.total)}</td><td><span class="status-badge status-${o.status}">${t(o.status)}</span></td></tr>`).join('') || '<tr><td colspan="4" class="empty-message">No orders</td></tr>'}</tbody></table></div></div>
      <div class="section-card"><div class="card-header"><h3>Top Stock</h3><button class="link-btn" onclick="showPage('products')">${t('view_all')}</button></div><div class="table-responsive"><table class="data-table"><thead><tr><th>${t('product_name')}</th><th>${t('category')}</th><th>${t('stock')}</th></tr></thead><tbody>${topByStock.map(p => `<tr><td>${escapeHtml(p.name)}</td><td>${p.category}</td><td><strong>${p.stock}</strong></td></tr>`).join('') || '<tr><td colspan="3" class="empty-message">No products</td></tr>'}</tbody></table></div></div>
    </div>
    <div class="section-card full-width"><div class="card-header"><h3>Order Status Summary</h3></div><div class="status-grid">
      <div class="status-item"><div class="status-count">${statusCount.pending}</div><div class="status-label status-pending">${t('pending')}</div></div>
      <div class="status-item"><div class="status-count">${statusCount.processing}</div><div class="status-label status-processing">${t('processing')}</div></div>
      <div class="status-item"><div class="status-count">${statusCount.shipped}</div><div class="status-label status-shipped">${t('shipped')}</div></div>
      <div class="status-item"><div class="status-count">${statusCount.delivered}</div><div class="status-label status-delivered">${t('delivered')}</div></div>
      <div class="status-item"><div class="status-count">${statusCount.cancelled}</div><div class="status-label status-cancelled">${t('cancelled')}</div></div>
    </div></div>
  `;
}

// ========== REPORTS ==========
function renderReports() {
  const totalRevenue = allOrders.reduce((s, o) => s + (o.total || 0), 0);
  const deliveredRevenue = allOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
  const avgOrder = allOrders.length ? totalRevenue / allOrders.length : 0;
  const catRevenue = {};
  allOrders.forEach(o => o.items.forEach(item => {
    const prod = allProducts.find(p => p._id === item.productId);
    const cat = prod?.category || 'Unknown';
    catRevenue[cat] = (catRevenue[cat] || 0) + item.price * item.quantity;
  }));
  document.getElementById('pageContent').innerHTML = `
    <div class="toolbar"><h2>Reports</h2><div><button id="exportCsvBtn" class="btn-secondary">Export CSV</button></div></div>
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat-card"><div><div class="stat-value">${convertPrice(totalRevenue)}</div><div class="stat-label">Total Revenue</div></div></div>
      <div class="stat-card"><div><div class="stat-value">${convertPrice(deliveredRevenue)}</div><div class="stat-label">Delivered Revenue</div></div></div>
      <div class="stat-card"><div><div class="stat-value">${convertPrice(avgOrder)}</div><div class="stat-label">Avg Order Value</div></div></div>
    </div>
    <div class="section-card"><div class="card-header"><h3>Revenue by Category</h3></div><div class="category-list">${Object.entries(catRevenue).length === 0 ? '<div class="empty-message">No data</div>' : Object.entries(catRevenue).sort((a, b) => b[1] - a[1]).map(([cat, rev]) => `<div class="category-item"><span>${cat}</span><div class="progress-bar"><div class="progress-fill" style="width: ${Math.min(100, Math.round(rev / Math.max(...Object.values(catRevenue)) * 100))}%"></div></div><span>${convertPrice(rev)}</span></div>`).join('')}</div></div>
    <div class="section-card"><div class="card-header"><h3>Order List</h3></div><div class="table-responsive"><table class="data-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead><tbody>${allOrders.map(o => `<tr><td><strong>${o.orderId || o._id.slice(-8)}</strong></td><td>${escapeHtml(o.customerName)}</td><td>${convertPrice(o.total)}</td><td><span class="status-badge status-${o.status}">${t(o.status)}</span></td><td>${new Date(o.date).toLocaleDateString()}</td></tr>`).join('') || '<tr><td colspan="5" class="empty-message">No orders</td></tr>'}</tbody></table></div></div>
  `;
  document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
    const rows = [['Order ID', 'Customer', 'Email', 'Total', 'Status', 'Date'], ...allOrders.map(o => [o.orderId || o._id, o.customerName, o.customerEmail, o.total, o.status, new Date(o.date).toLocaleDateString()])];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('CSV exported');
  });
}

// ========== PAGE NAVIGATION ==========
function showPage(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
  const titles = { dashboard: 'Dashboard', products: 'Products', banners: 'Banners', orders: 'Orders', coupons: 'Coupons', posts: 'Posts', reports: 'Reports' };
  document.getElementById('pageTitle').innerText = titles[page] || page;
  const renders = { dashboard: renderDashboard, products: renderProducts, banners: renderBanners, orders: renderOrders, coupons: renderCoupons, posts: renderPosts, reports: renderReports };
  renders[page]?.();
}

// ========== INIT ==========
function init() {
  // Gắn click cho các mục menu sidebar (chuyển trang) — TRƯỚC ĐÂY BỊ THIẾU
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.onclick = (e) => { e.preventDefault(); showPage(item.dataset.page); };
  });
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    if (localStorage.getItem('darkMode') === 'true') {
      document.body.classList.add('dark-mode');
      darkModeToggle.innerHTML = '☀️';
    }
    darkModeToggle.onclick = () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('darkMode', isDark);
      darkModeToggle.innerHTML = isDark ? '☀️' : '🌙';
    };
  }
  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.onclick = () => document.querySelector('.sidebar')?.classList.toggle('open');
  }
  const langSelect = document.getElementById('globalLanguageSelect');
  if (langSelect) {
    langSelect.value = currentLanguage;
    langSelect.onchange = (e) => {
      currentLanguage = e.target.value;
      localStorage.setItem('preferredLanguage', currentLanguage);
      if (currentPage) showPage(currentPage);
    };
  }
  const curSelect = document.getElementById('globalCurrencySelect');
  if (curSelect) {
    curSelect.value = currentCurrency;
    curSelect.onchange = (e) => {
      currentCurrency = e.target.value;
      if (currentPage) showPage(currentPage);
    };
  }
  const backToShopBtn = document.getElementById('backToShopBtn');
  if (backToShopBtn) backToShopBtn.onclick = () => window.location.href = '/';
  const staffLogoutBtn = document.getElementById('staffLogoutBtn');
  if (staffLogoutBtn) staffLogoutBtn.onclick = doLogout;
  checkLogin();
}

init();
// ==================== LIVE RELOAD (dev) — tự tải lại khi file thay đổi ====================
(function liveReload(){
  if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return; // chỉ chạy ở dev
  var known = null;
  setInterval(function(){
    fetch('/api/livereload', { cache: 'no-store' })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){ if(!d || typeof d.v==='undefined') return; if(known===null){ known=d.v; return; } if(d.v!==known) location.reload(); })
      .catch(function(){});
  }, 1500);
})();
