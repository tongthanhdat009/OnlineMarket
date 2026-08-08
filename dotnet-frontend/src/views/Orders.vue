<template>
  <div class="orders-page">
    <div class="header-row">
      <h2>🧾 Quản lý đơn hàng</h2>
      <div class="search-bar">
        <select v-model="filterType">
          <option value="id">ID</option>
          <option value="customer">Khách hàng</option>
          <option value="phone">SĐT</option>
        </select>
        <input v-model="searchText" type="text" placeholder="Nhập từ khoá..." />
      </div>
    </div>

    <div v-if="loading" class="loading">Đang tải danh sách đơn hàng...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <table v-if="!loading" class="order-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Khách hàng</th>
          <th>Ngày đặt</th>
          <th>TT Thanh toán</th>
          <th>TT Đơn hàng</th>
          <th>Tổng tiền</th>
          <th>Giảm giá</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="o in filtered" :key="o.OrderId">
          <td>{{ displayId(o.OrderId) }}</td>
          <td>
            <div class="customer-col">
              <strong>{{ o.Name || o.Customer?.Name || 'Khách lẻ' }}</strong>
            </div>
          </td>
          <td>{{ formatDate(o.OrderDate) }}</td>
          <td><span :class="['badge', o.PayStatus]">{{ o.PayStatus }}</span></td>
          <td><span :class="['badge', o.OrderStatus]">{{ o.OrderStatus }}</span></td>
          <td>{{ formatCurrency(o.TotalAmount) }}</td>
          <td>{{ formatCurrency(o.DiscountAmount) }}</td>
          <td class="actions">
            <button class="btn-outline" :disabled="generatingId === o.OrderId" @click="openDetail(o.OrderId)">
              {{ generatingId === o.OrderId ? 'Đang tạo PDF…' : 'Xem chi tiết' }}
            </button>
            <button class="btn-danger" :disabled="o.OrderStatus === 'canceled'" @click="confirmCancel(o)">Hủy đơn</button>
          </td>
        </tr>
        <tr v-if="filtered.length === 0">
          <td colspan="8">Không có dữ liệu phù hợp</td>
        </tr>
      </tbody>
    </table>

    <!-- Điều hướng sang trang chi tiết order-items thay vì mở modal -->

    <!-- Xác nhận huỷ -->
    <div v-if="showConfirm" class="confirm-overlay">
      <div class="confirm-box">
        <h3>Xác nhận</h3>
        <p>Bạn muốn hủy đơn {{ displayId(pendingOrder?.OrderId) }}?</p>
        <div class="actions">
          <button class="btn-yes" :disabled="canceling" @click="doCancel">{{ canceling ? 'Đang hủy...' : 'Xác nhận' }}</button>
          <button class="btn-no" :disabled="canceling" @click="closeConfirm">Hủy</button>
        </div>
        <div v-if="cancelError" class="error" style="margin-top:8px;">{{ cancelError }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { fetchOrders, cancelOrder, fetchOrderById } from '../api/Order.js';
import { generateInvoicePDF } from '../utils/generateInvoicePDF.js';

const orders = ref([]);
const loading = ref(true);
const error = ref('');

const searchText = ref('');
const filterType = ref('id');


const showConfirm = ref(false);
const pendingOrder = ref(null);
const canceling = ref(false);
const cancelError = ref('');
const generatingId = ref(null);

const filtered = computed(() => {
  const kw = (searchText.value || '').toLowerCase().trim();
  if (!kw) return orders.value;
  return orders.value.filter(o => {
    if (filterType.value === 'id') return String(o.OrderId).includes(kw) || displayId(o.OrderId).toLowerCase().includes(kw);
    if (filterType.value === 'customer') return (o.Customer?.Name || '').toLowerCase().includes(kw);
    if (filterType.value === 'phone') return (o.Customer?.Phone || '').toLowerCase().includes(kw);
    return false;
  });
});

function displayId(id) { return `O${String(id).padStart(3,'0')}`; }
function formatDate(d) { try { return new Date(d).toLocaleString('vi-VN'); } catch { return d; } }
function formatCurrency(v) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v||0)); }

async function load() {
  loading.value = true; error.value='';
  try {
    const data = await fetchOrders();
    orders.value = Array.isArray(data) ? data : (data?.data || []);
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Không thể tải danh sách đơn hàng.';
  } finally {
    loading.value = false;
  }
}

async function openDetail(orderId) {
  try {
    error.value = '';
    generatingId.value = orderId;
    const data = await fetchOrderById(orderId);
    const order = data?.Order || data?.data?.Order || data;
    if (!order) throw new Error('Không lấy được dữ liệu đơn hàng');
    generateInvoicePDF(order);
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Không thể xem chi tiết đơn hàng.';
  } finally {
    generatingId.value = null;
  }
}

function confirmCancel(order) { pendingOrder.value = order; cancelError.value=''; showConfirm.value = true; }
function closeConfirm() { showConfirm.value = false; pendingOrder.value = null; }

async function doCancel() {
  if (!pendingOrder.value) return;
  canceling.value = true; cancelError.value='';
  try {
    await cancelOrder(pendingOrder.value.OrderId);
    const idx = orders.value.findIndex(x => x.OrderId === pendingOrder.value.OrderId);
    if (idx >= 0) {
      orders.value[idx] = { 
        ...orders.value[idx], 
        OrderStatus: 'canceled',
        PayStatus: orders.value[idx].PayStatus === 'pending' ? 'canceled' : 'refunded'
      };
    }
    closeConfirm();
  } catch (e) {
    cancelError.value = e?.response?.data?.message || e?.message || 'Hủy đơn thất bại.';
  } finally {
    canceling.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.orders-page { background: #fff; padding: 16px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
.header-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.search-bar { display:flex; gap:8px; align-items:center; }
.search-bar input { height:36px; padding:0 10px; border:1px solid #ddd; border-radius:6px; }
.search-bar select { height:36px; border:1px solid #ddd; border-radius:6px; padding:0 8px; }
.loading { padding:12px; color:#666; }
.error { padding:10px; background:#fdecea; color:#b91c1c; border:1px solid #fecaca; border-radius:6px; margin-bottom:10px; }

.order-table { width:100%; border-collapse: collapse; }
.order-table th, .order-table td { border:1px solid #eee; padding:10px; text-align:center; }
.order-table thead th {   background-color: #2c3e50;color: #ffffff; }
.customer-col { display:flex; flex-direction:column; align-items:flex-start; text-align: left; }
.customer-col small { color:#6b7280; }
.actions { display:flex; gap:8px; justify-content:center; }
.btn-outline { padding:6px 10px; border:2px solid #1abc9c; color:#1abc9c; background:#fff; border-radius:6px; font-weight:600; cursor:pointer; }
.btn-outline:hover { background:#1abc9c; color:#fff; }
.btn-danger { padding:6px 10px; border:2px solid #ef4444; color:#ef4444; background:#fff; border-radius:6px; font-weight:600; cursor:pointer; }
.btn-danger:disabled { opacity:.5; cursor:not-allowed; }
.btn-danger:not(:disabled):hover { background:#ef4444; color:#fff; }

.badge { padding:4px 8px; border-radius:999px; font-size:12px; font-weight:700; text-transform:uppercase; }
.badge.paid { background:#e6fffa; color:#0f766e; }
.badge.pending { background:#fff7ed; color:#b45309; }
.badge.canceled { background:#fee2e2; color:#b91c1c; }
.badge.refunded { background:#f3e8ff; color:#7e22ce; }
.badge.completed { background:#dcfce7; color:#15803d; }
.badge.approved { background:#e0f2fe; color:#0369a1; }
.badge.processing { background:#ffedd5; color:#c2410c; }
.badge.shipping { background:#fef9c3; color:#a16207; }
.badge.delivered { background:#d1fae5; color:#047857; }

/* Modal styles removed because we navigate to detail page */

/* Confirm */
.confirm-overlay { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.4); z-index:1000; }
.confirm-box { background:#fff; width:360px; border-radius:10px; padding:16px; box-shadow:0 10px 30px rgba(0,0,0,.2); }
.confirm-box h3 { margin:0 0 8px; }
.confirm-box .actions { display:flex; justify-content:flex-end; gap:8px; margin-top:12px; }
.btn-yes { padding:8px 12px; background:#ef4444; color:#fff; border:none; border-radius:6px; cursor:pointer; }
.btn-no { padding:8px 12px; background:#e5e7eb; color:#111827; border:none; border-radius:6px; cursor:pointer; }
</style>
