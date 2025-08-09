import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 3000;
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  console.log('Client connecté');

  ws.on('message', (message) => {
    // On reçoit un message ou de l'audio (Buffer)
    console.log('Données reçues:', message);

    // On renvoie à tous les clients connectés
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === ws.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client déconnecté');
  });
});

console.log(`Serveur WebSocket lancé sur le port ${PORT}`);
