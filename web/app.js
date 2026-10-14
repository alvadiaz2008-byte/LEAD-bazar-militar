(function () {
  function loadText(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(url);
      return r.text();
    });
  }
  Promise.all([
    loadText("web/app.part1.js"),
    loadText("web/app.part2.js"),
  ])
    .then(function (parts) {
      var code = parts[0] + parts[1];
      var s = document.createElement("script");
      s.textContent = code;
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
