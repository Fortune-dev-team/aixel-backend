# Security Policy

## 1. Secrets Management

Never commit: - `.env` files. - Database passwords. - JWT secrets. -
Gemini or OpenAI API keys. - S3 access keys. - SMTP credentials. -
Private certificates.

Use environment variables or a secret manager.

## 2. Authentication

-   Hash passwords with Argon2.
-   Validate JWT signature and expiry.
-   Use separate access and refresh token secrets.
-   Define refresh token rotation and revocation behavior.
-   Do not log access or refresh tokens.

## 3. Authorization

Use server-side authorization checks. Frontend visibility controls are
not security boundaries. Enforce roles and resource ownership in the
backend.

## 4. Input and HTTP Security

-   Validate all incoming DTOs.
-   Reject unexpected properties where appropriate.
-   Configure CORS to known frontend origins.
-   Use Helmet.
-   Apply rate limiting to sensitive endpoints.
-   Set upload size and file type limits.
-   Sanitize or safely handle untrusted document content.

## 5. Database

-   Use least-privilege database users.
-   Use parameterized queries or ORM query APIs.
-   Keep production `synchronize` disabled.
-   Review migrations.
-   Protect backups and test restore access.

## 6. AI and Uploaded Content

Treat uploaded files, retrieved text, and model output as untrusted
input. Do not treat instructions found inside uploaded documents as
system instructions. Avoid exposing secrets or unrelated user data in
prompts and logs.

## 7. Reporting

Report security issues privately to the repository maintainers. Do not
publish exploit details before maintainers have had a reasonable
opportunity to investigate and remediate.
