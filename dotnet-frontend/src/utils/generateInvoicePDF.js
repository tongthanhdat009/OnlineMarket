import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
// Đảm bảo bạn đã có file robotoRegularBase64 này
import { robotoRegularBase64 } from "./robotoRegularBase64";

export function generateInvoicePDF(order) {
  if (!order) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  
  // --- Cấu hình màu sắc & Font ---
  const primaryColor = [52, 73, 94]; // Dark Blue/Grey - Professional
  const accentColor = [41, 128, 185]; // Blue - Highlight
  const grayColor = [127, 140, 141];
  const lightGrayColor = [248, 249, 250];
  const whiteColor = [255, 255, 255];

  doc.addFileToVFS("Roboto-Regular.ttf", robotoRegularBase64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFont("Roboto-Regular.ttf", "Roboto", "bold");
  doc.addFont("Roboto-Regular.ttf", "Roboto", "italic");
  doc.setFont("Roboto");

  let y = 20;

  // --- 1. HEADER ---
  // Logo / Store Name (Left)
  doc.setFontSize(22);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("TÊN CỬA HÀNG", margin, y);
  
  // Invoice Title (Right)
  doc.setFontSize(22);
  doc.setTextColor(...accentColor);
  doc.text("HÓA ĐƠN", pageWidth - margin, y, { align: "right" });

  y += 8;

  // Store Info (Left)
  doc.setFontSize(9);
  doc.setFont("Roboto", "normal");
  doc.setTextColor(...grayColor);
  doc.text("123 Đường ABC, Phường X, Quận Y, TP. Z", margin, y);
  
  // Invoice Details (Right)
  doc.setTextColor(0, 0, 0);
  doc.setFont("Roboto", "bold");
  doc.text(`#${order.OrderId}`, pageWidth - margin, y, { align: "right" });

  y += 5;
  doc.setFont("Roboto", "normal");
  doc.setTextColor(...grayColor);
  doc.text("Hotline: (028) 3812 3456", margin, y);
  
  doc.text(`Ngày: ${new Date(order.OrderDate).toLocaleString('vi-VN')}`, pageWidth - margin, y, { align: "right" });

  y += 5;
  doc.text("Website: www.website-cua-ban.com", margin, y);
  
  // Conditional Staff Name
  if (order.User?.FullName) {
      doc.text(`Nhân viên: ${order.User.FullName}`, pageWidth - margin, y, { align: "right" });
  }

  y += 10;
  // Divider line
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // --- 2. INFO BOXES ---
  const boxGap = 10;
  const boxWidth = (pageWidth - margin * 2 - boxGap) / 2;
  const boxHeight = 40;
  
  // Background for boxes
  doc.setFillColor(...lightGrayColor);
  doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, 'F');
  doc.roundedRect(margin + boxWidth + boxGap, y, boxWidth, boxHeight, 2, 2, 'F');

  // Left Box: Customer
  let yBox = y + 8;
  let xBox = margin + 5;
  
  doc.setFontSize(10);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("KHÁCH HÀNG", xBox, yBox);
  
  yBox += 7;
  doc.setFontSize(9);
  doc.setFont("Roboto", "normal");
  doc.setTextColor(0, 0, 0);
  
  doc.text(order.Name || order.Customer?.Name || "Khách lẻ", xBox, yBox);
  yBox += 5;
  doc.setTextColor(...grayColor);
  doc.text(order.Phone || "", xBox, yBox);
  yBox += 5;
  
  if (order.Email) {
    doc.text(order.Email, xBox, yBox);
    yBox += 5;
  }

  const addressLines = doc.splitTextToSize(order.Address || "", boxWidth - 10);
  doc.text(addressLines, xBox, yBox);

  // Right Box: Payment & Status
  yBox = y + 8;
  xBox = margin + boxWidth + boxGap + 5;

  doc.setFontSize(10);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("THÔNG TIN THANH TOÁN", xBox, yBox);

  yBox += 7;
  doc.setFontSize(9);
  doc.setFont("Roboto", "normal");
  doc.setTextColor(...grayColor);
  
  doc.text("Hình thức:", xBox, yBox);
  doc.setTextColor(0, 0, 0);
  const paymentMethods = (order.Payments || []).map(p => p.PaymentMethod).join(", ");
  doc.text(paymentMethods || "Tiền mặt", xBox + 20, yBox);
  
  yBox += 6;
  doc.setTextColor(...grayColor);
  doc.text("Trạng thái:", xBox, yBox);
  doc.setTextColor(0, 0, 0);
  doc.text(order.Status || "Hoàn thành", xBox + 20, yBox);

  y += boxHeight + 10;

  // --- 3. PRODUCT TABLE ---
  const items = order.OrderItems?.map((item, i) => [
    i + 1,
    item.Product?.ProductName || "Sản phẩm",
    item.Quantity,
    item.Price.toLocaleString("vi-VN"),
    item.Subtotal.toLocaleString("vi-VN"),
  ]) || [];

  autoTable(doc, {
    startY: y,
    head: [["STT", "Tên sản phẩm", "SL", "Đơn giá", "Thành tiền"]],
    body: items,
    theme: 'plain', // Cleaner look
    styles: { 
      font: "Roboto", 
      fontSize: 9,
      cellPadding: 4,
      valign: 'middle',
      textColor: [50, 50, 50]
    },
    headStyles: {
      fillColor: whiteColor,
      textColor: primaryColor,
      fontStyle: 'bold',
      lineWidth: 0,
      borderBottomWidth: 1,
      borderColor: [200, 200, 200]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 35 }
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252]
    },
    didParseCell: function(data) {
        // Add bottom border to body rows
        if (data.section === 'body') {
             data.cell.styles.borderBottomWidth = 0.1;
             data.cell.styles.borderColor = [240, 240, 240];
        }
    },
    margin: { left: margin, right: margin }
  });

  let finalY = doc.lastAutoTable.finalY + 10;

  // --- 4. SUMMARY SECTION ---
  // Use a right-aligned box for summary
  const summaryWidth = 80;
  const summaryX = pageWidth - margin - summaryWidth;
  
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);

  // Subtotal
  doc.text("Tổng tiền hàng:", summaryX, finalY);
  doc.setTextColor(0, 0, 0);
  doc.text(`${order.TotalAmount.toLocaleString("vi-VN")} ₫`, pageWidth - margin, finalY, { align: "right" });
  finalY += 6;

  // Discount
  if (order.DiscountAmount > 0) {
    doc.setTextColor(...grayColor);
    doc.text("Giảm giá:", summaryX, finalY);
    doc.setTextColor(231, 76, 60);
    doc.text(`- ${order.DiscountAmount.toLocaleString("vi-VN")} ₫`, pageWidth - margin, finalY, { align: "right" });
    finalY += 6;
  }

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(summaryX, finalY, pageWidth - margin, finalY);
  finalY += 8;

  // Grand Total
  doc.setFontSize(11);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("TỔNG THANH TOÁN", summaryX, finalY);
  
  doc.setFontSize(14);
  doc.setTextColor(...accentColor);
  doc.text(`${(order.TotalAmount - order.DiscountAmount).toLocaleString("vi-VN")} ₫`, pageWidth - margin, finalY, { align: "right" });

  // --- 5. SIGNATURES ---
  finalY += 25;
  
  if (finalY > pageHeight - 40) {
      doc.addPage();
      finalY = 20;
  }

  const sigY = finalY;
  
  doc.setFontSize(9);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(0, 0, 0);
  
  // Buyer
  doc.text("Người mua hàng", margin + 25, sigY, { align: "center" });
  doc.setFont("Roboto", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text("(Ký, ghi rõ họ tên)", margin + 25, sigY + 4, { align: "center" });

  // Seller
  doc.setFont("Roboto", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text("Người bán hàng", pageWidth - margin - 25, sigY, { align: "center" });
  doc.setFont("Roboto", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text("(Ký, ghi rõ họ tên)", pageWidth - margin - 25, sigY + 4, { align: "center" });

  // --- 6. FOOTER ---
  const footerY = pageHeight - 15;
  doc.setDrawColor(240, 240, 240);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.setFont("Roboto", "italic");
  doc.text("Cảm ơn quý khách đã mua sắm tại cửa hàng!", pageWidth / 2, footerY, { align: "center" });

  window.open(doc.output("bloburl"), "_blank");
}