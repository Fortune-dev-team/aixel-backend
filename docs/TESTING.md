# Testing Strategy

## 1. Goals

Testing should verify correctness of business rules, API behavior,
integration boundaries, and operational readiness.

## 2. Test Levels

### Unit Tests

Prioritize domain services and business invariants: - Progression
between learning levels. - Cooldown rules. - Mentee quota. - Pass/fail
calculation. - Authorization and access restrictions. - Validation of
state transitions.

Mock external dependencies such as AI providers, storage, email, and
queues.

### Integration Tests

Verify integration with: - PostgreSQL and TypeORM. - Redis and BullMQ. -
Object storage. - Provider adapters where practical.

Use isolated test resources and deterministic setup/teardown.

### End-to-End Tests

Initial critical flows: - Authentication. - Goal limits. - Level
locking. - Mentor request. - Evaluation.

Use Supertest or the NestJS E2E testing setup.

## 3. AI Tests

Mock `LlmProvider` in regular CI to make tests deterministic. Prompt
quality and provider-specific behavior should be tested separately, with
controlled inputs and documented evaluation criteria.

## 4. CI Pipeline

Planned CI sequence:

``` mermaid
flowchart LR
    Push[Push / Pull Request] --> Lint[Lint]
    Lint --> Build[Build]
    Build --> Unit[Unit Tests]
    Unit --> E2E[E2E Tests]
    E2E --> Docker[Docker Build]
```

E2E CI should provide PostgreSQL and Redis services.

## 5. Quality Gates

Before merge: - Lint passes. - Build passes. - Relevant unit tests
pass. - Relevant E2E tests pass. - Migration is reviewed. - API
documentation is updated when contracts change. - No secrets are
committed.

## 6. Useful Commands

``` bash
npm run test
npm run test:e2e
npm run test:cov
npm run build
npm run lint
```

Only run commands that exist in the repository's `package.json`.
