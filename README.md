# QuickNotes System Design

## Project Description

QuickNotes is a simple notes management application built using HTML, CSS, and JavaScript. It demonstrates how a frontend application communicates with a REST API to retrieve, create, and delete notes using HTTP requests.

The project uses the [JSONPlaceholder API](https://jsonplaceholder.typicode.com/posts) to simulate server-side operations. It also includes system design documentation covering API design, database modelling, and application architecture.

## Features

- **Load notes:** Retrieve and display up to 10 notes using a GET request.
- **Create notes:** Submit a note title and body using a POST request.
- **Delete notes:** Remove a note from the displayed list using a DELETE request.
- **Input validation:** Require a title and limit it to 100 characters.
- **Error handling:** Display loading, success, and error messages.
- **Responsive styling:** Present notes in a clear, readable interface.

## Technologies Used

- HTML5 — application structure.
- CSS3 — styling and layout.
- JavaScript — application logic and API requests.
- Fetch API — communication with the REST API.
- JSONPlaceholder — simulated backend API.
- Git and GitHub — version control and project hosting.

## How to Run the Application

1. Clone or download this repository.
2. Open the project folder in Visual Studio Code.
3. Open `index.html` using the VS Code Live Server extension, or another local web server.
4. Click **Load notes** to retrieve sample notes.
5. Enter