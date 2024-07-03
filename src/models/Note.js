/**
 * Represents a Note.
 * @typedef {Object} Note
 * @property {string} title - The title of the note.
 * @property {string} content - The content of the note.
 * @property {mongoose.Schema.Types.ObjectId} user - The user associated with the note.
 * @property {Date} createdAt - The date and time when the note was created.
 * @property {Date} updatedAt - The date and time when the note was last updated.
 */

const mongoose = require('mongoose');

/**
 * Represents the schema for a Note.
 * @type {mongoose.Schema}
 */
const NoteSchema = new mongoose.Schema({
    title: {
        type: String,
        default: 'Untitled',
    },
    content: {
        type: String,
        default: '',
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Note', NoteSchema);
