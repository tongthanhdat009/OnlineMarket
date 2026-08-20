<template>
  <div class="refunds-page">
    <div class="header-row">
      <h2>💸 Yêu cầu Hoàn tiền</h2>
      <div class="search-bar">
        <input v-model="searchText" type="text" placeholder="Tìm theo ID đơn hàng..." />
      </div>
    </div>

    <div v-if="loading" class="loading">Đang tải danh sách hoàn tiền...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <table v-if="!loading" class="refund-table">
      <thead>
        <tr>
          <th>ID Yêu cầu</th>
          <th>Đơn hàng</th>
          <th>Số tiền hoàn</th>
          <th>Lý do</th>
          <th>Thông tin ngân hàng</th>
          <th>Trạng thái</th>
          <th>Ngày tạo</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in filtered" :key="r.RefundId">
          <td>#{{ r.RefundId }}</td>
          <td>
            <span class="order-link" @click="openDetail(r.OrderId)">{{ displayId(r.OrderId) }}</span>
          </td>
          <td class="amount">{{ formatCurrency(r.RefundAmount) }}</td>
          <td>{{ r.Reason }}</td>
          <td>
            <div v-if="r.CustomerBankName" class="bank-info">
              <div><strong>{{ r.CustomerBankName }}</strong></div>
              <div>{{ r.CustomerBankAccount }}</div>
              <div>{{ r.CustomerAccountHolder }}</div>
            </div>
            <div v-else>-</div>
          </td>
          <td><span :class="['badge', r.Status]">{{ r.Status }}</span></td>
          <td>{{ formatDate(r.CreatedAt) }}</td>
          <td class="actions">
            <button 
              v-if="r.Status === 'pending'" 
              class="btn-confirm" 
              @click="confirmRefund(r)"
            >
              Xác nhận hoàn tiền
            </button>
            <button class="btn-outline" :disabled="generatingId === r.OrderId" @click="openDetail(r.OrderId)">
              {{ generatingId === r.OrderId ? 'Đang tạo PDF…' : 'Xem đơn' }}
            </button>
          </td>
        </tr>
        <tr v-if="filtered.length === 0">
          <td colspan="8">Không có yêu cầu hoàn tiền nào</td>
        </tr>
      </tbody>
    </table>
    <Pagination :page="page" :pageSize="pageSize" :total="total" @update:page="page = $event; load()" @update:pageSize="pageSize = $event; page = 1; load()" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { fetchRefundRequests, fetchOrderById, confirmRefund as apiConfirmRefund } from '../api/Order.js';
import { parsePagedResponse, buildPagedParams } from '../utils/pagination.js';
import Pagination from '../components/Pagination.vue';
import { generateInvoicePDF } from '../utils/generateInvoicePDF.js';

const refunds = ref([]);
const loading = ref(true);
const error = ref('');
const searchText = ref('');
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const generatingId = ref(null);

const filtered = computed(() => refunds.value);

function displayId(id) { return `O${String(id).padStart(3,'0')}`; }
function formatDate(d) { try { return new Date(d).toLocaleString('vi-VN'); } catch { return d; } }
function formatCurrency(v) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v||0)); }

async function load() {
  loading.value = true; error.value='';
  try {
    const params = buildPagedParams({ page: page.value, pageSize: pageSize.value, search: searchText.value, searchField: 'OrderId' });
    const data = await fetchRefundRequests(params);
    const { items, total: t } = parsePagedResponse(data);
    total.value = t;
    const arr = Array.isArray(items) ? items : (Array.isArray(data) ? data : []);
    if (Array.isArray(data) && arr.length > pageSize.value && total.value === arr.length) {
      const kw = (searchText.value||'').toLowerCase().trim();
      let filteredArr = arr;
      if (kw) filteredArr = arr.filter(r => String(r.OrderId).includes(kw) || String(r.RefundId).includes(kw));
      total.value = filteredArr.length;
      const start = (page.value-1)*pageSize.value;
      refunds.value = filteredArr.slice(start, start+pageSize.value);
    } else {
      refunds.value = arr.length ? arr : (Array.isArray(data) ? data : []);
      if (!total.value && Array.isArray(refunds.value)) total.value = refunds.value.length;
    }
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Không thể tải danh sách hoàn tiền.';
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

async function confirmRefund(refund) {
  if (!confirm(`Xác nhận hoàn tiền ${formatCurrency(refund.RefundAmount)} cho yêu cầu #${refund.RefundId}?`)) return;
  
  try {
    await apiConfirmRefund(refund.RefundId);
    alert('Đã xác nhận hoàn tiền thành công!');
    await load(); // Reload list
  } catch (e) {
    console.error(e);
    alert(e?.response?.data?.message || e?.message || 'Lỗi khi xác nhận hoàn tiền');
  }
}

onMounted(load);
let _refundSearchTimer = null;
watch(searchText, () => {
  clearTimeout(_refundSearchTimer);
  _refundSearchTimer = setTimeout(() => { page.value = 1; load(); }, 400);
});
</script>

<style scoped>
.refunds-page { background: #fff; padding: 16px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
.header-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.search-bar input { height:36px; padding:0 10px; border:1px solid #ddd; border-radius:6px; width: 250px; }
.loading { padding:12px; color:#666; }
.error { padding:10px; background:#fdecea; color:#b91c1c; border:1px solid #fecaca; border-radius:6px; margin-bottom:10px; }

.refund-table { width:100%; border-collapse: collapse; }
.refund-table th, .refund-table td { border:1px solid #eee; padding:10px; text-align:center; vertical-align: middle; }
.refund-table thead th { background-color: #2c3e50; color: #ffffff; }

.amount { font-weight: bold; color: #d32f2f; }
.bank-info { text-align: left; font-size: 0.9em; }
.order-link { color: #1abc9c; cursor: pointer; font-weight: bold; text-decoration: underline; }

.actions { display:flex; gap:8px; justify-content:center; }
.btn-outline { padding:6px 10px; border:2px solid #1abc9c; color:#1abc9c; background:#fff; border-radius:6px; font-weight:600; cursor:pointer; }
.btn-outline:hover { background:#1abc9c; color:#fff; }
.btn-outline:disabled { opacity:.5; cursor:not-allowed; }

.btn-confirm { padding:6px 10px; border:none; color:#fff; background:#e67e22; border-radius:6px; font-weight:600; cursor:pointer; }
.btn-confirm:hover { background:#d35400; }

.badge { padding:4px 8px; border-radius:999px; font-size:12px; font-weight:700; text-transform:uppercase; }
.badge.pending { background:#fff7ed; color:#b45309; }
.badge.approved { background:#e3f2fd; color:#0d47a1; }
.badge.rejected { background:#fee2e2; color:#b91c1c; }
.badge.completed { background:#d4edda; color:#155724; }
</style>
