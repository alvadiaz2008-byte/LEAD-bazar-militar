(function () {
  const STORE_KEY = "atlas-tactico-store-v1";
  const CART_KEY = "atlas-tactico-cart-v1";
  const STOCK_CACHE_KEY = "lead-stock-cache-v1";
  const RESERVE_KEY = "lead-stock-reserve-v1";
  const BAD_KEYS = "lead-stock-bad-v1";
  const RESERVE_TTL_MS = 15 * 60 * 1000;
  const SHEETDB_URLS = [
    "https://sheetdb.io/api/v1/jrxq3blppmk92",
    "https://sheetdb.io/api/v1/hqbpwzelphd4c",
  ];
  const SHEETDB_ACTIVE_KEY = "lead-sheetdb-active-v1";
  const WHATSAPP = "51947978594";
  const LOGO = "public/logo.webp";
  const app = document.querySelector("#app");

  const style = document.createElement("style");
  style.textContent = [
    '.hero-bg{background:url("' + LOGO + '") center/contain no-repeat!important;background-color:#141611!important;opacity:.65!important}',
    '.hero-bg::after{background:color-mix(in oklab,#0b0c0a 35%,transparent)!important}',
    '.hero{min-height:12rem}@media(min-width:768px){.hero{min-height:16rem}}',
    '.cat-card{min-height:3.25rem!important;justify-content:center!important;padding:.55rem .85rem!important;border-radius:.7rem!important}',
    '.cat-card span{font-size:1rem!important}',
    '.logo-img{width:2rem;height:2rem;object-fit:contain;border-radius:6px;flex-shrink:0}',
    '.logo-name strong{letter-spacing:.12em}.logo-name span{letter-spacing:.14em}',
    '.card-photo{aspect-ratio:1/1!important;min-height:0!important;width:100%;overflow:hidden}',
    '.card-photo img{width:100%!important;height:100%!important;max-height:none!important;object-fit:cover!important;object-position:center!important}',
    '.panels{display:none!important}',
    '.lead-toast-actions{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center;margin-top:1rem}',
    '.lead-toast-actions .btn{min-width:7rem}',
    '.lead-toast-msg{margin-top:.5rem;color:var(--muted,#9b9c90);font-size:.95rem;white-space:pre-line}',
    '.cart-row.stock-bad{outline:2px solid #b4544a!important;box-shadow:0 0 0 1px rgba(180,84,74,.45)!important}',
    '[data-admin-form]{display:none!important}',
    '[data-admin-notice]{margin:1rem 0 1.25rem}',
    '.admin-list{margin-top:.5rem}',
    '.admin-viewer-card{width:min(28rem,100%);max-height:min(88svh,40rem);overflow:auto;background:var(--surface,#141611);border-radius:1rem;padding:1.2rem 1.15rem 1.1rem;box-shadow:0 18px 40px rgba(0,0,0,.45)}',
    '.admin-viewer-card img.main{width:100%;max-height:14rem;object-fit:contain;border-radius:.6rem;background:var(--elevated,#1c1f18);margin:.75rem 0}',
    '.admin-viewer-meta{display:grid;gap:.45rem;margin-top:.75rem;font-size:.92rem}',
    '.admin-viewer-meta div{display:flex;justify-content:space-between;gap:.75rem;padding:.4rem 0;border-top:1px solid var(--border,#2a2d24)}',
    '.admin-viewer-meta div:first-child{border-top:0}',
    '.admin-viewer-variants{margin-top:.85rem;display:grid;gap:.35rem}',
    '.admin-viewer-thumbs{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.75rem}',
    '.admin-viewer-thumbs img{width:3.5rem;height:3.5rem;object-fit:cover;border-radius:.4rem}',
  ].join('\n');
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
  function rowKey(productId, size, color) {
    return String(productId) + "|" + String(size || "Sin talla") + "|" + String(color || "");
  }
  function money(n) {
    return "S/ " + Number(n || 0).toFixed(2);
  }
  function currentRoute() {
    const h = (location.hash || "#/").replace(/^#\/?/, "");
    return (h.split("/")[0] || "").toLowerCase();
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

  function closeAdminViewer() {
    var el = document.querySelector("[data-admin-viewer]");
    if (el) el.remove();
  }

  function openProductViewer(id) {
    closeAdminViewer();
    var list = loadProducts();
    var p = list.find(function (x) {
      return String(x.id) === String(id);
    });
    if (!p) return;
    var imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
    var main = imgs[0] || "";
    var variants = Array.isArray(p.variants) ? p.variants : [];
    var stockTotal = variants.reduce(function (n, v) {
      return n + Math.max(0, Number(v.stock) || 0);
    }, 0);
    if (!variants.length && p.stock != null) stockTotal = Number(p.stock) || 0;
    var overlay = document.createElement("div");
    overlay.className = "modal";
    overlay.setAttribute("data-admin-viewer", "");
    var thumbs =
      imgs.length > 1
        ? '<div class="admin-viewer-thumbs">' +
          imgs.map(function (src) {
            return '<img src="' + src + '" alt="" />';
          }).join("") +
          "</div>"
        : "";
    var variantHtml = "";
    if (variants.length) {
      variantHtml =
        '<p class="subtle" style="margin-top:1rem">Variantes</p><div class="admin-viewer-variants">' +
        variants
          .map(function (v) {
            var parts = [];
            if (v.size && v.size !== "Sin talla") parts.push(v.size);
            if (v.color) parts.push(v.color);
            var label = parts.length ? parts.join(" · ") : "—";
            return (
              '<div class="notice" style="margin:0">' +
              label +
              " — stock: " +
              (v.stock != null ? v.stock : "—") +
              "</div>"
            );
          })
          .join("") +
        "</div>";
    }
    overlay.innerHTML =
      '<div class="admin-viewer-card" role="dialog" aria-modal="true">' +
      '<p class="kicker">Consulta</p>' +
      '<h2 style="margin-top:0.35rem;font-size:1.55rem">' +
      (p.name || "Producto") +
      "</h2>" +
      (main ? '<img class="main" src="' + main + '" alt="" />' : "") +
      thumbs +
      '<div class="admin-viewer-meta">' +
      "<div><span class=\"muted\">SKU</span><strong>" +
      (p.sku || "—") +
      "</strong></div>" +
      "<div><span class=\"muted\">Categoría</span><strong>" +
      (p.category || "—") +
      "</strong></div>" +
      "<div><span class=\"muted\">Precio</span><strong>" +
      money(p.priceSoles) +
      "</strong></div>" +
      "<div><span class=\"muted\">Stock total</span><strong>" +
      stockTotal +
      "</strong></div>" +
      (p.material
        ? "<div><span class=\"muted\">Material</span><strong>" +
          p.material +
          "</strong></div>"
        : "") +
      "</div>" +
      (p.description
        ? '<p class="muted" style="margin-top:0.85rem">' + p.description + "</p>"
        : "") +
      variantHtml +
      '<div style="margin-top:1.15rem;display:flex;justify-content:flex-end">' +
      '<button type="button" class="btn outline" data-admin-viewer-close>Cerrar</button>' +
      "</div></div>";
    overlay.addEventListener("click", function (ev) {
      if (ev.target === overlay || ev.target.closest("[data-admin-viewer-close]")) {
        closeAdminViewer();
      }
    });
    document.body.appendChild(overlay);
  }

  function polishAdminViewer() {
    if (currentRoute() !== "admin") {
      closeAdminViewer();
      return;
    }
    var form = document.querySelector("[data-admin-form]");
    if (form) {
      form.hidden = true;
      form.style.display = "none";
      form.setAttribute("aria-hidden", "true");
    }
    var list = document.querySelector(".admin-list");
    if (list && !document.querySelector("[data-admin-notice]")) {
      var notice = document.createElement("p");
      notice.className = "notice";
      notice.setAttribute("data-admin-notice", "");
      notice.textContent =
        "Solo consulta. Lista del catálogo: pulsa Ver para ver el detalle. Edición en catalog.json y stock en la base de datos.";
      list.parentNode.insertBefore(notice, list);
    }
    document.querySelectorAll("[data-edit]").forEach(function (btn) {
      if (btn.dataset.viewBound) return;
      btn.dataset.viewBound = "1";
      var id = btn.getAttribute("data-edit");
      btn.removeAttribute("data-edit");
      btn.setAttribute("data-view", id);
      btn.textContent = "Ver";
      btn.className = "btn outline";
      btn.addEventListener(
        "click",
        function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          ev.stopImmediatePropagation();
          openProductViewer(id);
        },
        true,
      );
    });
    document.querySelectorAll("[data-del]").forEach(function (btn) {
      btn.remove();
    });
  }

  const ADMIN_PASS = "955802712";
  const ADMIN_SESSION = "atlas-tactico-admin";
  document.addEventListener(
    "submit",
    function (e) {
      const form = e.target && e.target.closest && e.target.closest("[data-login]");
      if (!form) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const password = new FormData(form).get("password");
      const err = form.querySelector("[data-err]");
      if (String(password) === ADMIN_PASS) {
        sessionStorage.setItem(ADMIN_SESSION, "1");
        location.hash = "#/admin";
        location.reload();
      } else if (err) {
        err.hidden = false;
        err.textContent = "Contraseña incorrecta.";
      }
    },
    true,
  );
  document.addEventListener(
    "submit",
    function (e) {
      if (e.target && e.target.closest && e.target.closest("[data-admin-form]")) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
  document.addEventListener(
    "click",
    function (e) {
      const del = e.target.closest && e.target.closest("[data-del]");
      if (del) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    },
    true,
  );

  function applyLogo() {
    document.querySelectorAll(".logo").forEach(function (el) {
      if (el.querySelector(".logo-img")) return;
      var img = document.createElement("img");
      img.src = LOGO;
      img.alt = "LEAD";
      img.className = "logo-img";
      var svg = el.querySelector("svg");
      if (svg) svg.replaceWith(img);
      else el.insertBefore(img, el.firstChild);
    });
    polishAdminViewer();
  }
  function scheduleLogo() {
    setTimeout(applyLogo, 0);
    setTimeout(applyLogo, 50);
  }

  async function boot() {
    try {
      const res = await fetch("web/catalog.json", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          localStorage.setItem(STORE_KEY, JSON.stringify(data));
        }
      }
    } catch (_) {}
    const s = document.createElement("script");
    s.src =
      "https://cdn.jsdelivr.net/gh/alvadiaz2008-byte/bold-mint-flora-garden@fe6d9b176af50f8546c6597d913a090ddcbebb69/web/app.js";
    s.onload = function () {
      applyLogo();
      const root = document.querySelector("#app");
      if (root) {
        new MutationObserver(function () {
          scheduleLogo();
          polishAdminViewer();
        }).observe(root, { childList: true, subtree: true });
      }
      polishAdminViewer();
    };
    document.body.appendChild(s);
  }

  if (app) {
    app.innerHTML =
      '<div class="wrap" style="padding:3rem 1rem;color:#ecebe3"><p>LEAD BAZAR MILITAR</p><h1>Cargando catalogo…</h1></div>';
  }
  boot();
})();
