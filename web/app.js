(function () {
  function loadText(u) {
    return fetch(u, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(u + " " + r.status);
      return r.text();
    });
  }
  Promise.all([
    loadText("web/app.c0.js"),
    loadText("web/app.c1.js"),
    loadText("web/app.c2.js"),
    loadText("web/app.c3.js"),
    loadText("web/app.c4.js"),
  ])
    .then(function (parts) {
      var s = document.createElement("script");
      s.textContent = parts.join("");
      document.body.appendChild(s);
    })
    .catch(function (e) {
      console.error(e);
      var app = document.querySelector("#app");
      if (app)
        app.innerHTML =
          '<div class="wrap" style="padding:2rem;color:#ecebe3"><h1>Error cargando la app</h1><p>Recarga la página.</p></div>';
    });
})();
