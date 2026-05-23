const RESERVATION_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbwwmaEinUCm_VZu_ZNKIYKzQwcDK0Jis9ScqnuJA5nAx_KNmVJzCC3Xj_crIDg0svs/exec";

const products = [
  {
    id: "BR-202605-001",
    category: "枝もの",
    name: "ドウダンツツジ",
    price: 1200,
    unit: "本",
    stock: 10,
    description: "新緑の葉が軽やかで、玄関や店舗装花に使いやすい定番の枝ものです。",
    image:
      "https://images.unsplash.com/photo-1495231916356-a86217efff12?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "BR-202605-002",
    category: "枝もの",
    name: "ナツハゼ",
    price: 980,
    unit: "本",
    stock: 4,
    description: "細い枝ぶりと葉の表情がきれいな季節枝。花器に一本でも映えます。",
    image:
      "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "BR-202605-003",
    category: "花材",
    name: "アナベル",
    price: 760,
    unit: "本",
    stock: 8,
    description: "明るいグリーンの花材。枝ものと合わせた束づくりにも向いています。",
    image:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "BR-202605-004",
    category: "盆栽素材",
    name: "山もみじ 小鉢",
    price: 2400,
    unit: "鉢",
    stock: 3,
    description: "葉の細かさが魅力の小鉢素材。育成用にも贈り物にも選びやすいサイズです。",
    image:
      "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "BR-202605-005",
    category: "盆栽素材",
    name: "黒松 苗木",
    price: 1800,
    unit: "鉢",
    stock: 0,
    description: "次回入荷待ちの商品です。売切れ状態の表示確認用に残しています。",
    image:
      "https://images.unsplash.com/photo-1595433502559-d8f05e6a1041?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "BR-202605-006",
    category: "花材",
    name: "スモークツリー",
    price: 1350,
    unit: "本",
    stock: 6,
    description: "ふわりとした質感が人気の枝花材。初夏のディスプレイにおすすめです。",
    image:
      "https://images.unsplash.com/photo-1468327768560-75b778cbb551?auto=format&fit=crop&w=900&q=80",
  },
];

const productGrid = document.querySelector("#productGrid");
const resultCount = document.querySelector("#resultCount");
const searchInput = document.querySelector("#searchInput");
const filterTabs = [...document.querySelectorAll(".filter-tab")];
const dialog = document.querySelector("#reservationDialog");
const dialogImage = document.querySelector("#dialogImage");
const dialogCategory = document.querySelector("#dialogCategory");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogPrice = document.querySelector("#dialogPrice");
const customerNameInput = document.querySelector("#customerNameInput");
const contactInput = document.querySelector("#contactInput");
const visitDateInput = document.querySelector("#visitDateInput");
const quantityInput = document.querySelector("#quantityInput");
const noteInput = document.querySelector("#noteInput");
const submitReservation = document.querySelector("#submitReservation");
const closeDialogButtons = [...document.querySelectorAll("[value='cancel']")];
const toast = document.querySelector("#toast");

let activeFilter = "all";
let selectedProduct = null;
let toastTimer = null;

function currency(value) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

function stockLabel(product) {
  if (product.stock <= 0) return "売切れ";
  if (product.stock <= 4) return `残りわずか ${product.stock}${product.unit}`;
  return `在庫目安 ${product.stock}${product.unit}`;
}

function stockClass(product) {
  if (product.stock <= 0) return "is-sold";
  if (product.stock <= 4) return "is-low";
  return "";
}

function productCard(product) {
  const disabled = product.stock <= 0 ? "disabled" : "";
  const buttonText = product.stock <= 0 ? "売切れ" : "取り置き予約";

  return `
    <article class="product-card">
      <div class="product-media">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <span class="stock-badge ${stockClass(product)}">${stockLabel(product)}</span>
      </div>
      <div class="product-body">
        <div class="product-meta">
          <span class="category-pill">${product.category}</span>
          <span class="product-id">${product.id}</span>
        </div>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="price-row">
          <span class="price">${currency(product.price)}</span>
          <span class="unit">税込 / ${product.unit}</span>
        </div>
        <button class="primary-button reserve-button" type="button" data-product-id="${product.id}" ${disabled}>
          ${buttonText}
        </button>
      </div>
    </article>
  `;
}

function filteredProducts() {
  const keyword = searchInput.value.trim().toLowerCase();
  return products.filter((product) => {
    const matchesCategory = activeFilter === "all" || product.category === activeFilter;
    const text = `${product.name} ${product.category} ${product.description}`.toLowerCase();
    const matchesKeyword = !keyword || text.includes(keyword);
    return matchesCategory && matchesKeyword;
  });
}

function renderProducts() {
  const visibleProducts = filteredProducts();
  productGrid.innerHTML = visibleProducts.map(productCard).join("");
  resultCount.textContent = `${visibleProducts.length}件表示`;
}

function openReservation(productId) {
  selectedProduct = products.find((product) => product.id === productId);
  if (!selectedProduct) return;

  dialogImage.src = selectedProduct.image;
  dialogImage.alt = selectedProduct.name;
  dialogCategory.textContent = `${selectedProduct.category} / ${selectedProduct.id}`;
  dialogTitle.textContent = selectedProduct.name;
  dialogPrice.textContent = `${currency(selectedProduct.price)} 税込 / ${selectedProduct.unit}`;
  quantityInput.max = selectedProduct.stock;
  quantityInput.value = "1";
  customerNameInput.value = "";
  contactInput.value = "";
  visitDateInput.value = "";
  noteInput.value = "";

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
}

filterTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeFilter = tab.dataset.filter;
    filterTabs.forEach((item) => {
      const selected = item === tab;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-selected", String(selected));
    });
    renderProducts();
  });
});

searchInput.addEventListener("input", renderProducts);

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".reserve-button");
  if (!button || button.disabled) return;
  openReservation(button.dataset.productId);
});

closeDialogButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (dialog.open) dialog.close("cancel");
  });
});

submitReservation.addEventListener("click", async () => {
  if (!selectedProduct) return;
  const form = submitReservation.closest("form");
  if (form && !form.reportValidity()) return;

  const payload = new URLSearchParams({
    productId: selectedProduct.id,
    productName: selectedProduct.name,
    price: String(selectedProduct.price),
    quantity: quantityInput.value,
    customerName: customerNameInput.value.trim(),
    contact: contactInput.value.trim(),
    visitDate: visitDateInput.value,
    note: noteInput.value.trim(),
  });

  submitReservation.disabled = true;
  submitReservation.textContent = "送信中...";

  try {
    await fetch(RESERVATION_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      body: payload,
    });

    if (dialog.open) dialog.close("confirm");
    showToast(`${selectedProduct.name}の仮予約を送信しました。店舗確認後、必要に応じて連絡します。`);
  } catch (error) {
    showToast("送信できませんでした。通信状況を確認して、もう一度お試しください。");
  } finally {
    submitReservation.disabled = false;
    submitReservation.textContent = "仮予約を送信";
  }
});

renderProducts();
