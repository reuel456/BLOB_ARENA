
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const WORLD = 3000;
const players = {};
const foods = [];

const colors = [
  "#35e6ff", "#ff5252", "#69f0ae",
  "#ffca28", "#e040fb", "#ff80ab"
];

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

function randomPosition() {
  return Math.random() * (WORLD - 200) + 100;
}

function createFood(x, y, color) {
  return {
    x: x ?? randomPosition(),
    y: y ?? randomPosition(),
    radius: 7,
    color: color || colors[Math.floor(Math.random() * colors.length)]
  };
}

for (let i = 0; i < 400; i++) {
  foods.push(createFood());
}

function createPlayer(socket, name) {
  return {
    id: socket.id,
    name: String(name || "Jogador").slice(0, 15),
    color: colors[Math.floor(Math.random() * colors.length)],
    cells: [{
      x: 1500,
      y: 1500,
      radius: 30
    }],
    dx: 0,
    dy: 0,
    ejecting: false,
    lastEject: 0,
    powerUntil: 0,
    lastPower: 0
  };
}

function splitPlayer(player, targetCount) {
  while (player.cells.length < targetCount) {
    const largest = [...player.cells]
      .sort((a, b) => b.radius - a.radius)[0];

    if (!largest || largest.radius < 20) break;

    const directionLength = Math.hypot(player.dx, player.dy) || 1;
    const dx = player.dx / directionLength;
    const dy = player.dy / directionLength;

    const newRadius = largest.radius / Math.sqrt(2);

    largest.radius = newRadius;

    player.cells.push({
      x: Math.max(20, Math.min(WORLD - 20,
        largest.x + dx * newRadius * 2)),
      y: Math.max(20, Math.min(WORLD - 20,
        largest.y + dy * newRadius * 2)),
      radius: newRadius
    });
  }
}

io.on("connection", (socket) => {
  console.log("Conectou:", socket.id);

  socket.on("join", (name) => {
    players[socket.id] = createPlayer(socket, name);
    console.log("Entrou:", players[socket.id].name);
  });

  socket.on("input", (direction) => {
    const player = players[socket.id];
    if (!player || !direction) return;

    let dx = Number(direction.dx);
    let dy = Number(direction.dy);

    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;

    const length = Math.hypot(dx, dy);

    if (length > 1) {
      dx /= length;
      dy /= length;
    }

    player.dx = dx;
    player.dy = dy;
  });

  socket.on("action", (action) => {
    const player = players[socket.id];
    if (!player || !action) return;

    if (action.type === "split") {
      const count = Math.max(1, Math.min(16, Number(action.count) || 2));
      splitPlayer(player, count);
    }

    if (action.type === "eject") {
      player.ejecting = Boolean(action.active);
    }

    if (action.type === "power") {
      const now = Date.now();

      if (now - player.lastPower >= 6000) {
        player.lastPower = now;
        player.powerUntil = now + 2000;
      }
    }
  });

  socket.on("quickChat", (message) => {
    const player = players[socket.id];
    if (!player) return;

    const allowed = [
      "Olá!",
      "Vamos jogar!",
      "Boa partida!",
      "Estou crescendo!",
      "Cuidado!",
      "Boa!"
    ];

    if (allowed.includes(message)) {
      io.emit("quickChat", {
        id: socket.id,
        name: player.name,
        message
      });
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    console.log("Saiu:", socket.id);
  });
});

setInterval(() => {
  const now = Date.now();

  for (const player of Object.values(players)) {
    const powered = now < player.powerUntil;
    const speed = Math.max(1.2, 4 - player.cells[0].radius / 50)
      * (powered ? 1.8 : 1);

    for (const cell of player.cells) {
      cell.x += player.dx * speed;
      cell.y += player.dy * speed;

      cell.x = Math.max(cell.radius,
        Math.min(WORLD - cell.radius, cell.x));

      cell.y = Math.max(cell.radius,
        Math.min(WORLD - cell.radius, cell.y));

      for (let i = 0; i < foods.length; i++) {
        const food = foods[i];

        if (Math.hypot(cell.x - food.x, cell.y - food.y)
          < cell.radius + food.radius) {
          cell.radius += 0.35;
          foods[i] = createFood();
        }
      }
    }

    // Ejetar massa enquanto W estiver pressionado
    if (player.ejecting && now - player.lastEject > 180) {
      player.lastEject = now;

      const cell = [...player.cells]
        .sort((a, b) => b.radius - a.radius)[0];

      if (cell && cell.radius > 22) {
        const length = Math.hypot(player.dx, player.dy) || 1;
        const dx = player.dx / length;
        const dy = player.dy / length;

        cell.radius = Math.sqrt(cell.radius * cell.radius - 20);

        foods.push(createFood(
          cell.x + dx * (cell.radius + 12),
          cell.y + dy * (cell.radius + 12),
          player.color
        ));
      }
    }
  }

  // Colisão entre jogadores
  const allCells = [];

  for (const player of Object.values(players)) {
    for (const cell of player.cells) {
      allCells.push({ player, cell });
    }
  }

  const eaten = new Set();

  for (let i = 0; i < allCells.length; i++) {
    for (let j = i + 1; j < allCells.length; j++) {
      const a = allCells[i];
      const b = allCells[j];

      if (a.player.id === b.player.id) continue;
      if (eaten.has(a.cell) || eaten.has(b.cell)) continue;

      const distance = Math.hypot(
        a.cell.x - b.cell.x,
        a.cell.y - b.cell.y
      );

      if (distance < a.cell.radius * 0.7 &&
          a.cell.radius > b.cell.radius * 1.15) {
        a.cell.radius = Math.sqrt(
          a.cell.radius ** 2 + b.cell.radius ** 2
        );
        eaten.add(b.cell);
      } else if (distance < b.cell.radius * 0.7 &&
          b.cell.radius > a.cell.radius * 1.15) {
        b.cell.radius = Math.sqrt(
          a.cell.radius ** 2 + b.cell.radius ** 2
        );
        eaten.add(a.cell);
      }
    }
  }

  for (const player of Object.values(players)) {
    player.cells = player.cells.filter(cell => !eaten.has(cell));

    if (player.cells.length === 0) {
      player.cells = [{
        x: 1500,
        y: 1500,
        radius: 30
      }];
    }
  }

  // Enviar estado da arena
  const visiblePlayers = [];

  for (const player of Object.values(players)) {
    for (let i = 0; i < player.cells.length; i++) {
      const cell = player.cells[i];

      visiblePlayers.push({
        id: player.id,
        cellId: i,
        name: player.name,
        color: player.color,
        x: cell.x,
        y: cell.y,
        radius: cell.radius,
        power: now < player.powerUntil
      });
    }
  }

  io.emit("state", {
    players: visiblePlayers,
    foods
  });
}, 1000 / 30);

server.listen(3000, () => {
  console.log("BLOB ARENA INICIADO!");
  console.log("http://localhost:3000");
});
