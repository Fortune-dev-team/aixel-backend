# Deployment Guide

## 1. Target Architecture

The deployment design uses: - Docker multi-stage image. - VPS or managed
container host. - Nginx reverse proxy. - HTTPS with Let's Encrypt. -
PostgreSQL. - Redis. - Object storage. - Separate API and worker
processes.

## 2. Process Separation

Run API and worker as separate processes using the same application
image but different commands. This helps prevent long-running AI or
document jobs from degrading HTTP response latency.

## 3. Deployment Sequence

1.  Build and publish application image.
2.  Provision database, Redis, and object storage.
3.  Configure production environment secrets.
4.  Back up database before schema changes.
5.  Run migration as a deployment step.
6.  Start or update API process.
7.  Start or update worker process.
8.  Verify health checks and logs.
9.  Run smoke tests.
10. Monitor error rate, latency, queue depth, and resource usage.

Migration should not run automatically in every API replica at startup.

## 4. Reverse Proxy

Nginx should: - Terminate HTTPS. - Forward API requests to the NestJS
service. - Set appropriate forwarding headers. - Apply request size and
timeout limits based on upload and API requirements. - Route WebSocket
upgrade requests when Socket.IO is used.

## 5. Secrets

Store `DATABASE_URL`, AI API keys, JWT secrets, and storage credentials
in the hosting platform's secret manager or protected environment
configuration. Never bake secrets into the Docker image.

## 6. Database Backup

Run scheduled PostgreSQL backups using `pg_dump` and copy them to
protected object storage. Define retention and encryption policy and
test restoration.

## 7. Observability

Monitor: - API availability. - HTTP error rates. - Request latency. -
Database connection health. - Redis health. - Queue depth and job
failures. - Worker utilization. - AI provider latency and failures. -
Disk and memory utilization.

## 8. Rollback

Prepare an application rollback strategy and database recovery strategy.
Application rollback does not automatically reverse an incompatible
schema migration. Use backward-compatible migrations where possible.
