> Đề xuất phác thảo (chưa duyệt) — ngày 2026-11-12 — phạm vi: **trang chủ storefront** (`frontend-customer`, route `/`).
> Không bao gồm: đổi API, đổi header/footer/giỏ hàng/thanh toán, thêm dữ liệu bịa đặt.

# Phác thảo bố cục mới cho trang chủ OnlineMarket

## 1. Trang hiện tại có gì (đối chiếu `src/pages/CatalogPages.tsx`)

| # | Khối | Nhận xét |
|---|------|----------|
| 1 | Hero carousel 3 slide (vừa thay ảnh full-bleed) | Ổn, giữ nguyên |
| 2 | 3 `ValuePill` xếp ngang (giao nhanh / chất lượng / thanh toán) | Nội dung tốt nhưng dạng "3 card trắng" lặp lại khắp trang |
| 3 | "Mua theo danh mục" — dải card scroll ngang, icon emoji | Emoji to, không có ảnh thật, không cho biết danh mục có bao nhiêu món |
| 4 | "Món ngon, sẵn sàng" — grid 8 sản phẩm | Ổn, nhưng y hệt 2 khối dưới |
| 5 | 2 section danh mục, mỗi section 1 grid 4 sản phẩm | **Lặp y chang khối 4** — đây là điểm gây "nhàm" nhất |
| 6 | (hết) | Trang kết thúc đột ngột, không có điểm dừng chân |

Ba nguyên nhân gây nhàm: (a) mọi section cùng một công thức `SectionHeading + grid`; (b) khối 4 và 5 lặp nhau; (c) không có nhịp nghỉ (band màu, editorial) giữa các grid.

Nguyên tắc redesign giữ nguyên (theo `pages/AGENTS.md`): nội dung home suy ra từ catalog + categories, **không bịa xếp hạng/đề xuất** mà API không trả; chuỗi chữ mới phải thêm vào `translator.ts`; mobile-first; tái dùng primitives (`ProductGrid`, `SectionHeading`, `Button`).

## 2. Bố cục đề xuất (7 khối, header/footer giữ nguyên)

```
┌────────────────────────────────────────────────────────┐
│ HERO (giữ nguyên) + dải danh mục NỔI đè lên đáy hero   │
├────────────────────────────────────────────────────────┤
│ CAM KẾT — 1 strip 3 cột gọn (gộp ValuePill cũ)          │
├────────────────────────────────────────────────────────┤
│ EDITORIAL: card trái sticky + grid 4 món phải           │
├──────────────────────┬─────────────────────────────────┤
│ TABS DANH MỤC (1 section, chuyển tab thay vì 2 section)│
├────────────────────────────────────────────────────────┤
│ GỢI Ý BỮA ĂN (card link tới /search?q=..., thật 100%)   │
├────────────────────────────────────────────────────────┤
│ CTA band (copy chờ chủ shop duyệt — xem mục 4)          │
└────────────────────────────────────────────────────────┘
```

### Khối 1 — Hero + danh mục nổi (thay đổi nhỏ, hiệu quả cao)

Giữ nguyên hero hiện tại. Bỏ dải scroll ngang khối 3, thay bằng hàng chip danh mục **tràn lên đáy hero** (`-mt-10`, `relative z-10`):

```
│  [ảnh hero full-bleed]  Món ngon, tâm trạng vui.  (...) │
│  [Mua sắm tất cả] [Tìm món tốt cho sức khỏe]            │
│┌──────────────────────────────────────────────────────┐ │
││ ○ Rau củ (24)  ○ Thịt cá (18)  ○ Đồ khô (31)  ○ ... │ │  ← card trắng nổi
└──────────────────────────────────────────────────────┘ │
```

- Mỗi chip: emoji sẵn có + tên danh mục + **số món thật** (`products.filter(...)` đã có trong code). Click vào `/category/:id` như cũ.
- Mobile: chip cuộn ngang (`overflow-x-auto`), không vỡ layout.

### Khối 2 — Cam kết (gộp, không thêm mới)

Gộp 3 `ValuePill` thành 1 strip duy nhất, bỏ viền card, chỉ giữ icon + 1 dòng chữ:

```
│  🚚 Giao trong 2 giờ   │  ✓ Kiểm định mỗi sáng   │  💳 COD & VNPay  │
```

Dùng đúng 3 cặp `title/body` translator hiện có. Trang bớt 1 hàng "3 card trắng".

### Khối 3 — Editorial + grid (phá nhịp đơn điệu)

Thay khối "Món ngon, sẵn sàng" thành 2 cột: trái là card tĩnh (tái dùng 1 ảnh `hero-bg-*.png` + 1 câu + nút), phải là grid 2×2 sản phẩm thật. Phải sticky card trái trên desktop, xếp chồng trên mobile:

```
│ ┌─────────────┐  [món 1] [món 2] │
│ │ Ảnh + câu   │  [món 3] [món 4] │
│ │ [Xem tất cả]│                  │
│ └─────────────┘                  │
```

Grid vẫn dùng `ProductGrid` + `quickAdd` hiện có. Card trái là marketing tĩnh, không bịa số liệu.

### Khối 4 — Tabs danh mục (xóa 2 section lặp)

Gộp 2 section danh mục cuối trang thành **1 section duy nhất**: hàng tab (tên các danh mục có hàng) + 1 grid 4 món của tab đang chọn.

```
│ [Rau củ] [Thịt cá] [Đồ khô] ...              │
│  [món 1] [món 2] [món 3] [món 4]             │
```

State `activeTab` local trong `HomePage`, dữ liệu vẫn từ `categorySections` sẵn có — không gọi API mới, không state toàn cục.

### Khối 5 — Gợi ý bữa ăn (nội dung mới nhưng thật)

3 card link tới tìm kiếm có sẵn, không cần dữ liệu mới:

```
│ [🍲 Bữa tối 30 phút → /search?q=...] [🥗 Ăn healthy → ...] [� hotpot cuối tuần → ...] │
```

Mỗi card tái dùng ảnh `hero-bg-*.png` làm nền mờ + chữ đè. Click là search thật, kết quả thật — không bịa "món bán chạy".

### Khối 6 — CTA band (tùy chọn, cần duyệt copy)

1 band màu lá đậm cuối trang: 1 câu + nút "Mua sắm ngay". **Mọi con số (freeship từ bao nhiêu, giảm bao nhiêu %) phải do chủ shop xác nhận** — không tự bịa. Nếu chưa có chính sách, bỏ khối này, trang vẫn ổn.

## 3. So sánh nhanh: có đáng đổi không?

| Đổi | Hiệu quả cảm nhận | Effort | Ghi chú |
|-----|-------------------|--------|---------|
| 1. Danh mục nổi + số món | Cao (hero sâu hơn, bớt 1 dải scroll) | Thấp (chip + `-mt-10`, đếm từ data sẵn có) | Nên làm |
| 2. Gộp cam kết thành strip | Trung bình (bớt lặp card trắng) | Rất thấp (CSS lại `ValuePill`) | Nên làm |
| 3. Editorial + grid 2×2 | Cao (phá nhịp grid đều đều) | Thấp (layout lại, dùng `ProductGrid` cũ) | Nên làm |
| 4. Tabs thay 2 section lặp | Cao (bớt lặp rõ rệt nhất) | Thấp (state tab local) | Nên làm |
| 5. Gợi ý bữa ăn | Trung bình | Thấp (link search có sẵn) | Làm nếu thích |
| 6. CTA band | Thấp–trung bình | Thấp, nhưng **kẹt ở duyệt copy** | Để sau |

Kết luận: mục 1–4 đổi layout bằng code hiện có + không chạm API, hiệu quả rõ. Đáng làm.

## 4. Việc cần làm nếu duyệt (chưa code)

1. `translator.ts`: thêm key cho card editorial trái + 3 card gợi ý bữa ăn (theo quy ước: không inline tiếng Việt trong component).
2. `CatalogPages.tsx`: thêm `activeTab` state; tách `ValuePill` thành strip; thêm 2 component nội bộ `EditorialCard`, `MealIdeaCard` (hoặc vào `store-ui.tsx` nếu tái dùng được).
3. Ảnh: tái dùng 3 file `public/images/hero-bg-*.png`, chưa cần ảnh mới.
4. Kiểm tra: `npm run build --prefix frontend-customer`, `npm test --prefix frontend-customer -- --run`, xem tay ở 360px / 768px / 1280px.
5. Không đổi: API, `useCatalog`/`useCategories`, giỏ hàng, checkout, E2E hiện có.

## 5. Rủi ro đã loại trừ

- Không có khối nào cần API mới hay số liệu bịa (xếp hạng, lượt bán, đánh giá sao).
- Không thêm dependency, không đổi route, không ảnh hưởng trang `/products`, `/cart`, E2E staging.
