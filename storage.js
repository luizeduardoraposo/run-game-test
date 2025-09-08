// storage.js - Persistência de Q-table, highscore e games em Node.js puro
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'qtable.json');

function loadData() {
  if (fs.existsSync(FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      return {
        Q: data.qtable || data.Q || {},
        meta: data.meta || { highscore: 0, games: 1 }
      };
    } catch (e) {
      return { Q: {}, meta: { highscore: 0, games: 1 } };
    }
  }
  return { Q: {}, meta: { highscore: 0, games: 1 } };
}

function saveData(Q, meta) {
  fs.writeFileSync(FILE, JSON.stringify({ qtable: Q, meta }, null, 2), 'utf8');
}

module.exports = { loadData, saveData };
