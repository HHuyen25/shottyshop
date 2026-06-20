// ==================== CẤU HÌNH ====================
window.API_URL = '/api';
let currentUser = null;
let currentCurrency = 'USD';
let currentLanguage = 'en';
let authToken = localStorage.getItem('authToken');

// Biến global
window.products = [];
window.banners = [];

let products = window.products;
let banners = window.banners;

// Tỉ giá và ký hiệu tiền tệ
const exchangeRates = { KRW: 1350, USD: 1, JPY: 150, CNY: 7.2, MXN: 17, VND: 25500 };
const currencySymbols = { KRW: '₩', USD: '$', JPY: '¥', CNY: '¥', MXN: '$', VND: '₫' };

// ==================== TRANSLATIONS ====================
window.translations = window.translations || {};
const translations = window.translations = {
  en: {
    home: 'Home', about: 'About', blog: 'Blog', contact: 'Contact', filter: 'Filter', tracking: 'Tracking', explore: 'Explore',
    my_account: 'My Account', order_history: 'Order History', cart: 'Cart', login: 'Login', logout: 'Log Out',
    shop_now: 'SHOP NOW →', add_to_cart: 'ADD TO CART', added: 'ADDED!', preorder: 'PRE-ORDER',
    hanteo: 'HANTEO | Shipped from KR', detecting_location: 'Detecting...', location_unknown: 'Location unknown',
    quantity: 'Quantity', total: 'Total', remove: 'Remove', clear_cart: 'Clear Cart', checkout: 'Proceed to Checkout',
    empty_cart: 'Your cart is empty', continue_shopping: 'Continue Shopping',
    terms: 'Terms and Conditions', paid_services: 'Paid Services Terms and Conditions', youth_policy: 'Child and Youth Protection Policy',
    privacy: 'Privacy Policy', cookie: 'Cookie Policy', cookie_settings: 'Cookie Settings',
    specifications: 'Specifications', type: 'Type', country: 'Country', size: 'Size', weight: 'Weight',
    out_of_stock: 'Out of Stock', in_stock: 'In Stock', add_to_wishlist: 'Add to Wishlist', remove_from_wishlist: 'Remove from Wishlist',
    write_review: 'Write a Review', reviews: 'Customer Reviews', avg_rating: 'Average Rating',
    order_id: 'Order ID', status: 'Status', date: 'Date', payment_method: 'Payment Method', customer: 'Customer',
    email: 'Email', phone: 'Phone', shipping_address: 'Shipping Address', order_items: 'Order Items', grand_total: 'Grand Total',
    wishlist: 'Wishlist', clear_all: 'Clear All', your_wishlist_empty: 'Your wishlist is empty', start_shopping: 'Start Shopping',
    profile: 'Profile', full_name: 'Full Name', role: 'Role', change_password: 'Change Password', save_changes: 'Save Changes',
    product: 'Product', name: 'Name', price: 'Price', shipping_info: 'Shipping Information', order_summary: 'Order Summary',
    place_order: 'Place Order', back_to_cart: 'Back to Cart', admin_panel: 'Admin Panel', staff_panel: 'Staff Panel',
    dashboard: 'Dashboard', manage_products: 'Manage Products', manage_orders: 'Manage Orders', manage_users: 'Manage Users',
    search: 'Search', apply: 'Apply', reset: 'Reset', loading: 'Loading...', error: 'Error', success: 'Success',
    warning: 'Warning', info: 'Info', close: 'Close', confirm: 'Confirm', cancel: 'Cancel', save: 'Save',
    delete: 'Delete', edit: 'Edit', view: 'View', back: 'Back'
  },
  vi: {
    home: 'Trang chủ', about: 'Giới thiệu', blog: 'Blog', contact: 'Liên hệ', filter: 'Lọc', tracking: 'Theo dõi', explore: 'Khám phá',
    my_account: 'Tài khoản của tôi', order_history: 'Lịch sử đơn hàng', cart: 'Giỏ hàng', login: 'Đăng nhập', logout: 'Đăng xuất',
    shop_now: 'MUA NGAY →', add_to_cart: 'THÊM VÀO GIỎ', added: 'ĐÃ THÊM!', preorder: 'ĐẶT TRƯỚC',
    hanteo: 'HANTEO | Gửi từ Hàn Quốc', detecting_location: 'Đang xác định...', location_unknown: 'Không xác định',
    quantity: 'Số lượng', total: 'Tổng', remove: 'Xóa', clear_cart: 'Xóa giỏ hàng', checkout: 'Thanh toán',
    empty_cart: 'Giỏ hàng trống', continue_shopping: 'Tiếp tục mua sắm',
    terms: 'Điều khoản và Điều kiện', paid_services: 'Điều khoản Dịch vụ Trả phí', youth_policy: 'Chính sách Bảo vệ Trẻ em và Thanh thiếu niên',
    privacy: 'Chính sách Bảo mật', cookie: 'Chính sách Cookie', cookie_settings: 'Cài đặt Cookie',
    specifications: 'Thông số kỹ thuật', type: 'Loại', country: 'Xuất xứ', size: 'Kích thước', weight: 'Trọng lượng',
    out_of_stock: 'Hết hàng', in_stock: 'Còn hàng', add_to_wishlist: 'Thêm vào yêu thích', remove_from_wishlist: 'Xóa khỏi yêu thích',
    write_review: 'Viết đánh giá', reviews: 'Đánh giá của khách hàng', avg_rating: 'Đánh giá trung bình',
    order_id: 'Mã đơn hàng', status: 'Trạng thái', date: 'Ngày', payment_method: 'Phương thức thanh toán', customer: 'Khách hàng',
    email: 'Email', phone: 'Điện thoại', shipping_address: 'Địa chỉ giao hàng', order_items: 'Sản phẩm', grand_total: 'Tổng cộng',
    wishlist: 'Yêu thích', clear_all: 'Xóa tất cả', your_wishlist_empty: 'Danh sách yêu thích của bạn đang trống', start_shopping: 'Mua sắm ngay',
    profile: 'Hồ sơ', full_name: 'Họ và tên', role: 'Vai trò', change_password: 'Đổi mật khẩu', save_changes: 'Lưu thay đổi',
    product: 'Sản phẩm', name: 'Tên', price: 'Giá', shipping_info: 'Thông tin giao hàng', order_summary: 'Tóm tắt đơn hàng',
    place_order: 'Đặt hàng', back_to_cart: 'Quay lại giỏ hàng', admin_panel: 'Bảng điều khiển Admin', staff_panel: 'Bảng điều khiển Nhân viên',
    dashboard: 'Tổng quan', manage_products: 'Quản lý sản phẩm', manage_orders: 'Quản lý đơn hàng', manage_users: 'Quản lý người dùng',
    search: 'Tìm kiếm', apply: 'Áp dụng', reset: 'Đặt lại', loading: 'Đang tải...', error: 'Lỗi', success: 'Thành công',
    warning: 'Cảnh báo', info: 'Thông tin', close: 'Đóng', confirm: 'Xác nhận', cancel: 'Hủy', save: 'Lưu',
    delete: 'Xóa', edit: 'Sửa', view: 'Xem', back: 'Quay lại'
  },
  ko: {
    home:'홈', about:'소개', blog:'블로그', contact:'문의', filter:'필터', tracking:'배송조회', explore:'둘러보기',
    my_account:'내 계정', order_history:'주문 내역', cart:'장바구니', login:'로그인', logout:'로그아웃',
    shop_now:'지금 쇼핑 →', add_to_cart:'장바구니 담기', added:'추가됨!', preorder:'예약 주문',
    hanteo:'HANTEO | 한국에서 배송', detecting_location:'위치 확인 중...', location_unknown:'위치 알 수 없음',
    quantity:'수량', total:'합계', remove:'삭제', clear_cart:'장바구니 비우기', checkout:'결제하기',
    empty_cart:'장바구니가 비어 있습니다', continue_shopping:'쇼핑 계속하기',
    terms:'이용 약관', paid_services:'유료 서비스 약관', youth_policy:'아동·청소년 보호정책',
    privacy:'개인정보 처리방침', cookie:'쿠키 정책', cookie_settings:'쿠키 설정',
    specifications:'사양', type:'종류', country:'원산지', size:'크기', weight:'무게',
    out_of_stock:'품절', in_stock:'재고 있음', add_to_wishlist:'위시리스트 추가', remove_from_wishlist:'위시리스트 삭제',
    write_review:'리뷰 작성', reviews:'고객 리뷰', avg_rating:'평균 평점',
    order_id:'주문 번호', status:'상태', date:'날짜', payment_method:'결제 방법', customer:'고객',
    email:'이메일', phone:'전화', shipping_address:'배송 주소', order_items:'주문 상품', grand_total:'총 합계',
    wishlist:'위시리스트', clear_all:'전체 삭제', your_wishlist_empty:'위시리스트가 비어 있습니다', start_shopping:'쇼핑 시작',
    profile:'프로필', full_name:'이름', role:'역할', change_password:'비밀번호 변경', save_changes:'변경 사항 저장',
    product:'상품', name:'이름', price:'가격', shipping_info:'배송 정보', order_summary:'주문 요약',
    place_order:'주문하기', back_to_cart:'장바구니로 돌아가기', admin_panel:'관리자 패널', staff_panel:'스태프 패널',
    dashboard:'대시보드', manage_products:'상품 관리', manage_orders:'주문 관리', manage_users:'사용자 관리',
    search:'검색', apply:'적용', reset:'초기화', loading:'로딩 중...', error:'오류', success:'성공',
    warning:'경고', info:'정보', close:'닫기', confirm:'확인', cancel:'취소', save:'저장',
    delete:'삭제', edit:'편집', view:'보기', back:'뒤로'
  },
  ja: {
    home:'ホーム', about:'紹介', blog:'ブログ', contact:'お問い合わせ', filter:'フィルター', tracking:'追跡', explore:'探す',
    my_account:'マイアカウント', order_history:'注文履歴', cart:'カート', login:'ログイン', logout:'ログアウト',
    shop_now:'今すぐ購入 →', add_to_cart:'カートに追加', added:'追加しました！', preorder:'予約注文',
    hanteo:'HANTEO | 韓国から発送', detecting_location:'位置を確認中...', location_unknown:'位置不明',
    quantity:'数量', total:'合計', remove:'削除', clear_cart:'カートを空にする', checkout:'レジに進む',
    empty_cart:'カートは空です', continue_shopping:'買い物を続ける',
    terms:'利用規約', paid_services:'有料サービス規約', youth_policy:'児童・青少年保護方針',
    privacy:'プライバシーポリシー', cookie:'Cookieポリシー', cookie_settings:'Cookie設定',
    specifications:'仕様', type:'種類', country:'原産国', size:'サイズ', weight:'重量',
    out_of_stock:'在庫切れ', in_stock:'在庫あり', add_to_wishlist:'お気に入りに追加', remove_from_wishlist:'お気に入りから削除',
    write_review:'レビューを書く', reviews:'カスタマーレビュー', avg_rating:'平均評価',
    order_id:'注文番号', status:'ステータス', date:'日付', payment_method:'支払い方法', customer:'お客様',
    email:'メール', phone:'電話', shipping_address:'配送先住所', order_items:'注文商品', grand_total:'総合計',
    wishlist:'お気に入り', clear_all:'すべて削除', your_wishlist_empty:'お気に入りは空です', start_shopping:'買い物を始める',
    profile:'プロフィール', full_name:'氏名', role:'役割', change_password:'パスワード変更', save_changes:'変更を保存',
    product:'商品', name:'名前', price:'価格', shipping_info:'配送情報', order_summary:'注文概要',
    place_order:'注文する', back_to_cart:'カートに戻る', admin_panel:'管理パネル', staff_panel:'スタッフパネル',
    dashboard:'ダッシュボード', manage_products:'商品管理', manage_orders:'注文管理', manage_users:'ユーザー管理',
    search:'検索', apply:'適用', reset:'リセット', loading:'読み込み中...', error:'エラー', success:'成功',
    warning:'警告', info:'情報', close:'閉じる', confirm:'確認', cancel:'キャンセル', save:'保存',
    delete:'削除', edit:'編集', view:'表示', back:'戻る'
  },
  zh: {
    home:'首页', about:'关于', blog:'博客', contact:'联系', filter:'筛选', tracking:'物流跟踪', explore:'探索',
    my_account:'我的账户', order_history:'订单记录', cart:'购物车', login:'登录', logout:'退出登录',
    shop_now:'立即购买 →', add_to_cart:'加入购物车', added:'已添加！', preorder:'预购',
    hanteo:'HANTEO | 韩国发货', detecting_location:'正在定位...', location_unknown:'位置未知',
    quantity:'数量', total:'合计', remove:'移除', clear_cart:'清空购物车', checkout:'去结算',
    empty_cart:'购物车为空', continue_shopping:'继续购物',
    terms:'条款和条件', paid_services:'付费服务条款', youth_policy:'儿童及青少年保护政策',
    privacy:'隐私政策', cookie:'Cookie政策', cookie_settings:'Cookie设置',
    specifications:'规格', type:'类型', country:'产地', size:'尺寸', weight:'重量',
    out_of_stock:'缺货', in_stock:'有货', add_to_wishlist:'加入心愿单', remove_from_wishlist:'从心愿单移除',
    write_review:'写评价', reviews:'客户评价', avg_rating:'平均评分',
    order_id:'订单号', status:'状态', date:'日期', payment_method:'支付方式', customer:'客户',
    email:'邮箱', phone:'电话', shipping_address:'收货地址', order_items:'订单商品', grand_total:'总计',
    wishlist:'心愿单', clear_all:'全部清除', your_wishlist_empty:'您的心愿单为空', start_shopping:'开始购物',
    profile:'个人资料', full_name:'姓名', role:'角色', change_password:'修改密码', save_changes:'保存更改',
    product:'商品', name:'名称', price:'价格', shipping_info:'配送信息', order_summary:'订单摘要',
    place_order:'提交订单', back_to_cart:'返回购物车', admin_panel:'管理后台', staff_panel:'员工面板',
    dashboard:'仪表盘', manage_products:'商品管理', manage_orders:'订单管理', manage_users:'用户管理',
    search:'搜索', apply:'应用', reset:'重置', loading:'加载中...', error:'错误', success:'成功',
    warning:'警告', info:'信息', close:'关闭', confirm:'确认', cancel:'取消', save:'保存',
    delete:'删除', edit:'编辑', view:'查看', back:'返回'
  },
  'zh-tw': {
    home:'首頁', about:'關於', blog:'部落格', contact:'聯絡', filter:'篩選', tracking:'物流追蹤', explore:'探索',
    my_account:'我的帳戶', order_history:'訂單紀錄', cart:'購物車', login:'登入', logout:'登出',
    shop_now:'立即購買 →', add_to_cart:'加入購物車', added:'已加入！', preorder:'預購',
    hanteo:'HANTEO | 韓國出貨', detecting_location:'正在定位...', location_unknown:'位置未知',
    quantity:'數量', total:'合計', remove:'移除', clear_cart:'清空購物車', checkout:'前往結帳',
    empty_cart:'購物車是空的', continue_shopping:'繼續購物',
    terms:'條款與條件', paid_services:'付費服務條款', youth_policy:'兒童及青少年保護政策',
    privacy:'隱私權政策', cookie:'Cookie政策', cookie_settings:'Cookie設定',
    specifications:'規格', type:'類型', country:'產地', size:'尺寸', weight:'重量',
    out_of_stock:'缺貨', in_stock:'有貨', add_to_wishlist:'加入願望清單', remove_from_wishlist:'從願望清單移除',
    write_review:'撰寫評論', reviews:'顧客評論', avg_rating:'平均評分',
    order_id:'訂單編號', status:'狀態', date:'日期', payment_method:'付款方式', customer:'顧客',
    email:'電子郵件', phone:'電話', shipping_address:'收貨地址', order_items:'訂單商品', grand_total:'總計',
    wishlist:'願望清單', clear_all:'全部清除', your_wishlist_empty:'您的願望清單是空的', start_shopping:'開始購物',
    profile:'個人資料', full_name:'姓名', role:'角色', change_password:'修改密碼', save_changes:'儲存變更',
    product:'商品', name:'名稱', price:'價格', shipping_info:'配送資訊', order_summary:'訂單摘要',
    place_order:'送出訂單', back_to_cart:'返回購物車', admin_panel:'管理後台', staff_panel:'員工面板',
    dashboard:'儀表板', manage_products:'商品管理', manage_orders:'訂單管理', manage_users:'使用者管理',
    search:'搜尋', apply:'套用', reset:'重設', loading:'載入中...', error:'錯誤', success:'成功',
    warning:'警告', info:'資訊', close:'關閉', confirm:'確認', cancel:'取消', save:'儲存',
    delete:'刪除', edit:'編輯', view:'檢視', back:'返回'
  },
  es: {
    home:'Inicio', about:'Acerca de', blog:'Blog', contact:'Contacto', filter:'Filtrar', tracking:'Seguimiento', explore:'Explorar',
    my_account:'Mi cuenta', order_history:'Historial de pedidos', cart:'Carrito', login:'Iniciar sesión', logout:'Cerrar sesión',
    shop_now:'COMPRAR AHORA →', add_to_cart:'AÑADIR AL CARRITO', added:'¡AÑADIDO!', preorder:'PRE-ORDEN',
    hanteo:'HANTEO | Enviado desde Corea', detecting_location:'Detectando...', location_unknown:'Ubicación desconocida',
    quantity:'Cantidad', total:'Total', remove:'Quitar', clear_cart:'Vaciar carrito', checkout:'Pagar',
    empty_cart:'Tu carrito está vacío', continue_shopping:'Seguir comprando',
    terms:'Términos y condiciones', paid_services:'Términos de servicios de pago', youth_policy:'Política de protección de menores',
    privacy:'Política de privacidad', cookie:'Política de cookies', cookie_settings:'Configuración de cookies',
    specifications:'Especificaciones', type:'Tipo', country:'País', size:'Tamaño', weight:'Peso',
    out_of_stock:'Agotado', in_stock:'En stock', add_to_wishlist:'Añadir a favoritos', remove_from_wishlist:'Quitar de favoritos',
    write_review:'Escribir reseña', reviews:'Reseñas de clientes', avg_rating:'Valoración media',
    order_id:'N.º de pedido', status:'Estado', date:'Fecha', payment_method:'Método de pago', customer:'Cliente',
    email:'Correo', phone:'Teléfono', shipping_address:'Dirección de envío', order_items:'Artículos del pedido', grand_total:'Total general',
    wishlist:'Favoritos', clear_all:'Borrar todo', your_wishlist_empty:'Tu lista de favoritos está vacía', start_shopping:'Empezar a comprar',
    profile:'Perfil', full_name:'Nombre completo', role:'Rol', change_password:'Cambiar contraseña', save_changes:'Guardar cambios',
    product:'Producto', name:'Nombre', price:'Precio', shipping_info:'Información de envío', order_summary:'Resumen del pedido',
    place_order:'Realizar pedido', back_to_cart:'Volver al carrito', admin_panel:'Panel de administración', staff_panel:'Panel de personal',
    dashboard:'Panel', manage_products:'Gestionar productos', manage_orders:'Gestionar pedidos', manage_users:'Gestionar usuarios',
    search:'Buscar', apply:'Aplicar', reset:'Restablecer', loading:'Cargando...', error:'Error', success:'Éxito',
    warning:'Advertencia', info:'Información', close:'Cerrar', confirm:'Confirmar', cancel:'Cancelar', save:'Guardar',
    delete:'Eliminar', edit:'Editar', view:'Ver', back:'Atrás'
  }
};

// ==================== UTILITY FUNCTIONS ====================
function escapeHtml(str) { 
  if (!str) return ''; 
  return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;'); 
}

function convertPrice(usdPrice) {
  if (usdPrice == null || isNaN(usdPrice)) return `${currencySymbols[currentCurrency] || '$'}0`;
  const rate = exchangeRates[currentCurrency] || 1;
  let converted = usdPrice * rate;
  let symbol = currencySymbols[currentCurrency] || '$';
  if (['KRW','VND','JPY','CNY'].includes(currentCurrency)) { 
    converted = Math.round(converted); 
    return `${symbol}${converted.toLocaleString()}`; 
  }
  return `${symbol}${converted.toFixed(2)}`;
}

function getImageUrl(path) {
  if (!path) return null;
  // Chuẩn hóa dữ liệu cũ: bỏ host localhost/127.0.0.1 -> đường dẫn tương đối (để chạy đúng trên Render)
  path = path.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/image/')) return `${path}`;
  if (path.startsWith('/uploads/')) return `${path.replace('/uploads', '/image')}`;
  if (path.startsWith('image/')) return `/${path}`;
  if (!path.includes('/')) return `/image/products/${path}`;
  if (path.startsWith('/')) return `${path}`;
  return `/${path}`;
}

// ==================== TOAST ====================
class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }
  init() {
    if (!document.querySelector('.toast-container')) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.querySelector('.toast-container');
    }
  }
  show(message, options = {}) {
    const { title = '', type = 'success', duration = 3000, closable = true } = options;
    const toast = this.createToastElement(message, title, type, closable, duration);
    this.container.appendChild(toast);
    setTimeout(() => this.remove(toast), duration);
    return toast;
  }
  createToastElement(message, title, type, closable, duration) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✓', error: '✗', warning: '', info: '' };
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || '✓'}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${this.escapeHtml(title)}</div>` : ''}
        <div class="toast-message">${this.escapeHtml(message)}</div>
      </div>
      ${closable ? '<button class="toast-close">&times;</button>' : ''}
      <div class="toast-progress"></div>
    `;
    if (closable) {
      toast.querySelector('.toast-close').addEventListener('click', () => this.remove(toast));
    }
    const progress = toast.querySelector('.toast-progress');
    if (progress) {
      progress.style.animation = `progress ${duration}ms linear forwards`;
    }
    return toast;
  }
  remove(toast) {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }
  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
  }
  success(message, title = 'Success') { return this.show(message, { title, type: 'success' }); }
  error(message, title = 'Error') { return this.show(message, { title, type: 'error' }); }
  warning(message, title = 'Warning') { return this.show(message, { title, type: 'warning' }); }
  info(message, title = 'Info') { return this.show(message, { title, type: 'info' }); }
}
window.toast = new ToastManager();

// Toast styles
if (!document.querySelector('#toast-style')) {
  const style = document.createElement('style');
  style.id = 'toast-style';
  style.textContent = `
    .toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 12px; }
    .toast { min-width: 280px; max-width: 400px; background: white; border-radius: 12px; padding: 16px 20px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 12px; animation: slideInRight 0.3s ease; position: relative; overflow: hidden; border-left: 4px solid; }
    .toast-success { border-left-color: #10b981; } .toast-success .toast-icon { color: #10b981; }
    .toast-error { border-left-color: #ef4444; } .toast-error .toast-icon { color: #ef4444; }
    .toast-warning { border-left-color: #f59e0b; } .toast-warning .toast-icon { color: #f59e0b; }
    .toast-info { border-left-color: #3b82f6; } .toast-info .toast-icon { color: #3b82f6; }
    .toast-icon { font-size: 24px; flex-shrink: 0; } .toast-content { flex: 1; }
    .toast-title { font-weight: 600; font-size: 0.9rem; margin-bottom: 4px; color: #1a1a1a; }
    .toast-message { font-size: 0.8rem; color: #666; line-height: 1.4; }
    .toast-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #999; width: 24px; height: 24px; border-radius: 50%; }
    .toast-close:hover { background: #f0f0f0; color: #333; }
    .toast-progress { position: absolute; bottom: 0; left: 0; height: 3px; background: currentColor; animation: progress 3s linear forwards; }
    @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    @keyframes progress { from { width: 100%; } to { width: 0%; } }
    .toast-exit { animation: slideOutRight 0.3s ease forwards; }
  `;
  document.head.appendChild(style);
}

// ==================== LOADING SPINNER ====================
function showLoading() {
  let loading = document.getElementById('global-loading');
  if (!loading) {
    loading = document.createElement('div');
    loading.id = 'global-loading';
    loading.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000; backdrop-filter: blur(3px);`;
    loading.innerHTML = `<div style="background: white; padding: 20px 30px; border-radius: 16px; display: flex; flex-direction: column; align-items: center; gap: 12px;"><div class="loading-spinner" style="width: 40px; height: 40px; border: 3px solid #e5e5e5; border-top-color: #1a1a1a; border-radius: 50%; animation: spin 0.8s linear infinite;"></div><span style="color: #666;">Loading...</span></div>`;
    document.body.appendChild(loading);
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }
  loading.style.display = 'flex';
}

function hideLoading() {
  const loading = document.getElementById('global-loading');
  if (loading) loading.style.display = 'none';
}

// ==================== HÀM LOAD PRODUCTS (GLOBAL) ====================
window.loadProducts = async function(silent) {
  try {
    if (!silent) showLoading();
    // Lọc danh mục làm ở client -> phải tải HẾT sản phẩm (không để limit mặc định 20 cắt bớt)
    const res = await fetch(`${API_URL}/products?limit=500`);
    const data = await res.json();
    window.products = data.products || [];
    products = window.products;
    if (!silent) hideLoading();
    return products;
  } catch(e) {
    if (!silent) hideLoading();
    console.error('Load products error:', e);
    if (window.toast) toast.error('Failed to load products');
    return [];
  }
};

// ==================== HÀM LOAD BANNERS (GLOBAL) ====================
window.loadBanners = async function() {
  try {
    const res = await fetch(`${API_URL}/banners/active`);
    window.banners = await res.json();
    banners = window.banners;
    return banners;
  } catch(e) {
    console.error('Load banners error:', e);
    window.banners = [];
    banners = [];
    return [];
  }
};

// ==================== CART FUNCTIONS ====================
function updateCartCount() { 
  let cart = JSON.parse(localStorage.getItem('shotyCart')) || []; 
  let count = cart.reduce((s,i)=>s+i.quantity,0); 
  const span = document.getElementById('cartCount'); 
  if(span) span.textContent = count; 
}
function openCart() { window.location.href = '/crud/cart.html'; }

// ==================== AUTH FUNCTIONS ====================
async function checkLoginStatus() {
  const token = localStorage.getItem('authToken');
  const userId = localStorage.getItem('currentUserId');
  if (!token || !userId) { 
    currentUser = null; 
    updateUserUI(); 
    return false;
  }
  try {
    const res = await fetch(`${API_URL}/users/${userId}`, { 
      headers: { 'Authorization': `Bearer ${token}` } 
    });
    if (res.ok) {
      currentUser = await res.json();
      authToken = token;
      updateUserUI();
      // Nếu đang ở trang login mà đã đăng nhập rồi thì redirect đúng dashboard
      const path = window.location.pathname;
      if (path === '/crud/login.html' || path.endsWith('/login.html')) {
        if (currentUser.role === 'admin') {
          window.location.href = '/admin/admin.html';
        } else if (currentUser.role === 'staff') {
          window.location.href = '/staff/staff.html';
        }
      }
      return true;
    } else {
      logout();
      return false;
    }
  } catch(e) { 
    console.error(e); 
    return false;
  }
}

function updateUserUI() {
  const userMenuName = document.getElementById('userMenuName');
  const userMenuEmail = document.getElementById('userMenuEmail');
  const userMenuAvatar = document.getElementById('userMenuAvatar');
  const avatarImg = document.getElementById('avatarImg');
  const userMenuText = document.getElementById('userMenuText');
  const logoutBtnHeader = document.getElementById('logoutBtnHeader');
  
  if (currentUser) {
    let roleBadge = currentUser.role === 'admin' ? 
      '<span class="role-badge" style="background:#1a1a1a;color:white;padding:2px 8px;border-radius:12px;font-size:10px;margin-left:5px;">ADMIN</span>' : 
      (currentUser.role === 'staff' ? 
        '<span class="role-badge" style="background:#666;color:white;padding:2px 8px;border-radius:12px;font-size:10px;margin-left:5px;">STAFF</span>' : 
        '<span class="role-badge" style="background:#e5e5e5;color:#666;padding:2px 8px;border-radius:12px;font-size:10px;margin-left:5px;">CUSTOMER</span>');
    
    if (userMenuName) userMenuName.innerHTML = escapeHtml(currentUser.name) + ' ' + roleBadge;
    if (userMenuEmail) userMenuEmail.textContent = currentUser.email;
    if (userMenuAvatar) userMenuAvatar.src = getImageUrl(currentUser.avatar) || 'https://picsum.photos/50/50';
    if (avatarImg) { 
      avatarImg.src = getImageUrl(currentUser.avatar) || 'https://picsum.photos/24/24'; 
      avatarImg.style.display = 'inline-block'; 
    }
    if (userMenuText) userMenuText.style.display = 'none';
    if (logoutBtnHeader) logoutBtnHeader.style.display = 'block';
    
    const adminLink = document.getElementById('adminLink');
    const staffLink = document.getElementById('staffLink');
    if (adminLink) adminLink.style.display = currentUser.role === 'admin' ? 'block' : 'none';
    if (staffLink) staffLink.style.display = (currentUser.role === 'admin' || currentUser.role === 'staff') ? 'block' : 'none';
    loadNotifications();
  } else {
    const nl = document.getElementById('notificationList');
    if (nl) nl.innerHTML = '<div style="padding:16px;text-align:center;color:#999;font-size:.8rem;">Đăng nhập để xem thông báo</div>';
    updateNotifBadge(0);
    if (userMenuName) userMenuName.innerHTML = 'Guest User';
    if (userMenuEmail) userMenuEmail.textContent = 'guest@example.com';
    if (userMenuAvatar) userMenuAvatar.src = 'https://picsum.photos/50/50?random=guest';
    if (avatarImg) { 
      avatarImg.src = 'https://picsum.photos/24/24?random=guest'; 
      avatarImg.style.display = 'none'; 
    }
    if (userMenuText) userMenuText.style.display = 'inline-block';
    if (logoutBtnHeader) logoutBtnHeader.style.display = 'none';
  }
}

// ==================== THÔNG BÁO ====================
let _notifUnread = 0;

function notifTimeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'vừa xong';
  if (s < 3600) return Math.floor(s / 60) + ' phút trước';
  if (s < 86400) return Math.floor(s / 3600) + ' giờ trước';
  return Math.floor(s / 86400) + ' ngày trước';
}

function notifLink(n) {
  const d = n.data || {};
  if (n.type === 'order') return '/crud/order-history.html';
  if (n.type === 'post' && d.slug) return '/crud/blog-detail.html?slug=' + d.slug;
  if (n.type === 'product' && d.productId) return '/crud/product-detail.html?id=' + d.productId;
  return null;
}

function updateNotifBadge(count) {
  _notifUnread = count || 0;
  const trigger = document.getElementById('userMenuTrigger');
  if (!trigger) return;
  let badge = document.getElementById('notifBadge');
  if (!badge) {
    badge = document.createElement('span');
    badge.id = 'notifBadge';
    badge.style.cssText = 'position:absolute;top:-6px;right:-6px;background:#dc2626;color:#fff;font-size:10px;font-weight:700;min-width:16px;height:16px;border-radius:99px;display:none;align-items:center;justify-content:center;padding:0 4px;line-height:1;';
    trigger.style.position = 'relative';
    trigger.appendChild(badge);
  }
  badge.textContent = _notifUnread > 9 ? '9+' : _notifUnread;
  badge.style.display = _notifUnread > 0 ? 'flex' : 'none';
}

async function loadNotifications() {
  const token = localStorage.getItem('authToken');
  const list = document.getElementById('notificationList');
  if (!token || !currentUser) { updateNotifBadge(0); return; }
  try {
    const res = await fetch(`${API_URL}/notifications?limit=20`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) return;
    const data = await res.json();
    renderNotifications(data.notifications || [], data.unreadCount || 0);
  } catch (e) { /* im lặng */ }
}

function renderNotifications(items, unread) {
  const list = document.getElementById('notificationList');
  if (!list) return;
  updateNotifBadge(unread);
  if (!items.length) {
    list.innerHTML = '<div style="padding:16px;text-align:center;color:#999;font-size:.8rem;">Chưa có thông báo</div>';
    return;
  }
  list.innerHTML = items.map(n => `
    <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n._id}" data-link="${notifLink(n) || ''}">
      <div class="notif-title">${escapeHtml(n.title)}</div>
      <div class="notif-message">${escapeHtml(n.message)}</div>
      <div class="notif-time">${notifTimeAgo(n.createdAt)}</div>
    </div>`).join('');
  list.querySelectorAll('.notification-item').forEach(el => {
    el.addEventListener('click', async () => {
      const id = el.dataset.id, link = el.dataset.link;
      if (el.classList.contains('unread')) {
        try { await fetch(`${API_URL}/notifications/${id}/read`, { method: 'PUT', headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } }); } catch (e) {}
        el.classList.remove('unread');
        updateNotifBadge(Math.max(0, _notifUnread - 1));
      }
      if (link) window.location.href = link;
    });
  });
}

async function markAllNotificationsRead() {
  try { await fetch(`${API_URL}/notifications/read-all`, { method: 'PUT', headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } }); } catch (e) {}
  loadNotifications();
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUserId');
  currentUser = null;
  updateUserUI();
  if (window.toast) toast.success('Logged out successfully!');
  setTimeout(() => {
    // SỬA: chuyển hướng về trang login thay vì về index
    window.location.href = '/crud/login.html';
  }, 500);
}

// ==================== ENSURE AUTHENTICATED (FIX LỖI order-history.html) ====================
async function ensureAuthenticated(redirect = false) {
  if (currentUser) return true;
  await checkLoginStatus();
  if (currentUser) return true;
  if (redirect) {
    const here = location.pathname + location.search;
    window.location.href = '/crud/login.html?redirect=' + encodeURIComponent(here);
    return false;
  }
  return false;
}
window.ensureAuthenticated = ensureAuthenticated;
// Bắt buộc đăng nhập: nếu chưa -> chuyển sang login (nhớ trang để quay về). Trả false nếu chưa đăng nhập.
window.requireLogin = function() { return ensureAuthenticated(true); };

// ==================== LANGUAGE & CURRENCY ====================
function setupLanguageAndCurrency() {
  const savedLang = localStorage.getItem('preferredLanguage');
  if (savedLang && translations[savedLang]) currentLanguage = savedLang;
  const savedCurrency = localStorage.getItem('preferredCurrency');
  if (savedCurrency && exchangeRates[savedCurrency]) currentCurrency = savedCurrency;
  
  const langDropdown = document.getElementById('langDropdown');
  if (langDropdown) {
    langDropdown.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        currentLanguage = link.dataset.lang;
        localStorage.setItem('preferredLanguage', currentLanguage);
        translatePage();
        updateLangButton();
        if (typeof renderCartModal === 'function') renderCartModal();
        if (typeof window.onLanguageChange === 'function') window.onLanguageChange();
        window.toast?.success(`Language changed to ${currentLanguage.toUpperCase()}`);
      });
    });
  }
  
  const currencyDropdown = document.getElementById('currencyDropdown');
  if (currencyDropdown) {
    currencyDropdown.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        currentCurrency = link.dataset.currency;
        localStorage.setItem('preferredCurrency', currentCurrency);
        updateCurrencyButton();
        if (typeof renderCartModal === 'function') renderCartModal();
        if (typeof window.onCurrencyChange === 'function') window.onCurrencyChange();
        window.toast?.success(`Currency changed to ${currentCurrency}`);
      });
    });
  }
  
  updateLangButton(); 
  updateCurrencyButton(); 
  translatePage();
}

function updateLangButton() { 
  const display = { en:'EN', vi:'VI', ko:'KO', ja:'JA', zh:'ZH', 'zh-tw':'ZH', es:'ES' }; 
  const btn = document.getElementById('langBtn'); 
  if(btn) btn.innerHTML = `${display[currentLanguage] || 'EN'} ▼`; 
}
function updateCurrencyButton() { 
  const display = { KRW:'KRW ₩', USD:'USD $', JPY:'JPY ¥', CNY:'CNY ¥', MXN:'MXN $', VND:'VND ₫' }; 
  const btn = document.getElementById('currencyBtn'); 
  if(btn) btn.innerHTML = `${display[currentCurrency] || 'USD $'} ▼`; 
}

function translatePage() {
  const t = translations[currentLanguage];
  if (!t) return;
  
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.dataset.key;
    if (t[key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.placeholder) el.placeholder = t[key];
      } else if (el.tagName === 'BUTTON' && el.value) {
        el.value = t[key];
      } else {
        el.innerText = t[key];
      }
    }
  });

  // Dịch placeholder của input/textarea dùng data-placeholder-key
  document.querySelectorAll('[data-placeholder-key]').forEach(el => {
    const key = el.dataset.placeholderKey;
    if (t[key]) el.placeholder = t[key];
  });

  // Cập nhật thuộc tính lang của trang
  document.documentElement.lang = currentLanguage;
}

// ==================== DROPDOWN MENU ====================
function setupDropdown() {
  const trigger = document.getElementById('userMenuTrigger');
  const menu = document.getElementById('userMenu');
  if (!trigger || !menu) return;
  
  let hoverTimeout;
  
  function showMenu() {
    clearTimeout(hoverTimeout);
    menu.classList.add('show');
    const rect = trigger.getBoundingClientRect();
    menu.style.top = rect.bottom + window.scrollY + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    menu.style.left = 'auto';
  }
  
  function hideMenu() {
    hoverTimeout = setTimeout(() => {
      menu.classList.remove('show');
    }, 200);
  }
  
  trigger.addEventListener('mouseenter', showMenu);
  trigger.addEventListener('mouseleave', hideMenu);
  menu.addEventListener('mouseenter', () => clearTimeout(hoverTimeout));
  menu.addEventListener('mouseleave', hideMenu);

  // Click: chưa đăng nhập -> sang trang login (nhớ trang hiện tại để quay về); đã đăng nhập -> bật/tắt menu
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    if (!currentUser) {
      window.location.href = '/crud/login.html?redirect=' + encodeURIComponent(location.pathname + location.search);
    } else if (menu.classList.contains('show')) {
      menu.classList.remove('show');
    } else {
      showMenu();
    }
  });
}

// ==================== GEOLOCATION ====================
function getUserLocation() {
  const span = document.getElementById('userLocation');
  if (!span) return;
  span.textContent = 'Detecting...';
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      span.textContent = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
    }, () => { 
      span.textContent = 'Location unknown'; 
    });
  } else { 
    span.textContent = 'Location unknown'; 
  }
}

// ==================== DARK MODE ====================
function initDarkMode() {
  const savedTheme = localStorage.getItem('darkMode');
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (savedTheme === 'enabled') {
    document.body.classList.add('dark-mode');
    if (darkModeToggle) darkModeToggle.innerHTML = '☀️';
  } else {
    document.body.classList.remove('dark-mode');
    if (darkModeToggle) darkModeToggle.innerHTML = '🌙';
  }
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
      darkModeToggle.innerHTML = isDark ? '☀️' : '🌙';
      window.toast?.info(isDark ? 'Dark mode enabled' : 'Light mode enabled');
    });
  }
}

// ==================== LOAD HEADER ====================
async function loadHeader() {
  const placeholder = document.getElementById('header-placeholder');
  if (!placeholder) return;
  try {
    const response = await fetch('/components/header.html');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const html = await response.text();
    placeholder.innerHTML = html;
    updateCartCount();
    updateUserUI();
    setupDropdown();
    setupLanguageAndCurrency();
    getUserLocation();
    initDarkMode();
    const cartIcon = document.getElementById('cartIcon'); 
    if(cartIcon) cartIcon.addEventListener('click', openCart);
    const logoutBtn = document.getElementById('logoutBtn'); 
    if(logoutBtn) logoutBtn.addEventListener('click', logout);
    const logo = document.querySelector('.logo-top');
    if(logo) logo.addEventListener('click', () => window.location.href = '/');
    const markAllBtn = document.getElementById('markAllNotificationsBtn');
    if (markAllBtn) markAllBtn.addEventListener('click', markAllNotificationsRead);
    // Tìm kiếm từ MỌI trang -> chuyển sang trang chủ hiển thị sản phẩm khớp
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const goSearch = () => {
      const term = (searchInput?.value || '').trim();
      window.location.href = '/index.html' + (term ? '?search=' + encodeURIComponent(term) : '');
    };
    if (searchBtn) searchBtn.addEventListener('click', goSearch);
    if (searchInput) searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') goSearch(); });
    if (typeof window.initPage === 'function') window.initPage();
  } catch(error) {
    console.error('Failed to load header:', error);
    placeholder.innerHTML = `<div class="top-bar" style="background:#fff;padding:1rem;text-align:center;">SHOTTYSHOP - <a href="/">Home</a> | <a href="/crud/cart.html">Cart</a> | <a href="/crud/login.html">Login</a></div>`;
    if (typeof window.initPage === 'function') window.initPage();
  }
}

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', async () => {
  await loadHeader();
  await checkLoginStatus();
});

// Tự động làm mới thông báo mỗi 60 giây
setInterval(() => { if (currentUser) loadNotifications(); }, 60000);

// ==================== TỰ ĐỘNG CẬP NHẬT (không cần tải lại trang) ====================
// Mỗi trang gọi registerAutoRefresh(fn) để đăng ký hàm tải lại dữ liệu của trang đó.
// Engine sẽ tự gọi lại các hàm này khi: quay lại tab, cửa sổ được focus, và định kỳ mỗi 30s.
(function setupAutoRefresh(){
  const refreshers = [];
  window.registerAutoRefresh = function(fn){ if (typeof fn === 'function' && !refreshers.includes(fn)) refreshers.push(fn); };

  // Bỏ qua làm mới khi đang gây phiền: tab ẩn, đang nhập liệu, hoặc đang mở popup/modal
  window.autoRefreshShouldSkip = function(){
    if (document.hidden) return true;
    const ae = document.activeElement;
    if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return true;
    const modals = document.querySelectorAll('.modal, [id$="Modal"]');
    for (const m of modals) {
      const d = getComputedStyle(m).display;
      if (d && d !== 'none') return true;
    }
    return false;
  };

  let running = false;
  async function runAll(force){
    if (running) return;
    if (!force && window.autoRefreshShouldSkip()) return;
    running = true;
    for (const fn of refreshers) { try { await fn(); } catch(e){ console.error('autoRefresh:', e); } }
    running = false;
  }
  window.triggerAutoRefresh = () => runAll(true); // gọi thủ công sau khi thực hiện 1 hành động

  document.addEventListener('visibilitychange', () => { if (!document.hidden) runAll(); });
  window.addEventListener('focus', () => runAll());
  setInterval(() => runAll(), 30000);
})();

// ==================== FIXED HEADER + STICKY MENU ====================
function adjustFixedHeader() {
  const header = document.querySelector('.top-bar');
  if (!header) return;
  
  const headerHeight = header.offsetHeight;
  // Gán biến CSS --header-height
  document.documentElement.style.setProperty('--header-height', headerHeight + 'px');
  // Đảm bảo body có padding-top (nếu chưa có)
  document.body.style.paddingTop = headerHeight + 'px';
}

// Lắng nghe khi header thay đổi kích thước (resize, font load, ...)
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    adjustFixedHeader();
  }, 100);
});

// Nếu có MutationObserver để phát hiện header thay đổi nội dung (load ảnh, ...)
const observer = new MutationObserver(() => {
  adjustFixedHeader();
});
observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

// Gọi lại khi header đã load xong (trong loadHeader)
// Vì loadHeader đã có sẵn, ta sẽ patch nó để gọi adjustFixedHeader sau khi render
const originalLoadHeader = loadHeader;
window.loadHeader = async function() {
  await originalLoadHeader();
  adjustFixedHeader();
};

// Nếu trang đã có header từ lúc đầu (ví dụ admin, staff không dùng loadHeader) thì vẫn gọi
document.addEventListener('DOMContentLoaded', () => {
  adjustFixedHeader();
});

// ==================== NHÚNG VIDEO / BÀI VIẾT MẠNG XÃ HỘI ====================
// Tự nhận diện YouTube, TikTok, Facebook, Vimeo, Zalo... từ 1 URL → trả về HTML nhúng
function buildEmbed(url) {
  if (!url || typeof url !== 'string') return '';
  url = url.trim();
  if (!/^https?:\/\//i.test(url)) return '';
  let m;
  // YouTube (watch, youtu.be, embed, shorts)
  m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (m) return `<div class="embed embed-video"><iframe src="https://www.youtube.com/embed/${m[1]}" title="YouTube" loading="lazy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
  // TikTok
  m = url.match(/tiktok\.com\/(?:.*\/video\/|.*[?&]item_id=|v\/)(\d{6,})/) || url.match(/tiktok\.com\/.*\/(\d{15,})/);
  if (m) return `<div class="embed embed-tiktok"><iframe src="https://www.tiktok.com/embed/v2/${m[1]}" title="TikTok" loading="lazy" frameborder="0" scrolling="no" allow="encrypted-media; fullscreen" allowfullscreen></iframe></div>`;
  // Vimeo
  m = url.match(/vimeo\.com\/(\d+)/);
  if (m) return `<div class="embed embed-video"><iframe src="https://player.vimeo.com/video/${m[1]}" title="Vimeo" loading="lazy" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
  // Facebook (video hoặc post)
  if (/facebook\.com|fb\.watch/i.test(url)) {
    const isVideo = /\/videos?\/|\/reel\/|\/watch|fb\.watch/i.test(url);
    const plugin = isVideo ? 'video.php' : 'post.php';
    return `<div class="embed embed-fb"><iframe src="https://www.facebook.com/plugins/${plugin}?href=${encodeURIComponent(url)}&show_text=true&width=500" title="Facebook" loading="lazy" frameborder="0" scrolling="no" allowfullscreen allow="encrypted-media; clipboard-write; web-share"></iframe></div>`;
  }
  // Zalo & các link khác → thẻ liên kết (Zalo không hỗ trợ nhúng công khai)
  const isZalo = /zalo\.me|zalo\.com/i.test(url);
  const icon = isZalo ? '' : '';
  const label = isZalo ? 'Xem trên Zalo' : url.replace(/^https?:\/\//, '').slice(0, 60);
  return `<a class="embed-link" href="${url}" target="_blank" rel="noopener noreferrer">${icon} ${escapeHtml(label)}</a>`;
}

// Nhận 1 URL hoặc mảng URL → trả về khối HTML đã nhúng
function renderEmbeds(urls) {
  if (!urls) return '';
  const arr = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
  const html = arr.map(buildEmbed).filter(Boolean).join('');
  return html ? `<div class="embed-grid">${html}</div>` : '';
}

window.buildEmbed = buildEmbed;
window.renderEmbeds = renderEmbeds;

// CSS cho khối nhúng (tiêm 1 lần)
(function injectEmbedStyles() {
  if (document.getElementById('embed-styles')) return;
  const s = document.createElement('style');
  s.id = 'embed-styles';
  s.textContent = `
    .embed-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; margin: 12px 0; }
    .embed { position: relative; width: 100%; background: #000; border-radius: 12px; overflow: hidden; border: 1px solid rgba(0,0,0,.08); }
    .embed-video { aspect-ratio: 16 / 9; }
    .embed-tiktok { aspect-ratio: 9 / 16; max-height: 720px; background: #fff; }
    .embed-fb { min-height: 520px; background: #fff; }
    .embed iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
    .embed-fb iframe { position: static; min-height: 520px; }
    .embed-link { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; background: var(--bg-card, #f5f5f5); border: 1px solid var(--border-color, #e5e5e5); border-radius: 10px; color: var(--text-primary, #1a1a1a); text-decoration: none; font-size: .9rem; font-weight: 500; word-break: break-all; }
    .embed-link:hover { border-color: #1a1a1a; }
  `;
  document.head.appendChild(s);
})();
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
