// IA simples baseada em Q-Learning para endless runner 3D
// Esta IA toma decisões automáticas para desviar de obstáculos e coletar moedas
// Não utiliza pulo, apenas troca de faixa

// Parâmetros do ambiente
const NUM_LANES = 3;

// Q-Learning
const ACTIONS = ['left', 'stay', 'right']; // 0: esquerda, 1: manter, 2: direita
const ALPHA = 0.1; // taxa de aprendizado
const GAMMA = 0.9; // fator de desconto
const EPSILON = 0.1; // exploração

// Q-table: estado -> ação
let Q = {};
let meta = { highscore: 0, games: 1 };

// File System Access API helpers
let fileHandle = null;
async function loadQTableFS() {
  if (!('showOpenFilePicker' in window)) return false;
  try {
    // Tenta abrir qtable.json automaticamente se já foi autorizado
    const opts = {
      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
      excludeAcceptAllOption: true,
      multiple: false
    };
    // Tenta recuperar handle salvo
    const saved = localStorage.getItem('qtable_handle');
    if (saved) {
      fileHandle = await window.showOpenFilePicker({ ...opts, startIn: 'documents' }).then(files => files[0]);
    } else {
      // Solicita ao usuário na primeira vez
      fileHandle = await window.showSaveFilePicker({ ...opts, suggestedName: 'qtable.json' });
      localStorage.setItem('qtable_handle', '1');
    }
    const file = await fileHandle.getFile();
    const text = await file.text();
    Q = JSON.parse(text);
    return true;
  } catch (e) { return false; }
}

async function saveQTableFS() {
  if (!fileHandle) return false;
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(Q));
    await writable.close();
    return true;
  } catch (e) { return false; }
}

// Inicialização: tenta File System Access, depois localStorage, depois vazio
(async function initQTable() {
  let loaded = false;
  if ('showOpenFilePicker' in window) {
    loaded = await loadQTableFS();
  }
  if (!loaded) {
    try {
      const qstr = localStorage.getItem('qtable');
      if (qstr) {
        const obj = JSON.parse(qstr);
        if (obj && obj.Q && obj.meta) {
          Q = obj.Q;
          meta = obj.meta;
        } else if (obj && !obj.Q) {
          Q = obj;
        }
      }
    } catch (e) { Q = {}; }
  }
})();

// Função para discretizar o estado do jogo
function getState(player, obstacles, coins) {
  // Estado: [lane, dist_obs_0, dist_obs_1, dist_obs_2, dist_coin_0, dist_coin_1, dist_coin_2]
  const lanes = (typeof window !== 'undefined' && window.lanes) ? window.lanes : [-2, 0, 2];
  let lane = lanes.indexOf(Math.round(player.position.x));
  let dist_obs = [10, 10, 10];
  let dist_coin = [10, 10, 10];
  for (let i = 0; i < NUM_LANES; i++) {
    let minObsDist = 10;
    for (let obs of obstacles) {
      if (Math.abs(obs.position.x - lanes[i]) < 0.1) {
        let dz = obs.position.z - player.position.z;
        if (dz > 0 && dz < minObsDist) minObsDist = dz;
      }
    }
    dist_obs[i] = Math.round(minObsDist * 10) / 10; // arredonda para 1 casa decimal
    let minCoinDist = 10;
    for (let coin of coins) {
      if (Math.abs(coin.position.x - lanes[i]) < 0.1) {
        let dz = coin.position.z - player.position.z;
        if (dz > 0 && dz < minCoinDist) minCoinDist = dz;
      }
    }
    dist_coin[i] = Math.round(minCoinDist * 10) / 10;
  }
  return `${lane}|${dist_obs.join(',')}|${dist_coin.join(',')}`;
}

// Escolhe ação com epsilon-greedy
function chooseAction(state) {
  if (Math.random() < EPSILON || !Q[state]) {
    return Math.floor(Math.random() * ACTIONS.length);
  }
  let qvals = Q[state];
  let maxQ = Math.max(...qvals);
  let bestActions = [];
  for (let i = 0; i < qvals.length; i++) {
    if (qvals[i] === maxQ) bestActions.push(i);
  }
  return bestActions[Math.floor(Math.random() * bestActions.length)];
}

// Atualiza Q-table
function updateQ(state, action, reward, nextState) {
  if (!Q[state]) Q[state] = [0, 0, 0];
  if (!Q[nextState]) Q[nextState] = [0, 0, 0];
  Q[state][action] = Q[state][action] + ALPHA * (reward + GAMMA * Math.max(...Q[nextState]) - Q[state][action]);
  // Salva Q-table no arquivo se possível, senão localStorage
  // No navegador, persistência é feita via localStorage ou upload/download manual
  try {
    localStorage.setItem('qtable', JSON.stringify({ Q, meta }));
  } catch (e) { }
}

// Função principal da IA (chame a cada frame)
let lastState = null, lastAction = null;
function aiStep(player, obstacles, coins, reward, gameOver) {
  let state = getState(player, obstacles, coins);
  let action = chooseAction(state);
  if (lastState !== null && lastAction !== null) {
    updateQ(lastState, lastAction, reward, state);
  }
  lastState = state;
  lastAction = action;
  if (gameOver) {
    updateQ(state, action, reward, state); // reforço final
    lastState = null;
    lastAction = null;
  }
  // Executa ação
  return action;
}


// Exporta funções para uso no game.js (browser) e Node.js (treinamento)
if (typeof window !== 'undefined') {
  window.aiAgent = {
    aiStep,
    ACTIONS,
    getQTable: () => Q,
    setQTable: (data) => { Q = data || {}; },
    getMeta: () => meta,
    setMeta: (m) => { meta = m || { highscore: 0, games: 1 }; }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    aiStep,
    ACTIONS,
    getQTable: () => Q,
    setQTable: (data) => { Q = data || {}; },
    getMeta: () => meta,
    setMeta: (m) => { meta = m || { highscore: 0, games: 1 }; }
  };
}
