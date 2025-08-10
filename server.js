// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Quand un client se connecte
wss.on("connection", (ws) => {
  console.log("Un client WebSocket est connecté");

  ws.on("message", (message) => {
    console.log("Reçu :", message.toString());

    // On renvoie le message à tous les clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on("close", () => {
    console.log("Client déconnecté");
  });
});

// Route HTTP basique
app.get("/", (req, res) => {
  res.send("Serveur WebSocket + HTTP opérationnel 🚀");
});

// Render utilisera PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
