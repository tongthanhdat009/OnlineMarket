<template>
  <div class="inventory-page">
    <h2>📦 Quản lý tồn kho</h2>

    <!-- 🔍 Thanh tìm kiếm -->
    <div class="search-bar">
      <label for="filterType">Tìm theo:</label>
      <select v-model="filterType" id="filterType">
        <option value="all">Tất cả</option>
        <option value="InventoryId">ID</option>
        <option value="ProductName">Tên sản phẩm</option>
        <option value="Quantity">Số lượng</option>
      </select>
      <input type="text" v-model="searchText" :placeholder="getSearchPlaceholder()" />
    </div>

    <!-- 📝 Form cập nhật -->
    <form class="inventory-form" @submit.prevent="confirmSave">
      <div class="form-group">
        <label>ID</label>
        <input type="text" :value="displayId(inventory.InventoryId)" readonly />
      </div>

      <div class="form-group">
        <label>Sản phẩm</label>
        <select v-model="inventory.ProductId" :disabled="viewMode" required>
          <option disabled value="">-- Chọn sản phẩm --</option>
          <option v-for="p in products" :key="p.ProductId" :value="p.ProductId">
            {{ p.ProductName }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Số lượng</label>
        <input v-model="inventory.Quantity" type="number" min="0" :readonly="viewMode" required />
      </div>

      <div class="form-group">
        <label>Cập nhật lần cuối</label>
        <input type="text" :value="formatDate(inventory.UpdatedAt)" readonly />
      </div>

      <button type="submit" v-if="!viewMode && editMode">Cập nhật</button>
      <button type="button" v-if="editMode" @click="cancelEdit">Hủy</button>
      <button type="button" v-if="viewMode" @click="closeView">Đóng</button>
    </form>

    <!-- 📋 Bảng hiển thị -->
    <div v-if="loading" class="loading">Đang tải dữ liệu...</div>
    <div v-else-if="inventories.length === 0" class="no-data">Không có dữ liệu tồn kho</div>
    <table v-else class="inventory-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Sản phẩm</th>
          <th>Số lượng</th>
          <th>Cập nhật lần cuối</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="i in paginatedInventories"
          :key="i?.InventoryId ?? Math.random()"
          @click="viewInventory(i)"
          :class="{ active: viewMode && inventory.InventoryId === i?.InventoryId }"
        >
          <td>{{ displayId(i?.InventoryId) }}</td>
          <td>{{ i?.Product.ProductName || '-' }}</td>
          <td>{{ i?.Quantity || 0 }}</td>
          <td>{{ formatDate(i?.UpdatedAt) }}</td>
          <td>
            <button @click.stop="editInventory(i)">✏️</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 🔢 Phân trang -->
    <div v-if="totalPages > 1" class="pagination">
      <button @click="currentPage--" :disabled="currentPage === 1"><</button>
      <span>Trang {{ currentPage }} / {{ totalPages }}</span>
      <button @click="currentPage++" :disabled="currentPage === totalPages">></button>
    </div>

    <!-- 🔔 Popup xác nhận -->
    <div v-if="showConfirm" class="confirm-overlay">
      <div class="confirm-box">
        <h3>{{ confirmTitle }}</h3>
        <p>{{ confirmMessage }}</p>
        <div class="actions">
          <button @click="handleConfirm(true)" class="btn-yes">Xác nhận</button>
          <button @click="handleConfirm(false)" class="btn-no">Hủy</button>
        </div>
      </div>
    </div>

    <!-- 🚨 Thông báo lỗi -->
    <div v-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
      <button @click="errorMessage = ''">Đóng</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { getInventories, updateInventory, getInventoryById } from "../api/Inventory.js";
import { getProducts } from "../api/Product.js";

// ----- Data refs
const inventories = ref([]);
const products = ref([]);
const loading = ref(true);
const inventory = ref({
  InventoryId: null,
  ProductId: "",
  Quantity: 0,
  UpdatedAt: null
});
const editMode = ref(false);
const viewMode = ref(false);
const searchText = ref("");
const filterType = ref("all");
const errorMessage = ref("");

// ----- Pagination
const currentPage = ref(1);
const itemsPerPage = 10;

// ----- Confirmation
const showConfirm = ref(false);
const confirmTitle = ref("");
const confirmMessage = ref("");
let pendingAction = null;

// ----- Computed properties
const filteredInventories = computed(() => {
  if (!inventories.value || inventories.value.length === 0) return [];

  const keyword = searchText.value.trim();
  if (!keyword) return inventories.value;

  return inventories.value.filter((i) => {
    if (!i) return false;

    if (filterType.value === "all") {
      return (
        vietnameseIncludes(i.InventoryId, keyword) ||
        vietnameseIncludes(i.Product.ProductName, keyword) ||
        vietnameseIncludes(i.Quantity, keyword)
      );
    }

    const fieldValue = i[filterType.value];
    if (fieldValue == null) return false;

    if (filterType.value === "InventoryId") {
      const numericKeyword = keyword.replace(/\D/g, "");
      if (!numericKeyword) return vietnameseIncludes(fieldValue, keyword);
      return String(i.InventoryId).includes(numericKeyword) || vietnameseIncludes(fieldValue, keyword);
    }

    if (filterType.value === "Quantity") {
      return String(fieldValue).includes(keyword);
    }

    return vietnameseIncludes(fieldValue, keyword);
  });
});

const totalPages = computed(() => Math.ceil(filteredInventories.value.length / itemsPerPage));

const paginatedInventories = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredInventories.value.slice(start, end);
});

// ----- API Functions
async function fetchInventories() {
  try {
    loading.value = true;
    const data = await getInventories();
    inventories.value = data;
  } catch (err) {
    console.error("Lỗi khi tải tồn kho:", err);
    errorMessage.value = "Không thể tải danh sách tồn kho";
  } finally {
    loading.value = false;
  }
}

async function fetchProducts() {
  try {
    const data = await getProducts();
    products.value = data;
  } catch (err) {
    console.error("Lỗi khi tải sản phẩm:", err);
    errorMessage.value = "Không thể tải danh sách sản phẩm";
  }
}

// ----- Form Actions
function confirmSave() {
  confirmTitle.value = "Xác nhận cập nhật";
  confirmMessage.value = "Bạn có chắc muốn cập nhật tồn kho này không?";
  pendingAction = saveInventory;
  showConfirm.value = true;
}

function handleConfirm(confirmed) {
  if (confirmed && pendingAction) pendingAction();
  showConfirm.value = false;
  pendingAction = null;
}

async function saveInventory() {
  try {
    errorMessage.value = "";
    
    if (!inventory.value.ProductId) {
      errorMessage.value = "Vui lòng chọn sản phẩm";
      return;
    }
    
    if (inventory.value.Quantity < 0) {
      errorMessage.value = "Số lượng không được âm";
      return;
    }

    const inventoryData = {
      InventoryId: inventory.value.InventoryId,
      ProductId: inventory.value.ProductId,
      Quantity: parseInt(inventory.value.Quantity),
      UpdatedAt: inventory.value.UpdatedAt
    };

    await updateInventory(inventory.value.InventoryId, inventoryData);
    await fetchInventories();
    editMode.value = false;
    resetForm();
  } catch (err) {
    console.error("Lỗi khi cập nhật tồn kho:", err);
    if (err.response?.data?.message) {
      errorMessage.value = err.response.data.message;
    } else {
      errorMessage.value = "Có lỗi xảy ra khi cập nhật tồn kho";
    }
  }
}

// ----- UI Actions
function editInventory(i) {
  inventory.value = { ...i };
  editMode.value = true;
  viewMode.value = false;
}

function viewInventory(i) {
  if (!editMode.value) {
    inventory.value = { ...i };
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
  inventory.value = {
    InventoryId: null,
    ProductId: "",
    Quantity: 0,
    UpdatedAt: null
  };
}

// ----- Helper Functions
function displayId(id) {
  return id ? `I${id.toString().padStart(3, '0')}` : "-";
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("vi-VN");
}

function getSearchPlaceholder() {
  switch (filterType.value) {
    case "InventoryId":
      return "Nhập ID tồn kho...";
    case "ProductName":
      return "Nhập tên sản phẩm...";
    case "Quantity":
      return "Nhập số lượng...";
    default:
      return "Nhập từ khóa...";
  }
}

// Hàm chuyển đổi tiếng Việt có dấu thành không dấu
function removeVietnameseTones(str) {
  if (!str) return "";
  
  const accentsMap = {
    'a': 'aàáạảãâầấậẩẫăằắặẳẵ',
    'd': 'dđ',
    'e': 'eèéẹẻẽêềếệểễ',
    'i': 'iìíịỉĩ',
    'o': 'oòóọỏõôồốộổỗơờớợởỡ',
    'u': 'uùúụủũưừứựửữ',
    'y': 'yỳýỵỷỹ'
  };

  let result = str.toLowerCase();
  
  for (const [baseChar, accented] of Object.entries(accentsMap)) {
    const regex = new RegExp(`[${accented}]`, 'g');
    result = result.replace(regex, baseChar);
  }
  
  return result;
}

// Hàm so sánh chuỗi có hỗ trợ tiếng Việt
function vietnameseIncludes(text, keyword) {
  if (!text || !keyword) return false;
  
  const normalizedText = removeVietnameseTones(String(text));
  const normalizedKeyword = removeVietnameseTones(keyword);
  
  return String(text).toLowerCase().includes(keyword.toLowerCase()) ||
         normalizedText.includes(normalizedKeyword);
}

// ----- Mount
onMounted(async () => {
  await Promise.all([
    fetchInventories(),
    fetchProducts()
  ]);
});
</script>

<style scoped>
@import "../assets/css/inventory.css";
</style>
