
const socket = io();

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

let players = [];
let foods = [];
let myId = null;
let playing = false;
let paused = false;
let showMinimap = true;
let zoom = 1;

const camera = { x: 0, y: 0 };
const mouse = { x: 0, y: 0 };

const WORLD = 3000;

const quickMessages = {
  "1": "Olá!",
  "2": "Vamos jogar!",
  "3": "Boa partida!",
  "4": "Estou crescendo!",
  "5": "Cuidado!",
  "6": "Boa!"
};

let toast = "";
let toastUntil = 0;

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}

resize();
window.addEventListener("resize", resize);

socket.on("connect", () => {
  document.querySelector("#status").textContent =
    "Conectado ao servidor!";
});

socket.on("disconnect", () => {
  document.querySelector("#status").textContent =
    "Conexão perdida!";
});

document.querySelector("#playButton").addEventListener("click", () => {
  if (!socket.connected) {
    document.querySelector("#status").textContent =
      "Aguarde a conexão!";
    return;
  }

  const name =
    document.querySelector("#playerName").value.trim() || "Jogador";

  socket.emit("join", name);

  document.querySelector("#menu").style.display = "none";
  document.querySelector("#hud").style.display = "block";
  canvas.style.display = "block";

  playing = true;
  requestAnimationFrame(loop);
});

socket.on("state", (state) => {
  players = state.players;
  foods = state.foods;
  myId = socket.id;
});

socket.on("quickChat", (data) => {
  toast = data.name + ": " + data.message;
  toastUntil = Date.now() + 2500;
});

canvas.addEventListener("mousemove", (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
});

canvas.addEventListener("wheel", (event) => {
  event.preventDefault();

  zoom -= event.deltaY * 0.001;
  zoom = Math.max(0.5, Math.min(1.5, zoom));
}, { passive: false });

// CONTROLES DO TECLADO
document.addEventListener("keydown", (event) => {
  if (!playing) return;

  if (event.code === "Space") {
    event.preventDefault();

    if (!event.repeat && !paused) {
      const myCells = players.filter(p => p.id === myId);
      socket.emit("action", {
        type: "split",
        count: Math.min(16, myCells.length + 1)
      });
    }
  }

  if (event.key.toLowerCase() === "q" && !event.repeat && !paused) {
    const myCells = players.filter(p => p.id === myId);

    socket.emit("action", {
      type: "split",
      count: Math.min(16, myCells.length * 2)
    });
  }

  if (event.key.toLowerCase() === "e" && !event.repeat && !paused) {
    socket.emit("action", {
      type: "split",
      count: 16
    });
  }

  if (event.key.toLowerCase() === "w" && !event.repeat && !paused) {
    socket.emit("action", {
      type: "eject",
      active: true
    });
  }

  if (event.key.toLowerCase() === "f" && !event.repeat && !paused) {
    socket.emit("action", {
      type: "power"
    });

    toast = "PODER ATIVADO!";
    toastUntil = Date.now() + 1500;
  }

  if (event.key.toLowerCase() === "m" && !event.repeat) {
    showMinimap = !showMinimap;
  }

  if (event.key === "Escape" && !event.repeat) {
    paused = !paused;
  }

  if (quickMessages[event.key] && !event.repeat && !paused) {
    socket.emit("quickChat", quickMessages[event.key]);
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key.toLowerCase() === "w") {
    socket.emit("action", {
      type: "eject",
      active: false
    });
  }
});

window.addEventListener("blur", () => {
  socket.emit("action", {
    type: "eject",
    active: false
  });
});

// ENVIAR MOVIMENTO
function sendMovement() {
  if (paused) {
    socket.emit("input", { dx: 0, dy: 0 });
    return;
  }

  const dx = (mouse.x - canvas.width / 2) / zoom;
  const dy = (mouse.y - canvas.height / 2) / zoom;
  const distance = Math.hypot(dx, dy);

  socket.emit("input", {
    dx: distance > 5 ? dx / distance : 0,
    dy: distance > 5 ? dy / distance : 0
  });
}

// CÂMERA
function updateCamera() {
  const myCells = players.filter(p => p.id === myId);

  if (myCells.length === 0) return;

  const me = [...myCells].sort(
    (a, b) => b.radius - a.radius
  )[0];

  camera.x = me.x - canvas.width / (2 * zoom);
  camera.y = me.y - canvas.height / (2 * zoom);
}

// MAPA
function drawGrid() {
  const grid = 50;
  const left = camera.x;
  const top = camera.y;
  const right = left + canvas.width / zoom;
  const bottom = top + canvas.height / zoom;

  ctx.strokeStyle = "#ffffff12";
  ctx.lineWidth = 1 / zoom;

  for (let x = Math.floor(left / grid) * grid; x < right; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
  }

  for (let y = Math.floor(top / grid) * grid; y < bottom; y += grid) {
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }
}

// COMIDA
function drawFood(food) {
  ctx.beginPath();
  ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
  ctx.fillStyle = food.color;
  ctx.fill();
}

// JOGADORES
function drawPlayer(player) {
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.fill();

  ctx.strokeStyle = player.power ? "#ffffff" : "#ffffffaa";
  ctx.lineWidth = player.power ? 5 : 3;
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(player.name, player.x, player.y);
}

// MINIMAPA
function drawMinimap() {
  if (!showMinimap) return;

  const width = 150;
  const height = 150;
  const x = canvas.width - width - 20;
  const y = canvas.height - height - 20;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.fillStyle = "#07111ddd";
  ctx.fillRect(x, y, width, height);

  ctx.strokeStyle = "#ffffffaa";
  ctx.strokeRect(x, y, width, height);

  for (const player of players) {
    const px = x + player.x / WORLD * width;
    const py = y + player.y / WORLD * height;

    ctx.beginPath();
    ctx.arc(px, py, player.id === myId ? 4 : 2.5, 0, Math.PI * 2);
    ctx.fillStyle = player.id === myId ? "#35e6ff" : player.color;
    ctx.fill();
  }

  ctx.fillStyle = "white";
  ctx.font = "11px Arial";
  ctx.textAlign = "center";
  ctx.fillText("MINIMAPA", x + width / 2, y - 7);

  ctx.restore();
}

// RANKING
function updateRanking() {
  const totals = {};

  for (const player of players) {
    if (!totals[player.id]) {
      totals[player.id] = {
        name: player.name,
        mass: 0
      };
    }

    totals[player.id].mass += player.radius * player.radius;
  }

  const ranking = Object.values(totals)
    .sort((a, b) => b.mass - a.mass);

  document.querySelector("#leaderboard").innerHTML =
    "<b>JOGADORES</b><br>" +
    ranking.slice(0, 5).map((p, i) =>
      `${i + 1}. ${p.name}`
    ).join("<br>");
}

// MENSAGENS E PAUSA
function drawOverlay() {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (toast && Date.now() < toastUntil) {
    ctx.fillStyle = "#000b";
    ctx.fillRect(canvas.width / 2 - 150, 30, 300, 45);

    ctx.fillStyle = "white";
    ctx.font = "bold 17px Arial";
    ctx.textAlign = "center";
    ctx.fillText(toast, canvas.width / 2, 58);
  }

  if (paused) {
    ctx.fillStyle = "#0009";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PAUSADO", canvas.width / 2, canvas.height / 2);

    ctx.font = "18px Arial";
    ctx.fillText("Aperte ESC para continuar",
      canvas.width / 2, canvas.height / 2 + 40);
  }

  ctx.restore();
}

// LOOP PRINCIPAL
function loop() {
  if (!playing) return;

  if (!paused) {
    sendMovement();
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updateCamera();

  ctx.setTransform(
    zoom, 0, 0, zoom,
    -camera.x * zoom,
    -camera.y * zoom
  );

  drawGrid();

  for (const food of foods) {
    drawFood(food);
  }

  for (const player of players) {
    drawPlayer(player);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  updateRanking();
  drawMinimap();
  drawOverlay();

  requestAnimationFrame(loop);
}
document.querySelector("#controls").style.display = "block";