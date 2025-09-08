// train_ai.js - Treinador de IA para Node.js (simulação sem renderização)
const { aiStep, getMeta, setMeta, getQTable, setQTable } = require('./ai_agent');
const { saveData } = require('./storage');

// Parâmetros do ambiente simulado
const lanes = [-2, 0, 2];
const NUM_LANES = 3;
const NUM_OBSTACLES = 10;
const NUM_COINS = 10;
// Treinamento sem limite de partidas (loop infinito)
// const MAX_PARTIDAS = 10000; // Número de partidas de treino
const MAX_STEPS = 500; // Passos por partida

function randomLane() {
  return lanes[Math.floor(Math.random() * NUM_LANES)];
}

function resetGame() {
  return {
    player: { position: { x: 0, z: 0 } },
    obstacles: Array.from({ length: NUM_OBSTACLES }, (_, i) => ({
      position: { x: randomLane(), z: -20 - i * 20 }
    })),
    coins: Array.from({ length: NUM_COINS }, (_, i) => ({
      position: { x: randomLane(), z: -10 - i * 20 }
    })),
    score: 0,
    lane: 1
  };
}

function step(state, action) {
  // Atualiza lane
  if (action === 0 && state.lane > 0) state.lane--;
  if (action === 2 && state.lane < 2) state.lane++;
  state.player.position.x = lanes[state.lane];

  // Move obstáculos e moedas
  let reward = 0;
  let gameOver = false;
  for (let obs of state.obstacles) {
    obs.position.z += 0.2;
    if (obs.position.z > 2) {
      obs.position.z -= 200;
      obs.position.x = randomLane();
    }
    if (Math.abs(obs.position.z - state.player.position.z) < 1.2 && Math.abs(obs.position.x - state.player.position.x) < 0.9) {
      reward = -10;
      gameOver = true;
    }
  }
  for (let coin of state.coins) {
    coin.position.z += 0.2;
    if (coin.position.z > 2) {
      coin.position.z -= 200;
      coin.position.x = randomLane();
    }
    if (
      Math.abs(coin.position.z - state.player.position.z) < 1.2 &&
      Math.abs(coin.position.x - state.player.position.x) < 0.9
    ) {
      reward = 1;
      state.score++;
      coin.position.z -= 200;
      coin.position.x = randomLane();
    }
  }
  return { reward, gameOver };
}

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function std(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}
function min(arr) {
  return Math.min(...arr);
}
function max(arr) {
  return Math.max(...arr);
}

function train() {
  let { highscore, games } = getMeta();
  const block = 1000;
  let scores = [];
  let partida = 0;
  while (true) {
    if ((partida + 1) % 100 === 0) {
      console.log(`Partida ${partida + 1} em andamento...`);
    }
    let state = resetGame();
    let steps = 0;
    let done = false;
    while (!done && steps < MAX_STEPS) {
      const reward = 0; // reward será atualizado no step
      const action = aiStep(state.player, state.obstacles, state.coins, reward, false);
      const { reward: r, gameOver } = step(state, action);
      aiStep(state.player, state.obstacles, state.coins, r, gameOver);
      done = gameOver;
      steps++;
    }
    if (state.score > highscore) highscore = state.score;
    games++;
    scores.push(state.score);
    // Salva progresso imediatamente a cada partida
    setMeta({ highscore, games });
    saveData(getQTable(), getMeta());
    if ((partida + 1) % block === 0) {
      console.log(`Partidas ${partida + 2 - block} a ${partida + 1}: Média = ${mean(scores).toFixed(2)}, Máx = ${max(scores)}, Mín = ${min(scores)}, Desvio = ${std(scores).toFixed(2)}, Recorde = ${highscore}, Partidas = ${games}`);
      scores = [];
    }
    partida++;
  }
}

console.log('Iniciando treino da IA...');
train();
