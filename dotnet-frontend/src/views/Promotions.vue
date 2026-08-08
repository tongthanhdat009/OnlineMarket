<template>
  <div class="promotions-page">
    <h2>🎁 Quản lý khuyến mãi</h2>

    <!-- 🔍 Thanh tìm kiếm -->
    <div class="search-bar">
      <label for="filterType">Tìm theo:</label>
      <select v-model="filterType" id="filterType">
        <option value="PromoId">ID</option>
        <option value="PromoCode">Mã khuyến mãi</option>
      </select>
      <input type="text" v-model="searchText" placeholder="Nhập từ khóa..." />
    </div>

    <!-- 📝 Form thêm / sửa / xem -->
    <form class="promotion-form" @submit.prevent="confirmAction(editMode ? 'update' : 'add')">
      <div class="form-group">
        <label>ID</label>
        <input type="text" :value="displayId(promotion.PromoId)" readonly />
      </div>

      <div class="form-group">
        <label>Mã khuyến mãi</label>
        <input v-model="promotion.PromoCode" type="text" required placeholder="Nhập mã khuyến mãi" :readonly="viewMode" />
      </div>

      <div class="form-group">
        <label>Mô tả</label>
        <input v-model="promotion.description" type="text" placeholder="Mô tả khuyến mãi" :readonly="viewMode" />
      </div>

      <div class="form-group">
        <label>Loại giảm giá</label>
        <select v-model="promotion.DiscountType" required :disabled="viewMode || (editMode && promotion.UsedCount > 0)">
          <option value="percent">percent</option>
          <option value="fixed">fixed</option>
        </select>
      </div>

      <div class="form-group">
        <label>Giá trị giảm</label>
        <input v-model="promotion.DiscountValue" type="number" step="0.01" required :readonly="viewMode || (editMode && promotion.UsedCount > 0)" />
      </div>

      <div class="form-group">
        <label>Ngày bắt đầu</label>
        <Flatpickr v-model="promotion.StartDate" :config="{ dateFormat: 'Y-m-d' }" placeholder="Chọn ngày bắt đầu" :disabled="viewMode" />
      </div>

      <div class="form-group">
        <label>Ngày kết thúc</label>
        <Flatpickr v-model="promotion.EndDate" :config="{ dateFormat: 'Y-m-d' }" placeholder="Chọn ngày kết thúc" :disabled="viewMode" />
      </div>

      <div class="form-group">
        <label>Giá trị tối thiểu đơn hàng</label>
        <input v-model="promotion.MinOrderAmount" type="number" step="0.01" :readonly="viewMode" />
      </div>

      <div class="form-group">
        <label>Giới hạn sử dụng</label>
        <input v-model="promotion.UsageLimit" type="number" min="0" :readonly="viewMode" />
      </div>

      <div class="form-group">
        <label>Số lượt đã dùng</label>
        <input v-model="promotion.UsedCount" type="number" min="0" readonly />
      </div>

      <div class="form-group">
        <label>Trạng thái</label>
        <select v-model="promotion.status" :disabled="viewMode">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <button type="submit" v-if="!viewMode">{{ editMode ? "Cập nhật" : "Thêm mới" }}</button>
      <button type="button" v-if="editMode" @click="cancelEdit">Hủy</button>
      <button type="button" v-if="viewMode" @click="closeView">Đóng</button>
    </form>

    <!-- 📋 Bảng hiển thị -->
    <table class="promotion-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Mã khuyến mãi</th>
          <th>Mô tả</th>
          <th>Loại giảm</th>
          <th>Giá trị giảm</th>
          <th>Bắt đầu</th>
          <th>Kết thúc</th>
          <th>Min đơn hàng</th>
          <th>Giới hạn</th>
          <th>Đã dùng</th>
          <th>Trạng thái</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="p in filteredPromotions"
          :key="p.PromoId"
          @click="viewPromotion(p)"
          :class="{ active: viewMode && promotion.PromoId === p.PromoId }"
        >
          <td>{{ displayId(p.PromoId) }}</td>
          <td>{{ p.PromoCode }}</td>
          <td>{{ p.Description }}</td>
          <td>{{ p.DiscountType }}</td>
          <td>{{ formatPrice(p.DiscountValue) }}</td>
          <td>{{ p.StartDate }}</td>
          <td>{{ p.EndDate }}</td>
          <td>{{ formatPrice(p.MinOrderAmount) }}</td>
          <td>{{ p.UsageLimit }}</td>
          <td>{{ p.UsedCount }}</td>
          <td>{{ p.Status }}</td>
          <td>
            <button @click.stop="editPromotion(p)">✏️</button>
            <button @click.stop="confirmAction('delete', p)">🗑️</button>
            <button @click.stop="openGiftModal(p.PromoId)" title="Tặng Voucher" :disabled="getRemainingCount(p) <= 0" :class="{ disabled: getRemainingCount(p) <= 0 }">🎁</button>
          </td>
        </tr>
        <tr v-if="filteredPromotions.length === 0">
          <td colspan="12">Không có dữ liệu phù hợp</td>
        </tr>
      </tbody>
    </table>

    <!-- 🎁 Modal Tặng Voucher -->
    <div v-if="showGiftModal" class="confirm-overlay">
      <div class="confirm-box gift-modal">
        <div v-if="sendingGift" class="loading-overlay">
          <div class="spinner"></div>
          <p>Đang gửi email tặng quà...</p>
        </div>
        
        <div class="modal-header-actions">
          <h3>🎁 Tặng Voucher</h3>
          <div class="promo-info" v-if="currentGiftPromo">
             <span class="badge-code">{{ currentGiftPromo.PromoCode }}</span>
             <span class="badge-limit">Còn lại: {{ getRemainingCount(currentGiftPromo) }}</span>
          </div>
        </div>

        <div class="gift-search">
          <input v-model="customerSearch" type="text" placeholder="🔍 Tìm khách hàng (Tên, SĐT, Email)..." />
        </div>
        <div class="customer-list">
          <div v-if="loadingCustomers" class="loading-text">Đang tải danh sách khách hàng...</div>
          <table v-else>
            <thead>
              <tr>
                <th class="col-checkbox">
                    <input type="checkbox" :checked="isAllAutoSelected" @change="toggleSelectAllAuto" title="Chọn tự động theo số lượng còn lại" />
                </th>
                <th>Tên khách hàng</th>
                <th>Email</th>
                <th>SĐT</th>
                <th class="text-right">Chi tiêu</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in filteredCustomers" :key="c.CustomerId" :class="{ selected: selectedCustomerIds.includes(c.CustomerId) }">
                <td class="col-checkbox">
                  <input type="checkbox" :checked="selectedCustomerIds.includes(c.CustomerId)" @change="toggleCustomerSelection(c.CustomerId)" />
                </td>
                <td><strong>{{ c.Name }}</strong></td>
                <td>{{ c.Email || '-' }}</td>
                <td>{{ c.Phone }}</td>
                <td class="text-right highlight-spending">{{ formatCurrency(c.TotalSpending) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="actions">
          <button class="btn-yes" @click="sendGiftVoucher" :disabled="sendingGift">
            {{ sendingGift ? 'Đang gửi...' : `Gửi tặng (${selectedCustomerIds.length})` }}
          </button>
          <button class="btn-no" @click="showGiftModal = false" :disabled="sendingGift">Đóng</button>
        </div>
      </div>
    </div>

    <!-- 🧩 Popup xác nhận -->
    <div v-if="showPopup" class="confirm-overlay">
      <div class="confirm-box">
        <h3>{{ popupTitle }}</h3>
        <p>{{ popupMessage }}</p>
        <div class="actions">
          <button class="btn-yes" @click="handleConfirm">Xác nhận</button>
          <button class="btn-no" @click="closePopup">Hủy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import Flatpickr from "vue-flatpickr-component";
import "flatpickr/dist/flatpickr.css";
import * as PromotionApi from "../api/Promotion";
import { getCustomersBySpending } from "../api/Customer.js";

const promotions = ref([]);

const promotion = ref({});
const editMode = ref(false);
const viewMode = ref(false);
const searchText = ref("");
const filterType = ref("PromoId");

// Gift Voucher Modal
const showGiftModal = ref(false);
const giftPromoId = ref(null);
const customers = ref([]);
const customerSearch = ref("");
const selectedCustomerIds = ref([]);
const loadingCustomers = ref(false);
const sendingGift = ref(false);

const filteredCustomers = computed(() => {
  if (!customerSearch.value) return customers.value;
  const kw = customerSearch.value.toLowerCase();
  return customers.value.filter(c => 
    c.Name.toLowerCase().includes(kw) || 
    (c.Phone && c.Phone.includes(kw)) ||
    (c.Email && c.Email.toLowerCase().includes(kw))
  );
});

const currentGiftPromo = computed(() => promotions.value.find(p => p.PromoId === giftPromoId.value));

function openGiftModal(promoId) {
  giftPromoId.value = promoId;
  showGiftModal.value = true;
  selectedCustomerIds.value = [];
  loadCustomersBySpending();
}

async function loadCustomersBySpending() {
  loadingCustomers.value = true;
  try {
    customers.value = await getCustomersBySpending();
  } catch (e) {
    console.error(e);
    alert("Không thể tải danh sách khách hàng.");
  } finally {
    loadingCustomers.value = false;
  }
}

function toggleCustomerSelection(id) {
  const idx = selectedCustomerIds.value.indexOf(id);
  if (idx > -1) selectedCustomerIds.value.splice(idx, 1);
  else selectedCustomerIds.value.push(id);
}

function getRemainingCount(p) {
  const limit = p.UsageLimit || 0;
  return Math.max(0, limit - (p.UsedCount || 0));
}

const isAllAutoSelected = computed(() => {
    if (!currentGiftPromo.value || filteredCustomers.value.length === 0) return false;
    const p = currentGiftPromo.value;
    const limit = p.UsageLimit || 0;
    const remaining = Math.max(0, limit - (p.UsedCount || 0));
    
    if (remaining === 0) return false;

    const expectedCount = Math.min(remaining, filteredCustomers.value.length);
    // If we have selected at least the expected count, show checked
    return selectedCustomerIds.value.length > 0 && selectedCustomerIds.value.length >= expectedCount;
});

function toggleSelectAllAuto(e) {
  const checked = e.target.checked;
  if (!checked) {
    selectedCustomerIds.value = [];
  } else {
    if (!currentGiftPromo.value) return;
    const p = currentGiftPromo.value;
    const limit = p.UsageLimit || 0;
    const remaining = Math.max(0, limit - (p.UsedCount || 0));
    
    if (remaining === 0) {
      alert("Mã khuyến mãi này đã hết lượt sử dụng.");
      e.target.checked = false;
      return;
    }
    
    // Select top 'remaining' customers from the filtered list
    const countToSelect = Math.min(remaining, filteredCustomers.value.length);
    selectedCustomerIds.value = filteredCustomers.value.slice(0, countToSelect).map(c => c.CustomerId);
  }
}

async function sendGiftVoucher() {
  if (selectedCustomerIds.value.length === 0) {
    alert("Vui lòng chọn ít nhất một khách hàng.");
    return;
  }
  sendingGift.value = true;
  try {
    await PromotionApi.giftVoucher({
      CustomerIds: selectedCustomerIds.value,
      PromoId: giftPromoId.value
    });
    alert("Đã gửi mã khuyến mãi thành công!");
    showGiftModal.value = false;
  } catch (e) {
    const msg = e?.response?.data?.message || e.message || "Lỗi khi gửi mã.";
    alert(msg);
  } finally {
    sendingGift.value = false;
  }
}

function formatCurrency(val) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
}

const showPopup = ref(false);
const popupAction = ref("");
const popupTarget = ref(null);
const popupTitle = ref("");
const popupMessage = ref("");

const filteredPromotions = computed(() => {
  const keyword = searchText.value.toLowerCase().trim();
  if (!keyword) return promotions.value;
  return promotions.value.filter(p => {
    if (filterType.value === "PromoId") return displayId(p.PromoId).toLowerCase().includes(keyword);
    if (filterType.value === "PromoCode") return p.PromoCode.toLowerCase().includes(keyword);
    return false;
  });
});

function displayId(id) {
  if (id == null || id === undefined) return "PR000";
  return "PR" + String(id).padStart(3, "0");
}

function formatPrice(val) {
  return Number(val).toLocaleString("vi-VN");
}

/* ----------------- POPUP ----------------- */
function confirmAction(action, target = null) {
  popupAction.value = action;
  popupTarget.value = target;
  showPopup.value = true;
  if (action === "add") {
    popupTitle.value = "Xác nhận thêm mới";
    popupMessage.value = "Bạn có chắc muốn thêm khuyến mãi này không?";
  } else if (action === "update") {
    popupTitle.value = "Xác nhận cập nhật";
    popupMessage.value = "Bạn có chắc muốn cập nhật thông tin khuyến mãi này không?";
  } else if (action === "delete") {
    popupTitle.value = "Xác nhận xóa";
    popupMessage.value = "Bạn có chắc muốn xóa khuyến mãi này không?";
  }
}

function handleConfirm() {
  if (popupAction.value === "add") savePromotion();
  else if (popupAction.value === "update") savePromotion(true);
  else if (popupAction.value === "delete" && popupTarget.value)
    doDelete(popupTarget.value);
  closePopup();
}

function closePopup() {
  showPopup.value = false;
}

/* ----------------- CRUD ----------------- */
async function savePromotion(isUpdate = false) {
  try {
    if (isUpdate || editMode.value) {
      const updated = await PromotionApi.updatePromotion(promotion.value.PromoId, promotion.value);
      const idx = promotions.value.findIndex((p) => p.PromoId === updated.PromoId);
      if (idx !== -1) promotions.value[idx] = updated;
      editMode.value = false;
    } else {
      const created = await PromotionApi.createPromotion(promotion.value);
      promotions.value.push(created);
    }
    resetForm();
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || "Lỗi khi lưu khuyến mãi";
    alert(msg);
  }
}

function editPromotion(p) {
  promotion.value = { ...p };
  editMode.value = true;
  viewMode.value = false;
}

function viewPromotion(p) {
  if (!editMode.value) {
    promotion.value = { ...p };
    viewMode.value = true;
  }
}

function closeView() {
  viewMode.value = false;
  resetForm();
}

function cancelEdit() {
  editMode.value = false;
  resetForm();
}

function resetForm() {
  const nextId = promotions.value.length > 0 ? Math.max(...promotions.value.map(p => p.PromoId)) + 1 : 1;
  promotion.value = {
    PromoId: nextId,
    PromoCode: "",
    Description: "",
    DiscountType: "percent",
    DiscountValue: 0,
    StartDate: "",
    EndDate: "",
    MinOrderAmount: 0,
    UsageLimit: 0,
    UsedCount: 0,
    Status: "active",
  };
}

resetForm();

// load data
onMounted(async () => {
  try {
    promotions.value = await PromotionApi.getPromotions();
  } catch (err) {
    console.error(err);
    alert("Không thể tải danh sách khuyến mãi. Kiểm tra backend.");
  }
});

// delete helper
async function doDelete(target) {
  try {
    await PromotionApi.deletePromotion(target.PromoId);
    promotions.value = promotions.value.filter((p) => p.PromoId !== target.PromoId);
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || "Lỗi khi xóa";
    alert(msg);
  }
}

</script>

<style scoped>
.promotions-page {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.promotion-form {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.promotion-table {
  width: 100%;
  border-collapse: collapse;
}
.promotion-table th,
.promotion-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}
.promotion-table th {
  background-color: #2c3e50;
  color: white;
}

.promotion-table tr:hover {
  background-color: #f8f8f8;
  cursor: pointer;
}

.promotion-table tr.active {
  background-color: #e7f1ff;
}

.form-actions {
  grid-column: span 2;
  display: flex;
  gap: 10px;
}

.gift-modal {
  width: 900px;
  max-width: 95%;
}

.gift-search {
  margin-bottom: 10px;
}

.gift-search input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.customer-list {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #eee;
  margin-bottom: 15px;
}

.customer-list table {
  width: 100%;
  border-collapse: collapse;
}

.customer-list th, .customer-list td {
  padding: 8px;
  border-bottom: 1px solid #eee;
  text-align: left;
}

.customer-list th {
  background: #f5f5f5;
  position: sticky;
  top: 0;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.promo-info {
  display: flex;
  gap: 10px;
  font-size: 0.9rem;
}

.badge-code {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
  border: 1px solid #c8e6c9;
}

.badge-limit {
  background: #fff3e0;
  color: #ef6c00;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
  border: 1px solid #ffe0b2;
}

.col-checkbox {
  width: 40px;
  text-align: center !important;
}

.col-checkbox input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.text-right {
  text-align: right !important;
}

.highlight-spending {
  color: #2c3e50;
  font-weight: 600;
}

.customer-list tr.selected {
  background-color: #e3f2fd;
}

.customer-name {
  font-weight: 500;
  color: #1976d2;
}

.loading-text {
  padding: 20px;
  text-align: center;
  color: #666;
  font-style: italic;
}

button.disabled { opacity: 0.3; cursor: not-allowed; filter: grayscale(100%); }
</style>
