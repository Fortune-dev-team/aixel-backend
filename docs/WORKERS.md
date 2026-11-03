# Background Workers and Queues

## 1. Purpose

BullMQ and Redis are planned for asynchronous work that should not block
an HTTP request for its full duration.

Candidate workloads: - Document extraction and ingestion. - Embedding
generation. - AI-assisted content generation. - Long-running
evaluation. - Email delivery. - Scheduled maintenance tasks.

These are candidate workloads; queue names and job contracts must be
defined by the implementation.

## 2. Components

-   Redis: queue backend.
-   BullMQ: queue and job management.
-   NestJS processors: job handlers.
-   Worker process: separate runtime process for background jobs.

## 3. Processing Lifecycle

``` mermaid
sequenceDiagram
    participant API as NestJS API
    participant R as Redis / BullMQ
    participant W as Worker
    participant S as Storage / Database
    API->>R: Add job
    R-->>API: Job identifier
    API-->>API: Return accepted response
    W->>R: Fetch job
    W->>S: Process data
    S-->>W: Processing result
    W->>R: Complete / fail job
```

## 4. Job Design

Every job should define: - Stable job name. - Validated payload. - Retry
policy. - Timeout or processing limits where applicable. - Idempotency
behavior. - Failure logging. - Operational monitoring.

Avoid placing large file binaries in Redis job payloads. Store the file
in object storage and pass a storage key/reference.

## 5. API and Worker Processes

The deployment design uses one application image with separate process
commands: - API process. - Worker process.

This isolates CPU- or AI-intensive jobs from API request latency. Do not
run duplicate schedulers unintentionally in every replica; define which
process owns scheduled tasks.

## 6. Operations

Useful commands:

``` bash
docker compose logs -f redis
docker compose ps
```

Queue dashboards, metrics, retention policies, and dead-letter handling
should be selected and configured before production.
