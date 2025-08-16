// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Petite aide pour envoyer à une room
function broadcastToRoom(roomId, data, exceptWs = null) {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.roomId === roomId &&
      client !== exceptWs
    ) {
      client.send(payload);
    }
  });
}

// Quand un client se connecte
wss.on("connection", (ws) => {
  console.log("Client WS connecté");

  // Métadonnées de la socket
  ws.roomId = null;
  ws.playerId = null;
  ws.playerName = null;

  ws.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch (e) {
      console.warn("Message non-JSON ignoré:", message.toString());
      return;
    }

    // On s'assure qu'un roomId existe toujours
    const roomId = data.roomId || ws.roomId || "default";

    // Premier message: mémoriser l'identité/room
    if (data.type === "set_name" || data.type === "join") {
      ws.roomId = roomId;
      ws.playerId = data.id || ws.playerId;
      ws.playerName = data.name || ws.playerName;

      // Optionnel: confirmer au client sa room
      ws.send(
        JSON.stringify({
          type: "joined",
          id: ws.playerId,
          name: ws.playerName,
          roomId: ws.roomId,
        })
      );
      return;
    }

    // Protéger : si la socket n'a pas encore déclaré sa room, la fixer
    if (!ws.roomId) {
      ws.roomId = roomId;
    }

    // Normaliser: toujours renvoyer roomId
    data.roomId = ws.roomId;

    // Diffusion dans la room (on exclut l’émetteur pour la voix/ping)
    switch (data.type) {
      case "voice_data":
      case "ping":
        broadcastToRoom(ws.roomId, data, ws);
        break;

      case "player_left":
        // (rarement envoyé par le client; on forward quand même)
        broadcastToRoom(ws.roomId, data, ws);
        break;

      default:
        // Par défaut, on forward à la room
        broadcastToRoom(ws.roomId, data, ws);
        break;
    }
  });

  ws.on("close", () => {
    if (ws.roomId && ws.playerId) {
      console.log(`Client ${ws.playerId} quitte la room ${ws.roomId}`);
      // Notifier la room qu'il est parti
      broadcastToRoom(ws.roomId, {
        type: "player_left",
        id: ws.playerId,
        roomId: ws.roomId,
      });
    } else {
      console.log("Client déconnecté (non identifié)");
    }
  });
});

// Route HTTP basique
app.get("/", (_req, res) => {
  res.send("Serveur WebSocket + HTTP opérationnel ✅");
});

// Render utilisera PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
