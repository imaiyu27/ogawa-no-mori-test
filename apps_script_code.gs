const RESERVATION_SHEET_NAME = "予約一覧";
const PRODUCT_SHEET_NAME = "商品マスタ";

function doPost(e) {
  try {
    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(RESERVATION_SHEET_NAME);

    if (!sheet) {
      throw new Error(`シート「${RESERVATION_SHEET_NAME}」が見つかりません`);
    }

    const data = e.parameter || {};

    sheet.appendRow([
      new Date(),
      data.productId || "",
      data.productName || "",
      data.price || "",
      data.quantity || "",
      data.customerName || "",
      data.contact || "",
      data.visitDate || "",
      data.note || "",
      "未確認"
    ]);

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: String(error) });
  }
}

function doGet(e) {
  try {
    if (e.parameter && e.parameter.action === "products") {
      return productResponse(e.parameter.callback);
    }

    return jsonResponse({ ok: true, message: "予約受付APIは動作中です" });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: String(error) });
  }
}

function productResponse(callback) {
  const products = getProducts();
  const payload = { ok: true, products };

  if (callback) {
    const safeCallback = String(callback).replace(/[^\w.$]/g, "");
    return ContentService
      .createTextOutput(`${safeCallback}(${JSON.stringify(payload)});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return jsonResponse(payload);
}

function getProducts() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(PRODUCT_SHEET_NAME);

  if (!sheet) {
    throw new Error(`シート「${PRODUCT_SHEET_NAME}」が見つかりません`);
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map((header) => String(header).trim());
  const rows = values.slice(1);

  return rows
    .map((row) => rowToProduct(headers, row))
    .filter((product) => product.id && product.name && product.status !== "非表示")
    .sort((a, b) => a.order - b.order);
}

function rowToProduct(headers, row) {
  const item = {};
  headers.forEach((header, index) => {
    item[header] = row[index];
  });

  const status = String(item["表示状態"] || "表示").trim();
  const stock = Number(item["在庫数"] || 0);

  return {
    order: Number(item["表示順"] || 9999),
    id: String(item["商品ID"] || "").trim(),
    status,
    category: String(item["カテゴリ"] || "").trim(),
    name: String(item["商品名"] || "").trim(),
    description: String(item["説明文"] || "").trim(),
    price: Number(item["価格"] || 0),
    unit: String(item["単位"] || "").trim(),
    stock: status === "売切れ" ? 0 : stock,
    image: String(item["画像URL"] || "").trim(),
    updatedAt: formatDateValue(item["更新日"])
  };
}

function formatDateValue(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(value, "Asia/Tokyo", "yyyy-MM-dd");
  }
  return String(value);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
