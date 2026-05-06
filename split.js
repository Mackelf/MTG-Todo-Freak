const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Extraer el CSS
const styleRegex = /<style>([\s\S]*?)<\/style>/;
const styleMatch = html.match(styleRegex);
if (styleMatch) {
    fs.writeFileSync(path.join(__dirname, 'style.css'), styleMatch[1].trim() + '\n');
}

// Extraer el JS
const scriptRegex = /<script>([\s\S]*?)<\/script>/;
const scriptMatch = html.match(scriptRegex);
if (scriptMatch) {
    fs.writeFileSync(path.join(__dirname, 'app.js'), scriptMatch[1].trim() + '\n');
}

// Reemplazar en el HTML
let newHtml = html.replace(styleRegex, '<link rel="stylesheet" href="style.css" />');
newHtml = newHtml.replace(scriptRegex, '<script src="app.js"></script>');

fs.writeFileSync(indexPath, newHtml);

console.log("Separación completada con éxito.");
