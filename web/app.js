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

  /* PLACEHOLDER_REST - will fail if incomplete */
})();
