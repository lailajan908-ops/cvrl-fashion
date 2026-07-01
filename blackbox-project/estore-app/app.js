/* eslint-disable no-alert */
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const state = {
    cart: [],
    selected: null, // { productId, sku, warna, size, harga, stok, kategori, nama, warnaLabel }
  };

  function safeParseJSON(v, fallback) {
    try {
      return JSON.parse(v);
    } catch {
      return fallback;
    }
  }

  function cartKey() {
    return "rl_estore_cart_v1";
  }

  function loadCart() {
    const raw = localStorage.getItem(cartKey());
    const parsed = safeParseJSON(raw, []);
    state.cart = Array.isArray(parsed) ? parsed : [];
  }

  function saveCart() {
    localStorage.setItem(cartKey(), JSON.stringify(state.cart));
  }

  function money(n) {
    return formatIDR(n);
  }

  function getCartCount() {
    return state.cart.reduce((a, it) => a + it.qty, 0);
  }

  function getCartTotal() {
    return state.cart.reduce((a, it) => a + it.qty * it.harga, 0);
  }

  function escapeHtml(str) {
    const s = String(str);
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "<")
      .replaceAll(">", ">")
      .replaceAll('"', """)
      .replaceAll("'", "&#039;");
  }

  function getVariantStockLabel(stok) {
    return stok > 0 ? "In Stock" : "Out of Stock";
  }

  function findProductById(productId) {
    return masterProduk.find((p) => p.id === productId);
  }

  function pickDefaultVariant(variants) {
    const inStock = variants.find((v) => v.stok > 0);
    return inStock || variants[0];
  }

  function makeCartItem(variantObj) {
    return {
      productId: variantObj.productId,
      sku: variantObj.sku,
      nama: variantObj.nama,
      kategori: variantObj.kategori,
      warna: variantObj.warna,
      warnaLabel: variantObj.warnaLabel,
      size: variantObj.size,
      harga: variantObj.harga,
      stok: variantObj.stok,
      qty: 1,
    };
  }

  function toast(msg) {
    let el = document.getElementById("bb_toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "bb_toast";
      el.style.position = "fixed";
      el.style.left = "50%";
      el.style.transform = "translateX(-50%)";
      el.style.bottom = "92px";
      el.style.zIndex = "999";
      el.style.padding = "12px 14px";
      el.style.borderRadius = "14px";
      el.style.background = "rgba(212,175,55,.14)";
      el.style.border = "1px solid rgba(212,175,55,.35)";
      el.style.color = "var(--text)";
      el.style.fontWeight = "900";
      el.style.boxShadow = "0 10px 30px rgba(0,0,0,.5)";
      el.style.backdropFilter = "blur(10px)";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      el.style.opacity = "0";
    }, 1400);
  }

  function setCartUI() {
    const cartCount = $("#cartCount");
    const cartTotal = $("#cartTotal");
    const checkoutSummary = $("#checkoutSummary");
    const checkoutTotal = $("#checkoutTotal");

    if (cartCount) cartCount.textContent = String(getCartCount());
    if (cartTotal) cartTotal.textContent = money(getCartTotal());
    if (checkoutTotal) checkoutTotal.textContent = money(getCartTotal());

    if (!checkoutSummary) return;

    if (state.cart.length === 0) {
      checkoutSummary.innerHTML = '<div class="muted">Keranjang kosong.</div>';
      return;
    }

    checkoutSummary.innerHTML = state.cart
      .map((it) => {
        return `
          <div class="kv">
            <span>
              ${escapeHtml(it.nama)}
              <br/><span style="color:var(--muted);font-size:12px;">
                ${escapeHtml(it.warnaLabel)} • ${escapeHtml(it.size)}
              </span>
            </span>
            <span>${money(it.harga)}</span>
          </div>
        `;
      })
      .join("");
  }

  function addToCart(selectedVariant) {
    const existing = state.cart.find((it) => it.sku === selectedVariant.sku);
    if (existing) existing.qty += 1;
    else state.cart.push(makeCartItem(selectedVariant));
    saveCart();
    setCartUI();
    toast("Ditambahkan ke keranjang.");
  }

  function removeCartItem(sku) {
    state.cart = state.cart.filter((it) => it.sku !== sku);
    saveCart();
    setCartUI();
    renderCart();
  }

  function changeQty(sku, delta) {
    const it = state.cart.find((x) => x.sku === sku);
    if (!it) return;
    it.qty += delta;
    if (it.qty <= 0) state.cart = state.cart.filter((x) => x.sku !== sku);
    saveCart();
    setCartUI();
    renderCart();
  }

  function showPage(page) {
    $$(".page").forEach((p) => {
      const name = p.getAttribute("data-page");
      p.hidden = name !== page;
    });
  }

  function parseRoute() {
    const hash = (location.hash || "#/home").replace(/^#/, "");
    const [path, queryString] = hash.split("?");
    const page = path.replace(/^\//, "").trim();
    const qs = new URLSearchParams(queryString || "");
    return { page: page || "home", qs };
  }

  function routeTo(page) {
    location.hash = "#/" + page;
  }

  function renderProductCard(product) {
    const def = pickDefaultVariant(product.variants);
    const warnaLabel = colorMeta[def.warna]?.label || def.warna;
    const price = money(def.harga);
    const stockLabel = getVariantStockLabel(def.stok);

    return `
      <article class="productCard" aria-label="Produk">
        <div class="productCard__img">${escapeHtml(product.nama)}</div>
        <div class="productCard__title">${escapeHtml(product.nama)}</div>
        <div class="productCard__meta">
          <span>${escapeHtml(warnaLabel)}</span>
          <span>${escapeHtml(product.kategori)}</span>
        </div>
        <div class="productCard__price">${price}</div>
        <div class="muted" style="font-weight:900;color:var(--gold2);font-size:12px;margin-top:-6px;">
          ${escapeHtml(stockLabel)}
        </div>
        <div class="productCard__actions">
          <a class="productCard__link" href="#/detail?product=${encodeURIComponent(product.id)}">Lihat detail</a>
        </div>
      </article>
    `;
  }

  function renderHome() {
    const featuredGrid = $("#featuredGrid");
    const bestsellerGrid = $("#bestsellerGrid");
    const categoryChips = $("#categoryChips");
    if (!featuredGrid || !bestsellerGrid || !categoryChips) return;

    const featured = masterProduk.filter((p) => p.unggulan).slice(0, 8);
    const bestSeller = masterProduk.filter((p) => p.bestSeller).slice(0, 8);

    featuredGrid.innerHTML = featured.map((p) => renderProductCard(p)).join("");
    bestsellerGrid.innerHTML = bestSeller.map((p) => renderProductCard(p)).join("");

    categoryChips.innerHTML = categories
      .map((c) => `<a class="pill" href="#/katalog">${escapeHtml(c)}</a>`)
      .join("");

    const kpi = $("#kpiBestSeller");
    if (kpi) kpi.textContent = String(bestSeller.length);
  }

  function renderKatalog() {
    const grid = $("#katalogGrid");
    const selColor = $("#filterColor");
    const selStock = $("#filterStock");
    if (!grid || !selColor || !selStock) return;

    const colors = new Set();
    masterProduk.forEach((p) => p.variants.forEach((v) => colors.add(v.warna)));

    const colorList = Array.from(colors).map((k) => ({
      k,
      label: colorMeta[k]?.label || k,
    }));

    selColor.innerHTML =
      '<option value="__all__">Semua</option>' +
      colorList
        .map((c) => `<option value="${escapeHtml(c.k)}">${escapeHtml(c.label)}</option>`)
        .join("");

    function filtered() {
      const color = selColor.value;
      const stock = selStock.value;

      const products = masterProduk
        .map((p) => {
          const variants = p.variants.filter((v) => {
            if (color !== "__all__" && v.warna !== color) return false;
            if (stock === "in_stock" && v.stok <= 0) return false;
            if (stock === "out_of_stock" && v.stok > 0) return false;
            return true;
          });
          return { product: p, variants };
        })
        .filter((x) => x.variants.length > 0)
        .map((x) => ({ ...x.product, variants: x.variants }));

      grid.innerHTML = products.map((p) => renderProductCard(p)).join("");
    }

    selColor.addEventListener("change", filtered);
    selStock.addEventListener("change", filtered);

    filtered();
  }

  function renderDetail() {
    const media = $("#detailMedia");
    const title = $("#detailTitle");
    const category = $("#detailCategory");
    const skuEl = $("#detailSku");
    const priceEl = $("#detailPrice");
    const stockEl = $("#detailStock");
    const colorsWrap = $("#variantColors");
    const sizesWrap = $("#variantSizes");
    const btnAdd = $("#btnAddToCart");
    const btnBuy = $("#btnBuyNow");

    if (!media || !title) return;

    const { qs } = parseRoute();
    const productId = qs.get("product");
    if (!productId) {
      routeTo("katalog");
      return;
    }

    const product = findProductById(productId);
    if (!product) return;

    const defaultVar = pickDefaultVariant(product.variants);
    let activeWarna = defaultVar.warna;
    let activeSize = defaultVar.size;

    function renderVariantPills() {
      const warnaList = Array.from(new Set(product.variants.map((v) => v.warna)));

      colorsWrap.innerHTML = warnaList
        .map((w) => {
          const label = colorMeta[w]?.label || w;
          const pressed = w === activeWarna ? "true" : "false";
          return `<button class="pillBtn" type="button" aria-pressed="${pressed}" data-w="${escapeHtml(w)}">${escapeHtml(label)}</button>`;
        })
        .join("");

      $$(".pillBtn[data-w]", colorsWrap).forEach((b) => {
        b.addEventListener("click", () => {
          activeWarna = b.getAttribute("data-w");
          setSelected(activeWarna, activeSize);
        });
      });

      const sizes = product.variants.filter((v) => v.warna === activeWarna);
      const uniqueSizes = Array.from(new Map(sizes.map((s) => [s.size, s])).values());

      sizesWrap.innerHTML = uniqueSizes
        .map((s) => {
          const pressed = s.size === activeSize ? "true" : "false";
          const stockTxt = getVariantStockLabel(s.stok);
          const dim = s.stok <= 0 ? " style='opacity:.6;'" : "";
          return `<button class="pillBtn" type="button" aria-pressed="${pressed}" data-s="${escapeHtml(s.size)}" ${dim}>${escapeHtml(s.size)} • ${escapeHtml(stockTxt)}</button>`;
        })
        .join("");

      $$(".pillBtn[data-s]", sizesWrap).forEach((b) => {
        b.addEventListener("click", () => {
          activeSize = b.getAttribute("data-s");
          setSelected(activeWarna, activeSize);
        });
      });
    }

    function setSelected(warnaKey, sizeKey) {
      const v = product.variants.find((x) => x.warna === warnaKey && x.size === sizeKey);
      if (!v) return;

      const variant = {
        productId: product.id,
        sku: `${product.skuPrefix}-${warnaKey}-${sizeKey}`,
        nama: product.nama,
        kategori: product.kategori,
        warna: warnaKey,
        warnaLabel: colorMeta[warnaKey]?.label || warnaKey,
        size: sizeKey,
        harga: v.harga,
        stok: v.stok,
      };

      state.selected = variant;

      title.textContent = product.nama;
      category.textContent = product.kategori;
      skuEl.textContent = variant.sku;
      priceEl.textContent = money(variant.harga);
      stockEl.textContent = `Status stok: ${getVariantStockLabel(variant.stok)}`;

      media.innerHTML = `
        <div style="text-align:center; padding:10px;">
          <div style="font-weight:1000; letter-spacing:.8px;">${escapeHtml(product.nama)}</div>
          <div style="color:rgba(241,210,119,.95);font-weight:900;margin-top:6px;">
            ${escapeHtml(variant.warnaLabel)} • ${escapeHtml(variant.size)}
          </div>
          <div style="margin-top:10px;color:var(--muted);font-weight:900;font-size:12px;">Demo foto produk</div>
        </div>
      `;

      btnAdd.disabled = variant.stok <= 0;
      btnAdd.style.opacity = variant.stok <= 0 ? "0.6" : "1";
      btnBuy.href = variant.stok <= 0 ? "#/katalog" : "#/checkout";

      renderVariantPills();
    }

    btnAdd.addEventListener("click", () => {
      if (!state.selected) return;
      if (state.selected.stok <= 0) {
        toast("Stok habis untuk varian ini.");
        return;
      }
      addToCart(state.selected);
    });

    setSelected(activeWarna, activeSize);
  }

  function renderCart() {
    const list = $("#cartList");
    if (!list) return;

    if (state.cart.length === 0) {
      list.innerHTML = `<div class="muted" style="padding:16px;">Keranjang kosong. Silakan pilih produk.</div>`;
      setCartUI();
      return;
    }

    list.innerHTML = state.cart
      .map((it) => {
        return `
          <div class="cartItem">
            <div class="cartItem__img">${escapeHtml(it.nama)}</div>
            <div class="cartItem__main">
              <div class="cartItem__title">${escapeHtml(it.nama)}</div>
              <div class="cartItem__sub">${escapeHtml(it.warnaLabel)} • Size ${escapeHtml(it.size)}</div>
              <div class="cartItem__priceRow">
                <div class="strong">${money(it.harga)}</div>
                <div style="display:flex;gap:8px;align-items:center;">
                  <button class="iconBtn" type="button" data-act="dec" data-sku="${escapeHtml(it.sku)}" aria-label="Kurangi">-</button>
                  <div class="muted" style="font-weight:1000;">Qty: ${it.qty}</div>
                  <button class="iconBtn" type="button" data-act="inc" data-sku="${escapeHtml(it.sku)}" aria-label="Tambah">+</button>
                </div>
              </div>
              <div style="margin-top:10px;">
                <button class="iconBtn" type="button" data-act="rm" data-sku="${escapeHtml(it.sku)}">Hapus</button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    list.querySelectorAll("button[data-act]").forEach((b) => {
      b.addEventListener("click", () => {
        const sku = b.getAttribute("data-sku");
        const act = b.getAttribute("data-act");
        if (act === "rm") removeCartItem(sku);
        if (act === "inc") changeQty(sku, +1);
        if (act === "dec") changeQty(sku, -1);
      });
    });

    setCartUI();
  }

  function renderCheckout() {
    const methodsWrap = $("#paymentMethods");
    const waStatus = $("#waStatus");
    const waPhone = $("#waPhone");
    const btnWA = $("#btnWA");
    const btnSimPay = $("#btnSimPay");
    const payStatus = $("#payStatus");
    const btnPlaceOrder = $("#btnPlaceOrder");

    if (!methodsWrap || !waStatus || !btnWA || !payStatus || !btnPlaceOrder) return;

    methodsWrap.innerHTML = paymentMethods
      .map(
        (m) => `
        <div class="payMethod" role="button" tabindex="0" aria-selected="false" data-mid="${escapeHtml(m.id)}">
          <div class="payMethod__name">${escapeHtml(m.name)}</div>
          <div class="payMethod__desc">${escapeHtml(m.desc)}</div>
        </div>
      `
      )
      .join("");

    let selectedPay = null;

    function setPay(mid) {
      selectedPay = mid;
      $$(".payMethod", methodsWrap).forEach((x) => {
        const is = x.getAttribute("data-mid") === mid;
        x.setAttribute("aria-selected", is ? "true" : "false");
      });
      const name = paymentMethods.find((p) => p.id === mid)?.name || "-";
      payStatus.textContent = "Dipilih: " + name;
      payStatus.style.color = "var(--gold2)";
    }

    methodsWrap.querySelectorAll(".payMethod").forEach((el) => {
      el.addEventListener("click", () => setPay(el.getAttribute("data-mid")));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setPay(el.getAttribute("data-mid"));
        }
      });
    });

    waStatus.textContent = "Belum login.";
    waStatus.style.color = "var(--gold2)";

    btnWA.addEventListener("click", () => {
      const phone = (waPhone.value || "").trim();
      if (phone.length < 8) {
        toast("Masukkan nomor HP yang valid (demo).");
        return;
      }
      waStatus.textContent = "Login WA berhasil (demo).";
      localStorage.setItem("rl_estore_wa_login_demo", "true");
      localStorage.setItem("rl_estore_wa_phone_demo", phone);
      toast("WA login: OK");
    });

    const isLoggedIn = localStorage.getItem("rl_estore_wa_login_demo") === "true";
    if (isLoggedIn) waStatus.textContent = "Login WA berhasil (demo).";

    btnSimPay.addEventListener("click", () => {
      if (!selectedPay) {
        payStatus.textContent = "Pilih metode pembayaran dulu.";
        payStatus.style.color = "var(--gold2)";
        return;
      }
      if (localStorage.getItem("rl_estore_wa_login_demo") !== "true") {
        payStatus.textContent = "Login WA dulu sebelum bayar (demo).";
        return;
      }

      payStatus.textContent = "Memproses pembayaran (demo)...";
      payStatus.style.color = "var(--gold2)";

      setTimeout(() => {
        const mName = paymentMethods.find((p) => p.id === selectedPay)?.name || "-";
        payStatus.textContent = `Pembayaran berhasil via ${mName} (demo).`;
        toast("Pembayaran: BERHASIL (demo)");
      }, 900);
    });

    btnPlaceOrder.addEventListener("click", () => {
      if (state.cart.length === 0) {
        toast("Keranjang kosong.");
        return;
      }
      if (localStorage.getItem("rl_estore_wa_login_demo") !== "true") {
        toast("Login WA wajib saat checkout (demo).");
        payStatus.textContent = "Login WA wajib saat checkout.";
        return;
      }

      const name = ($("#shipName")?.value || "").trim();
      const addr = ($("#shipAddress")?.value || "").trim();
      const city = ($("#shipCity")?.value || "").trim();

      if (!name || !addr || !city) {
        toast("Lengkapi data pengiriman (demo).");
        return;
      }

      if (!selectedPay) {
        payStatus.textContent = "Pilih metode pembayaran dulu.";
        payStatus.style.color = "var(--gold2)";
        return;
      }

      const mName = paymentMethods.find((p) => p.id === selectedPay)?.name || "Metode belum dipilih";

      // COD-specific "real-time status" simulation
      if (selectedPay === "cod") {
        payStatus.textContent = "Order dibuat. Status: Menunggu pembayaran COD (demo)...";
        payStatus.style.color = "var(--gold2)";

        setTimeout(() => {
          payStatus.textContent = `Status COD: Kurir menunggu pembayaran / ${mName} (demo).`;
        }, 900);

        setTimeout(() => {
          payStatus.textContent = `Status COD: Dibayar di tempat / ${mName} (demo).`;
          toast("Pesanan COD sukses (demo)");
        }, 1800);

        return;
      }

      payStatus.textContent = "Order dibuat. Status akan tersinkronisasi (demo).";
      setTimeout(() => {
        payStatus.textContent = `Order sukses. Status: Dibayar / ${mName} (demo).`;
        toast("Pesanan sukses (demo)");
      }, 1200);
    });
  }

  function renderProfil() {
    const name = $("#profileName");
    const phone = $("#profilePhone");
    const address = $("#profileAddress");
    const city = $("#profileCity");
    if (!name || !phone) return;

    const demoLogin = localStorage.getItem("rl_estore_wa_login_demo") === "true";
    const demoPhone = localStorage.getItem("rl_estore_wa_phone_demo") || "-";

    name.textContent = demoLogin ? "Pelanggan Demo" : "-";
    phone.textContent = demoPhone;

    const last = safeParseJSON(localStorage.getItem("rl_estore_last_ship_demo"), null);
    address.textContent = last?.address || "-";
    city.textContent = last?.city || "-";
  }

  function wireCheckoutShipSave() {
    const save = () => {
      const payload = {
        name: ($("#shipName")?.value || "").trim(),
        phone: ($("#shipPhone")?.value || "").trim(),
        address: ($("#shipAddress")?.value || "").trim(),
        city: ($("#shipCity")?.value || "").trim(),
      };
      localStorage.setItem("rl_estore_last_ship_demo", JSON.stringify(payload));
    };

    ["shipName", "shipPhone", "shipAddress", "shipCity", "shipCourier"].forEach((id) => {
      const el = $("#" + id);
      if (!el) return;
      el.addEventListener("change", save);
      el.addEventListener("input", save);
    });
  }

  function renderRoute() {
    const { page } = parseRoute();
    showPage(page);

    if (page === "home") renderHome();
    if (page === "katalog") renderKatalog();
    if (page === "detail") renderDetail();
    if (page === "keranjang") renderCart();
    if (page === "checkout") {
      renderCart();
      renderCheckout();
      wireCheckoutShipSave();
    }
    if (page === "profil") renderProfil();
    // about is static
  }

  function initNav() {
    const chip = $("#cartChip");
    if (chip) chip.addEventListener("click", () => routeTo("keranjang"));
    window.addEventListener("hashchange", renderRoute);
  }

  function init() {
    loadCart();
    setCartUI();
    initNav();
    renderRoute();
  }

  init();
})();
