const API_URL = '/api';
let authToken = null;
let currentUser = null;
let allUsers = [], allProducts = [], allOrders = [], allBanners = [], allCoupons = [];
let currentLanguage = localStorage.getItem('preferredLanguage') || 'vi';
let currentCurrency = localStorage.getItem('preferredCurrency') || 'USD';
let currentPage = 'dashboard';

// Exchange rates
const exchangeRates = { USD: 1, VND: 25500, KRW: 1350, JPY: 150, CNY: 7.2, MXN: 17 };
const currencySymbols = { USD: '$', VND: '₫', KRW: '₩', JPY: '¥', CNY: '¥', MXN: '$' };

// Translations
const translations = {
  vi: { dashboard:'Dashboard', users:'Người dùng', products:'Sản phẩm', banners:'Banner', orders:'Đơn hàng', coupons:'Mã giảm giá', settings:'Cài đặt', back_to_shop:'Về trang chủ', logout:'Đăng xuất', welcome_back:'Chào mừng trở lại', administrator:'Quản trị viên', total_revenue:'Tổng doanh thu', pending_orders:'Đơn hàng chờ', products_count:'Sản phẩm', users_count:'Người dùng', revenue_chart:'Biểu đồ doanh thu', recent_orders:'Đơn hàng gần đây', top_products:'Sản phẩm bán chạy', view_all:'Xem tất cả', search:'Tìm kiếm...', add:'Thêm', edit:'Sửa', delete:'Xóa', view:'Xem', save:'Lưu', cancel:'Hủy', export_excel:'Xuất Excel', export_pdf:'Xuất PDF', print_invoice:'In hóa đơn', order_id:'Mã đơn', customer:'Khách hàng', email:'Email', total:'Tổng', status:'Trạng thái', date:'Ngày đặt', actions:'Thao tác', pending:'Chờ', processing:'Đang xử lý', shipped:'Đã gửi', delivered:'Đã giao', cancelled:'Đã hủy', product_name:'Tên sản phẩm', price:'Giá', category:'Danh mục', stock:'Tồn kho', preorder:'Đặt trước', hanteo:'Hanteo', image:'Hình ảnh', description:'Mô tả', coupon_code:'Mã code', discount:'Giảm giá', min_order:'Đơn tối thiểu', used:'Đã dùng', expiry:'Hạn', unlimited:'Không giới hạn', never:'Không', role:'Vai trò', customer_role:'Khách hàng', staff_role:'Nhân viên', admin_role:'Quản trị', created_at:'Ngày tạo', avatar:'Ảnh đại diện', name:'Họ tên', change_avatar:'Đổi ảnh đại diện', choose_file:'Chọn ảnh', update_info:'Cập nhật', language:'Ngôn ngữ', currency:'Tiền tệ', save_settings:'Lưu cài đặt', sold:'Đã bán', no_orders:'Chưa có đơn hàng', no_data:'Chưa có dữ liệu', day:'Ngày', week:'Tuần', month:'Tháng', all:'Tất cả', title:'Tiêu đề', subtitle:'Phụ đề', media_type:'Loại Media', order:'Thứ tự', button_text:'Text nút', button_link:'Link nút', discount_type:'Loại giảm giá', discount_value:'Giá trị giảm', usage_limit:'Giới hạn sử dụng', order_detail:'Chi tiết đơn hàng' },
  en: { dashboard:'Dashboard', users:'Users', products:'Products', banners:'Banners', orders:'Orders', coupons:'Coupons', settings:'Settings', back_to_shop:'Back to Shop', logout:'Logout', welcome_back:'Welcome back', administrator:'Administrator', total_revenue:'Total Revenue', pending_orders:'Pending Orders', products_count:'Products', users_count:'Users', revenue_chart:'Revenue Chart', recent_orders:'Recent Orders', top_products:'Top Products', view_all:'View All', search:'Search...', add:'Add', edit:'Edit', delete:'Delete', view:'View', save:'Save', cancel:'Cancel', export_excel:'Export Excel', export_pdf:'Export PDF', print_invoice:'Print Invoice', order_id:'Order ID', customer:'Customer', email:'Email', total:'Total', status:'Status', date:'Date', actions:'Actions', pending:'Pending', processing:'Processing', shipped:'Shipped', delivered:'Delivered', cancelled:'Cancelled', product_name:'Product Name', price:'Price', category:'Category', stock:'Stock', preorder:'Pre-order', hanteo:'Hanteo', image:'Image', description:'Description', coupon_code:'Coupon Code', discount:'Discount', min_order:'Min Order', used:'Used', expiry:'Expiry', unlimited:'Unlimited', never:'Never', role:'Role', customer_role:'Customer', staff_role:'Staff', admin_role:'Admin', created_at:'Created At', avatar:'Avatar', name:'Name', change_avatar:'Change Avatar', choose_file:'Choose File', update_info:'Update Info', language:'Language', currency:'Currency', save_settings:'Save Settings', sold:'Sold', no_orders:'No orders', no_data:'No data', day:'Day', week:'Week', month:'Month', all:'All', title:'Title', subtitle:'Subtitle', media_type:'Media Type', order:'Order', button_text:'Button Text', button_link:'Button Link', discount_type:'Discount Type', discount_value:'Discount Value', usage_limit:'Usage Limit', order_detail:'Order Detail' },
  ko: { dashboard:'대시보드', users:'사용자', products:'상품', banners:'배너', orders:'주문', coupons:'쿠폰', settings:'설정', back_to_shop:'쇼핑 계속하기', logout:'로그아웃', welcome_back:'환영합니다', administrator:'관리자', total_revenue:'총 매출', pending_orders:'대기 주문', products_count:'상품 수', users_count:'사용자 수', revenue_chart:'매출 차트', recent_orders:'최근 주문', top_products:'인기 상품', view_all:'모두 보기', search:'검색...', add:'추가', edit:'수정', delete:'삭제', view:'보기', save:'저장', cancel:'취소', export_excel:'Excel 내보내기', export_pdf:'PDF 내보내기', print_invoice:'송장 인쇄', order_id:'주문번호', customer:'고객', email:'이메일', total:'합계', status:'상태', date:'날짜', actions:'작업', pending:'대기', processing:'처리중', shipped:'발송됨', delivered:'배송완료', cancelled:'취소됨', product_name:'상품명', price:'가격', category:'카테고리', stock:'재고', preorder:'예약주문', hanteo:'한터', image:'이미지', description:'설명', coupon_code:'쿠폰코드', discount:'할인', min_order:'최소주문', used:'사용됨', expiry:'만료일', unlimited:'무제한', never:'없음', role:'역할', customer_role:'고객', staff_role:'직원', admin_role:'관리자', created_at:'생성일', avatar:'아바타', name:'이름', change_avatar:'아바타 변경', choose_file:'파일 선택', update_info:'정보 업데이트', language:'언어', currency:'통화', save_settings:'설정 저장', sold:'판매량', no_orders:'주문 없음', no_data:'데이터 없음', day:'일', week:'주', month:'월', all:'전체', title:'제목', subtitle:'부제목', media_type:'미디어 유형', order:'순서', button_text:'버튼 텍스트', button_link:'버튼 링크', discount_type:'할인 유형', discount_value:'할인 값', usage_limit:'사용 제한', order_detail:'주문 상세' },
  ja: { dashboard:'ダッシュボード', users:'ユーザー', products:'商品', banners:'バナー', orders:'注文', coupons:'クーポン', settings:'設定', back_to_shop:'ショップに戻る', logout:'ログアウト', welcome_back:'おかえりなさい', administrator:'管理者', total_revenue:'総売上', pending_orders:'保留中の注文', products_count:'商品数', users_count:'ユーザー数', revenue_chart:'売上チャート', recent_orders:'最近の注文', top_products:'人気商品', view_all:'すべて表示', search:'検索...', add:'追加', edit:'編集', delete:'削除', view:'表示', save:'保存', cancel:'キャンセル', export_excel:'Excel出力', export_pdf:'PDF出力', print_invoice:'請求書印刷', order_id:'注文ID', customer:'顧客', email:'メール', total:'合計', status:'ステータス', date:'日付', actions:'操作', pending:'保留', processing:'処理中', shipped:'発送済み', delivered:'配達完了', cancelled:'キャンセル', product_name:'商品名', price:'価格', category:'カテゴリー', stock:'在庫', preorder:'予約注文', hanteo:'ハンテオ', image:'画像', description:'説明', coupon_code:'クーポンコード', discount:'割引', min_order:'最小注文', used:'使用済み', expiry:'有効期限', unlimited:'無制限', never:'なし', role:'役割', customer_role:'顧客', staff_role:'スタッフ', admin_role:'管理者', created_at:'作成日', avatar:'アバター', name:'名前', change_avatar:'アバター変更', choose_file:'ファイル選択', update_info:'情報更新', language:'言語', currency:'通貨', save_settings:'設定保存', sold:'販売数', no_orders:'注文なし', no_data:'データなし', day:'日', week:'週', month:'月', all:'すべて', title:'タイトル', subtitle:'サブタイトル', media_type:'メディア種別', order:'順序', button_text:'ボタンテキスト', button_link:'ボタンリンク', discount_type:'割引タイプ', discount_value:'割引額', usage_limit:'使用制限', order_detail:'注文詳細' }
};

function t(key) { return translations[currentLanguage]?.[key] || translations.en[key] || key; }

function convertPrice(usdPrice) { 
  if (usdPrice == null || isNaN(usdPrice)) return `${currencySymbols[currentCurrency] || '$'}0`; 
  const rate = exchangeRates[currentCurrency] || 1; 
  let converted = usdPrice * rate; 
  const symbol = currencySymbols[currentCurrency] || '$'; 
  if (['KRW','VND','JPY','CNY'].includes(currentCurrency)) { 
    converted = Math.round(converted); 
    return `${symbol}${converted.toLocaleString()}`; 
  } 
  return `${symbol}${converted.toFixed(2)}`; 
}

function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, m => m==='&'?'&amp;':m==='<'?'&lt;':'&gt;'); }

function getImageUrl(path) {
  if(!path) return 'https://picsum.photos/400/200?random=1';
  // Bỏ host localhost/127.0.0.1 trong dữ liệu cũ -> đường dẫn tương đối (chạy đúng trên hosting)
  path = path.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
  if(path.startsWith('http')) return path;
  if(path.startsWith('/uploads/')) return path.replace('/uploads', '/image');
  if(path.startsWith('/')) return path;
  return `/${path}`;
}

function showToast(message, type = 'success') {
  if (window.toast) {
    if (type === 'success') window.toast.success(message);
    else if (type === 'error') window.toast.error(message);
    else window.toast.info(message);
  } else alert(message);
}

function showLoading() { const l = document.getElementById('globalLoading'); if (l) l.style.display = 'flex'; }
function hideLoading() { const l = document.getElementById('globalLoading'); if (l) l.style.display = 'none'; }

async function fetchWithAuth(url, options = {}) {
  authToken = localStorage.getItem('authToken');
  const res = await fetch(url, { ...options, headers: { ...options.headers, 'Authorization': `Bearer ${authToken}` } });
  if (res.status === 401 && currentUser) { logout(); throw new Error('Unauthorized'); }
  return res;
}

async function uploadFile(file, type) { 
  const formData = new FormData(); formData.append('file', file); 
  const res = await fetchWithAuth(`/api/upload?type=${type}`, { method: 'POST', body: formData }); 
  if (!res.ok) throw new Error('Upload failed'); 
  const data = await res.json(); return data.url; 
}

// ==================== MEDIA (nhiều ảnh + video) & PHÂN LOẠI (options) ====================
let productMediaList = [];   // [{url, type:'image'|'video'}]
let productOptionsList = []; // [{name, values:[]}]
function isVideoUrl(u){ return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(u || ''); }

function renderProductMedia() {
  const box = document.getElementById('productMediaPreview');
  if (!box) return;
  box.innerHTML = productMediaList.map((m, i) => {
    const src = getImageUrl(m.url);
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
    const src = getImageUrl(m.url);
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

function logout() {
  localStorage.removeItem('authToken'); localStorage.removeItem('currentUserId');
  showToast('Logged out successfully');
  setTimeout(() => window.location.href = '/crud/login.html', 500);
}

async function loadAllData() {
  try {
    const usersRes = await fetchWithAuth(`${API_URL}/users`); allUsers = await usersRes.json();
    const productsRes = await fetch(`${API_URL}/products?limit=500`); const productsData = await productsRes.json(); allProducts = productsData.products || [];
    const ordersRes = await fetchWithAuth(`${API_URL}/orders`); const ordersData = await ordersRes.json(); allOrders = ordersData.orders || [];
    const bannersRes = await fetch(`${API_URL}/banners`); allBanners = await bannersRes.json();
    const couponsRes = await fetchWithAuth(`${API_URL}/coupons`); allCoupons = await couponsRes.json();
    console.log('Data loaded:', { users: allUsers.length, products: allProducts.length, orders: allOrders.length, banners: allBanners.length });
  } catch(e) { console.error(e); showToast('Error loading data: ' + (e.message || 'Unknown'), 'error'); }
}

// ========== GLOBAL MODAL CLOSE FUNCTIONS ==========
window.closeUserModal = function() { const modal = document.getElementById('userModal'); if (modal) modal.style.display = 'none'; };
window.closeProductModal = function() { const modal = document.getElementById('productModal'); if (modal) modal.style.display = 'none'; };
window.closeBannerModal = function() { const modal = document.getElementById('bannerModal'); if (modal) modal.style.display = 'none'; };
window.closeCouponModal = function() { const modal = document.getElementById('couponModal'); if (modal) modal.style.display = 'none'; };
window.closePostModal = function() { const modal = document.getElementById('postModal'); if (modal) modal.style.display = 'none'; };
window.closeOrderDetailModal = function() { const modal = document.getElementById('orderDetailModal'); if (modal) modal.style.display = 'none'; };

// ========== DASHBOARD ==========
function renderDashboard() {
  const totalRevenue = allOrders.reduce((s,o)=>s+(o.total||0),0);
  const pendingOrders = allOrders.filter(o=>o.status==='pending').length;
  const recentOrders = [...allOrders].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  const productSales = {};
  allOrders.forEach(o=>{ if(o.items) o.items.forEach(i=>{ productSales[i.name]=(productSales[i.name]||0)+i.quantity; }); });
  const topProducts = Object.entries(productSales).sort((a,b)=>b[1]-a[1]).slice(0,5);
  let labels = [], data = [];
  const currentPeriod = document.querySelector('.period-btn.active')?.dataset.period || 'week';
  if (currentPeriod==='day') { labels=['6h','9h','12h','15h','18h','21h']; data=[120,340,560,890,670,450]; }
  else if (currentPeriod==='week') { labels=['T2','T3','T4','T5','T6','T7','CN']; data=[1200,1900,1500,2100,1800,2400,2200]; }
  else { labels=['Tuần1','Tuần2','Tuần3','Tuần4']; data=[5800,7200,8900,6500]; }
  
  document.getElementById('pageContent').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon"></div><div><div class="stat-value">${convertPrice(totalRevenue)}</div><div class="stat-label">${t('total_revenue')}</div></div></div>
      <div class="stat-card"><div class="stat-icon"></div><div><div class="stat-value">${pendingOrders}</div><div class="stat-label">${t('pending_orders')}</div></div></div>
      <div class="stat-card"><div class="stat-icon"></div><div><div class="stat-value">${allProducts.length}</div><div class="stat-label">${t('products_count')}</div></div></div>
      <div class="stat-card"><div class="stat-icon"></div><div><div class="stat-value">${allUsers.length}</div><div class="stat-label">${t('users_count')}</div></div></div>
    </div>
    <div class="chart-section"><div class="chart-header"><h2>${t('revenue_chart')}</h2><div class="period-buttons"><button class="period-btn ${currentPeriod==='day'?'active':''}" data-period="day">${t('day')}</button><button class="period-btn ${currentPeriod==='week'?'active':''}" data-period="week">${t('week')}</button><button class="period-btn ${currentPeriod==='month'?'active':''}" data-period="month">${t('month')}</button></div></div><canvas id="revenueChart" height="100"></canvas></div>
    <div class="two-columns">
      <div class="section-card"><div class="section-header"><h3>${t('recent_orders')}</h3><button class="view-all" onclick="showPage('orders')">${t('view_all')} →</button></div><div class="table-responsive"><table class="simple-table"><thead><tr><th>${t('order_id')}</th><th>${t('customer')}</th><th>${t('total')}</th><th>${t('status')}</th></tr></thead><tbody>${recentOrders.map(o=>`<tr><td>#${o.orderId||o._id.slice(-6)}</td><td>${escapeHtml(o.customerName)}</td><td>${convertPrice(o.total)}</td><td><span class="status-badge status-${o.status}">${t(o.status)}</span></td></tr>`).join('')||`<tr><td colspan="4" class="empty-state">${t('no_orders')}</td>`}</tbody></table></div></div>
      <div class="section-card"><div class="section-header"><h3>${t('top_products')}</h3><button class="view-all" onclick="showPage('products')">${t('view_all')} →</button></div><div class="table-responsive"><table class="simple-table"><thead><tr><th>${t('product_name')}</th><th>${t('sold')}</th></tr></thead><tbody>${topProducts.map(([name,qty])=>`<td><td>${escapeHtml(name)}</td><td>${qty}</td></tr>`).join('')||`<td><td colspan="2" class="empty-state">${t('no_data')}</td>`}</tbody></table></div></div>
    </div>
  `;
  const ctx = document.getElementById('revenueChart');
  if(ctx && typeof Chart!=='undefined') {
    const existingChart = Chart.getChart('revenueChart');
    if (existingChart) existingChart.destroy();
    new Chart(ctx.getContext('2d'),{ type:'line', data:{ labels, datasets:[{ label:t('total_revenue'), data, borderColor:'#111111', backgroundColor:'rgba(17,17,17,0.05)', tension:0.3, fill:true, pointBackgroundColor:'#111111', pointRadius:5 }] }, options:{ responsive:true } });
  }
  document.querySelectorAll('.period-btn').forEach(btn=>{ btn.onclick=()=>{ document.querySelectorAll('.period-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); renderDashboard(); }; });
}

// ========== PAGE NAVIGATION ==========
function showPage(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (activeNav) activeNav.classList.add('active');
  const titles = { dashboard: t('dashboard'), users: t('users'), products: t('products'), banners: t('banners'), orders: t('orders'), coupons: t('coupons'), posts: 'Bài viết', reports: 'Báo cáo' };
  const titleEl = document.getElementById('pageTitle'); if (titleEl) titleEl.textContent = titles[page] || 'Dashboard';
  if (page === 'dashboard') renderDashboard();
  else if (page === 'users') renderUsers();
  else if (page === 'products') renderProducts();
  else if (page === 'banners') renderBanners();
  else if (page === 'orders') renderOrders();
  else if (page === 'coupons') renderCoupons();
  else if (page === 'posts') renderPosts();
  else if (page === 'reports') renderReports();
}

// ========== USERS MANAGEMENT ==========
function renderUsers() {
  document.getElementById('pageContent').innerHTML = `
    <div class="toolbar"><h2>${t('users')}</h2><div><input type="text" id="userSearch" class="search-input" placeholder="${t('search')}"><button class="btn-primary" id="addUserBtn" style="margin-left:10px;">+ ${t('add')}</button></div></div>
    <div class="table-container"><table class="simple-table"><thead><tr><th>${t('avatar')}</th><th>${t('name')}</th><th>${t('email')}</th><th>${t('role')}</th><th>${t('created_at')}</th><th>${t('actions')}</th></tr></thead><tbody id="usersTableBody"></tbody></table></div>
    <div id="userModal" class="modal"><div class="modal-content"><div class="modal-header"><h3 id="userModalTitle">${t('add')} ${t('users')}</h3><span class="close" onclick="closeUserModal()">&times;</span></div><div class="modal-body"><div class="form-group"><label>${t('name')}</label><input type="text" id="userName" class="form-input"></div><div class="form-group"><label>${t('email')}</label><input type="email" id="userEmail" class="form-input"></div><div class="form-group"><label>Mật khẩu</label><input type="password" id="userPassword" class="form-input"></div><div class="form-group"><label>${t('role')}</label><select id="userRole" class="form-input"><option value="customer">${t('customer_role')}</option><option value="staff">${t('staff_role')}</option><option value="admin">${t('admin_role')}</option></select></div><div class="form-group"><label>${t('avatar')} URL</label><input type="text" id="userAvatar" class="form-input"></div></div><div class="modal-footer"><button class="btn-secondary" onclick="closeUserModal()">${t('cancel')}</button><button class="btn-primary" id="saveUserBtn">${t('save')}</button></div></div></div>
  `;
  
  let editingUserId = null;
  function renderUserList() {
    const search = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const filtered = allUsers.filter(u => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search));
    const tbody = document.getElementById('usersTableBody');
    if (!filtered.length) { tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${t('no_data')}</td></tr>`; return; }
    tbody.innerHTML = filtered.map(u => `
      <tr>
        <td><img src="${getImageUrl(u.avatar) || 'https://picsum.photos/40/40'}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;"></td>
        <td><strong>${escapeHtml(u.name)}</strong></td>
        <td>${escapeHtml(u.email)}</td>
        <td><select class="role-select" data-id="${u._id}"><option value="customer" ${u.role==='customer'?'selected':''}>${t('customer_role')}</option><option value="staff" ${u.role==='staff'?'selected':''}>${t('staff_role')}</option><option value="admin" ${u.role==='admin'?'selected':''}>${t('admin_role')}</option></select></td>
        <td>${new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
        <td><button class="btn-delete" onclick="deleteUser('${u._id}')">${t('delete')}</button></td>
      </tr>
    `).join('');
    document.querySelectorAll('.role-select').forEach(select => { select.onchange = () => updateUserRole(select.dataset.id, select.value); });
  }
  window.updateUserRole = async (id, role) => {
    try {
      await fetchWithAuth(`${API_URL}/users/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({role}) });
      showToast('Role updated successfully', 'success');
      await loadAllData(); renderUserList();
    } catch(e) { showToast('Failed to update role', 'error'); }
  };
  window.deleteUser = async (id) => {
    if (confirm('Delete this user?')) {
      try {
        await fetchWithAuth(`${API_URL}/users/${id}`, { method:'DELETE' });
        showToast('User deleted', 'success');
        await loadAllData(); renderUserList();
      } catch(e) { showToast('Failed to delete user', 'error'); }
    }
  };
  document.getElementById('addUserBtn').onclick = () => {
    editingUserId = null;
    document.getElementById('userModalTitle').textContent = `${t('add')} ${t('users')}`;
    ['userName','userEmail','userPassword','userAvatar'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('userRole').value = 'customer';
    document.getElementById('userModal').style.display = 'flex';
  };
  document.getElementById('saveUserBtn').onclick = async () => {
    const data = {
      name: document.getElementById('userName').value.trim(),
      email: document.getElementById('userEmail').value.trim(),
      password: document.getElementById('userPassword').value,
      role: document.getElementById('userRole').value,
      avatar: document.getElementById('userAvatar').value
    };
    if (!data.name || !data.email) { showToast('Please fill name and email', 'error'); return; }
    if (!editingUserId && !data.password) { showToast('Please enter password', 'error'); return; }
    try {
      let res;
      if (editingUserId) {
        const update = { name: data.name, role: data.role, avatar: data.avatar };
        if (data.password) update.password = data.password;
        res = await fetchWithAuth(`${API_URL}/users/${editingUserId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(update) });
      } else {
        res = await fetch(`${API_URL}/users/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
      }
      if (res.ok) {
        showToast(editingUserId ? 'User updated' : 'User created', 'success');
        closeUserModal();
        await loadAllData(); renderUserList();
      } else { const err = await res.json(); showToast(err.error || 'Operation failed', 'error'); }
    } catch(e) { showToast('Server error', 'error'); }
  };
  const searchInput = document.getElementById('userSearch'); if (searchInput) searchInput.addEventListener('keyup', renderUserList);
  renderUserList();
}

// ========== PRODUCTS MANAGEMENT ==========
function renderProducts() {
  document.getElementById('pageContent').innerHTML = `
    <div class="toolbar"><h2>${t('products')}</h2><div><input type="text" id="productSearch" class="search-input" placeholder="${t('search')}"><select id="categoryFilter" class="filter-select"><option value="all">${t('all')}</option><option value="Album">Album</option><option value="Card">Card</option><option value="Áo">Áo</option><option value="Sản phẩm liên quan">Sản phẩm liên quan</option></select><button class="btn-primary" id="addProductBtn" style="margin-left:10px;">+ ${t('add')}</button></div></div>
    <div class="table-container"><table class="simple-table"><thead><tr><th>${t('image')}</th><th>${t('product_name')}</th><th>${t('price')}</th><th>${t('category')}</th><th>${t('stock')}</th><th>${t('preorder')}</th><th>${t('hanteo')}</th><th>${t('actions')}</th></tr></thead><tbody id="productsTableBody"></tbody></table></div>
    <div id="productModal" class="modal"><div class="modal-content"><div class="modal-header"><h3 id="productModalTitle">${t('add')} ${t('products')}</h3><span class="close" onclick="closeProductModal()">&times;</span></div><div class="modal-body"><div class="form-group"><label>${t('product_name')}</label><input type="text" id="productName" class="form-input"></div><div class="form-row-2"><div class="form-group"><label>${t('price')}</label><input type="number" id="productPrice" class="form-input" step="0.01"></div><div class="form-group"><label>${t('stock')}</label><input type="number" id="productStock" class="form-input" value="10"></div></div><div class="form-row-2"><div class="form-group"><label>${t('category')}</label><select id="productCategory" class="form-input"><option value="Album">Album</option><option value="Card">Card</option><option value="Áo">Áo</option><option value="Sản phẩm liên quan">Sản phẩm liên quan</option></select></div><div class="form-group"><label>Ảnh & Video (có thể chọn nhiều)</label><div><button type="button" class="btn-secondary" id="productUploadBtn">+ Thêm ảnh/video</button><input type="file" id="productFileInput" accept="image/*,video/*" multiple style="display:none"><div id="productMediaPreview" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;"></div><input type="hidden" id="productImage"></div><small style="color:#888">Ảnh đầu tiên là ảnh đại diện. Hỗ trợ nhiều ảnh + video (mp4/webm).</small></div></div><div class="form-group"><label>${t('description')}</label><textarea id="productDescription" rows="3" class="form-input"></textarea></div><div class="form-group"><label>Link video / nhúng — YouTube, TikTok, Facebook, Zalo (mỗi link 1 dòng)</label><textarea id="productVideoLinks" rows="3" class="form-input" placeholder="https://youtube.com/watch?v=..."></textarea></div><div class="form-group"><label>Thông số kỹ thuật</label><div class="form-row-2"><input id="specType" class="form-input" placeholder="Loại (Type)"><input id="specBrand" class="form-input" placeholder="Thương hiệu (Brand)"></div><div class="form-row-2" style="margin-top:10px"><input id="specCountry" class="form-input" placeholder="Xuất xứ (Country)"><input id="specSize" class="form-input" placeholder="Kích thước (Size)"></div><div class="form-row-2" style="margin-top:10px"><input id="specWeight" class="form-input" placeholder="Trọng lượng (Weight)"><input id="specMaterial" class="form-input" placeholder="Chất liệu (Material)"></div></div><div class="form-group"><label>Phân loại (Size, Màu... giống Shopee)</label><div id="productOptionsEditor"></div><button type="button" class="btn-secondary" id="addOptionBtn" style="margin-top:8px;">+ Thêm phân loại</button></div><div class="form-group"><label>Thành viên</label><select id="productMember" class="form-input"><option value="">— Không / Nhóm —</option><option value="OHYUL">OHYUL</option><option value="RYUL">RYUL</option><option value="WOOJIN">WOOJIN</option><option value="LOUIS">LOUIS</option><option value="GROUP">GROUP (cả nhóm)</option></select></div><div class="checkbox-group"><label><input type="checkbox" id="productPreorder"> ${t('preorder')}</label><label><input type="checkbox" id="productHanteo"> ${t('hanteo')}</label><label><input type="checkbox" id="productFeatured"> Nổi bật</label></div></div><div class="modal-footer"><button class="btn-secondary" onclick="closeProductModal()">${t('cancel')}</button><button class="btn-primary" id="saveProductBtn">${t('save')}</button></div></div></div>
  `;
  let editingProductId = null;
  function filterProducts() {
    const search = document.getElementById('productSearch')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const filtered = allProducts.filter(p => (category === 'all' || p.category === category) && p.name.toLowerCase().includes(search));
    const tbody = document.getElementById('productsTableBody');
    if (!filtered.length) { tbody.innerHTML = `<td><td colspan="8" class="empty-state">${t('no_data')}<\/td><\/tr>`; return; }
    tbody.innerHTML = filtered.map(p => `
      <tr>
        <td><img src="${getImageUrl(p.image) || 'https://picsum.photos/50/50'}" class="product-img" onerror="this.src='https://picsum.photos/50/50'"></td>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td>${convertPrice(p.price)}</td>
        <td>${escapeHtml(p.category)}</td>
        <td class="${p.stock <= 0 ? 'stock-out' : p.stock < 10 ? 'stock-low' : ''}">${p.stock <= 0 ? 'Hết hàng' : p.stock}</td>
        <td>${p.preorder ? '' : ''}</td>
        <td>${p.hanteo ? '' : ''}</td>
        <td><button class="btn-edit" onclick="editProductAdmin('${p._id}')">${t('edit')}</button><button class="btn-delete" onclick="deleteProductAdmin('${p._id}')">${t('delete')}</button></td>
      </tr>
    `).join('');
  }
  window.editProductAdmin = (id) => {
    const p = allProducts.find(p => p._id === id);
    if (p) {
      editingProductId = p._id;
      document.getElementById('productModalTitle').textContent = `${t('edit')} ${t('products')}`;
      document.getElementById('productName').value = p.name;
      document.getElementById('productPrice').value = p.price;
      document.getElementById('productStock').value = p.stock;
      document.getElementById('productCategory').value = p.category;
      const mEl = document.getElementById('productMember'); if (mEl) mEl.value = p.member || '';
      const fEl = document.getElementById('productFeatured'); if (fEl) fEl.checked = p.featured || false;
      document.getElementById('productDescription').value = p.description || '';
      document.getElementById('productVideoLinks').value = (p.videoLinks || []).join('\n');
      const sp = p.specifications || {};
      ['Type','Brand','Country','Size','Weight','Material'].forEach(k => { const el = document.getElementById('spec' + k); if (el) el.value = sp[k.toLowerCase()] || ''; });
      document.getElementById('productPreorder').checked = p.preorder;
      document.getElementById('productHanteo').checked = p.hanteo;
      document.getElementById('productImage').value = p.image || '';
      // Nạp nhiều ảnh + video vào danh sách media
      productMediaList = [];
      (p.images && p.images.length ? p.images : (p.image ? [p.image] : [])).forEach(u => { if (u) productMediaList.push({ url: u, type: isVideoUrl(u) ? 'video' : 'image' }); });
      (p.videoLinks || []).forEach(u => { if (u && isVideoUrl(u)) productMediaList.push({ url: u, type: 'video' }); });
      // Textarea chỉ giữ link nhúng (YouTube/TikTok...), video upload đã nằm trong media
      document.getElementById('productVideoLinks').value = (p.videoLinks || []).filter(u => !isVideoUrl(u)).join('\n');
      // Nạp phân loại
      productOptionsList = (p.options || []).map(o => ({ name: o.name || '', values: [...(o.values || [])] }));
      renderProductMedia();
      renderProductOptions();
      document.getElementById('productModal').style.display = 'flex';
    }
  };
  window.deleteProductAdmin = async (id) => {
    if (confirm('Delete this product?')) {
      try {
        await fetchWithAuth(`${API_URL}/products/${id}`, { method: 'DELETE' });
        showToast('Product deleted', 'success');
        await loadAllData(); filterProducts();
      } catch(e) { showToast('Failed to delete', 'error'); }
    }
  };
  const addBtn = document.getElementById('addProductBtn');
  if (addBtn) {
    addBtn.onclick = () => {
      editingProductId = null;
      document.getElementById('productModalTitle').textContent = `${t('add')} ${t('products')}`;
      ['productName','productPrice','productStock','productDescription','productImage','productVideoLinks','specType','specBrand','specCountry','specSize','specWeight','specMaterial'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      document.getElementById('productCategory').value = 'Album';
      const mEl0 = document.getElementById('productMember'); if (mEl0) mEl0.value = '';
      const fEl0 = document.getElementById('productFeatured'); if (fEl0) fEl0.checked = false;
      document.getElementById('productPreorder').checked = false;
      document.getElementById('productHanteo').checked = false;
      productMediaList = [];
      productOptionsList = [];
      renderProductMedia();
      renderProductOptions();
      document.getElementById('productModal').style.display = 'flex';
    };
  }
  const saveBtn = document.getElementById('saveProductBtn');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      const data = {
        name: document.getElementById('productName').value.trim(),
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        category: document.getElementById('productCategory').value,
        member: document.getElementById('productMember')?.value || '',
        featured: document.getElementById('productFeatured')?.checked || false,
        description: document.getElementById('productDescription').value,
        preorder: document.getElementById('productPreorder').checked,
        hanteo: document.getElementById('productHanteo').checked,
        image: (productMediaList.find(m => m.type === 'image') || productMediaList[0] || {}).url || document.getElementById('productImage').value || '',
        images: productMediaList.filter(m => m.type === 'image').map(m => m.url),
        videoLinks: [
          ...((document.getElementById('productVideoLinks').value || '').split(/[\n,]/).map(s => s.trim()).filter(Boolean)),
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
        }
      };
      if (!data.name || isNaN(data.price)) { showToast('Please fill name and price', 'error'); return; }
      if (data.price <= 0) { showToast('Price must be greater than 0', 'error'); return; }
      try {
        let url = `${API_URL}/products`, method = 'POST';
        if (editingProductId) { url = `${API_URL}/products/${editingProductId}`; method = 'PUT'; }
        const res = await fetchWithAuth(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.ok) {
          showToast(editingProductId ? 'Product updated' : 'Product created', 'success');
          closeProductModal();
          await loadAllData(); filterProducts();
        } else { const err = await res.json(); showToast(err.error || 'Operation failed', 'error'); }
      } catch(e) { showToast('Server error', 'error'); }
    };
  }
  const uploadBtn = document.getElementById('productUploadBtn');
  const fileInput = document.getElementById('productFileInput');
  if (uploadBtn && fileInput) {
    uploadBtn.onclick = () => fileInput.click();
    fileInput.onchange = async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      showToast('Đang tải lên...', 'success');
      for (const file of files) {
        try {
          const url = await uploadFile(file, 'products');
          productMediaList.push({ url, type: file.type.startsWith('video') ? 'video' : 'image' });
          renderProductMedia();
        } catch (err) { showToast('Tải lỗi: ' + file.name, 'error'); }
      }
      fileInput.value = '';
      showToast('Đã tải lên ' + files.length + ' tệp', 'success');
    };
  }
  const addOptionBtn = document.getElementById('addOptionBtn');
  if (addOptionBtn) addOptionBtn.onclick = () => { productOptionsList.push({ name: '', values: [] }); renderProductOptions(); };
  const searchInput = document.getElementById('productSearch'); if (searchInput) searchInput.addEventListener('keyup', filterProducts);
  const filterSelect = document.getElementById('categoryFilter'); if (filterSelect) filterSelect.addEventListener('change', filterProducts);
  filterProducts();
}

// ========== BANNERS MANAGEMENT (ĐÃ SỬA: dùng trường 'image', dropdown cho link) ==========
function renderBanners() {
  // Tạo dropdown cho button link
  let productOptions = '<option value="">-- Chọn sản phẩm/danh mục --</option>';
  productOptions += '<optgroup label="Danh mục">';
  const uniqueCats = [...new Set(allProducts.map(p => p.category))];
  uniqueCats.forEach(cat => {
    productOptions += `<option value="/index.html?category=${encodeURIComponent(cat)}">Danh mục: ${cat}</option>`;
  });
  productOptions += '</optgroup><optgroup label="Sản phẩm">';
  allProducts.forEach(p => {
    productOptions += `<option value="/crud/product-detail.html?id=${p._id}">${escapeHtml(p.name)}</option>`;
  });
  productOptions += '</optgroup>';
  
  document.getElementById('pageContent').innerHTML = `
    <div class="toolbar"><h2>${t('banners')}</h2><button class="btn-primary" id="addBannerBtn">+ ${t('add')}</button></div>
    <div class="banners-grid" id="bannersGrid"></div>
    <div id="bannerModal" class="modal"><div class="modal-content"><div class="modal-header"><h3 id="bannerModalTitle">${t('add')} ${t('banners')}</h3><span class="close" onclick="closeBannerModal()">&times;</span></div><div class="modal-body"><div class="form-group"><label>${t('title')}</label><input type="text" id="bannerTitle" class="form-input"></div><div class="form-group"><label>${t('subtitle')}</label><input type="text" id="bannerSubtitle" class="form-input"></div><div class="form-group"><label>${t('media_type')}</label><select id="bannerMediaType" class="form-input"><option value="image">Hình ảnh</option><option value="video">Video</option></select></div><div class="form-group"><label>${t('image')}</label><div><button type="button" class="btn-secondary" id="bannerUploadBtn">${t('choose_file')}</button><input type="file" id="bannerFileInput" accept="image/*,video/*" style="display:none"><div id="bannerPreview"></div><input type="text" id="bannerImage" class="form-input" placeholder="Hoặc nhập URL"></div></div><div class="form-group"><label>${t('button_text')}</label><input type="text" id="bannerButtonText" class="form-input" value="SHOP NOW"></div><div class="form-group"><label>${t('button_link')} (chọn sản phẩm/danh mục)</label><select id="bannerButtonLink" class="form-input">${productOptions}</select></div><div class="form-group"><label>Hoặc nhập URL tùy chỉnh</label><input type="text" id="bannerButtonLinkCustom" class="form-input" placeholder="https://... (để trống nếu đã chọn ở trên)"></div><div class="form-group"><label>${t('order')}</label><input type="number" id="bannerOrder" class="form-input" value="0"></div><div class="checkbox-group"><label><input type="checkbox" id="bannerActive" checked> ${t('active')}</label></div></div><div class="modal-footer"><button class="btn-secondary" onclick="closeBannerModal()">${t('cancel')}</button><button class="btn-primary" id="saveBannerBtn">${t('save')}</button></div></div></div>
  `;
  
  let editingBannerId = null;
  
  function renderBannersList() {
    const grid = document.getElementById('bannersGrid');
    if (!grid) return;
    if (!allBanners.length) {
      grid.innerHTML = `<div class="empty-state">${t('no_data')}</div>`;
      return;
    }
    grid.innerHTML = allBanners.map(b => {
      const imageUrl = getImageUrl(b.image);
      return `
      <div class="banner-card">
        <div class="banner-media">
          ${b.mediaType === 'video' ? `<video src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;"></video>` : `<img src="${imageUrl}" onerror="this.src='https://picsum.photos/400/200'">`}
          <div class="banner-status ${b.active ? 'active' : ''}">${b.active ? 'Active' : 'Inactive'}</div>
        </div>
        <div class="banner-info">
          <h4>${escapeHtml(b.title)}</h4>
          <p>${escapeHtml(b.subtitle)}</p>
          ${b.buttonText ? `<a href="${b.buttonLink}" target="_blank" style="color:#111;font-weight:500;">${escapeHtml(b.buttonText)} →</a>` : ''}
        </div>
        <div class="banner-actions">
          <button class="btn-edit" onclick="editBannerAdmin('${b._id}')">${t('edit')}</button>
          <button class="btn-delete" onclick="deleteBannerAdmin('${b._id}')">${t('delete')}</button>
        </div>
      </div>
    `}).join('');
  }
  
  window.editBannerAdmin = (id) => {
    const b = allBanners.find(b => b._id === id);
    if (b) {
      editingBannerId = b._id;
      document.getElementById('bannerModalTitle').textContent = `${t('edit')} ${t('banners')}`;
      document.getElementById('bannerTitle').value = b.title || '';
      document.getElementById('bannerSubtitle').value = b.subtitle || '';
      document.getElementById('bannerMediaType').value = b.mediaType || 'image';
      document.getElementById('bannerImage').value = b.image || '';
      document.getElementById('bannerButtonText').value = b.buttonText || '';
      const linkSelect = document.getElementById('bannerButtonLink');
      const linkCustom = document.getElementById('bannerButtonLinkCustom');
      if (linkSelect) {
        linkSelect.value = b.buttonLink || '';
        // Nếu buttonLink không khớp option nào (URL tùy chỉnh) -> đưa vào ô custom
        if (linkCustom) linkCustom.value = (b.buttonLink && linkSelect.value !== b.buttonLink) ? b.buttonLink : '';
      }
      document.getElementById('bannerOrder').value = b.order || 0;
      document.getElementById('bannerActive').checked = b.active !== false;
      const preview = document.getElementById('bannerPreview');
      if (preview && b.image) {
        const mediaUrl = getImageUrl(b.image);
        preview.innerHTML = b.mediaType === 'video' ? `<video src="${mediaUrl}" style="max-width:150px;border-radius:12px;" controls></video>` : `<img src="${mediaUrl}" style="max-width:150px;border-radius:12px;">`;
      } else if (preview) preview.innerHTML = '';
      document.getElementById('bannerModal').style.display = 'flex';
    }
  };
  
  window.deleteBannerAdmin = async (id) => {
    if (confirm('Delete this banner?')) {
      try {
        await fetchWithAuth(`${API_URL}/banners/${id}`, { method: 'DELETE' });
        showToast('Banner deleted', 'success');
        await loadAllData();
        renderBannersList();
      } catch(e) { showToast('Failed to delete', 'error'); }
    }
  };
  
  const addBtn = document.getElementById('addBannerBtn');
  if (addBtn) {
    addBtn.onclick = () => {
      editingBannerId = null;
      document.getElementById('bannerModalTitle').textContent = `${t('add')} ${t('banners')}`;
      document.getElementById('bannerTitle').value = '';
      document.getElementById('bannerSubtitle').value = '';
      document.getElementById('bannerMediaType').value = 'image';
      document.getElementById('bannerImage').value = '';
      document.getElementById('bannerButtonText').value = 'SHOP NOW';
      const linkSelect = document.getElementById('bannerButtonLink');
      if (linkSelect) linkSelect.value = '';
      const linkCustom = document.getElementById('bannerButtonLinkCustom');
      if (linkCustom) linkCustom.value = '';
      document.getElementById('bannerOrder').value = '0';
      document.getElementById('bannerActive').checked = true;
      const preview = document.getElementById('bannerPreview');
      if (preview) preview.innerHTML = '';
      document.getElementById('bannerModal').style.display = 'flex';
    };
  }
  
  const saveBtn = document.getElementById('saveBannerBtn');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      const data = {
        title: document.getElementById('bannerTitle').value,
        subtitle: document.getElementById('bannerSubtitle').value,
        mediaType: document.getElementById('bannerMediaType').value,
        image: document.getElementById('bannerImage').value,
        buttonText: document.getElementById('bannerButtonText').value,
        buttonLink: (document.getElementById('bannerButtonLinkCustom').value.trim()) || document.getElementById('bannerButtonLink').value,
        order: parseInt(document.getElementById('bannerOrder').value) || 0,
        active: document.getElementById('bannerActive').checked
      };
      try {
        let url = `${API_URL}/banners`, method = 'POST';
        if (editingBannerId) { url = `${API_URL}/banners/${editingBannerId}`; method = 'PUT'; }
        const res = await fetchWithAuth(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.ok) {
          showToast(editingBannerId ? 'Banner updated' : 'Banner created', 'success');
          closeBannerModal();
          await loadAllData();
          renderBannersList();
        } else { showToast('Operation failed', 'error'); }
      } catch(e) { showToast('Server error', 'error'); }
    };
  }
  
  const uploadBtn = document.getElementById('bannerUploadBtn');
  const fileInput = document.getElementById('bannerFileInput');
  const preview = document.getElementById('bannerPreview');
  const imageInput = document.getElementById('bannerImage');
  if (uploadBtn && fileInput) {
    uploadBtn.onclick = () => fileInput.click();
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (preview) preview.innerHTML = '<div>Uploading...</div>';
      try {
        const url = await uploadFile(file, 'banners');
        if (imageInput) imageInput.value = url;
        const mediaType = document.getElementById('bannerMediaType').value;
        if (preview) {
          if (mediaType === 'video') {
            preview.innerHTML = `<video src="${getImageUrl(url)}" style="max-width:150px;border-radius:12px;" controls></video><div>✓ Uploaded</div>`;
          } else {
            preview.innerHTML = `<img src="${getImageUrl(url)}" style="max-width:150px;border-radius:12px;"><div>✓ Uploaded</div>`;
          }
        }
        showToast('File uploaded', 'success');
      } catch (err) {
        if (preview) preview.innerHTML = '<div style="color:red">Upload failed</div>';
        showToast('Upload failed', 'error');
      }
    };
  }
  renderBannersList();
}

// ========== ORDERS MANAGEMENT ==========
function renderOrders() {
  document.getElementById('pageContent').innerHTML = `
    <div class="toolbar"><h2>${t('orders')}</h2><div><input type="text" id="orderSearch" class="search-input" placeholder="${t('search')}"><select id="orderStatusFilter" class="filter-select"><option value="all">${t('all')}</option><option value="pending">${t('pending')}</option><option value="processing">${t('processing')}</option><option value="shipped">${t('shipped')}</option><option value="delivered">${t('delivered')}</option><option value="cancelled">${t('cancelled')}</option></select></div></div>
    <div class="table-container"><table class="simple-table"><thead><tr><th>${t('order_id')}</th><th>${t('customer')}</th><th>${t('total')}</th><th>${t('status')}</th><th>${t('date')}</th><th>${t('actions')}</th></tr></thead><tbody id="ordersTableBody"></tbody></table></div>
    <div id="orderDetailModal" class="modal"><div class="modal-content"><div class="modal-header"><h3>${t('order_detail')}</h3><span class="close" onclick="closeOrderDetailModal()">&times;</span></div><div class="modal-body" id="orderDetailBody"></div><div class="modal-footer"><button class="btn-secondary" onclick="closeOrderDetailModal()">${t('close')}</button></div></div></div>
  `;
  
  function filterOrders() {
    const search = document.getElementById('orderSearch')?.value.toLowerCase() || '';
    const status = document.getElementById('orderStatusFilter')?.value || 'all';
    const filtered = allOrders.filter(o => (status === 'all' || o.status === status) && (o.customerName?.toLowerCase().includes(search) || o.orderId?.toLowerCase().includes(search)));
    const tbody = document.getElementById('ordersTableBody');
    if (!filtered.length) { tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${t('no_orders')}</td></tr>`; return; }
    tbody.innerHTML = filtered.map(o => `
      <tr>
        <td>#${o.orderId || o._id.slice(-6)}</td>
        <td>${escapeHtml(o.customerName)}</td>
        <td>${convertPrice(o.total)}</td>
        <td><span class="status-badge status-${o.status}">${t(o.status)}</span></td>
        <td>${new Date(o.date).toLocaleString('vi-VN')}</td>
        <td><button class="btn-view" onclick="viewOrderDetail('${o._id}')">${t('view')}</button> <select class="status-select" data-id="${o._id}" style="margin-left:8px;"><option value="pending" ${o.status==='pending'?'selected':''}>${t('pending')}</option><option value="processing" ${o.status==='processing'?'selected':''}>${t('processing')}</option><option value="shipped" ${o.status==='shipped'?'selected':''}>${t('shipped')}</option><option value="delivered" ${o.status==='delivered'?'selected':''}>${t('delivered')}</option><option value="cancelled" ${o.status==='cancelled'?'selected':''}>${t('cancelled')}</option></select></td>
      </tr>
    `).join('');
    document.querySelectorAll('.status-select').forEach(select => { select.onchange = () => updateOrderStatus(select.dataset.id, select.value); });
  }
  
  window.viewOrderDetail = (orderId) => {
    const order = allOrders.find(o => o._id === orderId);
    if (!order) return;
    let itemsHtml = '';
    order.items.forEach(item => { itemsHtml += `<div><strong>${escapeHtml(item.name)}</strong> x ${item.quantity} = ${convertPrice(item.price * item.quantity)}</div>`; });
    document.getElementById('orderDetailBody').innerHTML = `
      <p><strong>${t('order_id')}:</strong> #${order.orderId || order._id}</p>
      <p><strong>${t('customer')}:</strong> ${escapeHtml(order.customerName)} (${escapeHtml(order.customerEmail)})</p>
      <p><strong>${t('phone')}:</strong> ${order.customerPhone || 'N/A'}</p>
      <p><strong>${t('address')}:</strong> ${order.shippingAddress?.street || 'N/A'}, ${order.shippingAddress?.district || ''}, ${order.shippingAddress?.city || ''}</p>
      <p><strong>${t('total')}:</strong> ${convertPrice(order.total)}</p>
      <p><strong>${t('status')}:</strong> ${t(order.status)}</p>
      <p><strong>${t('date')}:</strong> ${new Date(order.date).toLocaleString()}</p>
      <h4>${t('order_items')}:</h4>${itemsHtml}
    `;
    document.getElementById('orderDetailModal').style.display = 'flex';
  };
  
  async function updateOrderStatus(orderId, status) {
    try {
      await fetchWithAuth(`${API_URL}/orders/${orderId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status}) });
      showToast(`Order status updated to ${status}`, 'success');
      await loadAllData(); filterOrders();
    } catch(e) { showToast('Failed to update status', 'error'); }
  }
  
  document.getElementById('orderSearch')?.addEventListener('keyup', filterOrders);
  document.getElementById('orderStatusFilter')?.addEventListener('change', filterOrders);
  filterOrders();
}

// ========== COUPONS MANAGEMENT ==========
function renderCoupons() {
  document.getElementById('pageContent').innerHTML = `
    <div class="toolbar"><h2>${t('coupons')}</h2><button class="btn-primary" id="addCouponBtn">+ ${t('add')}</button></div>
    <div class="table-container"><table class="simple-table"><thead><tr><th>${t('coupon_code')}</th><th>${t('discount')}</th><th>${t('min_order')}</th><th>${t('used')}</th><th>${t('expiry')}</th><th>${t('actions')}</th></tr></thead><tbody id="couponsTableBody"></tbody></table></div>
    <div id="couponModal" class="modal"><div class="modal-content"><div class="modal-header"><h3 id="couponModalTitle">${t('add')} ${t('coupons')}</h3><span class="close" onclick="closeCouponModal()">&times;</span></div><div class="modal-body"><div class="form-group"><label>${t('coupon_code')}</label><input type="text" id="couponCode" class="form-input" placeholder="VD: SUMMER2024"></div><div class="form-row-2"><div class="form-group"><label>${t('discount_type')}</label><select id="couponDiscountType" class="form-input"><option value="percentage">% Percentage</option><option value="fixed">Fixed Amount</option></select></div><div class="form-group"><label>${t('discount_value')}</label><input type="number" id="couponDiscountValue" class="form-input" step="0.01"></div></div><div class="form-group"><label>${t('min_order')}</label><input type="number" id="couponMinOrder" class="form-input" value="0" step="0.01"></div><div class="form-row-2"><div class="form-group"><label>${t('usage_limit')}</label><input type="number" id="couponUsageLimit" class="form-input" value="1"></div><div class="form-group"><label>${t('expiry')}</label><input type="date" id="couponExpiry" class="form-input"></div></div><div class="checkbox-group"><label><input type="checkbox" id="couponUnlimited"> ${t('unlimited')}</label></div></div><div class="modal-footer"><button class="btn-secondary" onclick="closeCouponModal()">${t('cancel')}</button><button class="btn-primary" id="saveCouponBtn">${t('save')}</button></div></div></div>
  `;
  let editingCouponId = null;
  function renderCouponsList() {
    const tbody = document.getElementById('couponsTableBody');
    if (!allCoupons.length) { tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${t('no_data')}<tr></tr>`; return; }
    tbody.innerHTML = allCoupons.map(c => `
      <tr>
        <td><span class="coupon-code">${escapeHtml(c.code)}</span></td>
        <td>${c.discountType === 'percentage' ? `${c.discountValue}%` : convertPrice(c.discountValue)}</td>
        <td>${c.minOrder > 0 ? convertPrice(c.minOrder) : '₩0'}</td>
        <td><span class="used-badge">${c.usedCount || 0}/${c.usageLimit || '∞'}</span></td>
        <td>${c.expiry ? new Date(c.expiry).toLocaleDateString('vi-VN') : t('never')}</td>
        <td><button class="btn-edit" onclick="editCouponAdmin('${c._id}')">${t('edit')}</button><button class="btn-delete" onclick="deleteCouponAdmin('${c._id}')">${t('delete')}</button></td>
      </tr>
    `).join('');
  }
  window.editCouponAdmin = (id) => {
    const c = allCoupons.find(c => c._id === id);
    if (c) {
      editingCouponId = c._id;
      document.getElementById('couponModalTitle').textContent = `${t('edit')} ${t('coupons')}`;
      document.getElementById('couponCode').value = c.code;
      document.getElementById('couponDiscountType').value = c.discountType || 'percentage';
      document.getElementById('couponDiscountValue').value = c.discountValue;
      document.getElementById('couponMinOrder').value = c.minOrder || 0;
      document.getElementById('couponUsageLimit').value = c.usageLimit || 1;
      document.getElementById('couponExpiry').value = c.expiry ? new Date(c.expiry).toISOString().slice(0,10) : '';
      document.getElementById('couponUnlimited').checked = !c.usageLimit;
      document.getElementById('couponModal').style.display = 'flex';
    }
  };
  window.deleteCouponAdmin = async (id) => {
    if (confirm('Delete this coupon?')) {
      try {
        await fetchWithAuth(`${API_URL}/coupons/${id}`, { method: 'DELETE' });
        showToast('Coupon deleted', 'success');
        await loadAllData(); renderCouponsList();
      } catch(e) { showToast('Failed to delete', 'error'); }
    }
  };
  const addBtn = document.getElementById('addCouponBtn');
  if (addBtn) addBtn.onclick = () => {
    editingCouponId = null;
    document.getElementById('couponModalTitle').textContent = `${t('add')} ${t('coupons')}`;
    document.getElementById('couponCode').value = '';
    document.getElementById('couponDiscountType').value = 'percentage';
    document.getElementById('couponDiscountValue').value = '';
    document.getElementById('couponMinOrder').value = '0';
    document.getElementById('couponUsageLimit').value = '1';
    document.getElementById('couponExpiry').value = '';
    document.getElementById('couponUnlimited').checked = false;
    document.getElementById('couponModal').style.display = 'flex';
  };
  const saveBtn = document.getElementById('saveCouponBtn');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      const unlimited = document.getElementById('couponUnlimited').checked;
      const data = {
        code: document.getElementById('couponCode').value.trim().toUpperCase(),
        discountType: document.getElementById('couponDiscountType').value,
        discountValue: parseFloat(document.getElementById('couponDiscountValue').value),
        minOrder: parseFloat(document.getElementById('couponMinOrder').value) || 0,
        usageLimit: unlimited ? null : parseInt(document.getElementById('couponUsageLimit').value),
        expiry: document.getElementById('couponExpiry').value || null
      };
      if (!data.code || !data.discountValue) { showToast('Please fill all fields', 'error'); return; }
      if (data.discountValue <= 0) { showToast('Discount value must be greater than 0', 'error'); return; }
      try {
        let url = `${API_URL}/coupons`, method = 'POST';
        if (editingCouponId) { url = `${API_URL}/coupons/${editingCouponId}`; method = 'PUT'; }
        const res = await fetchWithAuth(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.ok) {
          showToast(editingCouponId ? 'Coupon updated' : 'Coupon created', 'success');
          closeCouponModal();
          await loadAllData(); renderCouponsList();
        } else { const err = await res.json(); showToast(err.error || 'Operation failed', 'error'); }
      } catch(e) { showToast('Server error', 'error'); }
    };
  }
  renderCouponsList();
}

// ========== BLOG POSTS ==========
let allPosts = [], editingPostId = null;
async function loadPosts() {
  try {
    const res = await fetchWithAuth(`${API_URL}/posts/admin/all`);
    allPosts = await res.json();
    renderPostsList();
  } catch(e) { showToast('Failed to load posts', 'error'); }
}
function renderPosts() {
  document.getElementById('pageContent').innerHTML = `
    <div class="toolbar"><h2>Bài viết / Blog</h2><div><select id="postStatusFilter" class="filter-select"><option value="all">Tất cả</option><option value="published">Đã xuất bản</option><option value="draft">Bản nháp</option><option value="archived">Đã lưu trữ</option></select><button class="btn-primary" id="addPostBtn">+ Viết bài mới</button></div></div>
    <div class="table-container"><table class="simple-table"><thead><tr><th>Hình ảnh</th><th>Tiêu đề</th><th>Danh mục</th><th>Trạng thái</th><th>Lượt xem</th><th>Ngày đăng</th><th>Thao tác</th></tr></thead><tbody id="postsTableBody"></tbody></table></div>
    <div id="postModal" class="modal"><div class="modal-content" style="max-width:800px;"><div class="modal-header"><h3 id="postModalTitle">${t('add')} Bài viết</h3><span class="close" onclick="closePostModal()">&times;</span></div><div class="modal-body"><div class="form-group"><label>Tiêu đề *</label><input type="text" id="postTitle" class="form-input"></div><div class="form-group"><label>Danh mục</label><select id="postCategory" class="form-input"><option value="news">News</option><option value="event">Event</option><option value="guide">Guide</option><option value="review">Review</option><option value="announcement">Announcement</option><option value="update">Update</option></select></div><div class="form-group"><label>Tags (cách nhau bằng dấu phẩy)</label><input type="text" id="postTags" class="form-input" placeholder="VD: kpop, album, concert"></div><div class="form-group"><label>Ảnh & Video (có thể chọn nhiều)</label><div><button type="button" class="btn-secondary" id="postUploadBtn">+ Thêm ảnh/video</button><input type="file" id="postFileInput" accept="image/*,video/*" multiple style="display:none"><div id="postMediaPreview" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;"></div><input type="hidden" id="postImage"></div><small style="color:#888">Ảnh đầu là ảnh đại diện.</small></div><div class="form-group"><label>Tóm tắt (excerpt)</label><textarea id="postExcerpt" rows="2" class="form-input"></textarea></div><div class="form-group"><label>Nội dung *</label><textarea id="postContent" rows="10" class="form-input"></textarea></div><div class="form-group"><label>Trạng thái</label><select id="postStatus" class="form-input"><option value="draft">Bản nháp</option><option value="published">Xuất bản</option><option value="archived">Lưu trữ</option></select></div><div class="form-group"><label>Link video nhúng (YouTube, TikTok, Vimeo — mỗi link 1 dòng)</label><textarea id="postVideoLinks" rows="2" class="form-input" placeholder="https://youtube.com/watch?v=..."></textarea></div><div class="form-row-2"><div class="form-group"><label>Facebook</label><input id="postFacebook" class="form-input" placeholder="https://facebook.com/..."></div><div class="form-group"><label>Zalo</label><input id="postZalo" class="form-input" placeholder="https://zalo.me/..."></div></div><div class="form-row-2"><div class="form-group"><label>TikTok</label><input id="postTiktok" class="form-input" placeholder="https://tiktok.com/..."></div><div class="form-group"><label>YouTube</label><input id="postYoutube" class="form-input" placeholder="https://youtube.com/..."></div></div></div><div class="modal-footer"><button class="btn-secondary" onclick="closePostModal()">${t('cancel')}</button><button class="btn-primary" id="savePostBtn">${t('save')}</button></div></div></div>
  `;
  document.getElementById('postStatusFilter')?.addEventListener('change', filterPosts);
  document.getElementById('addPostBtn')?.addEventListener('click', () => openPostModal());
  document.getElementById('savePostBtn')?.addEventListener('click', savePost);
  const uploadBtn = document.getElementById('postUploadBtn');
  const fileInput = document.getElementById('postFileInput');
  if (uploadBtn && fileInput) {
    uploadBtn.onclick = () => fileInput.click();
    fileInput.onchange = async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      showToast('Đang tải lên...', 'success');
      for (const file of files) {
        try { const url = await uploadFile(file, 'products'); postMediaList.push({ url, type: file.type.startsWith('video') ? 'video' : 'image' }); renderPostMedia(); }
        catch (err) { showToast('Tải lỗi: ' + file.name, 'error'); }
      }
      fileInput.value = '';
      showToast('Đã tải lên ' + files.length + ' tệp', 'success');
    };
  }
  loadPosts();   // TẢI dữ liệu bài viết từ API rồi render (trước đây bị thiếu nên bảng luôn trống)
}
function filterPosts() {
  const status = document.getElementById('postStatusFilter')?.value || 'all';
  const filtered = status === 'all' ? allPosts : allPosts.filter(p => p.status === status);
  renderPostsList(filtered);
}
function renderPostsList(posts = null) {
  const data = posts || allPosts;
  const tbody = document.getElementById('postsTableBody');
  if (!tbody) return;
  if (!data.length) { tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Chưa có bài viết nào</td><\/tr>`; return; }
  tbody.innerHTML = data.map(post => {
    const statusText = post.status === 'published' ? 'Xuất bản' : (post.status === 'draft' ? 'Nháp' : 'Lưu trữ');
    const statusClass = post.status === 'published' ? 'status-delivered' : (post.status === 'draft' ? 'status-pending' : 'status-cancelled');
    const imageUrl = getImageUrl(post.featuredImage) || 'https://picsum.photos/50/50';
    const date = new Date(post.publishedAt || post.createdAt).toLocaleDateString('vi-VN');
    return `<tr><td><img src="${imageUrl}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;"></td><td><strong>${escapeHtml(post.title)}</strong><br><small>${post.slug}</small></td><td>${getCategoryName(post.category)}</td><td><span class="status-badge ${statusClass}">${statusText}</span></td><td>${post.views || 0}</td><td>${date}</td><td><button class="btn-edit" onclick="editPost('${post._id}')">Sửa</button> <button class="btn-delete" onclick="deletePost('${post._id}')">Xóa</button></td><\/tr>`;
  }).join('');
}
function getCategoryName(category) {
  const names = { 'news':'News', 'event':'Event', 'guide':'Guide', 'review':'Review', 'announcement':'Announcement', 'update':'Update' };
  return names[category] || category;
}
function openPostModal(post = null) {
  editingPostId = post?._id || null;
  const modal = document.getElementById('postModal');
  const modalTitle = document.getElementById('postModalTitle');
  if (post) {
    modalTitle.textContent = 'Sửa bài viết';
    document.getElementById('postTitle').value = post.title || '';
    document.getElementById('postCategory').value = post.category || 'news';
    document.getElementById('postTags').value = (post.tags || []).join(', ');
    document.getElementById('postExcerpt').value = post.excerpt || '';
    document.getElementById('postContent').value = post.content || '';
    document.getElementById('postStatus').value = post.status || 'draft';
    document.getElementById('postImage').value = post.featuredImage || '';
    const sl = post.socialLinks || {};
    document.getElementById('postFacebook').value = sl.facebook || '';
    document.getElementById('postZalo').value = sl.zalo || '';
    document.getElementById('postTiktok').value = sl.tiktok || '';
    document.getElementById('postYoutube').value = sl.youtube || '';
    postMediaList = [];
    (post.images && post.images.length ? post.images : (post.featuredImage ? [post.featuredImage] : [])).forEach(u => { if (u) postMediaList.push({ url: u, type: isVideoUrl(u) ? 'video' : 'image' }); });
    (post.videoLinks || []).forEach(u => { if (u && isVideoUrl(u)) postMediaList.push({ url: u, type: 'video' }); });
    document.getElementById('postVideoLinks').value = (post.videoLinks || []).filter(u => !isVideoUrl(u)).join('\n');
    renderPostMedia();
  } else {
    modalTitle.textContent = 'Viết bài mới';
    document.getElementById('postTitle').value = '';
    document.getElementById('postCategory').value = 'news';
    document.getElementById('postTags').value = '';
    document.getElementById('postExcerpt').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('postStatus').value = 'published'; // mặc định Xuất bản để bài hiện ngay trên blog
    document.getElementById('postImage').value = '';
    ['postFacebook','postZalo','postTiktok','postYoutube','postVideoLinks'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    postMediaList = [];
    renderPostMedia();
  }
  modal.style.display = 'flex';
}
function closePostModal() { document.getElementById('postModal').style.display = 'none'; }
async function savePost() {
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();
  if (!title || !content) { showToast('Vui lòng nhập tiêu đề và nội dung', 'error'); return; }
  const tags = document.getElementById('postTags').value.split(',').map(t => t.trim()).filter(t => t);
  const socialLinks = {
    facebook: document.getElementById('postFacebook')?.value.trim() || '',
    zalo: document.getElementById('postZalo')?.value.trim() || '',
    tiktok: document.getElementById('postTiktok')?.value.trim() || '',
    youtube: document.getElementById('postYoutube')?.value.trim() || ''
  };
  const embedLinks = (document.getElementById('postVideoLinks')?.value || '').split(/[\n,]/).map(s => s.trim()).filter(Boolean);
  const images = postMediaList.filter(m => m.type === 'image').map(m => m.url);
  const uploadedVideos = postMediaList.filter(m => m.type === 'video').map(m => m.url);
  const videoLinks = [...embedLinks, ...uploadedVideos];
  const data = { title, content, excerpt: document.getElementById('postExcerpt').value.trim(), category: document.getElementById('postCategory').value, tags, featuredImage: images[0] || document.getElementById('postImage').value || '', images, status: document.getElementById('postStatus').value, socialLinks, videoLinks };
  try {
    showLoading();
    let url = `${API_URL}/posts`, method = 'POST';
    if (editingPostId) { url = `${API_URL}/posts/${editingPostId}`; method = 'PUT'; }
    const res = await fetchWithAuth(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) { showToast(editingPostId ? 'Bài viết đã cập nhật' : 'Bài viết đã tạo', 'success'); closePostModal(); await loadPosts(); }
    else { const err = await res.json(); showToast(err.error || 'Lỗi khi lưu bài viết', 'error'); }
  } catch(e) { showToast('Lỗi kết nối server', 'error'); } finally { hideLoading(); }
}
async function editPost(id) { const post = allPosts.find(p => p._id === id); if (post) openPostModal(post); }
async function deletePost(id) {
  if (confirm('Bạn có chắc muốn xóa bài viết này?')) {
    try {
      await fetchWithAuth(`${API_URL}/posts/${id}`, { method: 'DELETE' });
      showToast('Đã xóa bài viết', 'success');
      await loadPosts();
    } catch(e) { showToast('Lỗi khi xóa bài viết', 'error'); }
  }
}

// ========== REPORTS (BÁO CÁO CHUYÊN NGHIỆP) ==========
function renderReports() {
  const totalRevenue = allOrders.reduce((s,o)=>s+(o.total||0),0);
  const totalOrders = allOrders.length;
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const completedOrders = allOrders.filter(o => o.status === 'delivered').length;
  const cancelledOrders = allOrders.filter(o => o.status === 'cancelled').length;
  const revenueByMonth = {};
  allOrders.forEach(o => {
    const month = new Date(o.date).toLocaleString('default', { month: 'short', year: 'numeric' });
    revenueByMonth[month] = (revenueByMonth[month] || 0) + o.total;
  });
  const monthLabels = Object.keys(revenueByMonth).slice(-6);
  const monthData = monthLabels.map(m => revenueByMonth[m]);
  const productSales = {};
  allOrders.forEach(o => { if(o.items) o.items.forEach(i => { productSales[i.name] = (productSales[i.name] || 0) + i.quantity; }); });
  const topSelling = Object.entries(productSales).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const statusCount = {
    pending: allOrders.filter(o=>o.status==='pending').length,
    processing: allOrders.filter(o=>o.status==='processing').length,
    shipped: allOrders.filter(o=>o.status==='shipped').length,
    delivered: allOrders.filter(o=>o.status==='delivered').length,
    cancelled: allOrders.filter(o=>o.status==='cancelled').length
  };
  document.getElementById('pageContent').innerHTML = `
    <div class="toolbar"><h2>${t('reports')}</h2><div><button id="exportReportExcelBtn" class="btn-secondary">Export Excel</button><button id="exportReportPDFBtn" class="btn-secondary">Export PDF</button></div></div>
    <div class="stats-grid" style="margin-bottom:24px;">
      <div class="stat-card"><div class="stat-icon"></div><div><div class="stat-value">${convertPrice(totalRevenue)}</div><div class="stat-label">Tổng doanh thu</div></div></div>
      <div class="stat-card"><div class="stat-icon"></div><div><div class="stat-value">${totalOrders}</div><div class="stat-label">Tổng đơn hàng</div></div></div>
      <div class="stat-card"><div class="stat-icon"></div><div><div class="stat-value">${convertPrice(avgOrderValue)}</div><div class="stat-label">Giá trị đơn hàng TB</div></div></div>
      <div class="stat-card"><div class="stat-icon"></div><div><div class="stat-value">${completedOrders}</div><div class="stat-label">Hoàn thành</div></div></div>
    </div>
    <div class="two-columns">
      <div class="section-card"><div class="section-header"><h3>Doanh thu theo tháng</h3></div><div class="chart-section" style="margin:0; border:none; padding:16px;"><canvas id="revenueMonthChart" height="200"></canvas></div></div>
      <div class="section-card"><div class="section-header"><h3>Top sản phẩm bán chạy</h3></div><div class="table-responsive"><table class="simple-table"><thead><tr><th>Sản phẩm</th><th>Số lượng bán</th></tr></thead><tbody>${topSelling.map(([name,qty])=>`<tr><td>${escapeHtml(name)}</td><td>${qty}</td></tr>`).join('')||`<tr><td colspan="2" class="empty-state">Chưa có dữ liệu</td><\/tr>`}</tbody></table></div></div>
    </div>
    <div class="two-columns">
      <div class="section-card"><div class="section-header"><h3>Trạng thái đơn hàng</h3></div><div style="padding:16px;"><canvas id="statusPieChart" height="200"></canvas></div></div>
      <div class="section-card"><div class="section-header"><h3>Danh sách đơn hàng gần đây</h3><button class="view-all" onclick="showPage('orders')">Xem tất cả →</button></div><div class="table-responsive"><table class="simple-table"><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Tổng</th><th>Trạng thái</th><th>Ngày</th></tr></thead><tbody>${allOrders.slice(0,5).map(o=>`<tr><td>#${o.orderId||o._id.slice(-6)}</td><td>${escapeHtml(o.customerName)}</td><td>${convertPrice(o.total)}</td><td><span class="status-badge status-${o.status}">${t(o.status)}</span></td><td>${new Date(o.date).toLocaleDateString()}</td></tr>`).join('')||`<tr><td colspan="5" class="empty-state">Chưa có đơn hàng</td><\/tr>`}</tbody></table></div></div>
    </div>
  `;
  const monthCtx = document.getElementById('revenueMonthChart');
  if(monthCtx && typeof Chart !== 'undefined') {
    new Chart(monthCtx.getContext('2d'), {
      type: 'bar',
      data: { labels: monthLabels, datasets: [{ label: 'Doanh thu', data: monthData, backgroundColor: '#3b82f6', borderRadius: 8 }] },
      options: { responsive: true, maintainAspectRatio: true }
    });
  }
  const pieCtx = document.getElementById('statusPieChart');
  if(pieCtx && typeof Chart !== 'undefined') {
    new Chart(pieCtx.getContext('2d'), {
      type: 'pie',
      data: { labels: ['Đang chờ','Đang xử lý','Đã gửi','Đã giao','Đã hủy'], datasets: [{ data: [statusCount.pending, statusCount.processing, statusCount.shipped, statusCount.delivered, statusCount.cancelled], backgroundColor: ['#f59e0b','#3b82f6','#8b5cf6','#10b981','#ef4444'] }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }
  document.getElementById('exportReportExcelBtn')?.addEventListener('click', () => {
    if (typeof XLSX !== 'undefined') {
      const wsData = [['Mã đơn','Khách hàng','Email','Tổng','Trạng thái','Ngày']];
      allOrders.forEach(o => wsData.push([o.orderId||o._id, o.customerName, o.customerEmail, o.total, o.status, new Date(o.date).toLocaleDateString()]));
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Orders_Report');
      XLSX.writeFile(wb, `orders_report_${new Date().toISOString().slice(0,10)}.xlsx`);
    } else alert('Excel library not loaded');
  });
  document.getElementById('exportReportPDFBtn')?.addEventListener('click', () => {
    if (typeof html2pdf !== 'undefined') {
      const element = document.getElementById('pageContent');
      html2pdf().from(element).set({ margin: 0.5, filename: `report_${new Date().toISOString().slice(0,10)}.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' } }).save();
    } else alert('PDF library not loaded');
  });
}

// ========== AUTH CHECK ==========
async function checkAdmin() {
  showLoading();
  authToken = localStorage.getItem('authToken');
  const userId = localStorage.getItem('currentUserId');
  if (!authToken || !userId) { window.location.href = '/crud/login.html'; return; }
  try {
    const res = await fetch(`${API_URL}/users/${userId}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
    if (res.status === 401 || res.status === 403) { localStorage.removeItem('authToken'); localStorage.removeItem('currentUserId'); window.location.href = '/crud/login.html'; return; }
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    currentUser = await res.json();
    if (currentUser.role !== 'admin') { showToast('Bạn không có quyền truy cập Admin', 'error'); setTimeout(() => window.location.href = '/', 1500); return; }
    document.getElementById('adminName').textContent = currentUser.name;
    await loadAllData();
    const langSelect = document.getElementById('globalLanguageSelect');
    if (langSelect) {
      langSelect.value = currentLanguage;
      langSelect.onchange = (e) => { currentLanguage = e.target.value; localStorage.setItem('preferredLanguage', currentLanguage); updateUILanguage(); showPage(currentPage); };
    }
    const curSelect = document.getElementById('globalCurrencySelect');
    if (curSelect) {
      curSelect.value = currentCurrency;
      curSelect.onchange = (e) => { currentCurrency = e.target.value; localStorage.setItem('preferredCurrency', currentCurrency); showPage(currentPage); };
    }
    updateUILanguage();
    showPage('dashboard');
    showToast('Welcome to Admin Dashboard!', 'success');
  } catch(e) { console.error(e); hideLoading(); showToast('Không thể kết nối server. Kiểm tra lại kết nối mạng.', 'error'); } finally { hideLoading(); }
}
function updateUILanguage() {
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.dataset.key;
    if (translations[currentLanguage]?.[key]) el.textContent = translations[currentLanguage][key];
  });
  document.getElementById('pageTitle').textContent = t(currentPage);
}
document.querySelectorAll('.nav-item[data-page]').forEach(item => { item.addEventListener('click', () => showPage(item.dataset.page)); });
document.getElementById('backToShopBtn')?.addEventListener('click', () => window.location.href = '/');
document.getElementById('adminLogoutBtn')?.addEventListener('click', logout);
document.getElementById('menuToggle')?.addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));
window.showPage = showPage;

// Thêm vào trong script của admin.html
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    darkModeToggle.innerHTML = '☀️';
  }
  darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    darkModeToggle.innerHTML = isDark ? '☀️' : '🌙';
  });
}

checkAdmin();
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
