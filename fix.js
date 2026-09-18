const fs = require('fs');

let tasks = fs.readFileSync('admin/src/pages/Tasks.jsx', 'utf8');
tasks = tasks.replace("await axios.put(/api/admin/tasks/${task.id}/status, { status: newStatus });", "await axios.put(/api/admin/tasks/ + task.id + /status, { status: newStatus });");
tasks = tasks.replace("await axios.delete(/api/admin/tasks/${id});", "await axios.delete(/api/admin/tasks/ + id);");
tasks = tasks.replace("await axios.put(/api/admin/tasks/ + task.id + /status", "await axios.put(/api/admin/tasks/ + task.id + /status");
tasks = tasks.replace("await axios.delete(/api/admin/tasks/);", "await axios.delete(/api/admin/tasks/ + id);");
fs.writeFileSync('admin/src/pages/Tasks.jsx', tasks);

let promos = fs.readFileSync('admin/src/pages/Promos.jsx', 'utf8');
promos = promos.replace("await axios.put(/api/admin/promos/${promo.id}/status, { status: newStatus });", "await axios.put(/api/admin/promos/ + promo.id + /status, { status: newStatus });");
promos = promos.replace("await axios.delete(/api/admin/promos/${id}`);", "await axios.delete(/api/admin/promos/ + id);");
fs.writeFileSync('admin/src/pages/Promos.jsx', promos);
