/**
 * Provides routes for handling note-related requests.
 */
const express = require('express');
const {
  getNotes, createNote, updateNote, deleteNote, getNote,
} = require('../controllers/noteController');
const { attachUser, ensureAuth } = require('../middleware/auth');

/**
 * Creates a router for handling note-related routes.
 *
 * @returns {express.Router} The router object.
 */
function createNoteRouter() {
  const router = express.Router();

  router.use(attachUser, ensureAuth);

  router.get('/', getNotes);
  router.post('/', createNote);
  router.get('/:id', getNote);
  router.put('/:id', updateNote);
  router.delete('/:id', deleteNote);

  return router;
}

module.exports = createNoteRouter;
