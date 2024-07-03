const http = require('http');
const { Server } = require('socket.io');
const createApp = require('./src/app');

/**
 * Sets up the server by creating an Express app, a HTTP server, and a Socket.IO instance.
 * Listens for client connections and handles events such as note creation, update, deletion, and disconnection.
 * @returns {Object} An object containing the Express app, Socket.IO instance, and HTTP server.
 */
async function setupServer() {
  const app = await createApp();
  const server = http.createServer(app);
  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('note-created', (note) => {
      console.log('Note created:', note);
      socket.broadcast.emit('note-created', note);
    });

    socket.on('note-updated', (note) => {
      console.log('Note updated:', note);
      socket.broadcast.emit('note-updated', note);
    });

    socket.on('note-deleted', (noteId) => {
      console.log('Note deleted:', noteId);
      socket.broadcast.emit('note-deleted', noteId);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  const PORT = process.env.PORT || 3000;

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  return { app, io, server };
}

if (require.main === module) {
  setupServer();
}

module.exports = setupServer;
