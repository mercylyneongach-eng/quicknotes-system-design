# QuickNotes System Architecture

## 1. Introduction

QuickNotes is a notes management application that allows users to retrieve, create, and delete notes. The current demonstration uses HTML, CSS, JavaScript, and the JSONPlaceholder testing API.

This document proposes a scalable production architecture for supporting approximately one million registered users. The proposed architecture is a future design; the current frontend demonstration does not yet implement all the components described below.

## 2. Functional Requirements

The system should:

1. Allow users to create and manage notes.
2. Retrieve and display notes belonging to a user.
3. Delete notes when requested by an authorised user.
4. Validate note titles and other required input.
5. Display loading, success, empty, and error states.
6. Associate notes with their owners.
7. Support tagging, searching, and filtering as the application develops.
8. Prevent users from accessing or modifying other users' notes.

## 3. Non-Functional Requirements

- **Scalability:** Support growth in users, requests, and stored notes.
- **Availability:** Keep the application accessible during individual server failures.
- **Performance:** Return common note requests quickly and minimise unnecessary database queries.
- **Security:** Use HTTPS, authentication, authorisation, input validation, and secure secret management.
- **Reliability:** Protect stored data through backups, replication, monitoring, and recovery procedures.
- **Maintainability:** Separate the frontend, application logic, data storage, and background processing.
- **Consistency:** Ensure note creation and deletion are correctly reflected in the primary database.
- **Cost efficiency:** Scale resources according to demand and monitor infrastructure usage.

## 4. Estimated System Load

The following estimates illustrate a possible workload for one million registered users. They are planning assumptions, not measured traffic.

### Assumptions

- Registered users: 1,000,000.
- Daily active users: 10% of registered users = 100,000.
- Each daily active user performs approximately 5 note reads and 1 note creation per day.
- Average note record, including typical text and basic metadata: approximately 2 KB.
- Peak traffic is estimated at 10 times the average request rate.
- One year is treated as 365 days.

### Calculations

| Metric | Calculation | Estimate |
|---|---|---:|
| Daily active users | 1,000,000 × 10% | 100,000 |
| Reads per day | 100,000 × 5 | 500,000 |
| Average reads per second | 500,000 ÷ 86,400 | 5.8 |
| Estimated peak reads per second | 5.8 × 10 | Approximately 58 |
| Writes per day | 100,000 × 1 | 100,000 |
| Average writes per second | 100,000 ÷ 86,400 | 1.2 |
| Estimated peak writes per second | 1.2 × 10 | Approximately 12 |
| New notes per year | 100,000 × 365 | 36.5 million |
| Annual raw note storage | 36.5 million × 2 KB | Approximately 73 GB |

The storage estimate covers newly created note records only. It excludes existing notes, attachments, indexes, database overhead, replicas, logs, and backups. Actual storage will depend on average note length and user activity.

These estimates provide a starting point for capacity planning. Production monitoring and load testing should be used to refine them.

## 5. Proposed Architecture Diagram

```text
                    USERS / BROWSERS
                           |
                           v
                         DNS
                           |
                           v
                          CDN
                (Static files and assets)
                           |
                           v
                    LOAD BALANCER
                           |
                +----------+----------+
                |                     |
                v                     v
          +------------+       +------------+
          | App Server 1|       | App Server 2|
          +------------+       +------------+
                |                     |
                +----------+----------+
                           |
                 +---------+---------+
                 |                   |
                 v                   v
            +----------+       +-------------+
            |  CACHE   |       | PRIMARY DB  |
            +----------+       +-------------+
                                    |
                                    | Replication
                                    v
                              +-------------+
                              | READ REPLICA|
                              +-------------+

          APP SERVERS
               |
               v
         +-------------+
         | MESSAGE QUEUE|
         +-------------+
               |
               v
         +-------------+
         | BACKGROUND  |
         |   WORKER    |
         +-------------+
```

## 6. Architecture Components and Their Purposes

1. **Users and browsers:** Provide the interface through which users interact with their notes.
2. **DNS:** Resolves the application's domain name to the appropriate service endpoint.
3. **CDN:** Caches static assets such as CSS, JavaScript, and images near users to reduce latency and origin-server traffic.
4. **Load balancer:** Distributes incoming requests across healthy application servers and removes unhealthy instances from rotation.
5. **Application servers:** Run the backend API, validate requests, enforce authentication and authorisation, and execute note operations.
6. **Cache:** Stores frequently accessed data to reduce repeated database queries and improve response times.
7. **Primary database:** Stores authoritative note records and handles writes such as creating and deleting notes.
8. **Read replica:** Serves suitable read queries and reduces read pressure on the primary database.
9. **Message queue:** Holds asynchronous tasks until background workers can process them, helping absorb bursts of non-critical work.
10. **Background worker:** Processes tasks such as notifications, search indexing, or other asynchronous operations without unnecessarily delaying user requests.

The diagram is a conceptual design. It does not imply that the current QuickNotes application already contains these production components.

## 7. Request Flow: GET /notes

1. A user opens the notes page and requests their notes.
2. DNS resolves the application domain, and the request reaches the application through the relevant network and load-balancing layers.
3. The load balancer forwards the request to a healthy application server.
4. The application server authenticates the user and checks that the user is authorised to access the requested notes.
5. The application checks the cache for suitable, current data.
6. If the cache contains valid data, the application returns the cached result.
7. If the cache misses, the application retrieves the user's notes from the database, using a read replica when appropriate.
8. The application returns a JSON response with a suitable HTTP status code, such as `200 OK`.
9. The frontend displays the notes to the user.

## 8. Request Flow: POST /notes

1. A user enters a title and note body and submits the form.
2. The frontend validates basic input and sends a POST request containing JSON.
3. The load balancer forwards the request to a healthy application server.
4. The server authenticates the user, verifies authorisation, and validates the request data.
5. The server writes the new note to the primary database, associating it with the authenticated user.
6. After the database confirms the write, the server returns `201 Created`, ideally with the created note and its identifier.
7. The frontend displays a success message and updates the note list.
8. If follow-up tasks are required, the application can enqueue them for background processing.

The database write must succeed before the API reports successful note creation. Cache invalidation or updating should also be handled so users do not continue seeing stale data.

## 9. Design Trade-Offs

### Trade-Off 1: Caching versus data freshness

Caching improves response times and reduces database load. However, cached notes may become outdated after a note is created, edited, or deleted.

**Decision:** Cache suitable read-heavy data with short expiration periods and invalidate or update relevant cache entries after successful writes. Sensitive, user-specific data must be isolated by user and authorisation rules.

### Trade-Off 2: Read replicas versus consistency

Read replicas distribute read traffic and reduce pressure on the primary database. However, replication delay can cause a newly created or deleted note to appear temporarily out of date.

**Decision:** Send writes to the primary database. Where immediate read-after-write consistency is important, read from the primary or use a strategy that waits for replication to catch up.

### Trade-Off 3: Background processing versus immediate feedback

Queues help handle bursts of work and keep non-critical tasks outside the main request path. However, asynchronous tasks can be delayed or fail and require retries and monitoring.

**Decision:** Keep the main note database operation synchronous. Use queued tasks for non-critical work such as notifications and search indexing, with retry handling and dead-letter processing where appropriate.

## 10. Avoiding Single Points of Failure

A single point of failure is a component whose failure can make the entire service unavailable.

The proposed design reduces this risk by:

- Running at least two application servers across separate failure domains.
- Using a load balancer with health checks and a highly available configuration.
- Deploying the primary database with managed failover, replication, backups, and tested recovery procedures.
- Configuring the cache and message queue for appropriate redundancy and recovery.
- Monitoring application errors, database health, queue depth, latency, and resource utilisation.
- Testing failover and recovery procedures regularly.

A read replica alone is not a complete high-availability strategy. Database promotion, failover procedures, backups, and recovery testing are also required. DNS, CDN, load-balancing, and other infrastructure services must likewise be configured to avoid unnecessary single points of failure.

## 11. Conclusion

The proposed architecture separates frontend delivery, application processing, caching, database storage, and asynchronous work. Load balancing and multiple application servers improve resilience, while caching and read replicas help manage read traffic. Capacity estimates provide an initial planning baseline for one million registered users, but the design should be validated through load testing, monitoring, and security reviews before production deployment.