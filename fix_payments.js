const fs = require('fs');

let payments = fs.readFileSync('admin/src/pages/Payments.jsx', 'utf8');
payments = payments.replace("await axios.post(/api/admin/+type+/+id+/+action);", "await axios.post(/api/admin/ + type + / + id + / + action);");
fs.writeFileSync('admin/src/pages/Payments.jsx', payments);
console.log("Fixed Payments.jsx");
