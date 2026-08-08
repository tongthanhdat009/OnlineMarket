// src/utils/registerVietnameseFont.js
import { robotoRegularBase64 } from "./robotoRegularBase64";

/**
 * Đăng ký font Roboto (hỗ trợ tiếng Việt) cho jsPDF
 */
export function registerVietnameseFont(doc) {
  if (!doc) return;

  const fontFileName = "Roboto-Regular.ttf";

  // Thêm font vào Virtual File System
  doc.addFileToVFS(fontFileName, robotoRegularBase64);

  // Đăng ký font
  doc.addFont(fontFileName, "Roboto", "normal");

  // Dùng font này
  doc.setFont("Roboto");
}
