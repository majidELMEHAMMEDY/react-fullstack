const express = require("express");
const app = express();
const httpServer = require("http").Server(app);
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const cors = require("cors");

app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3001"] }));

const PORT = process.env.PORT || 3001;
const MAX_SCORE = 10;

app.use(express.static("public"));

app.post("/join-game", (req, res) => {
  const gameId = req.body.gameId;
  res.send("Successfully joined game");
});

const games = {};

io.on("connection", (socket) => {
  socket.on("join-game", (gameId) => {
    socket.join(gameId);
    if (!games[gameId]) {
      games[gameId] = {
        players: {},
        dice: 0,
      };
    }
    games[gameId].players[socket.id] = {
      id: socket.id,
      score: 0,
      current: 0,
      active: false,
      winner: false,
    };
    const playerIds = Object.keys(games[gameId].players);
    if (playerIds.length === 1) {
      games[gameId].players[playerIds[0]].active = true;
      games[gameId].players[playerIds[0]].nome = "Player 1";
    } else if (playerIds.length === 2) {
      games[gameId].players[playerIds[1]].nome = "Player 2";
    } else {
      // Disconnect the third player
      socket.disconnect();
    }
    io.to(gameId).emit("update-game", games[gameId]);
  });

  socket.on("roll-dice", (gameId) => {
    if (games[gameId]?.players[socket.id].winner) return;
    if (games[gameId].players[socket.id].active) {
      const dice = Math.floor(Math.random() * 6) + 1;
      games[gameId].dice = dice;
      if (dice !== 1) {
        games[gameId].players[socket.id].current += dice;
      } else {
        const playerIds = Object.keys(games[gameId].players);
        for (let i = 0; i < playerIds.length; i++) {
          const player = games[gameId].players[playerIds[i]];
          if (player.active) {
            player.active = false;
            player.current = 0;
            if (i === playerIds.length - 1) {
              games[gameId].players[playerIds[0]].active = true;
            } else {
              games[gameId].players[playerIds[i + 1]].active = true;
            }
            break;
          }
        }
      }
      io.to(gameId).emit("update-game", games[gameId]);
    } else {
      socket.emit("error", "It is not your turn to roll the dice.");
    }
  });

  socket.on("hold-dice", (gameId) => {
    if (games[gameId] && games[gameId].players[socket.id]) {
      if (games[gameId].players[socket.id].winner) return;
      games[gameId].players[socket.id].score +=
        games[gameId].players[socket.id].current;
      if (games[gameId].players[socket.id].score >= MAX_SCORE) {
        games[gameId].players[socket.id].winner = true;
        games[gameId].players[socket.id].nome = "WINNER";
      } else {
        const playerIds = Object.keys(games[gameId].players);
        for (let i = 0; i < playerIds.length; i++) {
          const player = games[gameId].players[playerIds[i]];
          if (player.active) {
            player.active = false;
            player.current = 0;
            if (i === playerIds.length - 1) {
              games[gameId].players[playerIds[0]].active = true;
            } else {
              games[gameId].players[playerIds[i + 1]].active = true;
            }
            break;
          }
        }
      }
      games[gameId].dice = 0;
      io.to(gameId).emit("update-game", games[gameId]);
    }
  });

  socket.on("new-game", (gameId) => {
    games[gameId] = {
      players: games[gameId].players, // keep the same players
      dice: 0,
    };

    // reset scores and active status for all players
    Object.keys(games[gameId].players).forEach((playerId) => {
      games[gameId].players[playerId].score = 0;
      games[gameId].players[playerId].current = 0;
      games[gameId].players[playerId].active = false;
      games[gameId].players[playerId].winner = false;
    });

    // set the first player as active
    const playerIds = Object.keys(games[gameId].players);
    games[gameId].players[playerIds[0]].active = true;

    io.to(gameId).emit("update-game", games[gameId]);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
