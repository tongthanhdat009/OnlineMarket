<template>
  <div class="customers-page">
    <h2>👥 Quản lý khách hàng</h2>

    <!-- 🔍 Thanh tìm kiếm -->
    <div class="search-bar">
      <label for="filterType">Tìm theo:</label>
      <select v-model="filterType" id="filterType">
        <option value="id">ID</option>
        <option value="name">Tên khách hàng</option>
        <option value="phone">Số điện thoại</option>
        <option value="email">Email</option>
      </select>

      <input type="text" v-model="searchText" placeholder="Nhập từ khóa..." />
    </div>

    <!-- 📝 Form thêm / sửa / xem -->
    <form class="customer-form" @submit.prevent="confirmSave">
      <div v-if="formError" class="form-error">{{ formError }}</div>
      <div class="form-group">
        <label>ID</label>
        <input v-model="customer.id" type="text" readonly />
      </div>

      <div class="form-group">
        <label> Tên khách hàng <span class="required">*</span></label>
        <input
          v-model="customer.name"
          type="text"
          placeholder="Tên khách hàng"
          :readonly="viewMode && !editMode"
          required
        />
      </div>

      <div class="form-group">
        <label>Số điện thoại <span class="required">*</span></label>
        <input
          v-model="customer.phone"
          type="text"
          placeholder="Số điện thoại"
          :readonly="viewMode && !editMode"
          required
        />
      </div>

      <div class="form-group">
        <label>Email</label>
        <input
          v-model="customer.email"
          type="email"
          placeholder="Email"
          :readonly="viewMode && !editMode"
        />
      </div>

      <div class="form-group">
        <label>Địa chỉ</label>
        <input
          v-model="customer.address"
          type="text"
          placeholder="Địa chỉ"
          :readonly="viewMode && !editMode"
        />
      </div>

      <button type="submit" v-if="!viewMode">{{ editMode ? "Cập nhật" : "Thêm mới" }}</button>
      <button type="button" v-if="editMode" @click="cancelEdit">Hủy</button>
      <button type="button" v-if="viewMode && !editMode" @click="closeView">Đóng</button>
    </form>

    <!-- 📋 Bảng hiển thị -->
    <table class="customer-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Tên khách hàng</th>
          <th>Số điện thoại</th>
          <th>Email</th>
          <th>Địa chỉ</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="c in paginatedCustomers"
          :key="c.id"
          :class="{ active: customer.id === c.id && (editMode || viewMode) }"
          @click="viewCustomer(c)"
        >
          <td>{{ c.id }}</td>
          <td>{{ c.name }}</td>
          <td>{{ c.phone }}</td>
          <td>{{ c.email }}</td>
          <td>{{ c.address }}</td>
          <td>
            <button @click.stop="confirmEdit(c)">✏️</button>
            <button @click.stop="confirmDelete(c.id)">🗑️</button>
            <button @click.stop="fetchOrders(c.id)">📦</button>
          </td>
        </tr>
        <tr v-if="filteredCustomers.length === 0">
          <td colspan="6">Không có dữ liệu phù hợp</td>
        </tr>
      </tbody>
    </table>

    <!-- 📦 Modal hiển thị danh sách đơn hàng -->
    <div v-if="showOrdersModal" class="orders-modal-overlay" @click.self="closeOrdersModal">
      <div class="orders-modal">
        <header class="orders-modal-header">
          <h3>📦 Đơn hàng của khách hàng</h3>
          <button class="close-btn" @click="closeOrdersModal">✕</button>
        </header>

        <div class="orders-modal-body">
          <div v-if="ordersError" class="form-error">{{ ordersError }}</div>

          <table v-if="orders.length" class="orders-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Ngày</th>
                <th>Trạng thái</th>
                <th>Tổng tiền</th>
                <th>Phương thức TT</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in orders" :key="o.OrderId">
                <td>#{{ o.OrderId }}</td>
                <td>{{ formatDate(o.OrderDate) }}</td>
                <td><span class="status-badge" :class="'status-' + o.Status">{{ o.Status }}</span></td>
                <td>{{ formatCurrency(o.TotalAmount) }}</td>
                <td>{{ o.Payments?.[0]?.PaymentMethod || '—' }}</td>
                <td><button class="btn-view" @click.stop="viewOrderDetails(o.OrderId)">Xem hóa đơn</button></td>
              </tr>
            </tbody>
          </table>

          <div v-else-if="!ordersError" class="no-data">Không có đơn hàng</div>
        </div>
      </div>
    </div>

    <!-- invoice detail UI removed -->

    <!-- �🔢 Phân trang -->
    <div class="pagination" v-if="filteredCustomers.length > pageSize">
      <button :disabled="currentPage === 1" @click="currentPage = currentPage - 1">Prev</button>

      <button
        v-for="p in pageNumbers"
        :key="p"
        :class="{ active: p === currentPage }"
        @click="currentPage = p"
      >
        {{ p }}
      </button>

      <button :disabled="currentPage >= totalPages" @click="currentPage = currentPage + 1">Next</button>
      <span class="page-info">Trang {{ currentPage }} / {{ totalPages }}</span>
    </div>

    <!-- ✅ Hộp xác nhận -->
    <div v-if="showConfirm" class="confirm-overlay">
      <div class="confirm-box">
        <h3>{{ confirmTitle }}</h3>
        <p>{{ confirmMessage }}</p>
        <div class="actions">
          <button class="btn-yes" @click="handleConfirmYes">Đồng ý</button>
          <button class="btn-no" @click="handleConfirmNo">Hủy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { fetchCustomers, addCustomer, updateCustomer, deleteCustomer as deleteCustomerApi, getCustomerOrders } from "@/api/Customer";
import { fetchOrderById } from "@/api/Order";
import { generateInvoicePDF } from "@/utils/generateInvoicePDF";

// 🧩 Dữ liệu khách hàng (từ API)
const customers = ref([]);

// Trạng thái tải và lỗi (tùy chọn)
const loading = ref(false);
const loadError = ref("");

const customer = ref({ id: "", name: "", phone: "", email: "", address: "" });
const editMode = ref(false);
const viewMode = ref(false); // ✅ thêm biến xem chi tiết

const searchText = ref("");
const filterType = ref("id");
// Phân trang
const currentPage = ref(1);
const pageSize = 10; // 1 trang 10 khách

// ✅ Popup xác nhận
const showConfirm = ref(false);
const confirmTitle = ref("");
const confirmMessage = ref("");
let confirmAction = null;
const formError = ref("");
const orders = ref([]);
const ordersError = ref("");
const showOrdersModal = ref(false);

function formatDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleString();
  } catch (e) {
    return String(d);
  }
}

function formatCurrency(v) {
  if (v == null) return "";
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
}

// 🔍 Lọc khách hàng
const filteredCustomers = computed(() => {
  const keyword = searchText.value.toLowerCase().trim();
  if (!keyword) return customers.value;
  return customers.value.filter((c) => {
    const val = String(c[filterType.value] ?? "").toLowerCase();
    return val.includes(keyword);
  });
});

// Danh sách sau khi phân trang
const totalPages = computed(() => Math.max(1, Math.ceil(filteredCustomers.value.length / pageSize)));

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredCustomers.value.slice(start, start + pageSize);
});

const pageNumbers = computed(() => {
  return Array.from({ length: totalPages.value }, (_, i) => i + 1);
});

// Khi tìm kiếm/lọc thay đổi, quay lại trang 1
watch([searchText, filterType, customers], () => {
  currentPage.value = 1;
});

// 🆕 Sinh ID mới
function generateNextId() {
  // Khi dữ liệu lấy từ DB, ID do server quản lý. Hàm này chỉ phục vụ form local nếu cần.
  if (customers.value.length === 0) return "";
  const ids = customers.value
    .map((c) => parseInt(String(c.id).replace(/\D/g, "")))
    .filter((n) => !Number.isNaN(n));
  if (ids.length === 0) return "";
  const next = Math.max(...ids) + 1;
  return String(next);
}

// 💾 Lưu khách hàng (gọi API khi thêm mới)
async function saveCustomer() {
  // Nếu đang edit thì gọi API PUT để cập nhật
  if (editMode.value) {
    try {
      const payload = {
        Name: customer.value.name,
        Phone: customer.value.phone,
        Email: customer.value.email,
        Address: customer.value.address,
      };
      console.log("updateCustomer payload:", payload);
      // use customer.id as identifier (server may expect numeric id)
      const updated = await updateCustomer(customer.value.id, payload);
      console.log("updateCustomer response:", updated);
      // server may wrap response in { message, data }
      const result = updated?.data ?? updated;
      const norm = {
        id: String(result?.CustomerId ?? result?.id ?? customer.value.id ?? ""),
        name: String(result?.Name ?? result?.name ?? customer.value.name ?? ""),
        phone: String(result?.Phone ?? result?.phone ?? customer.value.phone ?? ""),
        email: String(result?.Email ?? result?.email ?? customer.value.email ?? ""),
        address: String(result?.Address ?? result?.address ?? customer.value.address ?? ""),
      };
      const index = customers.value.findIndex((c) => c.id === customer.value.id);
      if (index !== -1) customers.value[index] = norm;
      editMode.value = false;
      resetForm();
      return;
    } catch (err) {
      console.error("Failed to update customer", err);
      // prefer server-provided message if present
      const serverMsg = err?.response?.data?.message;
      formError.value = serverMsg || "Không cập nhật được khách hàng. Vui lòng thử lại.";
      return;
    }
  }

  // Thêm mới: gọi API
  try {
    const payload = {
      Name: customer.value.name,
      Phone: customer.value.phone,
      Email: customer.value.email,
      Address: customer.value.address,
    };
    // Debug: show payload being sent
    console.log("addCustomer payload:", payload);
    const created = await addCustomer(payload);
    // Debug: show raw response from POST
    console.log("addCustomer response:", created);
    const result = created?.data ?? created;
    // Chuẩn hóa object trả về từ server
    const norm = {
      id: String(result?.CustomerId ?? result?.id ?? ""),
      name: String(result?.Name ?? result?.name ?? customer.value.name ?? ""),
      phone: String(result?.Phone ?? result?.phone ?? customer.value.phone ?? ""),
      email: String(result?.Email ?? result?.email ?? customer.value.email ?? ""),
      address: String(result?.Address ?? result?.address ?? customer.value.address ?? ""),
    };
    customers.value.push(norm);
    resetForm();
  } catch (err) {
    console.error("Failed to add customer", err);
    const serverMsg = err?.response?.data?.message;
    formError.value = serverMsg || "Không thêm được khách hàng. Vui lòng thử lại.";
  }
}

// 💾 Xác nhận trước khi lưu
function confirmSave() {
  formError.value = "";
  if (!customer.value.name || customer.value.name.trim() === "") {
    formError.value = "Tên khách hàng là bắt buộc.";
    return;
  }
  if (!customer.value.phone || customer.value.phone.trim() === "") {
    formError.value = "Số điện thoại là bắt buộc.";
    return;
  }

  openConfirm(
    editMode.value ? "Xác nhận cập nhật" : "Xác nhận thêm mới",
    editMode.value
      ? `Bạn có chắc muốn cập nhật khách hàng "${customer.value.name}" không?`
      : `Bạn có chắc muốn thêm khách hàng "${customer.value.name}" không?`,
    saveCustomer
  );
}

// ✏️ Chỉnh sửa
function editCustomer(c) {
  customer.value = { ...c };
  editMode.value = true;
  viewMode.value = false;
}

// ✏️ Xác nhận chỉnh sửa
function confirmEdit(c) {
  openConfirm("Xác nhận chỉnh sửa", `Bạn muốn chỉnh sửa khách hàng "${c.name}"?`, () =>
    editCustomer(c)
  );
}

// 👁️ Xem chi tiết khi click dòng
function viewCustomer(c) {
  if (!editMode.value) {
    customer.value = { ...c };
    viewMode.value = true;
  }
}

// 🔒 Đóng chế độ xem
function closeView() {
  viewMode.value = false;
  resetForm();
}

// 🗑️ Xóa khách hàng (gọi API DELETE)
async function deleteCustomer(id) {
  try {
    console.log("deleteCustomer id:", id);
    const resp = await deleteCustomerApi(id);
    console.log("deleteCustomer response:", resp);
    // If server returns wrapper { message, data } or message only
    const serverMsg = resp?.message ?? resp;
    // Remove from local list
    customers.value = customers.value.filter((c) => c.id !== id);
    resetForm();
    // optionally show server message in formError (or use a toast). Here we set briefly.
    formError.value = typeof serverMsg === "string" ? serverMsg : "Xóa thành công.";
    // clear message after short time
    setTimeout(() => (formError.value = ""), 2500);
  } catch (err) {
    console.error("Failed to delete customer", err);
    const serverMsg = err?.response?.data?.message;
    formError.value = serverMsg || "Không xóa được khách hàng. Vui lòng thử lại.";
  }
}

// 🗑️ Xác nhận xóa
function confirmDelete(id) {
  const target = customers.value.find((c) => c.id === id) ?? { name: "(không rõ)" };
  openConfirm("Xác nhận xóa", `Bạn có chắc muốn xóa khách hàng "${target.name}"?`, () =>
    deleteCustomer(id)
  );
}

// Lấy đơn hàng của khách hàng
async function fetchOrders(id) {
  orders.value = [];
  ordersError.value = "";
  showOrdersModal.value = true;
  try {
    console.log("fetchOrders for id:", id);
    const res = await getCustomerOrders(id);
    console.log("getCustomerOrders response:", res);
    // server may return { message, data } or array directly
    const data = res?.data ?? res;
    orders.value = Array.isArray(data) ? data : [];
    if (!Array.isArray(data)) ordersError.value = "Không có đơn hàng hoặc response không hợp lệ.";
  } catch (err) {
    console.error("Failed to fetch orders", err);
    ordersError.value = err?.response?.data?.message || "Không lấy được đơn hàng.";
  }
}

function closeOrdersModal() {
  showOrdersModal.value = false;
  orders.value = [];
  ordersError.value = "";
}

// Khi bấm nút "Xem hóa đơn" — lấy chi tiết từ backend rồi log ra console
async function viewOrderDetails(orderId) {
  ordersError.value = "";
  try {
    const data = await fetchOrderById(orderId);
    generateInvoicePDF(data)
  } catch (err) {
    console.error('Failed to fetch order details', err);
    ordersError.value = err?.response?.data?.message || 'Không lấy được chi tiết đơn hàng.';
  }
}

// ❌ Hủy
function cancelEdit() {
  editMode.value = false;
  resetForm();
}

// 🔄 Reset form
function resetForm() {
  customer.value = { id: generateNextId(), name: "", phone: "", email: "", address: "" };
}

// ⚡ Hàm chung cho popup
function openConfirm(title, message, action) {
  confirmTitle.value = title;
  confirmMessage.value = message;
  confirmAction = action;
  showConfirm.value = true;
}
async function handleConfirmYes() {
  if (confirmAction) await confirmAction();
  showConfirm.value = false;
}
function handleConfirmNo() {
  showConfirm.value = false;
}

// 🚀 Tải dữ liệu từ API
async function loadCustomers() {
  loading.value = true;
  loadError.value = "";
  try {
    const data = await fetchCustomers();
    // Debug: raw GET response from API
    console.log("fetchCustomers raw:", data);
    const arr = Array.isArray(data) ? data : [];
    // Chuẩn hóa dữ liệu: đảm bảo các trường tồn tại và là string
      customers.value = arr.map((it) => ({
      id: String(it?.CustomerId ?? ""),
      name: String(it?.Name ?? ""),
      phone: String(it?.Phone ?? ""),
      email: String(it?.Email ?? ""),
      address: String(it?.Address ?? ""),
    }));
    // Nếu đang xem chi tiết hoặc chỉnh sửa mà danh sách đổi, reset form
    resetForm();
  } catch (err) {
    console.error("Failed to load customers", err);
    loadError.value = "Không tải được danh sách khách hàng. Vui lòng thử lại.";
    customers.value = [];
    resetForm();
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadCustomers();
});

resetForm();
</script>


<style scoped>
.customers-page {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* 🔍 Thanh tìm kiếm */
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}
.search-bar input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.search-bar select {
  padding: 6px 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

/* 📝 Form */
.customer-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

/* 📋 Bảng */
.customer-table {
  width: 100%;
  border-collapse: collapse;
}
.customer-table th,
.customer-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}
.customer-table th {
  background-color: #2c3e50;
  color: white;
}
.customer-table tr:hover {
  background-color: #f8f8f8;
  cursor: pointer;
}

.customer-table tr.active {
  background-color: #e7f1ff;
}

.form-actions {
  grid-column: span 2;
  display: flex;
  gap: 10px;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
}
.pagination button {
  padding: 6px 10px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}
.pagination button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
.pagination button.active {
  background: #2c3e50;
  color: white;
  border-color: #2c3e50;
}
.pagination .page-info {
  margin-left: 10px;
  color: #666;
}
.form-error {
  color: #b00020;
  margin-bottom: 8px;
}
.required {
  color: #b00020;
  margin-left: 4px;
}
.orders-panel {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #fafafa;
}
.orders-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
}
.orders-table th,
.orders-table td {
  border: 1px solid #ddd;
  padding: 6px 8px;
  text-align: left;
}
.order-detail {
  margin-top: 10px;
  padding: 10px;
  border-top: 1px dashed #ddd;
}

/* Orders modal overlay */
.orders-modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  z-index: 1100;
  padding: 20px;
}
.orders-modal {
  width: 1000px;
  max-width: 95%;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.orders-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(90deg, #34495e 0%, #2c3e50 100%);
  color: white;
  padding: 16px 20px;
}
.orders-modal-header h3 { margin: 0; }
.orders-modal-body {
  padding: 20px;
  overflow-y: auto;
}
.btn-view {
  background: #3498db;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}
.btn-view:hover {
  background: #2980b9;
}
.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}
.status-pending { background: #fff3cd; color: #856404; }
.status-paid { background: #d1ecf1; color: #0c5460; }
.status-canceled { background: #f8d7da; color: #721c24; }
.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
}

/* Invoice modal / card styles */
.invoice-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.35);
  z-index: 1200;
  padding: 20px;
}
.invoice-card {
  width: 900px;
  max-width: 100%;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  overflow: hidden;
}
.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  background: linear-gradient(90deg, #2c3e50 0%, #3a5772 100%);
  color: white;
  padding: 18px 20px;
}
.invoice-header h3 { margin: 0 0 6px 0; letter-spacing: 1px; }
.invoice-header .meta { font-size: 13px; opacity: 0.95; }
.invoice-header .status-badge { background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 6px; font-weight: 600; }
.close-btn { background: transparent; color: white; border: none; font-size: 20px; cursor: pointer; }

.invoice-body { display: grid; grid-template-columns: 1fr 1fr 320px; gap: 18px; padding: 18px 20px; align-items: start; }
.invoice-body .col { background: #fafafa; padding: 12px; border-radius: 6px; border: 1px solid #f0f0f0; }
.invoice-body h4 { margin-top: 0; margin-bottom: 8px; }
.payments-summary ul { list-style: none; padding: 0; margin: 0; max-height: 200px; overflow: auto; }
.payment-row { display: flex; justify-content: space-between; gap: 10px; padding: 8px 6px; border-bottom: 1px dashed #eee; align-items: center; }
.payment-row .pm-method { font-weight: 600; color: #333; }
.payment-row .pm-amount { color: #0b6a0b; font-weight: 700; }
.payment-row .pm-date { font-size: 12px; color: #666; }
.no-pay { color: #888; padding: 10px 6px; }

.totals { display: flex; flex-direction: column; gap: 8px; }
.total-row { display: flex; justify-content: space-between; padding: 6px 4px; border-bottom: 1px solid rgba(0,0,0,0.03); }
.total-row.grand { font-size: 18px; font-weight: 800; color: #111; padding-top: 10px; }

.invoice-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 20px; background: #fff; border-top: 1px solid #f0f0f0; }
.btn-detail { background: linear-gradient(90deg,#4b8bf5,#2c6ee6); color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; }
.btn-detail:disabled { background: #ccc; cursor: not-allowed; opacity: 0.6; }
.btn-close { background: #f3f3f3; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; }

@media (max-width: 900px) {
  .invoice-body { grid-template-columns: 1fr; }
  .totals { order: 3; }
}
</style>
