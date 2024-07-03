const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const connectDB = require('./config/database');

/**
 * Creates and configures an Express application.
 * 
 * @returns {Express.Application} The configured Express application.
 */
async function createApp() {
  await connectDB().then(() => {
    console.log('Database connected successfully');
  }).catch((err) => {
    console.log('Error connecting to database', err);
    process.exit(1);
  });

  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use('/bootstrap', express.static(path.join(__dirname, '..', 'node_modules/bootstrap/dist')));
  app.use('/fontawesome', express.static(path.join(__dirname, '..', 'node_modules/@fortawesome/fontawesome-free')));

  // View engine setup
  app.use(expressLayouts);
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.get('/', (req, res) => {
    res.render('welcome', { title: '' });
  });

  return app;
}

module.exports = createApp;
