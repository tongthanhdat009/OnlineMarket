<template>
  <div class="pos-page">
    <div v-if="loading" class="loading">Đang tải dữ liệu...</div>
    <div v-if="error" class="error">{{ error }}</div>
    
    <div v-if="!loading && !error" class="pos-container">
      <!-- Bên trái: Danh sách sản phẩm -->
      <div class="products-section">
        <!-- Header với tìm kiếm -->
        <div class="products-header">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Tìm sản phẩm (tên, mã barcode)..."
              @input="filterProducts"
            />
          </div>
        </div>

        <!-- Danh mục -->
        <div class="categories">
          <button 
            :class="['category-btn', { active: selectedCategory === null }]"
            @click="selectCategory(null)"
          >
            Tất cả
          </button>
          <button 
            v-for="cat in categories" 
            :key="cat.CategoryId"
            :class="['category-btn', { active: selectedCategory === cat.CategoryId }]"
            @click="selectCategory(cat.CategoryId)"
          >
            {{ cat.CategoryName }}
          </button>
        </div>

        <!-- Lưới sản phẩm -->
        <div class="products-grid">
          <div 
            v-for="product in filteredProducts" 
            :key="product.ProductId"
            class="product-card"
            @click="addToCart(product)"
          >
            <div class="product-image">
              <img v-if="product.ImageUrl" :src="product.ImageUrl" alt="Product Image" class="real-product-img" />
              <span v-else>📦</span>
            </div>
            <div class="product-info">
              <div class="product-name">{{ product.ProductName }}</div>
              <div class="product-price">{{ formatCurrency(product.Price) }}</div>
              <div class="product-unit">{{ product.Unit }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bên phải: Giỏ hàng & Thanh toán -->
      <div class="cart-section">
        <!-- Thông tin khách hàng -->
        <div class="customer-section">
          <div class="customer-header">
            <label>👤 Khách hàng</label>
            <button class="add-customer-btn" @click="openAddCustomerModal">+</button>
          </div>
          <div v-if="selectedCustomer" class="selected-customer">
            <div class="customer-info">
              <strong>{{ selectedCustomer.Name }}</strong>
              <span>{{ selectedCustomer.Phone }}</span>
            </div>
            <button class="change-customer-btn" @click="clearCustomer">Thay đổi</button>
          </div>
          <div v-else class="customer-search-wrapper">
            <input 
              type="text"
              class="customer-search-input"
              v-model="customerSearchQuery"
              placeholder="Tìm theo SĐT hoặc tên..."
              @focus="showCustomerResults = true"
              @blur="hideCustomerResults"
            />
            <div v-if="showCustomerResults && filteredCustomers.length > 0" class="customer-results">
              <ul>
                <li v-for="cust in filteredCustomers" :key="cust.CustomerId" @mousedown="selectCustomer(cust)">
                  <strong>{{ cust.Name }}</strong> - {{ cust.Phone }}
                </li>
              </ul>
            </div>
             <div v-if="showCustomerResults && filteredCustomers.length === 0 && customerSearchQuery" class="customer-results no-results">
                <span>Không tìm thấy khách hàng.</span>
            </div>
          </div>
        </div>

        <!-- Giỏ hàng -->
        <div class="cart-items">
          <div v-if="cart.length === 0" class="empty-cart">
            <p>🛒 Giỏ hàng trống</p>
            <p class="hint">Nhấn vào sản phẩm để thêm</p>
          </div>

          <div v-for="item in cart" :key="item.ProductId" class="cart-item">
            <div class="item-info">
              <div class="item-name">{{ item.ProductName }}</div>
              <div class="item-price">{{ formatCurrency(item.Price) }}</div>
            </div>
            <div class="item-controls">
              <button class="qty-btn" @click="decreaseQty(item)">−</button>
              <input 
                type="number" 
                v-model.number="item.quantity" 
                @change="updateTotal"
                min="1"
                class="qty-input"
              />
              <button class="qty-btn" @click="increaseQty(item)">+</button>
              <button class="remove-btn" @click="removeFromCart(item)">🗑️</button>
            </div>
            <div class="item-total">{{ formatCurrency(item.Price * item.quantity) }}</div>
          </div>
        </div>

        <!-- Tổng cộng -->
        <div class="cart-summary">
          <div class="summary-row">
            <span>Tạm tính:</span>
            <strong>{{ formatCurrency(subtotal) }}</strong>
          </div>
          <!-- Promo code input -->
          <div class="summary-row promo-row">
            <span>Mã khuyến mãi:</span>
            <div class="promo-controls">
              <input
                type="text"
                v-model="promoCode"
                placeholder="Nhập mã khuyến mãi"
                class="promo-input"
              />
              <button class="promo-apply-btn" @click="applyPromoCode">Áp dụng</button>
            </div>
          </div>

          <div v-if="appliedPromo" class="summary-row">
            <span>Khuyến mãi:</span>
            <strong class="promo-badge">{{ appliedPromo.PromoCode }} — {{ appliedPromo.Description }} <button class="remove-promo" @click="removePromo">✕</button></strong>
          </div>

          <div v-if="promoDiscount" class="summary-row promo-discount-row">
            <span>Giảm từ mã:</span>
            <strong>-{{ formatCurrency(promoDiscount) }}</strong>
          </div>

          <div v-if="promoMessage" class="promo-message">{{ promoMessage }}</div>
          <div class="summary-row total-row">
            <span>TỔNG CỘNG:</span>
            <strong class="total-amount">{{ formatCurrency(total) }}</strong>
          </div>
        </div>

        <!-- Nút hành động -->
        <div class="cart-actions">
          <button class="btn-clear" @click="clearCart">
            🗑️ Xóa hết
          </button>
          <button 
            class="btn-checkout" 
            @click="checkout"
            :disabled="cart.length === 0 || !selectedCustomer"
          >
            💳 Thanh toán
          </button>
        </div>
      </div>
    </div>

    <!-- Modal cảnh báo tồn kho trước khi thanh toán -->
    <div v-if="showStockWarning" class="modal-overlay" @click.self="cancelStockWarning">
      <div class="checkout-modal">
        <div class="modal-header">
          <h3>Cảnh báo tồn kho</h3>
          <button class="close-btn" @click="cancelStockWarning">✕</button>
        </div>
        <div class="modal-body">
          <p style="margin-top:0;">Một số mặt hàng vượt quá số lượng tồn. Bạn vẫn muốn tiếp tục thanh toán?</p>
          <table class="stock-table">
            <colgroup>
              <col style="width:50%" />
              <col style="width:25%" />
              <col style="width:25%" />
            </colgroup>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Trong kho</th>
                <th>Đã chọn</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="w in stockWarnings" :key="w.ProductId">
                <td>{{ w.ProductName }}</td>
                <td>{{ w.availableQty }}</td>
                <td class="over-qty">{{ w.selectedQty }}</td>
              </tr>
            </tbody>
          </table>
          <div class="payment-error">Bạn có thể tiếp tục thanh toán hoặc quay lại điều chỉnh số lượng.</div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelStockWarning">Quay lại</button>
          <button class="btn-confirm" @click="proceedAfterStockWarning">Tiếp tục</button>
        </div>
      </div>
    </div>

    <!-- Modal thanh toán -->
    <div v-if="showCheckoutModal" class="modal-overlay" @click.self="showCheckoutModal = false">
      <div class="checkout-modal">
        <div class="modal-header">
          <h3>💳 Thanh toán đơn hàng</h3>
          <button class="close-btn" @click="showCheckoutModal = false">✕</button>
        </div>
        <div class="modal-body">
            <div class="checkout-customer-info" v-if="selectedCustomer">
                <p><strong>Khách hàng:</strong> {{ selectedCustomer.Name }} - {{ selectedCustomer.Phone }}</p>
            </div>
            <div class="checkout-customer-info" v-else>
                <p><strong>Khách hàng:</strong> Khách lẻ</p>
            </div>

            <div class="checkout-total">
                <p>TỔNG TIỀN</p>
                <h2>{{ formatCurrency(total) }}</h2>
            </div>

      <div v-if="appliedPromo" class="checkout-promo">
        <p><strong>Khuyến mãi:</strong> {{ appliedPromo.PromoCode }} — -{{ formatCurrency(promoDiscount) }}</p>
      </div>

            <div class="payment-details">
                <div class="payment-method">
                    <label>Phương thức thanh toán</label>
          <div class="method-options">
            <button 
              :class="{ active: paymentMethod === 'Tiền mặt' }"
              @click="paymentMethod = 'Tiền mặt'">
              💵 Tiền mặt
            </button>
            <button 
              :class="{ active: paymentMethod === 'Thẻ' }"
              @click="paymentMethod = 'Thẻ'">
              💳 Thẻ
            </button>
            <button 
              :class="{ active: paymentMethod === 'Ví điện tử' }"
              @click="paymentMethod = 'Ví điện tử'">
              📱 Ví điện tử
            </button>
          </div>
                </div>
                <div class="customer-paid">
                    <label for="customer-paid-input">Khách đưa</label>
                    <input 
                        id="customer-paid-input"
                        type="number" 
                        v-model.number="customerPaid" 
                        @input="calculateChange"
                        placeholder="0"
                    />
                </div>
                <div class="change-amount" v-if="change > 0">
                    <span>Tiền thừa trả khách:</span>
                    <strong class="change">{{ formatCurrency(change) }}</strong>
                </div>
        <div v-if="customerPaid < total" class="payment-error">
          Số tiền khách đưa không được nhỏ hơn tổng hoá đơn.
        </div>
            </div>
        </div>

        <div v-if="checkoutError" class="payment-error" style="margin: 0 32px 12px;">
          {{ checkoutError }}
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showCheckoutModal = false">Hủy</button>
          <button class="btn-confirm" :disabled="isSubmittingCheckout || (customerPaid < total)" @click="confirmCheckout">Xác nhận thanh toán</button>
        </div>
      </div>
    </div>

    <!-- Modal thành công -->
    <div v-if="showSuccessModal" class="modal-overlay" @click.self="showSuccessModal = false">
      <div class="success-modal">
        <div class="success-icon">✅</div>
        <h3>Thanh toán thành công!</h3>
        <p>Đơn hàng đã được tạo</p>
        <div class="success-actions">
          <button class="btn-view-invoice" @click="viewInvoice">Xem hoá đơn</button>
          <button class="btn-ok" @click="closeSuccessModal">OK</button>
        </div>
      </div>
    </div>

    <!-- Modal thêm khách hàng -->
    <div v-if="showAddCustomerModal" class="modal-overlay" @click.self="showAddCustomerModal = false">
      <div class="add-customer-modal">
        <div class="modal-header">
          <h3>👤 Thêm khách hàng mới</h3>
          <button class="close-btn" @click="showAddCustomerModal = false">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="addNewCustomer">
            <div class="form-group">
              <label for="name">Tên khách hàng <span class="required">*</span></label>
              <input type="text" id="name" v-model="newCustomer.Name" required>
            </div>
            <div class="form-group">
              <label for="phone">Số điện thoại <span class="required">*</span></label>
              <input type="tel" id="phone" v-model="newCustomer.Phone" required>
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" v-model="newCustomer.Email">
            </div>
            <div class="form-group">
              <label for="address">Địa chỉ</label>
              <input type="text" id="address" v-model="newCustomer.Address">
            </div>
          </form>
        </div>
        <div v-if="addCustomerError" class="payment-error" style="margin: 0 32px 12px;">
          {{ addCustomerError }}
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showAddCustomerModal = false">Hủy</button>
          <button class="btn-confirm" :disabled="isAddingCustomer" @click="addNewCustomer">{{ isAddingCustomer ? 'Đang lưu...' : 'Lưu' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getCategories } from '../api/Category.js';
import { getProductsPos } from '../api/Product.js';
import { fetchCustomers, addCustomer } from '../api/Customer.js';
import { fetchPromotions, createOrder } from '../api/Order.js';
import { getInventories } from '../api/Inventory.js';
import { getCurrentUser } from '../api/Auth.js';
import { generateInvoicePDF } from '../utils/generateInvoicePDF';

const loading = ref(true);
const error = ref('');

const categories = ref([]);
const products = ref([]);
const customers = ref([]);
const promotions = ref([]);
const inventories = ref([]);
const inventoryMap = ref(new Map());

const promoCode = ref('');
const appliedPromo = ref(null);
const promoDiscount = ref(0);
const promoMessage = ref('');

const selectedCategory = ref(null);
const searchQuery = ref('');
const filteredProducts = ref([]);

const cart = ref([]);
const selectedCustomer = ref(null);
const subtotal = ref(0);
const total = ref(0);

// Lấy ID người dùng hiện tại từ API
const currentUserId = ref(null);

// State for new customer search
const customerSearchQuery = ref('');
const showCustomerResults = ref(false);

const showCheckoutModal = ref(false);
const showStockWarning = ref(false);
const stockWarnings = ref([]);
const showSuccessModal = ref(false);
const paymentMethod = ref('Tiền mặt');
const customerPaid = ref(0);
const change = ref(0);
const isSubmittingCheckout = ref(false);
const createdOrder = ref(null);
const checkoutError = ref('');

// Add-customer submitting and error state
const isAddingCustomer = ref(false);
const addCustomerError = ref('');

// State for Add Customer Modal
const showAddCustomerModal = ref(false);
const newCustomer = ref({
  Name: '',
  Phone: '',
  Email: '',
  Address: ''
});


const filteredCustomers = computed(() => {
  if (!customerSearchQuery.value) {
    return customers.value;
  }
  const query = customerSearchQuery.value.toLowerCase();
  return customers.value.filter(c => 
    (c.Phone && c.Phone.includes(query)) || 
    (c.Name && c.Name.toLowerCase().includes(query))
  );
});

async function loadData() {
  loading.value = true;
  error.value = '';
  
  try {
    const [categoriesRes, productsRes, customersRes, promotionsRes, inventoriesRes, userRes] = await Promise.all([
      getCategories(),
      getProductsPos(),
      fetchCustomers(),
      fetchPromotions(),
      getInventories(),
      getCurrentUser()
    ]);

    console.log('Categories:', categoriesRes);
    console.log('Products:', productsRes);
    console.log('Customers:', customersRes);
    console.log('Current User:', userRes);

    if (userRes && userRes.UserId) {
      currentUserId.value = Number(userRes.UserId);
    }

  categories.value = categoriesRes;
  products.value = productsRes;
  customers.value = customersRes;
  promotions.value = promotionsRes || [];
  inventories.value = inventoriesRes || [];
  inventoryMap.value = new Map((inventories.value || []).map(inv => [inv.ProductId, Math.max(0, Number(inv.Quantity) || 0)]));
  filteredProducts.value = productsRes;

    loading.value = false;
  } catch (err) {
    console.error('Failed to load POS data:', err);
    error.value = 'Không thể tải dữ liệu. Vui lòng kiểm tra API server.';
    loading.value = false;
  }
}

function selectCategory(categoryId) {
  selectedCategory.value = categoryId;
  filterProducts();
}

function filterProducts() {
  let result = products.value;

  // Lọc theo danh mục
  if (selectedCategory.value !== null) {
    result = result.filter(p => p.CategoryId === selectedCategory.value);
  }

  // Lọc theo tìm kiếm
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(p => 
      p.ProductName.toLowerCase().includes(query) || 
      (p.Barcode && p.Barcode.includes(query))
    );
  }

  filteredProducts.value = result;
}

function addToCart(product) {
  const existing = cart.value.find(item => item.ProductId === product.ProductId);
  if (existing) {
    existing.quantity++;
  } else {
    cart.value.push({
      ...product,
      quantity: 1
    });
  }
  updateTotal();
}

function increaseQty(item) {
  item.quantity++;
  updateTotal();
}

function decreaseQty(item) {
  if (item.quantity > 1) {
    item.quantity--;
    updateTotal();
  }
}

function removeFromCart(item) {
  const index = cart.value.findIndex(i => i.ProductId === item.ProductId);
  if (index > -1) {
    cart.value.splice(index, 1);
  }
  updateTotal();
}

function updateTotal() {
  subtotal.value = cart.value.reduce((sum, item) => sum + (item.Price * item.quantity), 0);

  // Calculate promo discount if a promo is applied and still valid
  if (appliedPromo.value) {
    const p = appliedPromo.value;
    const minAmt = p.MinOrderAmount || 0;
    if (subtotal.value < minAmt) {
      // promo no longer valid for current subtotal
      promoMessage.value = `Đơn hàng phải >= ${formatCurrency(minAmt)} để áp dụng mã ${p.PromoCode}. Mã đã được bỏ.`;
      appliedPromo.value = null;
      promoDiscount.value = 0;
    } else {
      if (p.DiscountType === 'percent') {
        promoDiscount.value = Math.round(subtotal.value * (p.DiscountValue / 100));
      } else {
        promoDiscount.value = p.DiscountValue || 0;
      }
      if (promoDiscount.value > subtotal.value) promoDiscount.value = subtotal.value;
    }
  } else {
    promoDiscount.value = 0;
  }

  total.value = subtotal.value - (promoDiscount.value || 0);
  if (total.value < 0) total.value = 0;
}

function clearCart() {
  if (confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
    cart.value = [];
    updateTotal();
  }
}

function applyPromoCode() {
  promoMessage.value = '';
  const code = (promoCode.value || '').trim();
  if (!code) {
    promoMessage.value = 'Vui lòng nhập mã khuyến mãi.';
    return;
  }
  const found = promotions.value.find(p => p.PromoCode && p.PromoCode.toUpperCase() === code.toUpperCase() && p.Status === 'active');
  if (!found) {
    promoMessage.value = 'Mã không hợp lệ hoặc không hoạt động.';
    return;
  }
  const now = new Date();
  const start = new Date(found.StartDate);
  const end = new Date(found.EndDate);
  if (now < start || now > end) {
    promoMessage.value = 'Mã chưa có hiệu lực hoặc đã hết hạn.';
    return;
  }
  if (subtotal.value < (found.MinOrderAmount || 0)) {
    promoMessage.value = `Yêu cầu đơn tối thiểu ${formatCurrency(found.MinOrderAmount)}.`;
    return;
  }
  appliedPromo.value = found;
  promoMessage.value = `Đã áp dụng mã ${found.PromoCode}.`;
  updateTotal();
}

function removePromo() {
  appliedPromo.value = null;
  promoCode.value = '';
  promoDiscount.value = 0;
  promoMessage.value = '';
  updateTotal();
}

function checkout() {
  if (cart.value.length === 0) return;
  if (!selectedCustomer.value) {
    alert('Vui lòng chọn khách hàng trước khi thanh toán.');
    showCustomerResults.value = true;
    return;
  }
  // Kiểm tra tồn kho trước khi mở modal thanh toán
  const warnings = getOverstockItems();
  if (warnings.length > 0) {
    stockWarnings.value = warnings;
    showStockWarning.value = true;
    return;
  }
  customerPaid.value = total.value;
  change.value = 0;
  checkoutError.value = '';
  showCheckoutModal.value = true;
}

function calculateChange() {
  change.value = (customerPaid.value || 0) - total.value;
  if (change.value < 0) change.value = 0;
}

async function confirmCheckout() {
  if (!selectedCustomer.value) {
    alert('Vui lòng chọn khách hàng trước khi xác nhận thanh toán.');
    return;
  }
  // Clear previous server error
  checkoutError.value = '';
  // Kiểm tra tiền khách đưa không được < tổng hoá đơn
  if ((customerPaid.value || 0) < total.value) {
    alert('Số tiền khách đưa không được nhỏ hơn tổng hoá đơn.');
    return;
  }
  // Build order JSON data
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const promoId = appliedPromo.value ? (appliedPromo.value.PromoId ?? appliedPromo.value.Id ?? null) : null;

  const orderData = {
    customerId: selectedCustomer.value.CustomerId,
    userId: currentUserId.value,
    promoId: promoId,
    totalAmount: Number(total.value),
    discountAmount: Number(promoDiscount.value || 0),
    orderItems: cart.value.map(i => ({
      productId: i.ProductId,
      quantity: i.quantity,
      price: Number(i.Price),
      subtotal: Number(i.Price * i.quantity)
    })),
    payments: [
      {
        amount: Number(total.value),
        paymentMethod: mapPaymentMethodToCode(paymentMethod.value)
      }
    ]
  };
  // Log payload trước khi gọi API tạo hoá đơn
  try {
    console.log('[POS] Payload tạo hoá đơn:', orderData);
  } catch (e) {
    // noop: một số môi trường cũ có thể lỗi toString
  }
    try {
    isSubmittingCheckout.value = true;
  const response = await createOrder(orderData);
  console.log('Tạo hoá đơn thành công:', response ?? null);
  createdOrder.value = response ?? null;
    // clear any previous server error and close modal
    checkoutError.value = '';
    showCheckoutModal.value = false;
    showSuccessModal.value = true;

    // Reset sau khi thanh toán
    setTimeout(() => {
      cart.value = [];
      clearCustomer();
      customerPaid.value = 0;
      change.value = 0;
      appliedPromo.value = null;
      promoCode.value = '';
      promoDiscount.value = 0;
      promoMessage.value = '';
      updateTotal();
    }, 300);
  } catch (e) {
    // Ghi log chi tiết lỗi khi tạo hoá đơn thất bại
    try {
      const err = e || {};
      const resp = err.response || {};
      const serverData = resp.data;
      // Prefer backend-provided message if available
      const serverMessage = (serverData && (serverData.message || serverData.Message)) || '';

      console.error('[POS] Tạo hoá đơn thất bại:', {
        status: resp.status,
        statusText: resp.statusText,
        serverMessage,
        responseData: serverData,
        errorMessage: err.message,
        stack: err.stack,
      });

      // Show error message in the checkout modal instead of alert
      let userMsg = serverMessage || err.message || 'Không rõ nguyên nhân';
      // If no simple message, try to stringify response payload
      if (!userMsg && serverData) {
        try { userMsg = typeof serverData === 'string' ? serverData : JSON.stringify(serverData); } catch {}
      }
      checkoutError.value = userMsg;
    } catch (logErr) {
      console.error('[POS] Lỗi khi ghi log thất bại:', logErr);
      checkoutError.value = 'Không thể tạo hoá đơn. Vui lòng thử lại.';
    }
  } finally {
    isSubmittingCheckout.value = false;
  }
}

// Tạo danh sách cảnh báo vượt tồn kho
function getOverstockItems() {
  const list = [];
  for (const item of cart.value) {
    const stock = inventoryMap.value.get(item.ProductId);
    const available = typeof stock === 'number' ? Math.max(0, stock) : 0;
    if (item.quantity > available) {
      list.push({
        ProductId: item.ProductId,
        ProductName: item.ProductName,
        selectedQty: item.quantity,
        availableQty: available
      });
    }
  }
  return list;
}

function proceedAfterStockWarning() {
  showStockWarning.value = false;
  customerPaid.value = total.value;
  change.value = 0;
  checkoutError.value = '';
  showCheckoutModal.value = true;
}

function cancelStockWarning() {
  showStockWarning.value = false;
}

function closeSuccessModal() {
  showSuccessModal.value = false;
}

function viewInvoice() {
  if (!createdOrder.value) {
    alert('Không có dữ liệu hoá đơn để xuất PDF.');
    return;
  }
  try {
    // Hỗ trợ các kiểu response khác nhau: { Order: {...} } | { data: { Order: {...} } } | { ...order }
    const envelope = createdOrder.value;
    const orderObj = envelope?.Order ?? envelope?.data?.Order ?? envelope?.data ?? envelope;

    // Nếu backend đã trả đúng cấu trúc PascalCase (OrderItems/Payments/Customer/OrderId...), xuất trực tiếp
    if (orderObj?.OrderItems && orderObj?.Payments) {
      generateInvoicePDF(orderObj);
    } else {
      // Ngược lại, chuẩn hoá về cấu trúc mà PDF util mong muốn
      const pdfOrder = normalizeOrderForPDF(orderObj);
      generateInvoicePDF(pdfOrder);
    }
  } catch (e) {
    console.error('Xuất PDF lỗi:', e);
    alert('Không thể xuất hoá đơn PDF.');
  }
}

// Chuẩn hoá dữ liệu order trả về từ API sang cấu trúc mà generateInvoicePDF mong đợi (PascalCase)
function normalizeOrderForPDF(apiOrder) {
  const o = apiOrder || {};

  // Tìm sản phẩm theo id từ danh sách đã tải để lấy tên nếu API không trả về Product
  const findProductName = (productId) => {
    const p = products.value.find(x => x.ProductId === productId);
    return p?.ProductName || '';
  };

  const orderItemsSrc = o.orderItems || o.OrderItems || [];
  const paymentsSrc = o.payments || o.Payments || [];

  const normalized = {
    OrderId: o.orderId ?? o.OrderId ?? o.id ?? null,
    OrderDate: o.orderDate ?? o.OrderDate ?? o.createdAt ?? new Date().toISOString(),
    TotalAmount: Number(o.totalAmount ?? o.TotalAmount ?? 0),
    DiscountAmount: Number(o.discountAmount ?? o.DiscountAmount ?? 0),
    Status: o.status ?? o.Status ?? '',
    User: o.user || o.User || { FullName: '' },
    Customer: o.customer || o.Customer || (selectedCustomer.value ? {
      Name: selectedCustomer.value.Name,
      Address: selectedCustomer.value.Address,
      Phone: selectedCustomer.value.Phone
    } : undefined),
    Payments: paymentsSrc.map(p => ({
      PaymentMethod: p.paymentMethod ?? p.PaymentMethod ?? '',
      Amount: Number(p.amount ?? p.Amount ?? 0)
    })),
    OrderItems: orderItemsSrc.map(it => {
      const productId = it.productId ?? it.ProductId;
      const productName = it.Product?.ProductName
        ?? it.product?.name
        ?? it.productName
        ?? findProductName(productId);
      return {
        Product: it.Product || { ProductName: productName },
        Quantity: Number(it.quantity ?? it.Quantity ?? 0),
        Price: Number(it.price ?? it.Price ?? 0),
        Subtotal: Number(it.subtotal ?? it.Subtotal ?? 0)
      };
    })
  };

  return normalized;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND' 
  }).format(value || 0);
}

// Customer related functions
function selectCustomer(customer) {
  selectedCustomer.value = customer;
  customerSearchQuery.value = '';
  showCustomerResults.value = false;
}

function clearCustomer() {
  selectedCustomer.value = null;
  customerSearchQuery.value = '';
}

function hideCustomerResults() {
  // Delay hiding to allow click event on results
  setTimeout(() => {
    showCustomerResults.value = false;
  }, 200);
}

function openAddCustomerModal() {
  showAddCustomerModal.value = true;
}

// Map Vietnamese payment method to code used in JSON
function mapPaymentMethodToCode(method) {
  switch (method) {
    case 'Tiền mặt':
      return 'cash';
    case 'Thẻ':
      return 'card';
    case 'Ví điện tử':
    case 'E-wallet':
      return 'e-wallet';
    default:
      return 'other';
  }
}

// Helper to download a JSON file in the browser
function downloadJSON(data, filename) {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Không thể tạo file JSON:', e);
  }
}

async function addNewCustomer() {
  addCustomerError.value = '';
  if (!newCustomer.value.Name || !newCustomer.value.Phone) {
    alert('Vui lòng nhập tên và số điện thoại.');
    return;
  }

  isAddingCustomer.value = true;
  try {
    const payload = {
      Name: newCustomer.value.Name,
      Phone: newCustomer.value.Phone,
      Email: newCustomer.value.Email || null,
      Address: newCustomer.value.Address || null
    };
    const res = await addCustomer(payload);
    // Backend may return { message, data: { ...customer } } or direct customer object
    const created = res?.data ?? res;

    const computedId = customers.value.length > 0 ? Math.max(...customers.value.map(c => c.CustomerId)) + 1 : 1;
    const customerToAdd = {
      CustomerId: created?.CustomerId ?? created?.customerId ?? created?.Id ?? created?.id ?? computedId,
      Name: created?.Name ?? payload.Name,
      Phone: created?.Phone ?? payload.Phone,
      Email: created?.Email ?? payload.Email ?? '',
      Address: created?.Address ?? payload.Address ?? ''
    };

    // Upsert into local list (avoid duplicate by id or phone)
    const idx = customers.value.findIndex(c => c.CustomerId === customerToAdd.CustomerId || (!!customerToAdd.Phone && c.Phone === customerToAdd.Phone));
    if (idx >= 0) customers.value.splice(idx, 1, customerToAdd); else customers.value.push(customerToAdd);
    selectCustomer(customerToAdd);

    showAddCustomerModal.value = false;
    newCustomer.value = { Name: '', Phone: '', Email: '', Address: '' };
  } catch (e) {
    let msg = e?.response?.data?.message || e?.response?.data?.Message || e?.message || 'Không thể thêm khách hàng.';
    if (!msg && e?.response?.data) {
      try { msg = JSON.stringify(e.response.data); } catch {}
    }
    addCustomerError.value = msg;
  } finally {
    isAddingCustomer.value = false;
  }
}


onMounted(() => {
  loadData();
});
</script>

<style scoped>
.pos-page {
  background: #f5f7fa;
  min-height: 100vh;
  padding: 0;
  margin: -20px;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 16px;
  color: #666;
}

.error {
  padding: 20px;
  background: #f8d7da;
  color: #721c24;
  border-radius: 6px;
  margin: 20px;
}

.pos-container {
  display: grid;
  grid-template-columns: 1fr 420px;
  height: 100vh;
  gap: 0;
}

/* PHẦN SẢN PHẨM */
.products-section {
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.products-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f5f6f7; /* light gray header */
  display: flex;
  align-items: center;
  justify-content: flex-start;
  color: #222;
}



.categories {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  overflow-x: auto;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.category-btn {
  padding: 10px 20px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  color: #2d3748;
  white-space: nowrap;
  transition: all 0.2s;
}

.category-btn:hover {
  border-color: #1abc9c;
  color: #1abc9c;
  background: #e6fffa;
}

.category-btn.active {
  background: #1abc9c;
  color: white;
  border-color: transparent;
}

.products-grid {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  align-content: start;
}

.product-card {
  background: white;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.product-card:hover {
  border-color: #1abc9c;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 188, 156, 0.2);
}

/* Product icon/image size */
.product-image {
  font-size: 64px;
  margin-bottom: 14px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.real-product-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.search-box {
  position: relative;
  max-width: 720px;
  width: 100%;
  margin: 0;
}

.search-box input {
  width: 100%;
  height: 48px;
  padding: 0 16px 0 44px; /* leave room for icon */
  border: 1px solid #e6e6e6;
  border-radius: 9999px;
  font-size: 15px;
  background: #ffffff; /* white search bar */
  color: #222222;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
  backdrop-filter: none;
}

.search-box input::placeholder {
  color: #9b9b9b; /* visible on white background */
}
/* Vendor prefixes for placeholder compatibility */
.search-box input::-webkit-input-placeholder {
  color: #9b9b9b;
}
.search-box input:-ms-input-placeholder {
  color: #9b9b9b;
}

.search-box input:focus {
  outline: none;
  border-color: #1abc9c;
  box-shadow: 0 0 0 3px rgba(26,188,156,0.15);
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #7a7a7a;
  pointer-events: none;
}


.product-price {
  color: #1abc9c;
  font-weight: 700;
  font-size: 16px;
}

.product-unit {
  color: #999;
  font-size: 12px;
}

/* PHẦN GIỎ HÀNG */
.cart-section {
  background: #fff;
  border-left: 2px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.customer-section {
  padding: 16px 20px;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  position: relative;
}

.customer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.customer-header label {
  font-weight: 600;
  font-size: 16px;
}

.add-customer-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #ffffff; /* raised white button */
  color: #1abc9c; /* teal accent */
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 6px 18px rgba(26,188,156,0.18);
  border: 2px solid rgba(255,255,255,0.9);
}

.add-customer-btn:hover {
  transform: translateY(-2px);
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(26,188,156,0.22);
}

.customer-search-wrapper {
  position: relative;
}

.customer-search-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.customer-search-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255,255,255,0.3);
}

.customer-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  color: #2d3748;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

.customer-results.no-results {
    padding: 12px;
    text-align: center;
}

.customer-results ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.customer-results li {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.customer-results li:last-child {
  border-bottom: none;
}

.customer-results li:hover {
  background: #f0f4ff;
}

.selected-customer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 10px;
  border-radius: 6px;
}

.selected-customer .customer-info {
  display: flex;
  flex-direction: column;
}

.selected-customer .customer-info span {
  font-size: 13px;
  opacity: 0.8;
}

.change-customer-btn {
  background: transparent;
  border: 1px solid white;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-cart {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-cart p:first-child {
  font-size: 48px;
  margin-bottom: 10px;
}

.empty-cart .hint {
  font-size: 14px;
}

.cart-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #e8e8e8;
}

.item-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.item-name {
  font-weight: 600;
  color: #2d3748;
}

.item-price {
  color: #1abc9c;
  font-weight: 600;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.qty-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  margin-top: 0;
  color: #2d3748;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.qty-btn:hover {
  background: #1abc9c;
  color: white;
  border-color: #1abc9c;
}

.qty-input {
  width: 70px;
  height: 36px;
  padding: 0 6px; /* keep small horizontal padding */
  text-align: center;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-weight: 700;
  font-size: 15px;
  display: inline-flex;
  align-items: center; /* vertically center the value */
  justify-content: center;
  box-sizing: border-box;
}

.required {
  color: #e53e3e;
  margin-left: 4px;
  font-weight: 700;
}

/* Remove native number input spinners for consistent visuals */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield; /* Firefox */
}

.remove-btn {
  margin-left: auto;
  width: 36px;
  height: 36px;
  border: 2px solid #ff4444;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #ff4444;
  color: white;
}

.item-total {
  text-align: right;
  font-weight: 700;
  font-size: 16px;
  color: #2d3748;
}

.cart-summary {
  padding: 16px 20px;
  border-top: 2px solid #e0e0e0;
  background: #fafafa;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 15px;
}

/* Align promo label vertically centered with controls */
.promo-row {
  align-items: center;
}

.promo-row .promo-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.promo-input {
  width: 160px;
  height: 36px;
  padding: 0 10px;
  border: 2px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
}

.promo-apply-btn {
  padding: 8px 12px;
  border: none;
  background: #1abc9c;
  color: white;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  margin: 0;
}

.promo-badge {
  background: #e6fffa;
  color: #0f766e;
  padding: 6px 10px;
  border-radius: 8px;
  font-weight: 700;
}

.remove-promo {
  margin-left: 8px;
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
}

.promo-message {
  padding: 8px 0;
  color: #c05621;
  font-size: 13px;
}

.promo-discount-row strong {
  color: #e53e3e;
}

.checkout-promo {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #fff7ed;
  border: 1px solid #ffe3bf;
  border-radius: 8px;
}

.total-row {
  border-top: 2px solid #ddd;
  margin-top: 8px;
  padding-top: 12px;
  font-size: 18px;
  font-weight: 700;
}

.total-amount {
  color: #1abc9c;
  font-size: 22px;
}

.cart-actions {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
  padding: 20px;
  background: white;
  border-top: 2px solid #e0e0e0;
}

.btn-clear {
  padding: 14px;
  border: 2px solid #ff4444;
  background: white;
  color: #ff4444;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: #ff4444;
  color: white;
}

.btn-checkout {
  padding: 14px;
  border: none;
  background: linear-gradient(135deg, #1abc9c 0%, #16a085 100%);
  color: white;
  border-radius: 8px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-checkout:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 188, 156, 0.4);
}

.btn-checkout:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* MODAL */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.checkout-modal, .add-customer-modal {
  background: white;
  border-radius: 16px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #1abc9c 0%, #16a085 100%);
  color: white;
  border-radius: 16px 16px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
}

.close-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 24px 32px;
  background-color: #f8f9fa;
}

.checkout-customer-info {
    background: white;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    border: 1px solid #e0e0e0;
}

.checkout-customer-info p {
    margin: 0;
    font-size: 15px;
    color: #333;
}

.checkout-total {
    text-align: center;
    margin-bottom: 24px;
}

.checkout-total p {
    margin: 0 0 4px 0;
    font-size: 14px;
    color: #555;
    text-transform: uppercase;
}

.checkout-total h2 {
    margin: 0;
    font-size: 36px;
  color: #1abc9c;
    font-weight: 700;
}

.payment-details {
    background: white;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
}

.payment-method {
    margin-bottom: 20px;
}

.payment-method label {
  display: block;
  margin-bottom: 12px;
  font-weight: 600;
  color: #2d3748;
  font-size: 16px;
}

.method-options {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
}

.method-options button {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #ffffff; /* make buttons white so they contrast with modal body */
  color: #2d3748;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s;
}

.method-options button:hover {
  border-color: #1abc9c;
  color: #1abc9c;
}

.method-options button.active {
  background: #1abc9c;
  color: white;
  border-color: #1abc9c;
}

.customer-paid label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2d3748;
  font-size: 16px;
}

.customer-paid input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 700;
  box-sizing: border-box;
  text-align: center;
}

.customer-paid input:focus {
  outline: none;
  border-color: #667eea;
}

.change-amount {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  margin-top: 16px;
  background: #e9f5ea;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
}

.change {
  color: #28a745;
  font-size: 20px;
  font-weight: 700;
}

.payment-error {
  color: #e53e3e;
  font-size: 13px;
  margin-top: 8px;
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr; /* make Cancel and Confirm equal width */
  gap: 12px;
  padding: 20px 24px 24px;
  background-color: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.btn-cancel {
  padding: 12px;
  border: 2px solid #d1d5db; /* subtle border */
  background: #f3f4f6; /* light gray so it contrasts with modal bg */
  color: #111827;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel:hover {
  border-color: #9ca3af;
  background: #e5e7eb;
}

.btn-confirm {
  padding: 12px;
  border: none;
  background: linear-gradient(135deg, #1abc9c 0%, #16a085 100%);
  color: white;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 188, 156, 0.4);
}

/* ADD CUSTOMER MODAL */
.add-customer-modal .form-group {
  margin-bottom: 16px;
}

.add-customer-modal .form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #2d3748;
}

.add-customer-modal .form-group input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  box-sizing: border-box;
}

.add-customer-modal .form-group input:focus {
  outline: none;
  border-color: #667eea;
}

/* SUCCESS MODAL */
.success-modal {
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.success-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.success-modal h3 {
  margin: 0 0 12px 0;
  color: #28a745;
  font-size: 24px;
}

.success-modal p {
  margin: 0 0 24px 0;
  color: #666;
}

.success-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-view-invoice {
  padding: 12px 20px;
  border: 2px solid #1abc9c;
  background: white;
  color: #1abc9c;
  border-radius: 8px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view-invoice:hover {
  background: #1abc9c;
  color: white;
  box-shadow: 0 4px 12px rgba(26, 188, 156, 0.4);
}

.btn-ok {
  padding: 12px 40px;
  border: none;
  background: #28a745;
  color: white;
  border-radius: 8px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-ok:hover {
  background: #218838;
  transform: translateY(-2px);
}

/* SCROLLBAR */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Stock warning table */
.stock-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 8px; }
.stock-table th, .stock-table td { padding: 8px; border-bottom: 1px solid #eee; }
.stock-table th:nth-child(1), .stock-table td:nth-child(1) { text-align: left; }
.stock-table th:nth-child(2), .stock-table td:nth-child(2),
.stock-table th:nth-child(3), .stock-table td:nth-child(3) { text-align: center; }
.over-qty { color:#b91c1c; font-weight:700; }
</style>
