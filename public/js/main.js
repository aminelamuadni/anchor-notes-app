/* global document, window, io, SimpleMDE, timeago, bootstrap */

/**
 * This file contains the main JavaScript code for the Anchor application.
 * It includes functions for updating note elements, sorting notes, creating note elements,
 * adding notes to the list, deleting notes, displaying note details, and fetching notes from the server.
 * The code also handles user interactions such as creating a new note, closing the sidebar, and updating the document title.
 */

// Constants
const NOTES_PER_PAGE = 10;
const AUTOSAVE_DELAY = 1000;

// State variables
let elements;
let currentNoteId;
let page;
let autosaveTimer;
let hasUnsavedChanges;
let socket;
let simpleMDE;

/**
 * Updates the time of a note element to a human-readable format.
 * @param {HTMLElement} element - The note element to update.
 */
function updateNoteTime(element) {
  const datetime = element.getAttribute('datetime');
  const updatedElement = element;
  updatedElement.textContent = timeago.format(datetime);
}

/**
 * Updates the times of all note elements with the class 'note-date'.
 */
function updateNoteTimes() {
  document.querySelectorAll('.note-date').forEach(updateNoteTime);
}

/**
 * Sorts the notes list based on the updated date.
 */
function sortNotesList() {
  const noteItems = Array.from(elements.notesList.children);
  noteItems.sort((a, b) => new Date(b.dataset.updatedAt) - new Date(a.dataset.updatedAt));
  noteItems.forEach((item) => elements.notesList.appendChild(item));
}

/**
 * Returns a preview of the content.
 *
 * @param {string} content - The content to generate a preview for.
 * @returns {string} The preview of the content.
 */
function getContentPreview(content) {
  if (!content) return '';
  return content.length > 50 ? `${content.substring(0, 50)}...` : content;
}

/**
 * Updates the note element with the provided note data.
 *
 * @param {HTMLElement} element - The note element to update.
 * @param {Object} note - The note data containing title, updatedAt, and content.
 */
function updateNoteElement(element, note) {
  const updatedElement = element;
  const titleElement = updatedElement.querySelector('.note-title');
  const dateElement = updatedElement.querySelector('.note-date');
  const previewElement = updatedElement.querySelector('.note-preview');

  if (titleElement) titleElement.textContent = note.title || 'Untitled';
  if (dateElement) {
    dateElement.setAttribute('datetime', note.updatedAt);
    updateNoteTime(dateElement);
  }
  if (previewElement) previewElement.textContent = getContentPreview(note.content);

  updatedElement.dataset.updatedAt = note.updatedAt;
}

/**
 * Highlights the selected note item by adding the 'active' class to it.
 * Removes the 'active' class from all other note items.
 *
 * @param {string} noteId - The ID of the note item to be highlighted.
 */
function highlightSelectedNoteItem(noteId) {
  document.querySelectorAll('.list-group-item').forEach((item) => item.classList.remove('active'));
  const selectedNote = document.querySelector(`[data-note-id="${noteId}"]`);
  if (selectedNote) selectedNote.classList.add('active');
}

/**
 * Creates a note element based on the provided note object.
 * @param {Object} note - The note object containing the note details.
 * @returns {HTMLElement} - The created note element.
 */
function createNoteElement(note) {
  const div = document.createElement('div');
  div.className = 'list-group-item list-group-item-action py-3 lh-sm';
  div.dataset.noteId = note._id;
  div.dataset.updatedAt = note.updatedAt;
  div.innerHTML = `
        <div class="d-flex gap-3">
          <div class="flex-grow-1 gap-3">
            <div class="d-flex justify-content-between gap-3">
              <a href="/notes/${note._id}" class="note-link text-decoration-none stretched-link">
                <strong class="note-title">${note.title || 'Untitled'}</strong>
              </a>
              <small class="text-nowrap note-date" datetime="${note.updatedAt}"></small>
            </div>
            <div class="note-preview small mt-1">${getContentPreview(note.content)}</div>
          </div>
          <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-danger delete-note position-relative z-1" data-note-id="${note._id}">
              <i class="fas fa-trash-alt fa-fw"></i>
            </button>
          </div>
        </div>
      `;
  return div;
}

/**
 * Adds a note to the notes list.
 *
 * @param {Object} note - The note object to be added.
 * @param {boolean} [prepend=true] - Determines whether the note should be prepended to the list (default: true).
 * @param {boolean} [highlight=false] - Determines whether the added note should be highlighted (default: false).
 */
function addNoteToList(note, prepend = true, highlight = false) {
  const existingNote = document.querySelector(`[data-note-id="${note._id}"]`);
  if (existingNote) {
    updateNoteElement(existingNote, note);
  } else {
    const noteItem = createNoteElement(note);
    if (prepend) {
      elements.notesList.prepend(noteItem);
    } else {
      elements.notesList.appendChild(noteItem);
    }
    updateNoteTime(noteItem.querySelector('.note-date'));
  }
  sortNotesList();
  if (highlight) {
    highlightSelectedNoteItem(note._id);
  }
}

/**
 * Closes the sidebar if it is currently open.
 */
function closeSidebar() {
  if (elements.sidebar.classList.contains('show')) {
    const bsOffcanvas = bootstrap.Offcanvas.getInstance(elements.sidebar);
    bsOffcanvas.hide();
  }
}

/**
 * Updates the document title with the provided title.
 * If the title is empty, it sets the document title to 'Anchor'.
 * @param {string} title - The new title for the document.
 */
function updateDocumentTitle(title) {
  document.title = title ? `${title} - Anchor` : 'Anchor';
}

/**
 * Resets the note editor by clearing the current note, title, content, and other related properties.
 */
function resetNoteEditor() {
  currentNoteId = null;
  elements.noteTitle.value = '';
  simpleMDE.value('');
  highlightSelectedNoteItem(null);
  updateDocumentTitle('');
  hasUnsavedChanges = false;
}

/**
 * Displays a confirmation dialog with the specified message.
 *
 * @param {string} message - The message to display in the confirmation dialog.
 * @returns {boolean} - A boolean value indicating whether the user clicked "OK" (true) or "Cancel" (false).
 */
function showConfirm(message) {
  return window.confirm(message);
}

/**
 * Creates a new note.
 * If there are unsaved changes, it prompts the user for confirmation before creating a new note.
 * Resets the note editor and updates the browser history.
 */
function createNewNote() {
  if (hasUnsavedChanges && !showConfirm('You have unsaved changes. Are you sure you want to create a new note?')) {
    return;
  }
  resetNoteEditor();
  window.history.pushState({ noteId: null }, '', '/notes');
}

/**
 * Toggles the state of a button and updates its appearance based on the isLoading parameter.
 * @param {HTMLButtonElement} button - The button element to toggle.
 * @param {boolean} isLoading - Indicates whether the button is in a loading state.
 */
function toggleButtonState(button, isLoading) {
  if (!button) return;

  const updatedButton = button;
  updatedButton.disabled = isLoading;
  if (isLoading) {
    updatedButton.dataset.originalText = updatedButton.innerHTML;
    updatedButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  } else {
    updatedButton.innerHTML = updatedButton.dataset.originalText || updatedButton.innerHTML;
  }
}

/**
 * Displays an alert with the given message.
 *
 * @param {string} message - The message to display in the alert.
 */
function showAlert(message) {
  window.alert(message);
}

/**
 * Removes a note element from the list based on the provided note ID.
 *
 * @param {string} noteId - The ID of the note element to be removed.
 * @returns {void}
 */
function removeNoteFromList(noteId) {
  const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
  if (noteElement) noteElement.remove();
}

/**
 * Deletes a note by its ID.
 *
 * @param {string} id - The ID of the note to delete.
 * @returns {Promise<void>} - A promise that resolves when the note is deleted.
 */
async function deleteNoteById(id) {
  if (!showConfirm('Are you sure you want to delete this note?')) return;

  const deleteButton = document.querySelector(`[data-note-id="${id}"] .delete-note`);
  toggleButtonState(deleteButton, true);

  try {
    const response = await fetch(`/notes/${id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to delete note');

    const wasCurrentNote = currentNoteId === id;

    removeNoteFromList(id);

    socket.emit('note-deleted', id);

    if (wasCurrentNote) {
      resetNoteEditor();
      window.history.pushState({ noteId: null }, '', '/notes');
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    showAlert('Failed to delete note. Please try again.');
  } finally {
    toggleButtonState(deleteButton, false);
  }
}

/**
 * Displays the details of a note.
 *
 * @param {Object} note - The note object containing the details.
 */
function displayNoteDetails(note) {
  currentNoteId = note._id;
  elements.noteTitle.value = note.title || '';
  simpleMDE.value(note.content || '');
  highlightSelectedNoteItem(note._id);
  updateDocumentTitle(note.title);
  hasUnsavedChanges = false;
}

/**
 * Fetches notes from the server and adds them to the list.
 * @returns {Promise<void>} A promise that resolves when the notes are fetched and added successfully.
 */
async function fetchNotes() {
  try {
    const response = await fetch(`/notes?page=${page}&limit=${NOTES_PER_PAGE}`, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to load notes');
    const data = await response.json();
    data.notes.forEach((note) => addNoteToList(note, false, false));
    elements.loadMoreButton.parentNode.style.display = data.hasMore ? 'block' : 'none';
  } catch (error) {
    console.error('Error loading notes:', error);
    showAlert('Failed to load notes. Please try again.');
  }
}

/**
 * Retrieves the note ID from the current URL path.
 * @returns {string|null} The note ID if found, otherwise null.
 */
function getNoteIdFromUrl() {
  const path = window.location.pathname;
  const noteIdMatch = path.match(/^\/notes\/([a-f\d]{24})$/i);
  return noteIdMatch ? noteIdMatch[1] : null;
}

/**
 * Handles the deletion of a note.
 *
 * @param {string} noteId - The ID of the note to be deleted.
 */
function handleNoteDeletion(noteId) {
  removeNoteFromList(noteId);
  if (noteId === currentNoteId) {
    resetNoteEditor();
    window.history.pushState({ noteId: null }, '', '/notes');
  }
}

/**
 * Updates a note in the list.
 * If the note element already exists in the list, it updates the existing element.
 * If the note element doesn't exist, it adds the note to the list.
 * Finally, it sorts the notes list.
 *
 * @param {Object} note - The note object to update in the list.
 */
function updateNoteInList(note) {
  const noteElement = document.querySelector(`[data-note-id="${note._id}"]`);
  if (noteElement) {
    updateNoteElement(noteElement, note);
  } else {
    addNoteToList(note, true);
  }
  sortNotesList();
}

/**
 * Saves the current note by sending a request to the server.
 * If the note already exists, it sends a PUT request to update the note.
 * If the note is new, it sends a POST request to create a new note.
 * 
 * @async
 * @function saveCurrentNote
 * @returns {Promise<void>} A Promise that resolves when the note is saved successfully.
 * @throws {Error} If the request to save the note fails.
 */
async function saveCurrentNote() {
  const title = elements.noteTitle.value.trim();
  const content = simpleMDE.value().trim();

  toggleButtonState(elements.saveNoteButton, true);
  const method = currentNoteId ? 'PUT' : 'POST';
  const url = currentNoteId ? `/notes/${currentNoteId}` : '/notes';

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ title, content }),
    });
    if (!response.ok) throw new Error('Failed to save note');
    const note = await response.json();
    updateNoteInList(note);
    socket.emit(currentNoteId ? 'note-updated' : 'note-created', note);
    currentNoteId = note._id;
    window.history.pushState({ noteId: note._id }, '', `/notes/${note._id}`);
    updateDocumentTitle(note.title);
    hasUnsavedChanges = false;
    highlightSelectedNoteItem(note._id);
  } catch (error) {
    console.error('Error saving note:', error);
    showAlert('Failed to save note. Please try again.');
  } finally {
    toggleButtonState(elements.saveNoteButton, false);
  }
}

/**
 * Schedules an autosave timer to save the current note.
 * If there are unsaved changes, it will call the saveCurrentNote function after a delay.
 */
function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    if (hasUnsavedChanges) {
      saveCurrentNote();
    }
  }, AUTOSAVE_DELAY);
}

/**
 * Handles the note input and sets the `hasUnsavedChanges` flag to true.
 * Also schedules an autosave.
 */
function handleNoteInput() {
  hasUnsavedChanges = true;
  scheduleAutosave();
}

/**
 * Handles the update of a note.
 *
 * @param {Object} note - The updated note object.
 */
function handleNoteUpdate(note) {
  updateNoteInList(note);
  if (note._id === currentNoteId) {
    displayNoteDetails(note);
  }
}

/**
 * Loads a note by its ID and displays its details.
 * @param {string} noteId - The ID of the note to load.
 * @param {boolean} [pushState=false] - Whether to push the note ID to the browser history.
 * @returns {Promise<void>} - A promise that resolves when the note is loaded and displayed.
 */
async function loadNoteById(noteId, pushState = false) {
  toggleButtonState(elements.saveNoteButton, true);
  try {
    const response = await fetch(`/notes/${noteId}`, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) throw new Error('Note not found');
    const note = await response.json();
    displayNoteDetails(note);
    if (pushState) {
      window.history.pushState({ noteId }, '', `/notes/${noteId}`);
    }
    updateDocumentTitle(note.title);
  } catch (error) {
    console.error('Error fetching note:', error);
    showAlert('Failed to fetch note. Please try again.');
    resetNoteEditor();
  } finally {
    toggleButtonState(elements.saveNoteButton, false);
  }
}

/**
 * Handles the click event on the notes list.
 * @param {Event} event - The click event.
 */
function handleNotesListClick(event) {
  const noteLink = event.target.closest('.note-link');
  const deleteButton = event.target.closest('.delete-note');
  if (noteLink) {
    event.preventDefault();
    if (hasUnsavedChanges && !showConfirm('You have unsaved changes. Are you sure you want to navigate away?')) {
      return;
    }
    const { noteId } = noteLink.closest('[data-note-id]').dataset;
    loadNoteById(noteId, true).then(() => {
      closeSidebar();
    });
  }
  if (deleteButton) {
    event.preventDefault();
    event.stopPropagation();
    deleteNoteById(deleteButton.dataset.noteId);
  }
}

/**
 * Handles the window beforeunload event.
 * @param {Event} event - The beforeunload event object.
 */
function handleWindowBeforeUnload(event) {
  if (hasUnsavedChanges) {
    const e = event;
    e.preventDefault();
    e.returnValue = '';
  }
}

/**
 * Handles the window popstate event.
 *
 * @param {Event} event - The popstate event object.
 */
function handleWindowPopState(event) {
  const noteId = event.state ? event.state.noteId : null;
  if (noteId) {
    loadNoteById(noteId);
  } else {
    resetNoteEditor();
  }
}

/**
 * Loads more notes asynchronously.
 * @returns {Promise<void>} A promise that resolves when the notes are loaded.
 */
async function loadMoreNotes() {
  toggleButtonState(elements.loadMoreButton, true);
  page += 1;
  await fetchNotes();
  toggleButtonState(elements.loadMoreButton, false);
}

/**
 * Sets up event listeners for various elements.
 */
function setupEventListeners() {
  elements.noteTitle.addEventListener('input', handleNoteInput);
  elements.newNoteButton.addEventListener('click', createNewNote);
  elements.saveNoteButton.addEventListener('click', saveCurrentNote);
  elements.loadMoreButton.addEventListener('click', loadMoreNotes);
  elements.notesList.addEventListener('click', handleNotesListClick);
  window.addEventListener('beforeunload', handleWindowBeforeUnload);
  window.addEventListener('popstate', handleWindowPopState);
}

/**
 * Loads the initial notes by performing the following steps:
 * 1. Fetches the notes from the server.
 * 2. Updates the note times.
 * 3. Retrieves the initial note ID from the URL.
 * 4. If an initial note ID is found, loads the note with that ID.
 * 5. If no initial note ID is found, resets the note editor and updates the browser history.
 *
 * @returns {Promise<void>} A promise that resolves when the initial notes are loaded.
 */
async function loadInitialNotes() {
  await fetchNotes();
  updateNoteTimes();
  const initialNoteId = getNoteIdFromUrl();
  if (initialNoteId) {
    await loadNoteById(initialNoteId);
  } else {
    resetNoteEditor();
    window.history.replaceState({ noteId: null }, '', '/notes');
  }
}

/**
 * Initializes the app by checking for required DOM elements, loading initial notes,
 * setting up event listeners, and updating note times at regular intervals.
 */
function initializeApp() {
  if (!elements.notesList || !elements.noteTitle || !elements.noteContent) {
    console.error('Required DOM elements are missing. The app cannot initialize.');
    return;
  }
  loadInitialNotes();
  setupEventListeners();
  setInterval(updateNoteTimes, 10000);
}

/**
 * Initializes the elements used in the application.
 */
function initializeElements() {
  elements = {
    noteTitle: document.getElementById('note-title'),
    noteContent: document.getElementById('note-content'),
    notesList: document.getElementById('notes-list'),
    newNoteButton: document.getElementById('new-note-btn'),
    saveNoteButton: document.getElementById('save-note-btn'),
    loadMoreButton: document.getElementById('load-more-btn'),
    sidebar: document.getElementById('sidebar'),
  };
}

/**
 * Initializes the SimpleMDE editor.
 */
function initializeSimpleMDE() {
  if (elements.noteContent) {
    simpleMDE = new SimpleMDE({
      element: elements.noteContent,
      spellChecker: false,
      status: false,
      toolbar: ['bold', 'italic', 'heading', '|', 'unordered-list', 'ordered-list', '|', 'link', 'quote', 'code', '|', 'preview'],
    });
    simpleMDE.codemirror.on('change', handleNoteInput);
  }
}

/**
 * Initializes the socket connection and sets up event listeners for note-related events.
 */
function initializeSocketConnection() {
  socket = io();
  socket.on('note-created', addNoteToList);
  socket.on('note-updated', handleNoteUpdate);
  socket.on('note-deleted', handleNoteDeletion);
}

/**
 * Initializes the state variables.
 */
function initializeStateVariables() {
  currentNoteId = null;
  page = 1;
  hasUnsavedChanges = false;
}

/**
 * Initializes the main functionality of the application.
 */
function main() {
  initializeElements();
  initializeStateVariables();
  initializeSocketConnection();
  initializeSimpleMDE();
  initializeApp();
}

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', main);
}
