export type TranslatorKey =
  | 'nav.allProducts'
  | 'nav.home'
  | 'nav.browse'
  | 'nav.orders'
  | 'nav.cart'
  | 'nav.askAi'
  | 'nav.myAccount'
  | 'nav.myOrders'
  | 'nav.signOut'
  | 'nav.signIn'
  | 'nav.menuBrowse'
  | 'search.placeholder'
  | 'search.label'
  | 'home.heroBadge'
  | 'home.heroTitleA'
  | 'home.heroTitleB'
  | 'home.heroBody'
  | 'home.shopAll'
  | 'home.findHealthy'
  | 'home.fastDelivery'
  | 'home.fastDeliveryBody'
  | 'home.qualityChecked'
  | 'home.qualityBody'
  | 'home.easyCheckout'
  | 'home.easyCheckoutBody'
  | 'home.explore'
  | 'home.shopByCategory'
  | 'home.viewAll'
  | 'home.availableNow'
  | 'home.goodStuff'
  | 'home.seeEverything'
  | 'home.forKitchen'
  | 'home.viewCategory'
  | 'catalog.discover'
  | 'catalog.allProducts'
  | 'catalog.allProductsBody'
  | 'catalog.backToShopping'
  | 'catalog.browseCatalog'
  | 'catalog.resultsFor'
  | 'catalog.categoryFallback'
  | 'catalog.clearFilters'
  | 'catalog.noProducts'
  | 'catalog.noProductsBody'
  | 'catalog.emptyTitle'
  | 'catalog.emptyBody'
  | 'catalog.viewAll'
  | 'catalog.seeEverything'
  | 'catalog.inStock'
  | 'catalog.outOfStock'
  | 'catalog.everydayEssential'
  | 'catalog.tryAgain'
  | 'catalog.loadError'
  | 'catalog.priceRange'
  | 'catalog.filters'
  | 'catalog.sort'
  | 'catalog.sortDefault'
  | 'catalog.sortPriceAsc'
  | 'catalog.sortPriceDesc'
  | 'catalog.sortNameAsc'
  | 'catalog.sortNewest'
  | 'catalog.allUnits'
  | 'product.unitFallback'
  | 'catalog.notFound'
  | 'catalog.signInToAdd'
  | 'commerce.detailsSecure'
  | 'commerce.downloadInvoice'
  | 'account.cancelRequest'
  | 'catalog.viewProduct'
  | 'product.addToCart'
  | 'product.addProductToCart'
  | 'product.buyNow'
  | 'product.inStock'
  | 'product.outOfStock'
  | 'product.unit'
  | 'product.barcode'
  | 'product.supplier'
  | 'product.groceryEssential'
  | 'product.related'
  | 'product.relatedEyebrow'
  | 'cart.title'
  | 'cart.basketItems'
  | 'cart.empty'
  | 'cart.emptyBody'
  | 'cart.startShopping'
  | 'cart.continueShopping'
  | 'cart.clearCart'
  | 'cart.subtotal'
  | 'cart.discount'
  | 'cart.delivery'
  | 'cart.free'
  | 'cart.total'
  | 'cart.checkout'
  | 'cart.promoPlaceholder'
  | 'cart.apply'
  | 'cart.itemsReady'
  | 'cart.emptyFind'
  | 'cart.emptyGroceries'
  | 'cart.removeItem'
  | 'cart.removePromotion'
  | 'checkout.title'
  | 'checkout.body'
  | 'checkout.deliveryAddress'
  | 'checkout.deliveryShort'
  | 'checkout.orderSummary'
  | 'checkout.placeOrder'
  | 'checkout.readyTitle'
  | 'checkout.reviewBody'
  | 'checkout.items'
  | 'checkout.amount'
  | 'checkout.cancel'
  | 'checkout.almostThere'
  | 'checkout.stepDelivery'
  | 'checkout.stepPayment'
  | 'checkout.stepPromotion'
  | 'checkout.name'
  | 'checkout.phone'
  | 'checkout.email'
  | 'checkout.address'
  | 'checkout.cashTitle'
  | 'checkout.cashBody'
  | 'checkout.vnpayBody'
  | 'checkout.promoApplied'
  | 'checkout.promoInvalid'
  | 'checkout.orderFailed'
  | 'checkout.placing'
  | 'checkout.detailsSecure'
  | 'payment.successTitle'
  | 'payment.failTitle'
  | 'payment.successBody'
  | 'payment.failBody'
  | 'payment.viewOrder'
  | 'payment.reviewOrder'
  | 'orders.title'
  | 'orders.order'
  | 'orders.orderDetails'
  | 'orders.orderProgress'
  | 'orders.requestRefund'
  | 'orders.body'
  | 'orders.noOrders'
  | 'orders.noOrdersBody'
  | 'orders.backToOrders'
  | 'orders.cancelOrder'
  | 'orders.canceling'
  | 'orders.orderCanceled'
  | 'orders.cannotCancel'
  | 'orders.notFound'
  | 'orders.downloadFailed'
  | 'orders.placed'
  | 'orders.productFallback'
  | 'refund.title'
  | 'refund.amount'
  | 'refund.reason'
  | 'refund.bank'
  | 'refund.accountNumber'
  | 'refund.accountHolder'
  | 'refund.submit'
  | 'refund.submitting'
  | 'refund.submitted'
  | 'refund.submitFailed'
  | 'orders.browseProducts'
  | 'account.profile'
  | 'account.orders'
  | 'account.bills'
  | 'account.refunds'
  | 'account.security'
  | 'account.myAccount'
  | 'bills.title'
  | 'bills.body'
  | 'bills.paidBills'
  | 'bills.totalSpent'
  | 'bills.showTotal'
  | 'bills.noBills'
  | 'bills.noBillsBody'
  | 'refunds.title'
  | 'refunds.body'
  | 'refunds.canceled'
  | 'refunds.cancelFailed'
  | 'refunds.noRequests'
  | 'refunds.noRequestsBody'
  | 'auth.welcomeBack'
  | 'auth.welcomeBody'
  | 'auth.createAccount'
  | 'auth.createBody'
  | 'auth.email'
  | 'auth.password'
  | 'auth.emailPlaceholder'
  | 'auth.passwordPlaceholder'
  | 'auth.haveAccount'
  | 'auth.createOne'
  | 'auth.welcomeToast'
  | 'auth.signInFailed'
  | 'auth.shortPassword'
  | 'auth.mismatch'
  | 'auth.profileUpdated'
  | 'auth.haveNoAccount'
  | 'auth.fullName'
  | 'auth.phone'
  | 'auth.address'
  | 'auth.confirm'
  | 'auth.signingIn'
  | 'auth.accountCreated'
  | 'auth.createFailed'
  | 'auth.creating'
  | 'auth.createAccountBtn'
  | 'auth.repeatPassword'
  | 'auth.profileTitle'
  | 'auth.profileBody'
  | 'auth.profileFailed'
  | 'auth.saving'
  | 'auth.saveChanges'
  | 'auth.securityTitle'
  | 'auth.securityBody'
  | 'auth.currentPassword'
  | 'auth.newPassword'
  | 'auth.confirmNew'
  | 'auth.newShort'
  | 'auth.changed'
  | 'auth.changeFailed'
  | 'auth.updating'
  | 'auth.changePassword'
  | 'auth.showPassword'
  | 'auth.hidePassword'
  | 'auth.myAccountEyebrow'
  | 'ai.title'
  | 'ai.subtitle'
  | 'ai.placeholder'
  | 'ai.send'
  | 'ai.close'
  | 'ai.suggestedBundle'
  | 'ai.addAll'
  | 'ai.greeting'
  | 'ai.unavailable'
  | 'ai.signInToAdd'
  | 'ai.addedToCart'
  | 'ai.addFailed'
  | 'footer.tagline'
  | 'footer.shop'
  | 'footer.account'
  | 'footer.help'
  | 'footer.rights'
  | 'footer.picked'
  | 'footer.checkout'
  | 'footer.paymentResult'
  | 'common.close'
  | 'common.cancel'
  | 'common.retry'
  | 'common.dismiss'
  | 'common.decrease'
  | 'common.increase'
  | 'common.openMenu'
  | 'common.closeMenu'
  | 'locale.label';

const dict: Record<TranslatorKey, string> = {
  'nav.allProducts': 'Tất cả sản phẩm',
  'nav.home': 'Trang chủ',
  'nav.browse': 'Duyệt',
  'nav.orders': 'Đơn hàng',
  'nav.cart': 'Giỏ hàng',
  'nav.askAi': 'Hỏi AI',
  'nav.myAccount': 'Tài khoản của tôi',
  'nav.myOrders': 'Đơn hàng của tôi',
  'nav.signOut': 'Đăng xuất',
  'nav.signIn': 'Đăng nhập',
  'nav.menuBrowse': 'Duyệt',
  'search.placeholder': 'Tìm sữa, đồ ăn vặt, đồ gia dụng...',
  'search.label': 'Tìm sản phẩm',
  'home.heroBadge': 'Lựa chọn tươi mới mỗi ngày',
  'home.heroTitleA': 'Món ngon,',
  'home.heroTitleB': 'tâm trạng vui.',
  'home.heroBody': 'Đồ tươi mỗi ngày, chọn kỹ và giao tận cửa mà không cần đi siêu thị.',
  'home.shopAll': 'Mua sắm tất cả',
  'home.findHealthy': 'Tìm món tốt cho sức khỏe',
  'home.fastDelivery': 'Giao hàng nhanh',
  'home.fastDeliveryBody': 'Tận cửa, đơn giản.',
  'home.qualityChecked': 'Kiểm tra chất lượng',
  'home.qualityBody': 'Tươi ngon hàng đầu.',
  'home.easyCheckout': 'Thanh toán dễ dàng',
  'home.easyCheckoutBody': 'Ít bước hơn, nhiều thời gian hơn.',
  'home.explore': 'Khám phá',
  'home.shopByCategory': 'Mua theo danh mục',
  'home.viewAll': 'Xem tất cả',
  'home.availableNow': 'Đang có sẵn',
  'home.goodStuff': 'Món ngon, sẵn sàng',
  'home.seeEverything': 'Xem mọi thứ',
  'home.forKitchen': 'Cho gian bếp của bạn',
  'home.viewCategory': 'Xem danh mục',
  'catalog.discover': 'Khám phá',
  'catalog.allProducts': 'Tất cả sản phẩm',
  'catalog.allProductsBody': 'Tìm đồ thiết yếu, đồ ăn vặt và món ngon mỗi ngày.',
  'catalog.backToShopping': 'Quay lại mua sắm',
  'catalog.browseCatalog': 'Duyệt danh mục',
  'catalog.resultsFor': 'Kết quả cho {search}',
  'catalog.categoryFallback': 'Danh mục',
  'catalog.clearFilters': 'Xóa bộ lọc',
  'catalog.noProducts': 'Không tìm thấy sản phẩm',
  'catalog.noProductsBody': 'Hãy thử từ khóa hoặc danh mục khác.',
  'catalog.emptyTitle': 'Chưa có sản phẩm',
  'catalog.emptyBody': 'Hãy quay lại sau để xem đồ tươi mới.',
  'catalog.viewAll': 'Xem tất cả',
  'catalog.seeEverything': 'Xem mọi thứ',
  'catalog.inStock': 'Còn hàng',
  'catalog.outOfStock': 'Hết hàng',
  'catalog.everydayEssential': 'Đồ thiết yếu mỗi ngày',
  'catalog.tryAgain': 'Thử lại',
  'catalog.loadError': 'Không tải được dữ liệu lúc này.',
  'catalog.priceRange': 'Khoảng giá',
  'catalog.filters': 'Bộ lọc',
  'catalog.sort': 'Sắp xếp',
  'catalog.sortDefault': 'Mặc định',
  'catalog.sortPriceAsc': 'Giá tăng dần',
  'catalog.sortPriceDesc': 'Giá giảm dần',
  'catalog.sortNameAsc': 'Tên A–Z',
  'catalog.sortNewest': 'Mới nhất',
  'catalog.allUnits': 'Tất cả',
  'product.unitFallback': 'sản phẩm',
  'catalog.notFound': 'Không tìm thấy sản phẩm hoặc đã ngừng bán.',
  'catalog.signInToAdd': 'Đăng nhập để thêm sản phẩm vào giỏ hàng.',
  'commerce.detailsSecure': 'Thông tin của bạn được gửi an toàn tới API khách hàng.',
  'commerce.downloadInvoice': 'Tải hóa đơn',
  'account.cancelRequest': 'Hủy yêu cầu',
  'catalog.viewProduct': 'Xem {name}',
  'product.addToCart': 'Thêm vào giỏ hàng',
  'product.addProductToCart': 'Thêm {name} vào giỏ hàng',
  'product.buyNow': 'Mua ngay',
  'product.inStock': 'Còn hàng',
  'product.outOfStock': 'Hiện đang hết hàng',
  'product.unit': 'Đơn vị',
  'product.barcode': 'Mã vạch',
  'product.supplier': 'Nhà cung cấp',
  'product.groceryEssential': 'Đồ thiết yếu',
  'product.related': 'Sản phẩm liên quan',
  'product.relatedEyebrow': 'Gợi ý cho bạn',
  'cart.title': 'Giỏ hàng của bạn',
  'cart.basketItems': 'Sản phẩm trong giỏ',
  'cart.empty': 'Giỏ hàng của bạn đang trống',
  'cart.emptyBody': 'Hãy thêm đồ thiết yếu để bắt đầu.',
  'cart.startShopping': 'Bắt đầu mua sắm',
  'cart.continueShopping': 'Tiếp tục mua sắm',
  'cart.clearCart': 'Xóa giỏ hàng',
  'cart.subtotal': 'Tạm tính',
  'cart.discount': 'Giảm giá',
  'cart.delivery': 'Giao hàng',
  'cart.free': 'Miễn phí',
  'cart.total': 'Tổng cộng',
  'cart.checkout': 'Thanh toán',
  'cart.promoPlaceholder': 'Nhập mã khuyến mãi',
  'cart.apply': 'Áp dụng',
  'cart.itemsReady': '{count} sản phẩm sẵn sàng thanh toán.',
  'cart.emptyFind': 'Tìm đồ thiết yếu mỗi ngày và thêm vào đây.',
  'cart.emptyGroceries': 'Thêm đồ đi chợ trước khi thanh toán.',
  'cart.removeItem': 'Xóa sản phẩm',
  'cart.removePromotion': 'Xóa khuyến mãi',
  'checkout.title': 'Thanh toán',
  'checkout.body': 'Một bước đơn giản giữa giỏ hàng và cửa nhà bạn.',
  'checkout.deliveryAddress': 'Địa chỉ giao hàng',
  'checkout.deliveryShort': 'Giao hàng',
  'checkout.orderSummary': 'Tóm tắt đơn hàng',
  'checkout.placeOrder': 'Đặt hàng',
  'checkout.readyTitle': 'Sẵn sàng khi bạn cần',
  'checkout.reviewBody': 'Vui lòng kiểm tra giỏ hàng trước khi đặt hàng.',
  'checkout.items': 'Sản phẩm',
  'checkout.amount': 'Số tiền',
  'checkout.cancel': 'Hủy',
  'checkout.almostThere': 'Sắp xong',
  'checkout.stepDelivery': 'Thông tin giao hàng',
  'checkout.stepPayment': 'Phương thức thanh toán',
  'checkout.stepPromotion': 'Khuyến mãi',
  'checkout.name': 'Tên',
  'checkout.phone': 'Điện thoại',
  'checkout.email': 'Email',
  'checkout.address': 'Địa chỉ',
  'checkout.cashTitle': 'Tiền mặt khi nhận hàng',
  'checkout.cashBody': 'Trả tiền khi nhận đồ.',
  'checkout.vnpayBody': 'Thanh toán online an toàn.',
  'checkout.promoApplied': 'Đã áp dụng mã {code}.',
  'checkout.promoInvalid': 'Mã khuyến mãi không hợp lệ.',
  'checkout.orderFailed': 'Không đặt được đơn hàng. Vui lòng thử lại.',
  'checkout.placing': 'Đang đặt hàng…',
  'checkout.detailsSecure': 'Thông tin của bạn được gửi an toàn tới API khách hàng.',
  'payment.successTitle': 'Thanh toán thành công',
  'payment.failTitle': 'Thanh toán chưa thành công',
  'payment.successBody': 'Đơn hàng của bạn đã được xác nhận và đang chuẩn bị.',
  'payment.failBody': 'Đơn hàng của bạn chưa được thanh toán. Bạn có thể xem lại và thử lại.',
  'payment.viewOrder': 'Xem đơn hàng',
  'payment.reviewOrder': 'Xem lại đơn hàng',
  'orders.title': 'Đơn hàng của tôi',
  'orders.order': 'Đơn hàng',
  'orders.orderDetails': 'Chi tiết đơn hàng',
  'orders.orderProgress': 'Tiến trình đơn hàng',
  'orders.requestRefund': 'Yêu cầu hoàn tiền',
  'orders.body': 'Theo dõi mọi chuyến đi chợ ở một nơi.',
  'orders.noOrders': 'Chưa có đơn hàng',
  'orders.noOrdersBody': 'Chuyến đi chợ tiếp theo sẽ hiện ở đây.',
  'orders.backToOrders': 'Quay lại đơn hàng',
  'orders.cancelOrder': 'Hủy đơn hàng',
  'orders.canceling': 'Đang hủy…',
  'orders.orderCanceled': 'Đã hủy đơn hàng.',
  'orders.cannotCancel': 'Không thể hủy đơn hàng này.',
  'orders.notFound': 'Không tìm thấy đơn hàng.',
  'orders.downloadFailed': 'Không tải được hóa đơn.',
  'orders.placed': 'Đặt lúc {date}',
  'orders.productFallback': 'Sản phẩm #{id}',
  'refund.title': 'Yêu cầu hoàn tiền',
  'refund.amount': 'Số tiền hoàn',
  'refund.reason': 'Lý do',
  'refund.bank': 'Ngân hàng',
  'refund.accountNumber': 'Số tài khoản',
  'refund.accountHolder': 'Chủ tài khoản',
  'refund.submit': 'Gửi yêu cầu',
  'refund.submitting': 'Đang gửi…',
  'refund.submitted': 'Đã gửi yêu cầu hoàn tiền.',
  'refund.submitFailed': 'Không gửi được yêu cầu hoàn tiền.',
  'orders.browseProducts': 'Duyệt sản phẩm',
  'account.profile': 'Hồ sơ',
  'account.orders': 'Đơn hàng',
  'account.bills': 'Hóa đơn',
  'account.refunds': 'Hoàn tiền',
  'account.security': 'Bảo mật',
  'account.myAccount': 'Tài khoản của tôi',
  'bills.title': 'Hóa đơn',
  'bills.body': 'Lịch sử thanh toán của bạn, đơn giản.',
  'bills.paidBills': 'Hóa đơn đã trả',
  'bills.totalSpent': 'Tổng đã chi',
  'bills.showTotal': 'Xem tổng',
  'bills.noBills': 'Chưa có hóa đơn',
  'bills.noBillsBody': 'Biên lai đã thanh toán sẽ hiện ở đây.',
  'refunds.title': 'Hoàn tiền',
  'refunds.body': 'Xem lại các yêu cầu cho đơn đã giao.',
  'refunds.canceled': 'Đã hủy yêu cầu hoàn tiền.',
  'refunds.cancelFailed': 'Không hủy được yêu cầu hoàn tiền này.',
  'refunds.noRequests': 'Chưa có yêu cầu hoàn tiền',
  'refunds.noRequestsBody':
    'Đơn đủ điều kiện có thể yêu cầu hoàn tiền từ trang chi tiết.',
  'auth.welcomeBack': 'Chào mừng trở lại',
  'auth.welcomeBody': 'Đăng nhập để đồng bộ giỏ hàng và đơn hàng.',
  'auth.createAccount': 'Tạo tài khoản của bạn',
  'auth.createBody': 'Lưu thông tin để thanh toán nhanh hơn lần sau.',
  'auth.email': 'Email',
  'auth.password': 'Mật khẩu',
  'auth.emailPlaceholder': 'ban@example.com',
  'auth.passwordPlaceholder': 'Ít nhất 6 ký tự',
  'auth.haveAccount': 'Đã có tài khoản?',
  'auth.createOne': 'Tạo mới',
  'auth.welcomeToast': 'Chào mừng trở lại!',
  'auth.signInFailed': 'Không đăng nhập được. Kiểm tra email và mật khẩu.',
  'auth.shortPassword': 'Mật khẩu phải ít nhất 6 ký tự.',
  'auth.mismatch': 'Mật khẩu không khớp.',
  'auth.profileUpdated': 'Đã cập nhật hồ sơ.',
  'auth.haveNoAccount': 'Chưa có tài khoản?',
  'auth.fullName': 'Họ tên',
  'auth.phone': 'Điện thoại',
  'auth.address': 'Địa chỉ',
  'auth.confirm': 'Xác nhận mật khẩu',
  'auth.signingIn': 'Đang đăng nhập…',
  'auth.accountCreated': 'Đã tạo tài khoản. Vui lòng đăng nhập.',
  'auth.createFailed': 'Không tạo được tài khoản.',
  'auth.creating': 'Đang tạo tài khoản…',
  'auth.createAccountBtn': 'Tạo tài khoản',
  'auth.repeatPassword': 'Nhập lại mật khẩu',
  'auth.profileTitle': 'Hồ sơ',
  'auth.profileBody': 'Cập nhật thông tin giao hàng của bạn.',
  'auth.profileFailed': 'Không cập nhật được hồ sơ.',
  'auth.saving': 'Đang lưu…',
  'auth.saveChanges': 'Lưu thay đổi',
  'auth.securityTitle': 'Bảo mật',
  'auth.securityBody': 'Dùng mật khẩu mạnh để giữ an toàn tài khoản.',
  'auth.currentPassword': 'Mật khẩu hiện tại',
  'auth.newPassword': 'Mật khẩu mới',
  'auth.confirmNew': 'Xác nhận mật khẩu mới',
  'auth.newShort': 'Mật khẩu mới phải ít nhất 6 ký tự.',
  'auth.changed': 'Đã đổi mật khẩu.',
  'auth.changeFailed': 'Không đổi được mật khẩu.',
  'auth.updating': 'Đang cập nhật…',
  'auth.changePassword': 'Đổi mật khẩu',
  'auth.showPassword': 'Hiện mật khẩu',
  'auth.hidePassword': 'Ẩn mật khẩu',
  'auth.myAccountEyebrow': 'Tài khoản của tôi',
  'ai.title': 'Trợ lý đi chợ',
  'ai.subtitle': 'Combo, thay thế, ý tưởng mỗi ngày',
  'ai.placeholder': 'Hỏi bất cứ gì về đồ đi chợ...',
  'ai.send': 'Gửi tin nhắn',
  'ai.close': 'Đóng',
  'ai.suggestedBundle': 'Combo gợi ý',
  'ai.addAll': 'Thêm tất cả vào giỏ',
  'ai.greeting': 'Hãy cho tôi biết bạn định nấu gì hoặc mua gì. Tôi có thể soạn combo đi chợ cho bạn.',
  'ai.unavailable': 'AI tạm thời không khả dụng. Hãy thử lại.',
  'ai.signInToAdd': 'Đăng nhập để thêm gợi ý của AI vào giỏ hàng.',
  'ai.addedToCart': 'Đã thêm sản phẩm gợi ý vào giỏ hàng.',
  'ai.addFailed': 'Không thêm được gợi ý vào giỏ hàng.',
  'footer.tagline': 'Đồ tươi mỗi ngày, giao hàng đơn giản.',
  'footer.shop': 'Mua sắm',
  'footer.account': 'Tài khoản',
  'footer.help': 'Trợ giúp',
  'footer.rights': 'Đã đăng ký bản quyền.',
  'footer.picked': 'Đồ tươi mỗi ngày, chọn kỹ.',
  'footer.checkout': 'Thanh toán',
  'footer.paymentResult': 'Kết quả thanh toán',
  'common.close': 'Đóng',
  'common.cancel': 'Hủy',
  'common.retry': 'Thử lại',
  'common.dismiss': 'Bỏ qua thông báo',
  'common.decrease': 'Giảm số lượng',
  'common.increase': 'Tăng số lượng',
  'common.openMenu': 'Mở menu',
  'common.closeMenu': 'Đóng menu',
  'locale.label': 'Ngôn ngữ',
};

export function translator(
  key: string,
  vars?: Record<string, string | number | null | undefined>,
): string {
  let template = dict[key as TranslatorKey] ?? key;
  if (!vars) return template;
  for (const [name, value] of Object.entries(vars)) {
    template = template.replace(`{${name}}`, String(value ?? ''));
  }
  return template;
}
