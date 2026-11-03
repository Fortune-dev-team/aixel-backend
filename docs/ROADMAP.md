# Aixel Backend Implementation Roadmap

This roadmap follows the proposed implementation phases. It describes
intended milestones, not verified completion status.

  -----------------------------------------------------------------------
  Phase                   Scope                   Demonstrable outcome
  ----------------------- ----------------------- -----------------------
  0 --- Foundation        Repository, CI, Docker, Health endpoint and CI
                          configuration,          passing
                          error/response format,  
                          initial migration,      
                          seed, Swagger           

  1 --- Auth & User       Register, verify,       End-to-end login
                          login, refresh, reset,  
                          guards, profile         

  2 --- Catalog & Rules   Attributes, levels,     Admin manages
                          indicators, system      attributes and rules
                          rules, audit            

  3 --- Knowledge Base &  Storage, ingest queue,  Uploaded document can
  RAG                     chunking, embeddings,   be searched
                          retrieval               

  4 --- Rubrics,          Draft generation and    Admin approves
  Questions & Materials   approval workflow       rubric/content

  5 --- Pretest, Goals &  Pretest, goals,         Learning flow across
  Course                  progress, attempts, AI  levels
                          grading, results        

  6 --- Mentoring         Mentor registration,    Complete mentoring
                          requests, slots,        lifecycle
                          evaluation, cooldown,   
                          member attributes,      
                          certificates            

  7 --- Advanced Admin    Refresh, initial        Admin functionality
                          ownership,              
                          interventions, AI       
                          monitoring, dashboard,  
                          export                  

  8 --- Hardening         Notifications, rate     UAT-ready deployment
                          limiting, load tests,   
                          E2E, Nginx and SSL      
  -----------------------------------------------------------------------

## Recommended Dependencies

-   Complete Phase 0 before feature development.
-   Implement Knowledge Base and content approval before relying on
    course assessment flows.
-   Create initial seed data early enough to test mentoring and learning
    workflows.
-   Keep AI provider integration behind interfaces.
-   Define business invariants and tests before implementing complex
    state transitions.

## Definition of Done

A feature is considered ready when: - Requirements and acceptance
criteria are clear. - Authorization is enforced server-side. - Input
validation is implemented. - Relevant tests pass. - Logging and error
handling are appropriate. - API documentation is updated. - Database
migration is reviewed if schema changes. - No secret or sensitive data
is exposed.
