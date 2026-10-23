
const API_URL = "https://jsonplaceholder.typicode.com/posts";

// Get elements from index.html
const loadButton = document.getElementById("load-btn");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitButton = document.getElementById("submit-btn");
const statusMessage = document.getElementById("status");
const notesList = document.getElementById("notes-list");

// Store notes displayed on the page
let notes = [];

// Display loading, success, error, or other status messages
function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = type;
}

// Display notes and their Delete buttons
function renderNotes() {
    notesList.replaceChildren();

    if (notes.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty-state";
        emptyItem.textContent =
            "No notes to display. Load notes or create one.";

        notesList.appendChild(emptyItem);
        return;
    }

    notes.forEach((note) => {
        const item = document.createElement("li");
        item.className = "note-card";

        const title = document.createElement("h3");
        title.textContent = note.title || "Untitled note";

        const body = document.createElement("p");
        body.textContent = note.body || "No body provided.";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteNote(note.id, deleteButton);
        });

        item.append(title, body, deleteButton);
        notesList.appendChild(item);
    });
}

// Reusable API request function
async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`The server returned status ${response.status}.`);
    }

    // DELETE requests may return status 204 with no response body.
    const data = response.status === 204
        ? null
        : await response.json();

    return {
        data,
        status: response.status
    };
}

// TASK 1: GET - Load the first 10 notes
async function loadNotes() {
    loadButton.disabled = true;
    showStatus("Loading notes...", "loading");

    try {
        const result = await request(`${API_URL}?_limit=10`);

        notes = result.data;
        renderNotes();

        if (notes.length === 0) {
            showStatus("No notes were found on the server.", "success");
        } else {
            showStatus(
                `Loaded ${notes.length} notes from the server.`,
                "success"
            );
        }
    } catch (error) {
        showStatus(
            "Unable to load notes. Please check your connection and try again.",
            "error"
        );

        console.error("Load notes error:", error);
    } finally {
        loadButton.disabled = false;
    }
}

// Connect the Load notes button to GET
loadButton.addEventListener("click", loadNotes);

// TASK 2: POST - Create a new note
async function createNote(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    // Validate the title
    if (!title) {
        showStatus("Please enter a note title.", "error");
        titleInput.focus();
        return;
    }

    if (title.length > 100) {
        showStatus(
            "The title must not exceed 100 characters.",
            "error"
        );
        titleInput.focus();
        return;
    }

    submitButton.disabled = true;
    showStatus("Creating note...", "loading");

    try {
        const result = await request(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                body: body,
                userId: 1
            })
        });

        const newNote = result.data;

        // JSONPlaceholder simulates POST but does not permanently save
        // created posts. Keep the returned note in this page's local list.
        notes.unshift(newNote);
        renderNotes();

        showStatus(
            `Note created (status ${result.status}, id ${newNote.id}).`,
            "success"
        );

        noteForm.reset();
    } catch (error) {
        showStatus(
            "Unable to create the note. Please try again.",
            "error"
        );

        console.error("Create note error:", error);
    } finally {
        submitButton.disabled = false;
    }
}

// Connect the form to POST
noteForm.addEventListener("submit", createNote);

// TASK 3: DELETE - Remove a note from the displayed list
async function deleteNote(id, button) {
    button.disabled = true;
    showStatus("Deleting note...", "loading");

    try {
        const result = await request(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        // JSONPlaceholder simulates DELETE but does not permanently
        // delete server data. Remove the note from the local display.
        notes = notes.filter((note) => note.id !== id);

        renderNotes();

        showStatus(
            `Note ${id} deleted successfully (status ${result.status}).`,
            "success"
        );
    } catch (error) {
        showStatus(
            `Unable to delete note ${id}. Please try again.`,
            "error"
        );

        console.error("Delete note error:", error);
    }
}
