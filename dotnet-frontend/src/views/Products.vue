<template>
  <div class="products-page">
    <h2>📦 Quản lý sản phẩm</h2>

    <!-- 🔍 Thanh tìm kiếm -->
    <div class="search-bar">
      <label for="filterType">Tìm theo:</label>
      <select v-model="filterType" id="filterType">
        <option value="all">Tất cả</option>
        <option value="ProductId">ID</option>
        <option value="ProductName">Tên sản phẩm</option>
        <option value="CategoryName">Danh mục</option>
        <option value="SupplierName">Nhà cung cấp</option>
        <option value="Barcode">Mã vạch</option>
        <option value="Price">Giá</option>
        <option value="Unit">Đơn vị</option>
      </select>
      <input type="text" v-model="searchText" :placeholder="getSearchPlaceholder()" />
    </div>

    <!-- 📝 Form thêm / sửa / xem - Chỉ hiển thị nếu có quyền product_manage -->
    <form v-if="can('product_manage') || !viewMode" class="product-form" @submit.prevent="confirmSave">
      <div class="form-group">
        <label>ID</label>
        <input type="text" :value="displayId(product.ProductId)" readonly />
      </div>

      <div class="form-group">
        <label>Danh mục (Category ID)</label>
        <select v-model="product.CategoryId" :disabled="viewMode && !editMode">
          <option disabled value="">-- Chọn danh mục --</option>
          <option v-for="c in categories" :key="c.categoryId" :value="c.CategoryId">{{ c.CategoryName }}</option>
        </select>
      </div>

      <div class="form-group">
        <label>Nhà cung cấp (Supplier ID)</label>
        <select v-model="product.SupplierId" :disabled="viewMode && !editMode">
          <option disabled value="">-- Chọn NCC --</option>
          <option v-for="s in suppliers" :key="s.SupplierId" :value="s.SupplierId">{{ s.Name }}</option>
        </select>
      </div>

      <div class="form-group">
        <label>Tên sản phẩm</label>
        <input
          v-model="product.ProductName"
          type="text"
          required
          placeholder="Nhập tên sản phẩm"
          :readonly="viewMode && !editMode"
        />
      </div>

      <div class="form-group">
        <label>Mã vạch</label>
        <input
          v-model="product.Barcode"
          type="text"
          placeholder="Nhập barcode"
          :readonly="viewMode && !editMode"
        />
      </div>

      <div class="form-group">
        <label>Giá</label>
        <input
          v-model="product.Price"
          type="number"
          step="0.01"
          required
          :readonly="viewMode && !editMode"
        />
      </div>

      <div class="form-group">
        <label>Đơn vị</label>
        <input
          v-model="product.Unit"
          type="text"
          placeholder="Ví dụ: cái, hộp, chiếc..."
          :readonly="viewMode && !editMode"
        />
      </div>

      <!-- 🖼️ Hình ảnh sản phẩm -->
      <div class="form-group image-form-group">
        <label>Hình ảnh sản phẩm</label>
        
        <div class="image-upload-wrapper">
          <!-- Preview ảnh hiện tại hoặc ảnh mới chọn -->
          <div class="image-preview-container">
            <img 
              v-if="imagePreviewUrl || product.ImageUrl" 
              :src="imagePreviewUrl || product.ImageUrl" 
              alt="Product Preview" 
              class="image-preview" 
              @click="showImageModal(imagePreviewUrl || product.ImageUrl)"
            />
            <div v-else class="no-image-placeholder">
              <span>📷</span>
              <span>Chưa có ảnh</span>
            </div>
          </div>
          
          <!-- Nút điều khiển ảnh -->
          <div v-if="(!viewMode || editMode) && can('product_manage')" class="image-controls">
            <label class="btn-upload-image">
              <span>📁 Chọn ảnh</span>
              <input 
                type="file" 
                accept="image/*"
                @change="handleImageSelect"
                ref="fileInput"
                hidden
              />
            </label>
            <button 
              type="button" 
              v-if="imagePreviewUrl || (product.ImageUrl && !isDefaultImage(product.ImageUrl))" 
              @click="removeImage" 
              class="btn-remove-image"
              title="Xóa ảnh"
            >
              🗑️ Xóa ảnh
            </button>
          </div>
        </div>
      </div>

      <button type="submit" v-if="!viewMode && can('product_manage')">{{ editMode ? "Cập nhật" : "Thêm mới" }}</button>
      <button type="button" v-if="editMode && can('product_manage')" @click="cancelEdit">Hủy</button>
      <button type="button" v-if="viewMode && !editMode" @click="closeView">Đóng</button>
    </form>

    <!-- 📋 Bảng hiển thị -->
    <div v-if="loading" class="loading">Đang tải sản phẩm...</div>
    <div v-else-if="products.length === 0" class="no-data">Không có dữ liệu sản phẩm</div>
    <table v-else class="product-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Hình ảnh</th>
          <th>Danh mục</th>
          <th>Nhà cung cấp</th>
          <th>Tên sản phẩm</th>
          <th>Mã vạch</th>
          <th>Giá (VNĐ)</th>
          <th>Đơn vị</th>
          <th v-if="can('product_manage')">Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="p in paginatedProducts"
          :key="p?.ProductId ?? Math.random()"
          @click="viewProduct(p)"
          :class="{ active: viewMode && product.ProductId === p?.ProductId }"
        >
          <td>{{ displayId(p?.ProductId) }}</td>
          <td>
            <img 
              v-if="p?.ImageUrl"
              :src="p.ImageUrl" 
              alt="Product" 
              class="product-thumbnail"
              @click.stop="showImageModal(p.ImageUrl)"
            />
            <span v-else class="no-image">-</span>
          </td>
          <td>{{ p?.Category?.CategoryName || '-' }}</td>
          <td>{{ p?.Supplier?.Name || '-' }}</td>
          <td>{{ p?.ProductName || '-' }}</td>
          <td>{{ p?.Barcode || '-' }}</td>
          <td>{{ formatPrice(p?.Price) }}</td>
          <td>{{ p?.Unit || '-' }}</td>
          <td v-if="can('product_manage')">
            <button @click.stop="editProduct(p)">✏️</button>
            <button @click.stop="confirmDelete(p?.ProductId)">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>

    <Pagination :page="page" :pageSize="pageSize" :total="total" @update:page="page = $event; fetchProducts()" @update:pageSize="pageSize = $event; page = 1; fetchProducts()" />

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

    <!-- 🖼️ Modal xem ảnh lớn -->
    <div v-if="showImageModalFlag" class="image-modal-overlay" @click="closeImageModal">
      <span class="image-modal-close" @click="closeImageModal">&times;</span>
      <img :src="modalImageUrl" alt="Product Image" class="image-modal-content" @click.stop />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { getProducts, addProduct, updateProduct, deleteProduct as deleteProductAPI, uploadProductImage } from "../api/Product.js";
import { parsePagedResponse, buildPagedParams } from "../utils/pagination.js";
import Pagination from "../components/Pagination.vue";
import { getCategories } from "../api/Category.js";
import { getSuppliers } from "../api/Suppliers.js";
import { usePermissions } from "../composables/usePermissions.js";

// Permission check
const { can } = usePermissions();

// ----- Categories & Suppliers từ API
const categories = ref([]);
const suppliers = ref([]);

// ----- Image handling
const selectedImageFile = ref(null);
const imagePreviewUrl = ref(null);
const fileInput = ref(null);
const showImageModalFlag = ref(false);
const modalImageUrl = ref("");;

// ----- Products
const products = ref([]);
const loading = ref(true);
const product = ref({
  ProductId: null,
  CategoryId: null,
  SupplierId: null,
  ProductName: "",
  Barcode: "",
  Price: 0,
  Unit: "pcs",
  ImageUrl: "0.png",
});
const editMode = ref(false);
const viewMode = ref(false);
const searchText = ref("");
const filterType = ref("ProductId");
const errorMessage = ref("");

// ----- Pagination (server-side)
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const filteredProducts = computed(() => products.value);
const paginatedProducts = computed(() => products.value);
const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

// ----- Popup
const showConfirm = ref(false);
const confirmTitle = ref("");
const confirmMessage = ref("");
let confirmAction = null;

// ----- Fetch data
async function fetchCategories() {
  try {
    const data = await getCategories();
    categories.value = data;
  } catch (err) {
    console.error("Lỗi khi tải categories:", err);
    errorMessage.value = "Không thể tải danh sách danh mục";
  }
}

async function fetchSuppliers() {
  try {
    const data = await getSuppliers();
    suppliers.value = data;
  } catch (err) {
    console.error("Lỗi khi tải suppliers:", err);
    errorMessage.value = "Không thể tải danh sách nhà cung cấp";
  }
}


async function fetchProducts() {
  try {
    loading.value = true;
    const sf = filterType.value === "all" ? "" : filterType.value;
    const params = buildPagedParams({ page: page.value, pageSize: pageSize.value, search: searchText.value, searchField: sf });
    const data = await getProducts(params);
    const { items, total: t } = parsePagedResponse(data);
    total.value = t;
    const arr = Array.isArray(items) ? items : [];
    if (Array.isArray(data) && arr.length > pageSize.value) {
      total.value = arr.length;
      const start = (page.value - 1) * pageSize.value;
      products.value = arr.slice(start, start + pageSize.value);
    } else {
      products.value = arr;
    }
  } catch (err) {
    console.error("Lỗi khi tải sản phẩm:", err);
    errorMessage.value = "Không thể tải danh sách sản phẩm";
  } finally {
    loading.value = false;
  }
}

// ----- Confirm Save
function confirmSave() {
  confirmTitle.value = editMode.value ? "Xác nhận cập nhật" : "Xác nhận thêm mới";
  confirmMessage.value = editMode.value
    ? "Bạn có chắc muốn cập nhật sản phẩm này không?"
    : "Bạn có chắc muốn thêm sản phẩm mới không?";
  confirmAction = saveProduct;
  showConfirm.value = true;
}

// ----- Confirm Delete
function confirmDelete(id) {
  confirmTitle.value = "Xác nhận xóa";
  confirmMessage.value = "Bạn có chắc muốn xóa sản phẩm này không?";
  confirmAction = () => deleteProduct(id);
  showConfirm.value = true;
}

// ----- Handle Confirm
function handleConfirm(confirmed) {
  if (confirmed && confirmAction) confirmAction();
  showConfirm.value = false;
}

// ----- Save product
async function saveProduct() {
  try {
    errorMessage.value = "";
    
    // Validate required fields
    if (!product.value.ProductName.trim()) {
      errorMessage.value = "Tên sản phẩm không được để trống";
      return;
    }
    
    if (!product.value.Price || product.value.Price <= 0) {
      errorMessage.value = "Giá phải lớn hơn 0";
      return;
    }

    const productData = {
      ProductId: product.value.ProductId,
      ProductName: product.value.ProductName.trim(),
      Price: parseFloat(product.value.Price),
      Barcode: product.value.Barcode?.trim() || null,
      Unit: product.value.Unit?.trim() || "pcs",
      CategoryId: product.value.CategoryId || null,
      SupplierId: product.value.SupplierId || null,
      // Chỉ gửi key, không gửi presigned URL
      // Nếu ImageUrl là URL (bắt đầu bằng http) thì gửi null để giữ nguyên giá trị cũ
      // Nếu là "0.png" hoặc key bình thường thì gửi luôn
      ImageUrl: product.value.ImageUrl?.startsWith('http') 
        ? null 
        : (product.value.ImageUrl || "0.png")
    };

    let savedProduct;
    if (editMode.value) {
      savedProduct = await updateProduct(product.value.ProductId, productData);
    } else {
      // Xóa ProductId khi tạo mới
      delete productData.ProductId;
      savedProduct = await addProduct(productData);
    }
    
    // Upload ảnh nếu có file được chọn
    if (selectedImageFile.value && savedProduct?.ProductId) {
      try {
        await uploadProductImage(savedProduct.ProductId, selectedImageFile.value);
      } catch (uploadErr) {
        console.error("Lỗi khi upload ảnh:", uploadErr);
        errorMessage.value = "Sản phẩm đã được lưu nhưng không thể upload ảnh";
      }
    }
    
    await fetchProducts();
    editMode.value = false;
    resetForm();
  } catch (err) {
    console.error("Lỗi khi lưu sản phẩm:", err);
    if (err.response?.data?.message) {
      errorMessage.value = err.response.data.message;
    } else {
      errorMessage.value = "Có lỗi xảy ra khi lưu sản phẩm";
    }
  }
}


// ----- Delete product
async function deleteProduct(id) {
  try {
    errorMessage.value = "";
    await deleteProductAPI(id);
    await fetchProducts();
    resetForm();
  } catch (err) {
    console.error("Lỗi khi xóa sản phẩm:", err);
    if (err.response?.data?.message) {
      errorMessage.value = err.response.data.message;
    } else {
      errorMessage.value = "Có lỗi xảy ra khi xóa sản phẩm";
    }
  }
}

// ----- Edit / View / Close / Cancel
function editProduct(p) {
  product.value = { ...p };
  selectedImageFile.value = null;
  imagePreviewUrl.value = null;
  editMode.value = true;
  viewMode.value = false;
}

function viewProduct(p) {
  if (!editMode.value) {
    product.value = { ...p };
    selectedImageFile.value = null;
    imagePreviewUrl.value = null;
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

// ----- Reset form
function resetForm() {
  product.value = {
    ProductId: null,
    CategoryId: null,
    SupplierId: null,
    ProductName: "",
    Barcode: "",
    Price: 0,
    Unit: "pcs",
    ImageUrl: null,
  };
  selectedImageFile.value = null;
  imagePreviewUrl.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

// ----- Image Handling Functions
function handleImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    errorMessage.value = "Vui lòng chọn file hình ảnh";
    return;
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = "Kích thước ảnh không được vượt quá 5MB";
    return;
  }
  
  selectedImageFile.value = file;
  
  // Create preview URL
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreviewUrl.value = e.target.result;
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  selectedImageFile.value = null;
  imagePreviewUrl.value = null;
  product.value.ImageUrl = "0.png";
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

function showImageModal(url) {
  modalImageUrl.value = url;
  showImageModalFlag.value = true;
}

function closeImageModal() {
  showImageModalFlag.value = false;
  modalImageUrl.value = "";
}

// Kiểm tra có phải ảnh mặc định không (0.png)
function isDefaultImage(url) {
  if (!url) return true;
  return url.includes('0.png');
}

// ----- Helpers
function displayId(id) {
  return id ?? "-";
}

function formatPrice(val) {
  return Number(val || 0).toLocaleString("vi-VN");
}

function getSearchPlaceholder() {
  switch (filterType.value) {
    case "all":
      return "Nhập từ khóa tìm kiếm...";
    case "ProductId":
      return "Nhập ID sản phẩm...";
    case "ProductName":
      return "Nhập tên sản phẩm...";
    case "CategoryName":
      return "Nhập tên danh mục...";
    case "SupplierName":
      return "Nhập tên nhà cung cấp...";
    case "Barcode":
      return "Nhập mã vạch...";
    case "Price":
      return "Nhập giá sản phẩm...";
    case "Unit":
      return "Nhập đơn vị...";
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
  
  // Tìm kiếm cả bản gốc và bản không dấu
  return String(text).toLowerCase().includes(keyword.toLowerCase()) ||
         normalizedText.includes(normalizedKeyword);
}

// ----- Mount
onMounted(async () => {
  await Promise.all([
    fetchProducts(),
    fetchCategories(),
    fetchSuppliers()
  ]);
});
let _prodSearchTimer = null;
watch([searchText, filterType], () => {
  clearTimeout(_prodSearchTimer);
  _prodSearchTimer = setTimeout(() => { page.value = 1; fetchProducts(); }, 400);
});
</script>

<style >
@import "../assets/css/product.css";
</style>
