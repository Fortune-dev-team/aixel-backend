# Environment Variables

## 1. Example Configuration

Salin `.env.example` menjadi `.env`. Isi secret lokal pada `.env` dan
jangan commit file tersebut.

``` env
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

DATABASE_URL=postgresql://postgres:password@localhost:5432/aixel_db
REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=replace_with_random_secret_at_least_32_chars
JWT_ACCESS_TTL=15m
JWT_REFRESH_SECRET=replace_with_another_random_secret_at_least_32_chars
JWT_REFRESH_TTL_DAYS=14

ALLOWED_EMAIL_DOMAINS=

LLM_PROVIDER=gemini
EMBEDDING_PROVIDER=gemini
EMBEDDING_DIM=768
GEMINI_API_KEY=
OPENAI_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434

S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=aixel
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

SMTP_HOST=localhost
SMTP_PORT=1025
MAIL_FROM=noreply@aixel.local
```

## 2. Variable Reference

  -------------------------------------------------------------------------
  Variable                  Required / Default      Description
  ------------------------- ----------------------- -----------------------
  `NODE_ENV`                Default `development`   Application environment

  `PORT`                    Default `5000`          HTTP port

  `APP_URL`                 Required by proposed    Backend URL
                            Joi schema              

  `FRONTEND_URL`            Required by proposed    Frontend origin
                            Joi schema              

  `DATABASE_URL`            Required                PostgreSQL connection
                                                    string

  `REDIS_URL`               Required                Redis connection string

  `JWT_ACCESS_SECRET`       Required, minimum 32    Access token secret
                            chars                   

  `JWT_ACCESS_TTL`          Default `15m`           Access token lifetime

  `JWT_REFRESH_SECRET`      Required, minimum 32    Refresh token secret
                            chars                   

  `JWT_REFRESH_TTL_DAYS`    Default `14`            Refresh token lifetime
                                                    in days

  `ALLOWED_EMAIL_DOMAINS`   Default empty           Optional email domain
                                                    policy

  `LLM_PROVIDER`            Default `gemini`        LLM provider

  `EMBEDDING_PROVIDER`      Default `gemini`        Embedding provider

  `EMBEDDING_DIM`           Default `768`           Embedding vector
                                                    dimension

  `GEMINI_API_KEY`          Optional by provider    Gemini API key

  `OPENAI_API_KEY`          Optional by provider    OpenAI API key

  `OLLAMA_BASE_URL`         Default localhost URL   Ollama endpoint

  `S3_ENDPOINT`             Required by proposed    S3-compatible endpoint
                            schema                  

  `S3_REGION`               Default `us-east-1`     S3 region

  `S3_BUCKET`               Required by proposed    Bucket name
                            schema                  

  `S3_ACCESS_KEY`           Required by proposed    Storage access key
                            schema                  

  `S3_SECRET_KEY`           Required by proposed    Storage secret
                            schema                  

  `SMTP_HOST`               Required by proposed    SMTP hostname
                            schema                  

  `SMTP_PORT`               Required by proposed    SMTP port
                            schema                  

  `MAIL_FROM`               Required by proposed    Sender address
                            schema                  
  -------------------------------------------------------------------------

## 3. Secret Generation

Generate random secrets rather than using the example values.

OpenSSL:

``` bash
openssl rand -hex 32
```

Generate a different value for access and refresh secrets.

## 4. Environment Validation

Use Joi schema during application bootstrap to reject missing or invalid
configuration. The schema must reflect which providers are enabled: for
example, a Gemini API key should be required when Gemini is selected,
not necessarily when Ollama is selected.

## 5. Environment Separation

Use separate credentials for: - Local development. - Automated tests. -
Staging. - Production.

Do not copy production secrets into local `.env` files or issue
trackers.
