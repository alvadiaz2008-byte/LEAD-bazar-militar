(function () {
  // Carga la version completa estable (SheetDB dual API, reserva stock, mapa, WhatsApp)
  // y luego aplica el panel admin solo-lista + modal Ver.
  var CORE =
    "https://cdn.jsdelivr.net/gh/alvadiaz2008-byte/LEAD-bazar-militar@e615074062f29ca2958b80d7d19c902a63bd1f55/web/app.js";
  var CORE_FALLBACK =
    "https://raw.githubusercontent.com/alvadiaz2008-byte/LEAD-bazar-militar/e615074062f29ca2958b80d7d19c902a63bd1f55/web/app.js";

  function money(n) {
    return "S/ " + Number(n || 0).toFixed(2);
  }

  function loadProducts() {
    try {
      var list = JSON.parse(localStorage.getItem("atlas-tactico-store-v1") || "[]");
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  function currentRoute() {
    var h = (location.hash || "#/").replace(/^#\/?/, "");
    return (h.split("/")[0] || "").toLowerCase();
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

    var thumbs =
      imgs.length > 1
        ? '<div class="admin-viewer-thumbs">' +
          imgs
            .map(function (src) {
              return '<img src="' + src + '" alt="" />';
            })
            .join("") +
          "</div>"
        : "";

    var variantHtml = "";
    if (variants.length) {
      variantHtml =
        '<p class="subtle" style="margin-top:0.75rem">Variantes / stock</p><div class="admin-viewer-variants">' +
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

    var overlay = document.createElement("div");
    overlay.className = "modal";
    overlay.setAttribute("data-admin-viewer", "");
    overlay.innerHTML =
      '<div class="admin-viewer-card" role="dialog" aria-modal="true">' +
      '<div class="admin-viewer-head">' +
      '<div><p class="kicker">Consulta</p>' +
      '<h2 style="margin-top:0.25rem;font-size:1.55rem">' +
      (p.name || "Producto") +
      "</h2></div>" +
      '<button type="button" class="btn outline" data-admin-viewer-close>Cerrar</button>' +
      "</div>" +
      '<div class="admin-viewer-grid">' +
      '<div class="admin-viewer-media">' +
      (main
        ? '<img class="main" src="' + main + '" alt="" />'
        : '<div class="admin-viewer-placeholder">Sin imagen</div>') +
      thumbs +
      "</div>" +
      '<div class="admin-viewer-info">' +
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
        ? '<p class="muted admin-viewer-desc">' + p.description + "</p>"
        : "") +
      variantHtml +
      "</div>" +
      "</div>" +
      "</div>";
    overlay.addEventListener("click", function (ev) {
      if (ev.target === overlay || ev.target.closest("[data-admin-viewer-close]")) {
        closeAdminViewer();
      }
    });
    document.body.appendChild(overlay);
  }

  function injectAdminCss() {
    if (document.getElementById("lead-admin-css")) return;
    var st = document.createElement("style");
    st.id = "lead-admin-css";
    st.textContent =
      "[data-admin-form]{display:none!important}" +
      "[data-admin-notice]{margin:1rem 0 1.25rem}" +
      ".admin-viewer-card{width:min(56rem,96vw);max-height:min(92svh,44rem);overflow:auto;background:var(--surface,#141611);border-radius:1rem;padding:1.15rem 1.25rem 1.2rem;box-shadow:0 18px 40px rgba(0,0,0,.45)}" +
      ".admin-viewer-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:.85rem}" +
      ".admin-viewer-grid{display:grid;gap:1.15rem;grid-template-columns:1fr}" +
      "@media (min-width:640px){.admin-viewer-grid{grid-template-columns:minmax(0,1.05fr) minmax(0,1.2fr);align-items:start}}" +
      ".admin-viewer-media{min-width:0}" +
      ".admin-viewer-card img.main{width:100%;max-height:min(22rem,50vh);object-fit:contain;border-radius:.6rem;background:var(--elevated,#1c1f18);margin:0}" +
      ".admin-viewer-placeholder{display:grid;place-items:center;min-height:12rem;border-radius:.6rem;background:var(--elevated,#1c1f18);color:var(--muted,#9b9c90)}" +
      ".admin-viewer-info{min-width:0}" +
      ".admin-viewer-meta{display:grid;gap:.15rem .75rem;grid-template-columns:1fr;font-size:.92rem}" +
      "@media (min-width:480px){.admin-viewer-meta{grid-template-columns:1fr 1fr}}" +
      ".admin-viewer-meta div{display:flex;justify-content:space-between;gap:.5rem;padding:.45rem 0;border-top:1px solid var(--border,#2a2d24)}" +
      ".admin-viewer-meta div:first-child,.admin-viewer-meta div:nth-child(2){border-top:0}" +
      "@media (max-width:479px){.admin-viewer-meta div:nth-child(2){border-top:1px solid var(--border,#2a2d24)}}" +
      ".admin-viewer-desc{margin-top:.85rem;line-height:1.45}" +
      ".admin-viewer-variants{margin-top:.35rem;display:grid;gap:.35rem;grid-template-columns:1fr}" +
      "@media (min-width:480px){.admin-viewer-variants{grid-template-columns:1fr 1fr}}" +
      "@media (min-width:900px){.admin-viewer-variants{grid-template-columns:1fr 1fr 1fr}}" +
      ".admin-viewer-thumbs{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.65rem}" +
      ".admin-viewer-thumbs img{width:3.5rem;height:3.5rem;object-fit:cover;border-radius:.4rem}";
    document.head.appendChild(st);
  }

  function polishAdminModal() {
    if (currentRoute() !== "admin") {
      closeAdminViewer();
      return;
    }
    injectAdminCss();
    var form = document.querySelector("[data-admin-form]");
    if (form) {
      form.hidden = true;
      form.style.display = "none";
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
    document.querySelectorAll("[data-edit], [data-view]").forEach(function (btn) {
      if (btn.dataset.modalBound) return;
      btn.dataset.modalBound = "1";
      var id = btn.getAttribute("data-view") || btn.getAttribute("data-edit");
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

  function afterCore() {
    injectAdminCss();
    var root = document.querySelector("#app");
    if (root) {
      new MutationObserver(function () {
        polishAdminModal();
      }).observe(root, { childList: true, subtree: true });
    }
    polishAdminModal();
    window.addEventListener("hashchange", function () {
      setTimeout(polishAdminModal, 50);
    });
  }

  function loadCore(url, isFallback) {
    var s = document.createElement("script");
    s.src = url;
    s.onload = afterCore;
    s.onerror = function () {
      if (!isFallback) loadCore(CORE_FALLBACK, true);
      else {
        var app = document.querySelector("#app");
        if (app)
          app.innerHTML =
            '<div class="wrap" style="padding:2rem;color:#ecebe3"><h1>Error cargando la app</h1><p>Recarga la página.</p></div>';
      }
    };
    document.body.appendChild(s);
  }

  loadCore(CORE, false);
})();
