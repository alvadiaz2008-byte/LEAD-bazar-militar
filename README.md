# LEAD Bazar Militar

Catálogo web de ropa y equipo táctico para personal militar. Precios en soles (PEN).

La tienda pública en GitHub es el archivo [index.html](index.html). GitHub Pages la publica en:

**https://alvadiaz2008-byte.github.io/bold-mint-flora-garden/**

## Qué incluye

- Catálogo con filtros por categoría y búsqueda
- Ficha de producto (galería, tallas, colores, stock)
- Pedido con datos del comprador y dirección; al confirmar se abre WhatsApp (+51 955 802 712) con el mensaje y se descuenta el stock
- Panel de administrador (contraseña `589`) para editar prendas y el contador de unidades

## Archivos de la web (GitHub Pages)

```text
index.html       página que GitHub ejecuta
web/styles.css   diseño
web/app.js       catálogo, compra y administrador
web/products.js  prendas iniciales
imagenes/        fotos que subas a mano (luego pegas su URL en el admin)
```

No hace falta instalar Node para verla: GitHub Pages sirve esos archivos tal cual.

## Desarrollo local (opcional)

Si clonas el repositorio y quieres el servidor de desarrollo:

```bash
npm install
npm run dev
```
