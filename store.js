const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'store.json');

function load() {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return { users: [], notes: [] }; }
}
function save(data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }
module.exports = { load, save };
