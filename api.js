
const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.getElementById("load-btn");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitButton = document.getElementById("submit-btn");
const statusMessage = document.getElementById("status");
const notesList = document.getElementById("notes-list");

let notes = [];

function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = type;
}

function renderNotes() {
    notesList.replaceChildren();

    if (notes.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty-state";
        emptyItem.textContent = "No notes to display. Load notes or create one.";
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

        item.append(title, body);
        notesList.appendChild(item);
    });
}

// Reusable API request function.
async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`The server returned status ${response.status}.`);
    }

    const data = response.status === 204
        ? null
        : await response.json();

    return {
        data,
        status: response.status
    };
}

// TASK 1: Load notes using GET.
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

loadButton.addEventListener("click", loadNotes);

// TASK 2: Create a note using POST.
async function createNote(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (!title) {
        showStatus("Please enter a note title.", "error");
        titleInput.focus();
        return;
    }

    if (title.length > 100) {
        showStatus("The title must not exceed 100 characters.", "error");
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
                title,
                body,
                userId: 1
            })
        });

        const newNote = result.data;

        // JSONPlaceholder simulates POST requests but does not permanently
        // save new posts. Keep the returned note in the local page state.
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

noteForm.addEventListener("submit", createNote);
