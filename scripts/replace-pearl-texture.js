const fs = require("fs");
const path = require("path");

const indexPath = path.join(__dirname, "..", "index.html");
let html = fs.readFileSync(indexPath, "utf8");

const replacement =
  '      --real-pearl-texture: url("assets/ui/buttons/textures/pearl-mother-of-pearl.png");';
const re = /--real-pearl-texture:\s*url\("data:image[^"]+"\);/;

if (!re.test(html)) {
  console.error("Pattern not found for --real-pearl-texture base64");
  process.exit(1);
}

html = html.replace(re, replacement);
fs.writeFileSync(indexPath, html, "utf8");
console.log("Replaced base64 texture with PNG path");
console.log("New file size:", fs.statSync(indexPath).size);
