/**
 * Represents a MongoStore object for session storage.
 * @typedef {Object} MongoStore
 * @property {Function} create Creates a new session in the store.
 * @property {Function} get Retrieves a session from the store.
 * @property {Function} set Updates a session in the store.
 * @property {Function} destroy Destroys a session in the store.
 * @property {Function} length Retrieves the number of sessions in the store.
 * @property {Function} clear Clears all sessions from the store.
 */

const MongoStore = require('connect-mongo');

module.exports = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    secure: process.env.NODE_ENV === 'production',
  },
};
