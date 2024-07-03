
/**
 * @fileoverview This file contains the controller functions for managing notes.
 * @module noteController
 */

const Note = require('../models/Note');

/**
 * Get all notes for the authenticated user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - The JSON response containing the notes and hasMore flag, or the rendered view with the notes.
 * @throws {Error} - If an error occurs while fetching the notes.
 */
exports.getNotes = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const notes = await Note.find({ user: req.session.user.id })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id title content updatedAt');

    const totalNotes = await Note.countDocuments({ user: req.session.user.id });
    const hasMore = totalNotes > page * limit;

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ notes, hasMore });
    }
    return res.render('notes/index', {
      title: 'Notes',
      notes,
      hasMore,
      currentNote: null,
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return res.status(500).send('An error occurred while fetching notes');
  }
};

/**
 * Get a single note for the authenticated user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - The JSON response containing the note, or the rendered view with the note.
 * @throws {Error} - If an error occurs while fetching the note.
 */
exports.getNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.session.user.id });
    if (!note) {
      return req.xhr || req.headers.accept.indexOf('json') > -1
        ? res.status(404).json({ error: 'Note not found' })
        : res.status(404).send('Note not found');
    }

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json(note);
    }
    const notes = await Note.find({ user: req.session.user.id })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('_id title content updatedAt');

    return res.render('notes/index', {
      title: note.title || 'Untitled Note',
      notes,
      hasMore: notes.length === 10,
      currentNote: note,
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    return res.status(400).send('An error occurred while fetching the note');
  }
};

/**
 * Create a new note for the authenticated user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - The JSON response containing the created note.
 * @throws {Error} - If an error occurs while creating the note.
 */
exports.createNote = async (req, res) => {
  try {
    const note = new Note({
      title: req.body.title || 'Untitled',
      content: req.body.content || '',
      user: req.session.user.id,
    });
    await note.save();
    return res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    return res.status(400).json({ error: error.message });
  }
};

/**
 * Update an existing note for the authenticated user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - The JSON response containing the updated note.
 * @throws {Error} - If an error occurs while updating the note.
 */
exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.session.user.id },
      { title: req.body.title, content: req.body.content },
      { new: true },
    );
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    return res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    return res.status(400).json({ error: error.message });
  }
};

/**
 * Delete a note for the authenticated user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - The JSON response containing a success message.
 * @throws {Error} - If an error occurs while deleting the note.
 */
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.session.user.id });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    return res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return res.status(400).json({ error: error.message });
  }
};
