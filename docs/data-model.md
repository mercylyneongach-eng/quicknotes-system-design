# QuickNotes Data Model

## 1. Introduction

The QuickNotes data model describes how users, notes, and tags are stored and connected in a relational database. It uses four tables: `users`, `notes`, `tags`, and `note_tags`.

The design supports multiple users, multiple notes per user, and multiple tags assigned to a note.

## 2. Database Tables

### 2.1 Users Table

Stores information about registered users.

| Column | Data type | Constraint | Description |
|---|---|---|---|
| id | INTEGER | Primary Key | Unique user identifier |
| name | VARCHAR(100) | NOT NULL | User's name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| created_at | TIMESTAMP | NOT NULL | Account creation time |

### 2.2 Notes Table

Stores notes created by users.

| Column | Data type | Constraint | Description |
|---|---|---|---|
| id | INTEGER | Primary Key | Unique note identifier |
| user_id | INTEGER | Foreign Key, NOT NULL | References users.id |
| title | VARCHAR(100) | NOT NULL | Note title |
| body | TEXT | Nullable | Note content |
| created_at | TIMESTAMP | NOT NULL | Note creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

### 2.3 Tags Table

Stores reusable labels for categorising notes.

| Column | Data type | Constraint | Description |
|---|---|---|---|
| id | INTEGER | Primary Key | Unique tag identifier |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Tag name |

### 2.4 Note_Tags Table

Connects notes to tags and implements the many-to-many relationship.

| Column | Data type | Constraint | Description |
|---|---|---|---|
| note_id | INTEGER | Composite Primary Key, Foreign Key | References notes.id |
| tag_id | INTEGER | Composite Primary Key, Foreign Key | References tags.id |

The combination of `note_id` and `tag_id` prevents the same tag from being assigned to the same note more than once.

## 3. Entity Relationships

- **Users to Notes — One-to-Many:** One user can create many notes, but each note belongs to one user.
- **Notes to Tags — Many-to-Many:** A note can have several tags, and a tag can be used on several notes. The `note_tags` junction table manages this relationship.

### Relationship Diagram

```text
USERS
-----
id (PK)
name
email
   |
   | One-to-Many
   v
NOTES
-----
id (PK)
user_id (FK)
title
body
   |
   | One-to-Many
   v
NOTE_TAGS
---------
note_id (PK, FK)
tag_id  (PK, FK)
   ^
   | Many-to-One
   |
TAGS
----
id (PK)
name
```

## 4. SQL Table Creation

The following SQL uses SQLite-compatible syntax and creates all four tables.

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE note_tags (
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id)
        ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id)
        ON DELETE CASCADE
);
```

Foreign-key enforcement is enabled for the SQLite connection. Cascading deletion removes a user's notes and their tag associations when the relevant parent records are deleted.

## 5. Sample SQL Queries

### Query 1: Retrieve all notes belonging to a user

```sql
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 1
ORDER BY created_at DESC;
```

This query retrieves a user's notes, displaying the newest notes first.

### Query 2: Retrieve notes with their owners

```sql
SELECT
    notes.id AS note_id,
    notes.title,
    notes.body,
    users.name AS owner_name,
    users.email
FROM notes
JOIN users ON notes.user_id = users.id
ORDER BY notes.created_at DESC;
```

This query uses an `INNER JOIN` to combine note details with their owners.

### Query 3: Count notes for every user, including users without notes

```sql
SELECT
    users.id,
    users.name,
    COUNT(notes.id) AS total_notes
FROM users
LEFT JOIN notes ON users.id = notes.user_id
GROUP BY users.id, users.name
ORDER BY total_notes DESC;
```

This query uses a `LEFT JOIN` so users with zero notes are still included.

### Query 4: Find notes by tag

```sql
SELECT
    notes.id,
    notes.title,
    tags.name AS tag_name
FROM notes
JOIN note_tags ON notes.id = note_tags.note_id
JOIN tags ON note_tags.tag_id = tags.id
WHERE tags.name = 'Work';
```

This query uses joins across three tables to find notes with the `Work` tag.

## 6. Database Index

```sql
CREATE INDEX idx_notes_user_created
ON notes(user_id, created_at DESC);
```

**Reason:** QuickNotes frequently retrieves notes belonging to a specific user and orders them by creation date. This composite index can improve those queries by helping the database locate a user's notes and retrieve them in the required order. Indexes require additional storage and add overhead to writes, so they should support actual query patterns.

## 7. SQL vs NoSQL

A relational SQL database is suitable for QuickNotes because users, notes, and tags have clear relationships and require data consistency. SQL supports foreign keys, joins, constraints, and structured queries, making it easier to maintain these relationships.

A NoSQL database may be useful if the application later needs flexible document structures or particular large-scale distribution patterns. However, the choice depends on access patterns and operational requirements. For this design, a relational database such as PostgreSQL is a reasonable production option, while SQLite is suitable for learning and small local demonstrations.

## 8. Conclusion

The proposed data model separates users, notes, and tags into related tables. Primary keys, foreign keys, constraints, and indexes support data integrity and efficient retrieval. The design provides a foundation for future features such as note editing, tagging, user accounts, and filtering.