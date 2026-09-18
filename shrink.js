const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'admin/src/pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  let content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  
  // Reduce massive paddings
  content = content.replace(/p: 3/g, "p: 2.5");
  content = content.replace(/p: \{ xs: 3, md: 4 \}/g, "p: { xs: 2, md: 3 }");
  content = content.replace(/p: \{ xs: 4, sm: 5 \}/g, "p: { xs: 3, sm: 4 }");
  
  // Reduce massive margins
  content = content.replace(/mb: 4/g, "mb: 3");
  content = content.replace(/mb: 6/g, "mb: 4");
  content = content.replace(/mt: 5/g, "mt: 3");
  content = content.replace(/pt: 5/g, "pt: 3");
  content = content.replace(/mt: { xs: 2, md: 8 }/g, "mt: { xs: 2, md: 4 }");

  // Reduce gap
  content = content.replace(/gap: 4/g, "gap: 2");

  fs.writeFileSync(path.join(pagesDir, file), content);
});
console.log("Shrunk padding across all pages");
