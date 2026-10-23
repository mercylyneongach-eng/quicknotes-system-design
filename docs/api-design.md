# QuickNotes API Design

## 1. Introduction

The QuickNotes API provides endpoints for creating, retrieving, updating, and deleting notes. It is designed as a REST-style API that uses HTTP methods and JSON data to communicate between the frontend and backend.

The current QuickNotes demonstration uses the JSONPlaceholder testing API:

`https://jsonplaceholder.typicode.com/posts`

The endpoints documented below describe a proposed production API. They are not all implemented in the current demonstration.

## 2. API Conventions

- **Base URL:** `https://api.quicknotes.example/v1`
- **Data format:** JSON
- **Authentication:** Bearer token authentication for protected endpoints.
- **Transport security:** HTTPS.
- **Content-Type:** `application/json` for JSON request bodies.
- **Error format:** JSON objects containing an error code, message, and optional details.

The example domain `api.quicknotes.example` is a placeholder and is not a live API address.

## 3. REST API Endpoints

| HTTP Method | Endpoint | Description | Success Status |
|---|---|---|---|
| POST | `/users` | Register a new user | `201 Created` |
| GET | `/users/me` | Retrieve the authenticated user's profile | `200 OK` |
| GET | `/notes` | List the authenticated user's notes | `200 OK` |
| GET | `/notes/{id}` | Retrieve a specific note | `200 OK` |
| POST | `/notes` | Create a new note | `201 Created` |
| PUT | `/notes/{id}` | Replace an existing note | `200 OK` |
| PATCH | `/notes/{id}` | Update selected note fields | `200 OK` |
| DELETE | `/notes/{id}` | Delete a note | `204 No Content` |

All note operations must verify that the authenticated user owns the requested note. The API should not expose another user's private notes.

## 4. Example: Create