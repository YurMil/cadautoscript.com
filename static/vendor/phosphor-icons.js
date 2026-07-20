// Self-hosted Phosphor icon fonts (v2.1.2). This used to inject stylesheets
// from cdn.jsdelivr.net, which the site's Content Security Policy blocks
// (style-src 'self') — icons silently disappeared in embedded utilities.
// Assets live in /vendor/phosphor/<weight>/; only the weights actually used
// by the utilities are shipped.
var head = document.getElementsByTagName("head")[0];

for (const weight of ["bold", "fill", "duotone"]) {
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = `/vendor/phosphor/${weight}/style.css`;
  head.appendChild(link);
}
