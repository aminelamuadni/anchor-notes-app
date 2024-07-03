const http = require('http');
const createApp = require('./src/app');

async function setupServer() {
  const app = await createApp();
  const server = http.createServer(app);

  const PORT = process.env.PORT || 3000;

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  return { app, server };
}

if (require.main === module) {
  setupServer();
}

module.exports = setupServer;
