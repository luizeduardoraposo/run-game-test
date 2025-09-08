// Run Infinito 3D - Esqueleto básico
let scene, camera, renderer, player, ground, obstacles = [], coins = [], score = 0;
let speed = 0.2, lane = 0, lanes = [-2, 0, 2], isJumping = false, jumpSpeed = 0, gravity = 0.01;

function init() {
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

  document.addEventListener('keydown', onKeyDown);
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

function animate() {
  requestAnimationFrame(animate);

  // Movimento do jogador
  player.position.x += (lanes[lane] - player.position.x) * 0.2;
  if (isJumping) {
    player.position.y += jumpSpeed;
    jumpSpeed -= gravity;
    if (player.position.y <= 1) {
      player.position.y = 1;
      isJumping = false;
    }
  }

  // Movimento dos obstáculos e moedas
  for (let obs of obstacles) {
    obs.position.z += speed;
    if (obs.position.z > camera.position.z + 2) {
      obs.position.z -= 200;
      obs.position.x = lanes[Math.floor(Math.random() * 3)];
    }
    // Colisão
    if (Math.abs(obs.position.z - player.position.z) < 1.2 && Math.abs(obs.position.x - player.position.x) < 0.9 && player.position.y < 2) {
      alert('Game Over! Pontuação: ' + score);
      window.location.reload();
    }
  }
  for (let coin of coins) {
    coin.position.z += speed;
    if (coin.position.z > camera.position.z + 2) {
      coin.position.z -= 200;
      coin.position.x = lanes[Math.floor(Math.random() * 3)];
    }
    // Coleta
    if (Math.abs(coin.position.z - player.position.z) < 1.2 && Math.abs(coin.position.x - player.position.x) < 0.9 && player.position.y > 1) {
      score++;
      document.getElementById('score').textContent = 'Moedas: ' + score;
      coin.position.z -= 200;
      coin.position.x = lanes[Math.floor(Math.random() * 3)];
    }
  }

  renderer.render(scene, camera);
}

init();
