// Run Infinito 3D - Esqueleto básico
// Integração com IA via window.aiAgent (browser)
let scene, camera, renderer, player, ground, obstacles = [], coins = [], score = 0;
let highscore = 0, games = 1;
let speed = 0.2, lane = 1, lanes = [-2, 0, 2], isJumping = false, jumpSpeed = 0, gravity = 0.01;

function init() {
  // Carrega meta da IA se disponível
  if (window.aiAgent && window.aiAgent.getMeta) {
    const meta = window.aiAgent.getMeta();
    if (meta) {
      highscore = meta.highscore || 0;
      games = meta.games || 1;
    }
  }
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222233);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Luz
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, 10, 10);
  scene.add(light);

  // Chão
  const groundGeo = new THREE.BoxGeometry(10, 1, 200);
  const groundMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
  ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -1;
  ground.position.z = -90;
  scene.add(ground);

  // Jogador
  const playerGeo = new THREE.BoxGeometry(1, 2, 1);
  const playerMat = new THREE.MeshPhongMaterial({ color: 0x00ffcc });
  player = new THREE.Mesh(playerGeo, playerMat);
  player.position.y = 1;
  scene.add(player);

  // Obstáculos e moedas iniciais
  for (let i = 0; i < 10; i++) {
    spawnObstacle(i * -20 - 20);
    spawnCoin(i * -20 - 10);
  }

  // document.addEventListener('keydown', onKeyDown); // Desabilita controle manual
  window.addEventListener('resize', onWindowResize);
  animate();
}

function spawnObstacle(z) {
  const geo = new THREE.BoxGeometry(1, 2, 1);
  const mat = new THREE.MeshPhongMaterial({ color: 0xff3333 });
  const obs = new THREE.Mesh(geo, mat);
  obs.position.x = lanes[Math.floor(Math.random() * 3)];
  obs.position.y = 1;
  obs.position.z = z;
  scene.add(obs);
  obstacles.push(obs);
}

function spawnCoin(z) {
  const geo = new THREE.SphereGeometry(0.5, 16, 16);
  const mat = new THREE.MeshPhongMaterial({ color: 0xffff00 });
  const coin = new THREE.Mesh(geo, mat);
  coin.position.x = lanes[Math.floor(Math.random() * 3)];
  coin.position.y = 2;
  coin.position.z = z;
  scene.add(coin);
  coins.push(coin);
}

function onKeyDown(e) {
  if (e.code === 'ArrowLeft' && lane > 0) lane--;
  if (e.code === 'ArrowRight' && lane < 2) lane++;
  if (e.code === 'Space' && !isJumping) {
    isJumping = true;
    jumpSpeed = 0.2;
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}


// IA: importa o agente

function animate() {
  requestAnimationFrame(animate);

  // Recompensa: +1 por moeda, -10 por colisão, 0 caso contrário
  let reward = 0;
  let gameOver = false;

  // Movimento dos obstáculos e moedas
  for (let obs of obstacles) {
    obs.position.z += speed;
    if (obs.position.z > camera.position.z + 2) {
      obs.position.z -= 200;
      obs.position.x = lanes[Math.floor(Math.random() * 3)];
    }
    // Colisão
    if (Math.abs(obs.position.z - player.position.z) < 1.2 && Math.abs(obs.position.x - player.position.x) < 0.9) {
      reward = -10;
      gameOver = true;
    }
  }
  for (let coin of coins) {
    coin.position.z += speed;
    if (coin.position.z > camera.position.z + 2) {
      coin.position.z -= 200;
      coin.position.x = lanes[Math.floor(Math.random() * 3)];
    }
    // Coleta
    if (
      Math.abs(coin.position.z - player.position.z) < 1.2 &&
      Math.abs(coin.position.x - player.position.x) < 0.9
    ) {
      reward = 1;
      score++;
      // Atualiza highscore
      if (score > highscore) {
        highscore = score;
        if (window.aiAgent && window.aiAgent.setMeta) window.aiAgent.setMeta({ highscore, games });
      }
      coin.position.z -= 200;
      coin.position.x = lanes[Math.floor(Math.random() * 3)];
    }
  }

  // Chama a IA para decidir ação
  let action = window.aiAgent.aiStep(player, obstacles, coins, reward, gameOver);
  // Executa ação
  if (action === 0 && lane > 0) lane--;
  if (action === 2 && lane < 2) lane++;
  // Movimento do jogador
  player.position.x += (lanes[lane] - player.position.x) * 0.2;

  if (gameOver) {
    // Reinicia o jogo
    for (let i = 0; i < obstacles.length; i++) {
      obstacles[i].position.z = -20 - i * 20;
      obstacles[i].position.x = lanes[Math.floor(Math.random() * 3)];
    }
    for (let i = 0; i < coins.length; i++) {
      coins[i].position.z = -10 - i * 20;
      coins[i].position.x = lanes[Math.floor(Math.random() * 3)];
    }
    player.position.x = 0;
    player.position.y = 1;
    lane = 1;
    if (score > highscore) {
      highscore = score;
    }
    games++;
    if (window.aiAgent && window.aiAgent.setMeta) window.aiAgent.setMeta({ highscore, games });
    score = 0;
    // Pequeno delay para evitar múltiplos resets
    setTimeout(() => { }, 200);
  }

  renderer.render(scene, camera);
}

// Inicializa normalmente, IA já estará disponível se index.html carregar ai_agent.js antes
init();
