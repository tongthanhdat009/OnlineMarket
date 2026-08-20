<template>
  <div class="orders-page">
    <div class="header-row">
      <h2>🌐 Đơn hàng Online</h2>
      <div class="search-bar">
        <select v-model="filterType">
          <option value="id">ID</option>
          <option value="customer">Khách hàng</option>
          <option value="phone">SĐT</option>
        </select>
        <input v-model="searchText" type="text" placeholder="Nhập từ khoá..." />
      </div>
    </div>

    <div v-if="loading" class="loading">Đang tải danh sách đơn hàng online...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <table v-if="!loading" class="order-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Khách hàng</th>
          <th>Ngày đặt</th>
          <th>Trạng thái Đơn</th>
          <th>Thanh toán</th>
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
              <small v-if="o.Phone">{{ o.Phone }}</small>
              <small v-if="o.Email">{{ o.Email }}</small>
              <small class="address-text" v-if="o.Address">
                {{ o.Address }}
              </small>
            </div>
          </td>
          <td>{{ formatDate(o.OrderDate) }}</td>
          <td><span :class="['badge', o.OrderStatus]">{{ o.OrderStatus }}</span></td>
          <td><span :class="['badge', o.PayStatus]">{{ o.PayStatus }}</span></td>
          <td>{{ formatCurrency(o.TotalAmount) }}</td>
          <td>{{ formatCurrency(o.DiscountAmount) }}</td>
          <td class="actions">
            <button 
              v-if="getNextAction(o.OrderStatus)" 
              class="btn-approve" 
              @click="advanceStatus(o)"
            >
              {{ getNextAction(o.OrderStatus).label }}
            </button>
            <button 
              v-if="o.OrderStatus !== 'completed' && o.OrderStatus !== 'canceled' && o.PayStatus === 'pending'" 
              class="btn-cancel" 
              @click="cancelOrder(o)"
            >
              Hủy
            </button>
            <button class="btn-outline" :disabled="generatingId === o.OrderId" @click="openDetail(o.OrderId)">
              {{ generatingId === o.OrderId ? 'Đang tạo PDF…' : 'Xem chi tiết' }}
            </button>
          </td>
        </tr>
        <tr v-if="filtered.length === 0">
          <td colspan="8">Không có dữ liệu phù hợp</td>
        </tr>
      </tbody>
    </table>
    <Pagination :page="page" :pageSize="pageSize" :total="total" @update:page="page = $event; load()" @update:pageSize="pageSize = $event; page = 1; load()" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { fetchOrdersOnline, fetchOrderById, updateOrderStatus, cancelOrder as apiCancelOrder } from '../api/Order.js';
import { parsePagedResponse, buildPagedParams } from '../utils/pagination.js';
import Pagination from '../components/Pagination.vue';
import { generateInvoicePDF } from '../utils/generateInvoicePDF.js';

const orders = ref([]);
const loading = ref(true);
const error = ref('');

const searchText = ref('');
const filterType = ref('id');
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const generatingId = ref(null);

const filtered = computed(() => orders.value);

function displayId(id) { return `O${String(id).padStart(3,'0')}`; }
function formatDate(d) { try { return new Date(d).toLocaleString('vi-VN'); } catch { return d; } }
function formatCurrency(v) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v||0)); }

async function load() {
  loading.value = true; error.value='';
  try {
    const sfMap = { id: 'OrderId', customer: 'Customer', phone: 'Phone' };
    const sf = sfMap[filterType.value] || filterType.value;
    const params = buildPagedParams({ page: page.value, pageSize: pageSize.value, search: searchText.value, searchField: sf });
    const data = await fetchOrdersOnline(params);
    const { items, total: t } = parsePagedResponse(data);
    total.value = t;
    const arr = Array.isArray(items) ? items : (Array.isArray(data) ? data : []);
    if (Array.isArray(data) && arr.length > pageSize.value && total.value === arr.length) {
      const kw = (searchText.value||'').toLowerCase().trim();
      let filteredArr = arr;
      if (kw) {
        filteredArr = arr.filter(o => {
          if (filterType.value === 'id') return String(o.OrderId).includes(kw) || displayId(o.OrderId).toLowerCase().includes(kw);
          if (filterType.value === 'customer') return (o.Customer?.Name || '').toLowerCase().includes(kw);
          if (filterType.value === 'phone') return (o.Customer?.Phone || '').toLowerCase().includes(kw);
          return false;
        });
        total.value = filteredArr.length;
      }
      const start = (page.value-1)*pageSize.value;
      orders.value = filteredArr.slice(start, start+pageSize.value);
    } else {
      orders.value = arr.length ? arr : (Array.isArray(data) ? data : []);
      if (!total.value && Array.isArray(orders.value)) total.value = orders.value.length;
    }
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Không thể tải danh sách đơn hàng online.';
  } finally {
    loading.value = false;
  }
}

const statusFlow = {
  'pending': { next: 'approved', label: 'Duyệt đơn' },
  'approved': { next: 'processing', label: 'Xử lý' },
  'processing': { next: 'shipping', label: 'Giao hàng' },
  'shipping': { next: 'delivered', label: 'Đã giao' },
  'delivered': { next: 'completed', label: 'Hoàn tất' }
};

function getNextAction(currentStatus) {
  return statusFlow[currentStatus];
}

async function advanceStatus(order) {
  const action = getNextAction(order.OrderStatus);
  if (!action) return;

  if (!confirm(`Xác nhận chuyển trạng thái đơn hàng ${displayId(order.OrderId)} sang "${action.label}"?`)) return;

  try {
    await updateOrderStatus(order.OrderId, action.next);
    await load(); 
  } catch (e) {
    console.error(e);
    alert(e?.response?.data || e?.message || 'Lỗi khi cập nhật trạng thái');
  }
}

async function cancelOrder(order) {
  if (!confirm(`Bạn có chắc muốn hủy đơn hàng ${displayId(order.OrderId)}? Hành động này sẽ hoàn kho (nếu đã duyệt) và không thể hoàn tác.`)) return;
  try {
    await apiCancelOrder(order.OrderId);
    await load();
    alert('Đã hủy đơn hàng thành công!');
  } catch (e) {
    console.error(e);
    alert(e?.response?.data?.message || e?.message || 'Lỗi khi hủy đơn hàng');
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

onMounted(load);
let _onlineSearchTimer = null;
watch([searchText, filterType], () => {
  clearTimeout(_onlineSearchTimer);
  _onlineSearchTimer = setTimeout(() => { page.value = 1; load(); }, 400);
});
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
.address-text { font-size: 0.8em; color: #555; margin-top: 2px; max-width: 200px; white-space: normal; }
.actions { display:flex; gap:8px; justify-content:center; }
.btn-outline { padding:6px 10px; border:2px solid #1abc9c; color:#1abc9c; background:#fff; border-radius:6px; font-weight:600; cursor:pointer; }
.btn-outline:hover { background:#1abc9c; color:#fff; }
.btn-outline:disabled { opacity:.5; cursor:not-allowed; }

.btn-approve { padding:6px 10px; border:none; color:#fff; background:#28a745; border-radius:6px; font-weight:600; cursor:pointer; }
.btn-approve:hover { background:#218838; }

.btn-cancel { padding:6px 10px; border:none; color:#fff; background:#dc3545; border-radius:6px; font-weight:600; cursor:pointer; }
.btn-cancel:hover { background:#c82333; }

.badge { padding:4px 8px; border-radius:999px; font-size:12px; font-weight:700; text-transform:uppercase; }
.badge.paid { background:#e6fffa; color:#0f766e; }
.badge.pending { background:#fff7ed; color:#b45309; }
.badge.canceled { background:#fee2e2; color:#b91c1c; }
.badge.approved { background:#e3f2fd; color:#0d47a1; }
.badge.processing { background:#fff3cd; color:#856404; }
.badge.shipping { background:#d1ecf1; color:#0c5460; }
.badge.delivered { background:#d4edda; color:#155724; }
.badge.completed { background:#c3e6cb; color:#155724; }
</style>
