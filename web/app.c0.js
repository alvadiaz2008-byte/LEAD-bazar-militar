(function () {
  const STORE_KEY = "atlas-tactico-store-v1";
  const CART_KEY = "atlas-tactico-cart-v1";
  const STOCK_CACHE_KEY = "lead-stock-cache-v1";
  const RESERVE_KEY = "lead-stock-reserve-v1";
  const BAD_KEYS = "lead-stock-bad-v1";
  const RESERVE_TTL_MS = 15 * 60 * 1000;
  // APIs SheetDB en orden de prioridad (anade mas URLs al final si hace falta)
  const SHEETDB_URLS = [
    "https://sheetdb.io/api/v1/jrxq3blppmk92",
    "https://sheetdb.io/api/v1/hqbpwzelphd4c",
  ];
  const SHEETDB_ACTIVE_KEY = "lead-sheetdb-active-v1";
  const WHATSAPP = "51947978594";
  const LOGO = "public/logo.webp";
  const app = document.querySelector("#app");

  const style = document.createElement("style");
  style.textContent = `
.hero-bg {
  background: url("${LOGO}") center/contain no-repeat !important;
  background-color: #141611 !important;
  opacity: 0.65 !important;
}
.hero-bg::after {
  background: color-mix(in oklab, #0b0c0a 35%, transparent) !important;
}
.hero { min-height: 12rem; }
@media (min-width: 768px) { .hero { min-height: 16rem; } }
.cat-card {
  min-height: 3.25rem !important;
  justify-content: center !important;
  padding: 0.55rem 0.85rem !important;
  border-radius: 0.7rem !important;
}
.cat-card span { font-size: 1rem !important; }
.logo-img {
  width: 2rem;
  height: 2rem;
  object-fit: contain;
  border-radius: 6px;
  flex-shrink: 0;
}
.logo-name strong { letter-spacing: 0.12em; }
.logo-name span { letter-spacing: 0.14em; }
.card-photo {
  aspect-ratio: 1 / 1 !important;
  min-height: 0 !important;
  width: 100%;
  overflow: hidden;
}
.card-photo img {
  width: 100% !important;
  height: 100% !important;
  max-height: none !important;
  object-fit: cover !important;
  object-position: center !important;
}
.panels { display: none !important; }
.lead-toast-actions {
  display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center;
  margin-top: 1rem;
}
.lead-toast-actions .btn { min-width: 7rem; }
.lead-toast-msg {
  margin-top: 0.5rem;
  color: var(--muted, #9b9c90);
  font-size: 0.95rem;
  white-space: pre-line;
}
.cart-row.stock-bad {
  outline: 2px solid #b4544a !important;
  box-shadow: 0 0 0 1px rgba(180, 84, 74, 0.45) !important;
}
/* Admin solo lista + modal de detalle */
[data-admin-form] {
  display: none !important;
}
[data-admin-notice] {
  margin: 1rem 0 1.25rem;
}
.admin-list {
  margin-top: 0.5rem;
}
.admin-viewer-card {
  width: min(28rem, 100%);
  max-height: min(88svh, 40rem);
  overflow: auto;
  background: var(--surface, #141611);
  border-radius: 1rem;
  padding: 1.2rem 1.15rem 1.1rem;
  box-shadow: 0 18px 40px rgba(0,0,0,0.45);
}
.admin-viewer-card img.main {
  width: 100%;
  max-height: 14rem;
  object-fit: contain;
  border-radius: 0.6rem;
  background: var(--elevated, #1c1f18);
  margin: 0.75rem 0;
}
.admin-viewer-meta {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.75rem;
  font-size: 0.92rem;
}
.admin-viewer-meta div {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.4rem 0;
  border-top: 1px solid var(--border, #2a2d24);
}
.admin-viewer-meta div:first-child { border-top: 0; }
.admin-viewer-variants {
  margin-top: 0.85rem;
  display: grid;
  gap: 0.35rem;
}
.admin-viewer-thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.75rem;
}
.admin-viewer-thumbs img {
  width: 3.5rem;
  height: 3.5rem;
  object-fit: cover;
  border-radius: 0.4rem;
}
`.replace("${LOGO}", LOGO);
  document.head.appendChild(style);

  (function muteNotifySound() {
    const Native = window.AudioContext || window.webkitAudioContext;
    if (!Native) return;
    function Wrapped(options) {
      const ctx = new Native(options);
      const origOsc = ctx.createOscillator.bind(ctx);
      ctx.createOscillator = function () {
        const o = origOsc();
        o.start = function () {};
        o.stop = function () {};
        return o;
      };
      return ctx;
    }
    Wrapped.prototype = Native.prototype;
    window.AudioContext = Wrapped;
    if (window.webkitAudioContext) window.webkitAudioContext = Wrapped;
  })();

  function refreshProductStockUI() {
    document.querySelectorAll("form").forEach((f) => {
      if (typeof f._paintStock === "function") {
        try {
          f._paintStock();
        } catch (_) {}
      }
    });
  }

  function rowKey(productId, size, color) {
    return String(productId) + "|" + String(size || "Sin talla") + "|" + String(color || "");
  }

  function loadProducts() {
    try {
      const list = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  function saveProducts(list) {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  }

  function loadCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function clampCartToStock(map) {
    const cart = loadCart();
    const next = [];
    for (const item of cart) {
      const size = item.size || "Sin talla";
      const k = rowKey(item.productId, size, item.color);
      if (!Object.prototype.hasOwnProperty.call(map, k)) {
        next.push(item);
        continue;
      }
      const max = Math.max(0, Number(map[k]) || 0);
      if (max <= 0) continue;
      const qty = Math.min(Math.max(1, Number(item.qty) || 1), max);
      next.push(Object.assign({}, item, { qty: qty }));
    }
    localStorage.setItem(CART_KEY, JSON.stringify(next));
    return next;
  }

  function getReserve() {
    try {
      return JSON.parse(sessionStorage.getItem(RESERVE_KEY) || "null");
    } catch (_) {
      return null;
    }
  }

  function setReserve(data) {
    if (data) sessionStorage.setItem(RESERVE_KEY, JSON.stringify(data));
    else sessionStorage.removeItem(RESERVE_KEY);
  }

  function setBadKeys(keys) {
    sessionStorage.setItem(BAD_KEYS, JSON.stringify(keys || []));
  }

  function getBadKeys() {
    try {
      const k = JSON.parse(sessionStorage.getItem(BAD_KEYS) || "[]");
      return Array.isArray(k) ? k : [];
    } catch (_) {
      return [];
    }
  }

  function touchReserve() {
    const r = getReserve();
    if (!r) return;
    r.at = Date.now();
    setReserve(r);
  }

  function isReserveExpired(r) {
    if (!r || !r.at) return true;
    return Date.now() - Number(r.at) > RESERVE_TTL_MS;
  }

  function applyLocalWithReserve(sheetMap) {
    const map = Object.assign({}, sheetMap || {});
    const res = getReserve();
    if (res && res.items) {
      res.items.forEach((r) => {
        const cur = map[r.key];
        const qty = Number(r.qty) || 0;
        if (cur == null) map[r.key] = Number(r.before) || qty;
        else map[r.key] = cur + qty;
      });
    }
    localStorage.setItem(STOCK_CACHE_KEY, JSON.stringify(map));
    const list = loadProducts().map((p) => {
      const variants = (p.variants || []).map((v) => {
        const k = rowKey(p.id, v.size, v.color);
        if (Object.prototype.hasOwnProperty.call(map, k)) {
          return Object.assign({}, v, { stock: map[k] });
        }
        return v;
      });
      const stock = variants.reduce(
        (n, v) => n + Math.max(0, Number(v.stock) || 0),
        0,
      );
      return Object.assign({}, p, { variants: variants, stock: stock });
    });
    saveProducts(list);
  }

  function applyStockRows(rows) {
    if (!Array.isArray(rows) || !rows.length) return;
    const map = {};
    rows.forEach((r) => {
      const k = r.key || rowKey(r.product_id, r.size, r.color);
      map[k] = Math.max(0, Number(r.stock) || 0);
    });
    localStorage.setItem(STOCK_CACHE_KEY, JSON.stringify(map));
    const list = loadProducts().map((p) => {
      const variants = (p.variants || []).map((v) => {
        const k = rowKey(p.id, v.size, v.color);
        if (Object.prototype.hasOwnProperty.call(map, k)) {
          return { ...v, stock: map[k] };
        }
        return v;
      });
      const stock = variants.reduce(
        (n, v) => n + Math.max(0, Number(v.stock) || 0),
        0,
      );
      return { ...p, variants, stock };
    });
    saveProducts(list);
  }

  function getPreferredSheetIndex() {
    try {
      const n = Number(sessionStorage.getItem(SHEETDB_ACTIVE_KEY));
      if (Number.isFinite(n) && n >= 0 && n < SHEETDB_URLS.length) return n;
    } catch (_) {}
    return 0;
  }

  function setPreferredSheetIndex(i) {
    try {
      sessionStorage.setItem(SHEETDB_ACTIVE_KEY, String(i));
    } catch (_) {}
  }

  function orderedSheetUrls() {
    const start = getPreferredSheetIndex();
    const out = [];
    for (let i = 0; i < SHEETDB_URLS.length; i++) {
      out.push(SHEETDB_URLS[(start + i) % SHEETDB_URLS.length]);
    }
    return out;
  }

  async function sheetFetch(path, options) {
    const opts = Object.assign({ cache: "no-store" }, options || {});
    let lastErr = null;
    const urls = orderedSheetUrls();
    for (let i = 0; i < urls.length; i++) {
      const base = urls[i];
      const url = path ? base + path : base;
      try {
        const res = await fetch(url, opts);
        if (res.ok) {
          const idx = SHEETDB_URLS.indexOf(base);
          if (idx >= 0) setPreferredSheetIndex(idx);
          return res;
        }
        if (res.status === 429 || res.status === 402 || res.status === 403 || res.status >= 500) {
          lastErr = new Error("SheetDB " + res.status + " en " + base);
          console.warn(lastErr.message);
          continue;
        }
        lastErr = new Error("SheetDB error " + res.status);
        if (res.status === 404 && path) {
          throw lastErr;
        }
        continue;
      } catch (e) {
        lastErr = e;
        console.warn("SheetDB fallo", base, e);
      }
    }
    throw lastErr || new Error("No se pudo conectar con la base de datos.");
  }

  async function fetchSheetStock() {
    const res = await sheetFetch("");
    const rows = await res.json();
    return Array.isArray(rows) ? rows : [];
  }

  async function seedSheetIfEmpty(rows) {
    if (rows.length) return rows;
    const products = loadProducts();
    const data = [];
    products.forEach((p) => {
      (p.variants || []).forEach((v) => {
        data.push({
          key: rowKey(p.id, v.size, v.color),
          product_id: String(p.id),
          sku: p.sku || "",
          name: p.name || "",
          size: v.size || "Sin talla",
          color: v.color || "",
          stock: String(Math.max(0, Number(v.stock) || 0)),
        });
      });
    });
    if (!data.length) return rows;
    try {
      const res = await sheetFetch("", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) {
        console.warn("SheetDB seed failed", await res.text().catch(() => ""));
        throw new Error(
          "La hoja de Excel esta vacia. Fila 1: key | product_id | sku | name | size | color | stock",
        );
      }
    } catch (e) {
      console.warn("SheetDB seed failed", e);
      throw new Error(
        "La hoja de Excel esta vacia. Fila 1: key | product_id | sku | name | size | color | stock",
      );
    }
    return fetchSheetStock();
  }

  async function syncStockFromSheet() {
    let rows = await fetchSheetStock();
    try {
      rows = await seedSheetIfEmpty(rows);
    } catch (e) {
      console.warn(e);
    }
    applyStockRows(rows);
    return rows;
  }

  async function patchStock(key, nextStock) {
    const res = await sheetFetch("/key/" + encodeURIComponent(key), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ stock: String(Math.max(0, nextStock)) }),
    });
    if (!res.ok) throw new Error("No se pudo actualizar el stock. Intenta de nuevo.");
  }

  function stockMapFromRows(rows) {
    const map = {};
    rows.forEach((r) => {
      const k = r.key || rowKey(r.product_id, r.size, r.color);
      map[k] = Math.max(0, Number(r.stock) || 0);
    });
    return map;
  }

  function money(n) {
    return "S/ " + Number(n || 0).toFixed(2);
  }

  function variantNote(size, color) {
    const s = size && size !== "Sin talla" ? size : null;
    if (s && color) return s + " / " + color;
    return color || s || "—";
  }

  function dismissLeadToast(overlay) {
    if (!overlay || !overlay.parentNode) return;
    overlay.classList.remove("on");
    overlay.classList.add("off");
    setTimeout(() => overlay.remove(), 200);
  }

  function showLeadDialog({ kicker, title, message, buttons }) {
    return new Promise((resolve) => {
      document.querySelector("[data-lead-toast]")?.remove();
      const overlay = document.createElement("div");
      overlay.className = "toast-overlay";
      overlay.setAttribute("data-lead-toast", "");
      const btns = (buttons || [])
        .map(
          (b, i) =>
            `<button type="button" class="btn ${b.outline ? "outline" : ""}" data-lead-btn="${i}">${b.label}</button>`,
        )
        .join("");
      overlay.innerHTML = `<div class="toast-card" role="dialog" aria-modal="true">
        <p class="kicker">${kicker || "Aviso"}</p>
        <p class="toast-title">${title || ""}</p>
        ${message ? `<p class="lead-toast-msg">${message}</p>` : ""}
        <div class="lead-toast-actions">${btns}</div>
      </div>`;
      overlay.querySelectorAll("[data-lead-btn]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.getAttribute("data-lead-btn"));
          dismissLeadToast(overlay);
          resolve(buttons[idx]?.id);
        });
      });
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add("on"));
    });
  }

  function findInsufficient(items, map) {
    const bad = [];
    for (const item of items) {
      const size = item.size || "Sin talla";
      const k = rowKey(item.productId, size, item.color);
      const need = Math.max(1, Number(item.qty) || 1);
      const have = map[k];
      if (have == null || have < need) {
        bad.push({
          key: k,
          item,
          have: have == null ? 0 : have,
          need,
          label:
            (item.name || "Producto") +
            " (" +
            variantNote(size, item.color) +
            ")",
        });
      }
    }
    return bad;
  }

  async function reserveCartStock() {
    if (getReserve()) return { ok: true, already: true };
    const items = loadCart();
    if (!items.length) {
      await showLeadDialog({
        kicker: "Carrito",
        title: "Carrito vacio",
        message: "Agrega productos antes de comprar.",
        buttons: [{ id: "ok", label: "Entendido" }],
      });
      location.hash = "#/carrito";
      return { ok: false };
    }
    const rows = await fetchSheetStock();
    const map = stockMapFromRows(rows);
    applyStockRows(rows);
    const bad = findInsufficient(items, map);
    if (bad.length) {
      setBadKeys(bad.map((b) => b.key));
      const lines = bad
        .map(
          (b) =>
            "• " +
            b.label +
            "\n  Disponible: " +
            b.have +
            " · Pedido: " +
            b.need,
        )
        .join("\n\n");
      const choice = await showLeadDialog({
        kicker: "Stock",
        title: "Stock insuficiente",
        message: lines + "\n\nPuedes editar el carrito o salir.",
        buttons: [
          { id: "edit", label: "Editar", outline: true },
          { id: "leave", label: "Salir" },
        ],
      });
      if (choice === "edit") {
        clampCartToStock(map);
        location.hash = "#/carrito";
      } else location.hash = "#/";
      return { ok: false, bad };
    }
    setBadKeys([]);
    const reserved = [];
    for (const item of items) {
      const size = item.size || "Sin talla";
      const k = rowKey(item.productId, size, item.color);
      const need = Math.max(1, Number(item.qty) || 1);
      const freshRows = await fetchSheetStock();
      const freshMap = stockMapFromRows(freshRows);
      const have = freshMap[k];
      if (have == null || have < need) {
        applyStockRows(freshRows);
        for (const r of reserved) {
          try {
            await patchStock(r.key, r.before);
          } catch (_) {}
        }
        setBadKeys([k]);
        const label =
          (item.name || "Producto") +
          " (" +
          variantNote(size, item.color) +
          ")";
        const choice = await showLeadDialog({
          kicker: "Stock",
          title: "Stock insuficiente",
          message:
            "• " +
            label +
            "\n  Disponible: " +
            (have == null ? 0 : have) +
            " · Pedido: " +
            need +
            "\n\nPuedes editar el carrito o salir.",
          buttons: [
            { id: "edit", label: "Editar", outline: true },
            { id: "leave", label: "Salir" },
          ],
        });
        if (choice === "edit") {
          clampCartToStock(freshMap);
          location.hash = "#/carrito";
        } else location.hash = "#/";
        return { ok: false };
      }
      const next = Math.max(0, have - need);
      await patchStock(k, next);
      reserved.push({ key: k, before: have, qty: need, item });
      freshMap[k] = next;
      applyStockRows(
        Object.keys(freshMap).map((key) => {
          const p = key.split("|");
          return {
            key,
            product_id: p[0],
            size: p[1],
            color: p[2],
            stock: freshMap[key],
          };
        }),
      );
    }
    setReserve({ items: reserved, at: Date.now() });
    try {
      const rows2 = await fetchSheetStock();
      applyLocalWithReserve(stockMapFromRows(rows2));
    } catch (_) {
      const map2 = {};
      reserved.forEach((r) => {
        map2[r.key] = Number(r.before) || 0;
      });
      applyLocalWithReserve(map2);
    }
    return { ok: true };
  }

  async function releaseReserve() {
    const res = getReserve();
    setReserve(null);
    if (!res || !res.items || !res.items.length) return;
    try {
      const rows = await fetchSheetStock();
      const map = stockMapFromRows(rows);
      await Promise.all(
        res.items.map((r) => {
          const current = map[r.key];
          const restore =
            current == null ? r.before : current + Number(r.qty || 0);
          map[r.key] = restore;
          return patchStock(r.key, restore).catch((e) =>
            console.warn("No se pudo liberar stock", r.key, e),
          );
        }),
      );
      applyStockRows(
        Object.keys(map).map((key) => {
          const p = key.split("|");
          return {
            key,
            product_id: p[0],
            size: p[1],
            color: p[2],
            stock: map[key],
          };
        }),
      );
    } catch (e) {
      console.warn("releaseReserve", e);
    }
  }

  function releaseReserveKeepalive() {
    const res = getReserve();
    if (!res || !res.items || !res.items.length) return;
    setReserve(null);
    res.items.forEach((r) => {
      const body = JSON.stringify({ stock: String(Math.max(0, Number(r.before) || 0)),
