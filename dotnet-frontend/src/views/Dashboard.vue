<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <h2>📊 Dashboard</h2>
      <p class="subtitle">Thống kê doanh thu & đơn hàng</p>
    </div>

    <!-- Summary Cards -->
    <div class="stats-grid">
      <div class="stat-card users">
        <div class="stat-icon">
          <User />
        </div>
        <div class="stat-info">
          <span class="stat-label">Tổng Users</span>
          <p class="stat-value">{{ totalUsers }}</p>
        </div>
      </div>

      <div class="stat-card products">
        <div class="stat-icon">
          <Package />
        </div>
        <div class="stat-info">
          <span class="stat-label">Sản phẩm</span>
          <p class="stat-value">{{ totalProducts }}</p>
        </div>
      </div>

      <div class="stat-card categories">
        <div class="stat-icon">
          <ChartBarStacked />
        </div>
        <div class="stat-info">
          <span class="stat-label">Loại SP</span>
          <p class="stat-value">{{ totalCategories }}</p>
        </div>
      </div>

      <div class="stat-card revenue">
        <div class="stat-icon">
          <Wallet />
        </div>
        <div class="stat-info">
          <span class="stat-label">Tổng doanh thu</span>
          <p class="stat-value small">
            {{ formatPrice(dashboardStats.TotalRevenue) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Orders Overview Cards -->
    <div class="orders-overview">
      <h3 class="section-title">
        📦 Tổng quan đơn hàng (Hoàn thành & Đã thanh toán)
      </h3>
      <div class="orders-cards">
        <div class="order-card total">
          <div class="order-card-header">
            <ReceiptText />
            <span>Tất cả đơn</span>
          </div>
          <div class="order-card-body">
            <div class="order-stat">
              <span class="order-count">{{
                dashboardStats.CompletedOrders
              }}</span>
              <span class="order-label">đơn hoàn thành</span>
            </div>
            <div class="order-revenue">
              <span>{{ formatPrice(dashboardStats.TotalRevenue) }} VND</span>
            </div>
          </div>
        </div>

        <div class="order-card online">
          <div class="order-card-header">
            <Globe />
            <span>Đơn Online</span>
          </div>
          <div class="order-card-body">
            <div class="order-stat">
              <span class="order-count">{{
                dashboardStats.CompletedOnlineOrders
              }}</span>
              <span class="order-label">đơn hoàn thành</span>
            </div>
            <div class="order-revenue">
              <span>{{ formatPrice(dashboardStats.OnlineRevenue) }} VND</span>
            </div>
          </div>
          <div class="order-card-footer">
            <div class="progress-bar">
              <div
                class="progress"
                :style="{ width: onlinePercentage + '%' }"
              ></div>
            </div>
            <span class="percentage">{{ onlinePercentage.toFixed(1) }}%</span>
          </div>
        </div>

        <div class="order-card offline">
          <div class="order-card-header">
            <Store />
            <span>Đơn Offline</span>
          </div>
          <div class="order-card-body">
            <div class="order-stat">
              <span class="order-count">{{
                dashboardStats.CompletedOfflineOrders
              }}</span>
              <span class="order-label">đơn hoàn thành</span>
            </div>
            <div class="order-revenue">
              <span>{{ formatPrice(dashboardStats.OfflineRevenue) }} VND</span>
            </div>
          </div>
          <div class="order-card-footer">
            <div class="progress-bar offline">
              <div
                class="progress"
                :style="{ width: offlinePercentage + '%' }"
              ></div>
            </div>
            <span class="percentage">{{ offlinePercentage.toFixed(1) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Daily Order Statistics Table -->
    <div class="daily-stats-section">
      <div class="daily-stats-header">
        <h3>📅 Thống kê đơn hàng theo ngày</h3>
        <div class="daily-stats-controls">
          <select v-model="dailyStatsYear" @change="fetchDailyStats">
            <option v-for="y in years" :key="y" :value="y">Năm {{ y }}</option>
          </select>
          <select v-model="dailyStatsMonth" @change="fetchDailyStats">
            <option
              v-for="(m, index) in monthsSelect"
              :key="index"
              :value="index + 1"
            >
              {{ m }}
            </option>
          </select>
          <button
            class="export-btn"
            @click="exportDailyStatsPDF"
            :disabled="dailyStats.length === 0"
          >
            <FileDown style="width: 16px; height: 16px" />
            Xuất PDF
          </button>
        </div>
      </div>

      <div class="daily-stats-summary" v-if="dailyStats.length > 0">
        <div class="summary-card">
          <div class="summary-icon total">
            <CalendarDays />
          </div>
          <div class="summary-content">
            <span class="summary-label">Tổng đơn</span>
            <strong>{{ totalDailyOrders }}</strong>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon revenue">
            <Banknote />
          </div>
          <div class="summary-content">
            <span class="summary-label">Doanh thu</span>
            <strong>{{ formatPrice(totalDailyAmount) }}</strong>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon online">
            <Globe />
          </div>
          <div class="summary-content">
            <span class="summary-label">Online</span>
            <strong
              >{{ totalOnlineOrders }} ({{
                formatPrice(totalOnlineAmount)
              }})</strong
            >
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon offline">
            <Store />
          </div>
          <div class="summary-content">
            <span class="summary-label">Offline</span>
            <strong
              >{{ totalOfflineOrders }} ({{
                formatPrice(totalOfflineAmount)
              }})</strong
            >
          </div>
        </div>
      </div>

      <div class="daily-stats-table-wrapper">
        <table class="daily-stats-table" v-if="dailyStats.length > 0">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Tổng đơn</th>
              <th>Online</th>
              <th>Offline</th>
              <th>Tổng giá trị</th>
              <th>KH mua nhiều nhất</th>
              <th>Giá trị KH</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(stat, index) in dailyStats" :key="index">
              <td class="date-cell">{{ formatDate(stat.Date) }}</td>
              <td class="center">
                <span class="badge total">{{ stat.TotalOrders }}</span>
              </td>
              <td class="center">
                <span class="badge online">{{ stat.OnlineOrders }}</span>
              </td>
              <td class="center">
                <span class="badge offline">{{ stat.OfflineOrders }}</span>
              </td>
              <td class="right amount">
                {{ formatPrice(stat.TotalAmount) }} ₫
              </td>
              <td>{{ stat.TopCustomerName }}</td>
              <td class="right">{{ formatPrice(stat.TopCustomerAmount) }} ₫</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="no-data">
          <CalendarX2 style="width: 48px; height: 48px; color: #ccc" />
          <p>
            Không có dữ liệu cho tháng {{ dailyStatsMonth }}/{{
              dailyStatsYear
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Sales Report -->
    <section class="sales-report-section">
      <div class="sales-report-header">
        <div>
          <h3>📈 Báo cáo bán hàng</h3>
          <p class="report-hint">Tối đa 366 ngày · chỉ tính đơn hoàn thành & đã thanh toán</p>
        </div>
        <div class="sales-report-controls">
          <label>
            Từ
            <input v-model="reportFrom" type="date" :max="reportTo" />
          </label>
          <label>
            Đến
            <input v-model="reportTo" type="date" :min="reportFrom" :max="today" />
          </label>
          <label>
            Loại đơn
            <select v-model="reportOrderType">
              <option value="">Tất cả</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </label>
          <button class="export-btn" type="button" :disabled="reportLoading || reportDownloading" @click="loadSalesReport">
            {{ reportLoading ? "Đang tải..." : "Xem báo cáo" }}
          </button>
          <button class="export-btn report-download-btn" type="button" :disabled="reportLoading || reportDownloading || !salesReport" @click="downloadReportPDF">
            <FileDown style="width: 16px; height: 16px" />
            {{ reportDownloading ? "Đang xuất..." : "Xuất PDF" }}
          </button>
        </div>
      </div>

      <p v-if="reportError" class="report-message error">{{ reportError }}</p>
      <p v-else-if="reportLoading" class="report-message">Đang tải dữ liệu báo cáo...</p>
      <p v-else-if="!salesReport" class="report-message">Chọn khoảng ngày để xem báo cáo.</p>
      <template v-else>
        <div class="report-summary-grid">
          <div><span>Tổng đơn</span><strong>{{ salesReport.TotalOrders ?? 0 }}</strong></div>
          <div><span>Đơn hoàn thành & đã thanh toán</span><strong>{{ salesReport.CompletedPaidOrders ?? 0 }}</strong></div>
          <div><span>Doanh thu</span><strong>{{ formatPrice(salesReport.Revenue) }} ₫</strong></div>
          <div><span>Giảm giá</span><strong>{{ formatPrice(salesReport.Discounts) }} ₫</strong></div>
          <div><span>Hoàn tiền</span><strong>{{ formatPrice(salesReport.Refunds) }} ₫</strong></div>
        </div>
        <div v-if="!hasSalesReportData" class="report-message">Không có dữ liệu trong khoảng ngày đã chọn.</div>
        <div v-else class="report-breakdowns">
          <div class="report-breakdown report-period">
            <h4>Theo thời gian</h4>
            <div v-for="item in reportEntries(salesReport.ByPeriod)" :key="`period-${reportLabel(item)}`" class="report-row">
              <span>{{ reportLabel(item) }}</span><strong>{{ formatPrice(item.Revenue ?? item.TotalAmount ?? item.Value ?? 0) }} ₫</strong>
            </div>
          </div>
          <div class="report-breakdown">
            <h4>Theo trạng thái</h4>
            <div v-for="item in reportEntries(salesReport.ByStatus)" :key="`status-${reportLabel(item)}`" class="report-row">
              <span>{{ reportLabel(item) }}</span><strong>{{ reportValue(item) }}</strong>
            </div>
          </div>
          <div class="report-breakdown">
            <h4>Theo thanh toán</h4>
            <div v-for="item in reportEntries(salesReport.ByPayment)" :key="`payment-${reportLabel(item)}`" class="report-row">
              <span>{{ reportLabel(item) }}</span><strong>{{ reportValue(item) }}</strong>
            </div>
          </div>
          <div class="report-breakdown report-products">
            <h4>Sản phẩm bán chạy</h4>
            <div v-for="item in reportEntries(salesReport.TopProducts)" :key="`product-${reportLabel(item)}`" class="report-row">
              <span>{{ reportLabel(item) }}</span><strong>{{ formatPrice(item.Revenue ?? item.TotalAmount ?? 0) }} ₫</strong>
            </div>
          </div>
        </div>
      </template>
    </section>

    <!-- Charts Section -->
    <div class="search-bar">
      <label for="year">Xem biểu đồ năm:</label>
      <select v-model="time" id="year">
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>
    <div class="charts">
      <div class="chart-container salesChart">
        <div class="chart-header">
          <h3>💰 Doanh thu năm {{ time }}</h3>
          <span class="chart-total"
            >{{ formatPrice(totalSalesInYear) }} VND</span
          >
        </div>
        <canvas ref="salesChart"></canvas>
      </div>
      <div class="chart-container ordersChart">
        <div class="chart-header">
          <h3>📦 Đơn hàng năm {{ time }}</h3>
          <span class="chart-total"
            >{{ formatPrice(totalOrdersInYear) }} đơn</span
          >
        </div>
        <canvas ref="ordersChart"></canvas>
      </div>
    </div>

    <!-- Bottom Cards -->
    <div class="bottom-cards">
      <div class="info-card popular">
        <div class="info-card-header">
          <TrendingUp />
          <span>Sản phẩm phổ biến</span>
        </div>
        <div class="info-card-body">
          <div
            v-for="(product, index) in popularProducts"
            :key="index"
            class="rank-item"
          >
            <span class="rank-number">{{ index + 1 }}</span>
            <span class="rank-name">{{ product.ProductName }}</span>
            <span class="rank-value">{{ product.TotalOrders }} đơn</span>
          </div>
        </div>
      </div>

      <div class="info-card customers">
        <div class="info-card-header">
          <ChartNoAxesCombined />
          <span>Top khách hàng</span>
        </div>
        <div class="info-card-body">
          <div v-for="(user, index) in topUsers" :key="index" class="rank-item">
            <span class="rank-number">{{ index + 1 }}</span>
            <span class="rank-name">{{ user.Name }}</span>
            <span class="rank-value">{{ user.TotalOrders }} đơn</span>
          </div>
        </div>
      </div>

      <div class="info-card peak-time">
        <div class="info-card-header">
          <Clock4 />
          <span>Thời gian cao điểm</span>
        </div>
        <div class="info-card-body">
          <div v-for="(t, index) in peakTime" :key="index" class="time-item">
            <span class="time-range">{{ t.TimeRange }}</span>
            <div class="time-bar-container">
              <div
                class="time-bar"
                :style="{ width: t.Percentage + '%' }"
              ></div>
            </div>
            <span class="time-percentage">{{ t.Percentage }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getTotalProducts, getTopProducts } from "../api/Product.js";
import { getTotalUsers } from "../api/Users.js";
import { getTotalCategories } from "../api/Category.js";
import {
  getTotalOrders,
  getCompletedOrdersByYear,
  getCompletedSalesByYear,
  getPeakTimeStats,
  getDailyOrderStats,
  getDashboardStats,
} from "../api/Order.js";
import { getTopCustomers } from "../api/Customer.js";
import { getSalesReport, downloadSalesReport } from "../api/Reports.js";
import { ref, onMounted, computed, watch } from "vue";
import Chart from "chart.js/auto";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { robotoRegularBase64 } from "../utils/robotoRegularBase64";
import {
  FileDown,
  Globe,
  Store,
  CalendarDays,
  Banknote,
  CalendarX2,
  Wallet,
} from "lucide-vue-next";

// ----- data
const totalUsers = ref(0);
const totalOrders = ref(0);
const totalProducts = ref(0);
const totalCategories = ref(0);
const popularProducts = ref([]);
const totalSalesInYear = ref(0);
const totalOrdersInYear = ref(0);
const topUsers = ref([]);
const peakTime = ref([]);
const time = ref(new Date().getFullYear());
const dashboardStats = ref({
  TotalOrders: 0,
  TotalOnlineOrders: 0,
  TotalOfflineOrders: 0,
  CompletedOrders: 0,
  CompletedOnlineOrders: 0,
  CompletedOfflineOrders: 0,
  TotalRevenue: 0,
  OnlineRevenue: 0,
  OfflineRevenue: 0,
});

// Daily stats data
const dailyStats = ref([]);
const dailyStatsYear = ref(new Date().getFullYear());
const dailyStatsMonth = ref(new Date().getMonth() + 1);

// Sales report
const today = new Date().toISOString().slice(0, 10);
const reportFrom = ref(new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10));
const reportTo = ref(today);
const reportOrderType = ref("");
const salesReport = ref(null);
const reportLoading = ref(false);
const reportDownloading = ref(false);
const reportError = ref("");

// ----- Danh sách tháng & năm
const startYear = 2020;
const currentYear = new Date().getFullYear();
const years = computed(() =>
  Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i),
);

const months = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];
const monthsSelect = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

// Computed for daily stats summary
const totalDailyOrders = computed(() => {
  return dailyStats.value.reduce((sum, stat) => sum + stat.TotalOrders, 0);
});

const totalDailyAmount = computed(() => {
  return dailyStats.value.reduce((sum, stat) => sum + stat.TotalAmount, 0);
});

const totalOnlineOrders = computed(() => {
  return dailyStats.value.reduce((sum, stat) => sum + stat.OnlineOrders, 0);
});

const totalOnlineAmount = computed(() => {
  return dailyStats.value.reduce((sum, stat) => sum + stat.OnlineAmount, 0);
});

const totalOfflineOrders = computed(() => {
  return dailyStats.value.reduce((sum, stat) => sum + stat.OfflineOrders, 0);
});

const totalOfflineAmount = computed(() => {
  return dailyStats.value.reduce((sum, stat) => sum + stat.OfflineAmount, 0);
});

// Percentage calculations
const onlinePercentage = computed(() => {
  const total = dashboardStats.value.CompletedOrders;
  if (total === 0) return 0;
  return (dashboardStats.value.CompletedOnlineOrders / total) * 100;
});

const offlinePercentage = computed(() => {
  const total = dashboardStats.value.CompletedOrders;
  if (total === 0) return 0;
  return (dashboardStats.value.CompletedOfflineOrders / total) * 100;
});

// ----- watch()
watch(
  () => time.value,
  async (newVal, oldVal) => {
    await fetchOrdersByYear();
    await fetchSalesByYear();
  },
);

const salesChart = ref(null);
const ordersChart = ref(null);
let salesChartInstance = null;
let ordersChartInstance = null;

// ----- Fetch data
async function fetchDashboardStats() {
  try {
    const data = await getDashboardStats();
    dashboardStats.value = data;
  } catch (err) {
    console.error("Lỗi khi tải dashboard stats:", err);
  }
}

async function fetchDailyStats() {
  try {
    const data = await getDailyOrderStats(
      dailyStatsYear.value,
      dailyStatsMonth.value,
    );
    dailyStats.value = data;
  } catch (err) {
    console.error("Lỗi khi tải thống kê theo ngày:", err);
    dailyStats.value = [];
  }
}

async function fetchOrdersByYear() {
  try {
    const data = await getCompletedOrdersByYear(time.value);
    const orderCounts = data.map((item) => item.TotalOrders);
    const totalOrdersByYear = orderCounts.reduce((sum, val) => sum + val, 0);
    totalOrdersInYear.value = totalOrdersByYear;
    updateOrdersChart(orderCounts);
  } catch (err) {
    console.error("Lỗi khi tải dữ liệu theo năm:", err);
  }
}

function updateOrdersChart(orderCounts) {
  if (ordersChart.value) {
    ordersChartInstance.data.datasets[0].data = orderCounts;
    ordersChartInstance.update();
  }
}

async function fetchSalesByYear() {
  try {
    const data = await getCompletedSalesByYear(time.value);
    const salesAmounts = data.map((item) => item.TotalSales);
    const totalSalesByYear = salesAmounts.reduce((sum, val) => sum + val, 0);
    totalSalesInYear.value = totalSalesByYear;
    updateSalesChart(salesAmounts);
  } catch (err) {
    console.error("Lỗi khi tải doanh thu theo năm:", err);
  }
}

function updateSalesChart(salesAmounts) {
  if (salesChartInstance) {
    salesChartInstance.data.datasets[0].data = salesAmounts;
    salesChartInstance.update();
  }
}

async function fetchTotalProducts() {
  try {
    const data = await getTotalProducts();
    totalProducts.value = data;
  } catch (err) {
    console.error("Lỗi khi tải tổng sản phẩm:", err);
  }
}

async function fetchTopProducts() {
  try {
    const data = await getTopProducts();
    popularProducts.value = data;
  } catch (err) {
    console.error("Lỗi khi tải top products:", err);
  }
}

async function fetchTotalUsers() {
  try {
    const data = await getTotalUsers();
    totalUsers.value = data;
  } catch (err) {
    console.error("Lỗi khi tải tổng users:", err);
  }
}

async function fetchTopUsers() {
  try {
    const data = await getTopCustomers();
    topUsers.value = data;
  } catch (err) {
    console.error("Lỗi khi tải top users:", err);
  }
}

async function fetchTotalOrders() {
  try {
    const data = await getTotalOrders();
    totalOrders.value = data;
  } catch (err) {
    console.error("Lỗi khi tải total orders:", err);
  }
}

async function fetchTotalCategories() {
  try {
    const data = await getTotalCategories();
    totalCategories.value = data;
  } catch (err) {
    console.error("Lỗi khi tải total categories:", err);
  }
}

async function fetchPeakTimeStats() {
  try {
    const data = await getPeakTimeStats();
    peakTime.value = data;
  } catch (err) {
    console.error("Lỗi khi tải peak time stats:", err);
  }
}

// ----- Helpers

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPrice(val) {
  return Number(val || 0).toLocaleString("vi-VN");
}

const hasSalesReportData = computed(() =>
  Number(salesReport.value?.TotalOrders ?? 0) > 0 ||
  Number(salesReport.value?.CompletedPaidOrders ?? 0) > 0,
);

function reportEntries(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return Object.entries(value).map(([Label, Value]) => ({ Label, Value }));
}

function reportLabel(item) {
  return (
    item?.Label ??
    item?.Name ??
    item?.ProductName ??
    item?.Period ??
    item?.Status ??
    item?.Payment ??
    item?.PaymentMethod ??
    "—"
  );
}

function reportValue(item) {
  return item?.Value ?? item?.Count ?? item?.TotalOrders ?? 0;
}

function reportToExclusive() {
  const date = new Date(`${reportTo.value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function reportParams() {
  return {
    from: reportFrom.value,
    to: reportToExclusive(),
    ...(reportOrderType.value ? { orderType: reportOrderType.value } : {}),
  };
}

async function loadSalesReport() {
  reportError.value = "";
  const from = new Date(`${reportFrom.value}T00:00:00`);
  const to = new Date(`${reportTo.value}T00:00:00`);
  const days = (to - from) / 86400000 + 1;
  if (!reportFrom.value || !reportTo.value || reportFrom.value > reportTo.value || days > 366) {
    reportError.value = "Khoảng ngày không hợp lệ (tối đa 366 ngày).";
    return;
  }

  reportLoading.value = true;
  try {
    salesReport.value = await getSalesReport(reportParams());
  } catch (error) {
    salesReport.value = null;
    reportError.value = error?.response?.data?.Message || "Không thể tải báo cáo.";
  } finally {
    reportLoading.value = false;
  }
}

async function downloadReportPDF() {
  reportDownloading.value = true;
  reportError.value = "";
  try {
    const response = await downloadSalesReport(reportParams());
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-report-${reportFrom.value.replaceAll("-", "")}-${reportTo.value.replaceAll("-", "")}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    reportError.value = error?.response?.data?.Message || "Không thể xuất báo cáo PDF.";
  } finally {
    reportDownloading.value = false;
  }
}

// ----- PDF Export
function exportDailyStatsPDF() {
  if (dailyStats.value.length === 0) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Colors
  const primaryColor = [52, 73, 94];
  const accentColor = [41, 128, 185];
  const grayColor = [127, 140, 141];

  // Add font
  doc.addFileToVFS("Roboto-Regular.ttf", robotoRegularBase64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFont("Roboto-Regular.ttf", "Roboto", "bold");
  doc.setFont("Roboto");

  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("BÁO CÁO THỐNG KÊ ĐƠN HÀNG THEO NGÀY", pageWidth / 2, y, {
    align: "center",
  });

  y += 10;
  doc.setFontSize(12);
  doc.setFont("Roboto", "normal");
  doc.setTextColor(...accentColor);
  doc.text(
    `Tháng ${dailyStatsMonth.value}/${dailyStatsYear.value}`,
    pageWidth / 2,
    y,
    { align: "center" },
  );

  y += 12;
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text(
    "(Chỉ bao gồm đơn hàng hoàn thành & đã thanh toán)",
    pageWidth / 2,
    y,
    { align: "center" },
  );

  y += 12;

  // Summary
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text(`Tổng đơn: ${totalDailyOrders.value}`, margin, y);
  doc.text(`Online: ${totalOnlineOrders.value}`, margin + 50, y);
  doc.text(`Offline: ${totalOfflineOrders.value}`, margin + 90, y);

  y += 6;
  doc.text(
    `Tổng doanh thu: ${formatPrice(totalDailyAmount.value)} VND`,
    margin,
    y,
  );

  y += 10;

  // Table
  const tableData = dailyStats.value.map((stat) => [
    formatDate(stat.Date),
    stat.TotalOrders.toString(),
    stat.OnlineOrders.toString(),
    stat.OfflineOrders.toString(),
    formatPrice(stat.TotalAmount) + " VND",
    stat.TopCustomerName || "Khách lẻ",
    formatPrice(stat.TopCustomerAmount) + " VND",
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Ngày",
        "Tổng",
        "Online",
        "Offline",
        "Giá trị",
        "KH nhiều nhất",
        "Giá trị KH",
      ],
    ],
    body: tableData,
    theme: "striped",
    styles: {
      font: "Roboto",
      fontSize: 7,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [39, 174, 96],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { halign: "center", cellWidth: 14 },
      2: { halign: "center", cellWidth: 14 },
      3: { halign: "center", cellWidth: 14 },
      4: { halign: "right", cellWidth: 28 },
      5: { cellWidth: 32 },
      6: { halign: "right", cellWidth: 28 },
    },
    margin: { left: margin, right: margin },
  });

  // Footer
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(
    `Ngày xuất báo cáo: ${new Date().toLocaleString("vi-VN")}`,
    margin,
    finalY,
  );

  // Open PDF
  window.open(doc.output("bloburl"), "_blank");
}

// ----- onMounted()

onMounted(async () => {
  salesChartInstance = new Chart(salesChart.value, {
    type: "bar",
    data: {
      labels: months,
      datasets: [
        {
          label: "Doanh thu (đã thanh toán)",
          data: Array(12).fill(0),
          backgroundColor: "rgba(39, 174, 96, 0.8)",
          borderColor: "rgba(39, 174, 96, 1)",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return value.toLocaleString("vi-VN");
            },
          },
        },
      },
    },
  });

  ordersChartInstance = new Chart(ordersChart.value, {
    type: "bar",
    data: {
      labels: months,
      datasets: [
        {
          label: "Đơn hoàn thành",
          data: new Array(12).fill(0),
          backgroundColor: "rgba(52, 152, 219, 0.8)",
          borderColor: "rgba(52, 152, 219, 1)",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });

  await Promise.all([
    fetchTotalProducts(),
    fetchTopProducts(),
    fetchTotalUsers(),
    fetchTopUsers(),
    fetchTotalCategories(),
    fetchTotalOrders(),
    fetchSalesByYear(),
    fetchOrdersByYear(),
    fetchPeakTimeStats(),
    fetchDailyStats(),
    fetchDashboardStats(),
    loadSalesReport(),
  ]);
});
</script>

<style scoped>
/* Base Styles */
.dashboard-page {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  min-height: 100vh;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-header h2 {
  font-size: 28px;
  color: #2c3e50;
  margin: 0;
}

.dashboard-header .subtitle {
  color: #7f8c8d;
  font-size: 14px;
  margin-top: 4px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 28px;
  height: 28px;
  color: white;
}

.stat-card.users .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.stat-card.products .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
.stat-card.categories .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}
.stat-card.revenue .stat-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #95a5a6;
  display: block;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 4px 0 0;
}

.stat-value.small {
  font-size: 18px;
}

/* Orders Overview */
.orders-overview {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 18px;
  color: #2c3e50;
  margin: 0 0 20px;
}

.orders-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.order-card {
  border-radius: 12px;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.order-card.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.order-card.online {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
}

.order-card.offline {
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
  color: white;
}

.order-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  font-weight: 600;
}

.order-card-header svg {
  width: 24px;
  height: 24px;
}

.order-card-body {
  margin-bottom: 12px;
}

.order-stat {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

.order-count {
  font-size: 36px;
  font-weight: 700;
}

.order-label {
  font-size: 14px;
  opacity: 0.9;
}

.order-revenue {
  font-size: 16px;
  font-weight: 600;
  opacity: 0.95;
}

.order-card-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar .progress {
  height: 100%;
  background: white;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.percentage {
  font-size: 14px;
  font-weight: 600;
}

/* Daily Stats Section */
.daily-stats-section {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.daily-stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.daily-stats-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
}

.daily-stats-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.daily-stats-controls select {
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  background: white;
  transition: border-color 0.3s;
}

.daily-stats-controls select:focus {
  outline: none;
  border-color: #27ae60;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}

.export-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.export-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* Summary Cards */
.daily-stats-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.summary-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-icon svg {
  width: 22px;
  height: 22px;
  color: white;
}

.summary-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.summary-icon.revenue {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}
.summary-icon.online {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}
.summary-icon.offline {
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
}

.summary-content {
  flex: 1;
}

.summary-label {
  font-size: 12px;
  color: #95a5a6;
  display: block;
}

.summary-content strong {
  font-size: 14px;
  color: #2c3e50;
}

/* Table */
.daily-stats-table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.daily-stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.daily-stats-table th,
.daily-stats-table td {
  padding: 14px 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.daily-stats-table th {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.daily-stats-table tbody tr {
  transition: background 0.2s;
}

.daily-stats-table tbody tr:hover {
  background: #f8f9fa;
}

.daily-stats-table .date-cell {
  font-weight: 500;
  color: #2c3e50;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.badge.total {
  background: #e8f4fd;
  color: #3498db;
}
.badge.online {
  background: #e8f8f5;
  color: #27ae60;
}
.badge.offline {
  background: #fdedec;
  color: #e74c3c;
}

.daily-stats-table .center {
  text-align: center;
}
.daily-stats-table .right {
  text-align: right;
}
.daily-stats-table .amount {
  font-weight: 600;
  color: #27ae60;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #95a5a6;
}

.no-data p {
  font-size: 16px;
  font-weight: normal;
  margin-top: 12px;
}

.sales-report-section {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.sales-report-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.sales-report-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
}

.report-hint {
  margin: 5px 0 0;
  color: #95a5a6;
  font-size: 12px;
}

.sales-report-controls {
  display: flex;
  gap: 10px;
  align-items: end;
  flex-wrap: wrap;
}

.sales-report-controls label {
  display: grid;
  gap: 5px;
  color: #7f8c8d;
  font-size: 12px;
}

.sales-report-controls input,
.sales-report-controls select {
  min-height: 38px;
  padding: 7px 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  color: #2c3e50;
  font-size: 13px;
}

.report-download-btn {
  background: #2c3e50;
}

.report-message {
  margin: 16px 0 0;
  color: #7f8c8d;
  text-align: center;
}

.report-message.error {
  color: #c0392b;
}

.report-summary-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.report-summary-grid > div,
.report-breakdown {
  padding: 14px;
  border: 1px solid #edf0f2;
  border-radius: 10px;
  background: #f8f9fa;
}

.report-summary-grid span,
.report-summary-grid strong {
  display: block;
}

.report-summary-grid span {
  color: #7f8c8d;
  font-size: 12px;
}

.report-summary-grid strong {
  margin-top: 5px;
  color: #2c3e50;
  font-size: 16px;
}

.report-breakdowns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.report-breakdown h4 {
  margin: 0 0 8px;
  color: #2c3e50;
  font-size: 14px;
}

.report-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
  color: #566573;
  font-size: 13px;
}

.report-row:last-child {
  border-bottom: 0;
}

.report-row strong {
  color: #27ae60;
}

/* Charts Section */
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.search-bar label {
  font-weight: 500;
  color: #2c3e50;
}

.search-bar select {
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  background: white;
}

.charts {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin-bottom: 24px;
}

.chart-container {
  padding-bottom: 20px;
}

.chart-container.salesChart {
  border-bottom: 1px solid #eee;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-header h3 {
  font-size: 16px;
  color: #2c3e50;
  margin: 0;
}

.chart-total {
  font-size: 20px;
  font-weight: 700;
  color: #27ae60;
}

/* Bottom Cards */
.bottom-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.info-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.info-card-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 15px;
  color: white;
}

.info-card-header svg {
  width: 20px;
  height: 20px;
}

.info-card.popular .info-card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.info-card.customers .info-card-header {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}
.info-card.peak-time .info-card-header {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.info-card-body {
  padding: 16px 20px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.rank-item:last-child {
  border-bottom: none;
}

.rank-number {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.rank-name {
  flex: 1;
  font-size: 14px;
  color: #2c3e50;
}

.rank-value {
  font-size: 13px;
  font-weight: 600;
  color: #27ae60;
}

.time-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.time-item:last-child {
  border-bottom: none;
}

.time-range {
  width: 100px;
  font-size: 13px;
  color: #2c3e50;
}

.time-bar-container {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.time-bar {
  height: 100%;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.time-percentage {
  width: 50px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: #e74c3c;
}

/* Responsive */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .orders-cards {
    grid-template-columns: 1fr;
  }
  .daily-stats-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  .bottom-cards {
    grid-template-columns: 1fr;
  }
  .report-summary-grid,
  .report-breakdowns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .daily-stats-summary {
    grid-template-columns: 1fr;
  }
  .daily-stats-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
