# Aixel Backend

Backend API untuk platform **Aixel**, dibangun menggunakan **NestJS +
TypeScript** dengan PostgreSQL, TypeORM, Redis, BullMQ, object storage
S3-compatible, dan integrasi AI provider.

> **Status dokumentasi:** dokumen ini merupakan baseline dokumentasi
> repository dan panduan implementasi. Modul, endpoint, migration,
> worker, serta konfigurasi yang belum dibuat di source code harus
> dianggap sebagai rencana, bukan fitur yang sudah tersedia.

## Daftar Isi

-   [Gambaran Umum](#gambaran-umum)
-   [Teknologi](#teknologi)
-   [Arsitektur Tingkat Tinggi](#arsitektur-tingkat-tinggi)
-   [Persyaratan Sistem](#persyaratan-sistem)
-   [Quick Start](#quick-start)
-   [Environment Variables](#environment-variables)
-   [Struktur Repository](#struktur-repository)
-   [Perintah Pengembangan](#perintah-pengembangan)
-   [Database dan Migration](#database-dan-migration)
-   [API dan Swagger](#api-dan-swagger)
-   [Background Jobs](#background-jobs)
-   [AI Integration](#ai-integration)
-   [Testing](#testing)
-   [Git Workflow](#git-workflow)
-   [Dokumentasi Tambahan](#dokumentasi-tambahan)
-   [Troubleshooting](#troubleshooting)
-   [Security](#security)

## Gambaran Umum

Aixel Backend menyediakan layanan API untuk platform pembelajaran dan
pengembangan kompetensi. Rancangan domain mencakup autentikasi,
pengguna, atribut kompetensi, knowledge base, materi, bank soal, rubrik,
aturan sistem, pretest, goals, course, mentoring, wawancara, sertifikat,
notifikasi, dashboard, monitoring AI, intervensi, audit, dan health
check.

Backend dipisahkan dari frontend agar pengembangan, pengujian,
deployment, dan review dapat dilakukan secara independen. Frontend
berkomunikasi dengan backend melalui REST API dengan kontrak yang
didokumentasikan menggunakan OpenAPI/Swagger.

## Teknologi

  -----------------------------------------------------------------------
  Area                    Teknologi               Kegunaan
  ----------------------- ----------------------- -----------------------
  Runtime                 Node.js 22+             Runtime JavaScript

  Framework               NestJS                  Struktur aplikasi
                                                  backend

  Language                TypeScript              Type safety

  Package manager         npm                     Instalasi dependency

  Database                PostgreSQL              Penyimpanan data
                                                  relasional

  ORM                     TypeORM                 Entity dan migration

  Vector                  pgvector                Penyimpanan dan
                                                  pencarian embedding

  Cache                   Redis                   Cache dan penyimpanan
                                                  sementara

  Queue                   BullMQ                  Background job berbasis
                                                  Redis

  Authentication          Passport, JWT, Argon2   Autentikasi dan hashing
                                                  password

  Validation              Joi, class-validator,   Validasi konfigurasi
                          class-transformer       dan request

  API docs                Swagger                 Dokumentasi OpenAPI

  Realtime                Socket.IO               WebSocket

  Object storage          MinIO / Amazon S3       Penyimpanan file

  AI                      Gemini, OpenAI, Ollama  LLM dan embedding
                                                  provider

  Email                   Nodemailer, Mailpit     Pengiriman dan
                                                  pengujian email

  Container               Docker Compose          Infrastruktur lokal
  -----------------------------------------------------------------------

Versi package mengikuti lockfile repository. Gunakan `package-lock.json`
yang sudah di-commit untuk instalasi yang konsisten.

## Arsitektur Tingkat Tinggi

``` mermaid
flowchart LR
    FE[Frontend / Client] --> API[NestJS REST API]
    API --> AUTH[Authentication & Authorization]
    API --> MOD[Domain Modules]
    MOD --> PG[(PostgreSQL)]
    API --> REDIS[(Redis)]
    API --> S3[MinIO / S3]
    API --> AI[AI Provider Adapter]
    API --> WS[WebSocket]
    API --> MAIL[SMTP]
    API --> Q[BullMQ Queue]
    Q --> WORKER[Worker Process]
    WORKER --> REDIS
    WORKER --> PG
    WORKER --> AI
```

Komponen utama:

-   **REST API:** menerima request dari frontend, menjalankan validasi,
    autentikasi, dan aturan bisnis.
-   **PostgreSQL:** sumber data utama.
-   **TypeORM:** memetakan entity dan menjalankan migration.
-   **Redis:** cache dan backend BullMQ.
-   **Worker:** memproses pekerjaan berat secara asynchronous, misalnya
    pemrosesan dokumen atau pekerjaan AI.
-   **AI provider adapter:** abstraksi agar provider dapat dipilih
    melalui konfigurasi.
-   **MinIO/S3:** menyimpan file yang diunggah.
-   **Mailpit:** SMTP lokal untuk menguji email tanpa mengirim email
    sungguhan.

## Persyaratan Sistem

-   Node.js 22 atau lebih baru.
-   npm yang kompatibel dengan Node.js.
-   Git 2.40 atau lebih baru.
-   Docker Desktop dan Docker Compose V2.
-   NestJS CLI.
-   DBeaver atau database client lain (opsional).

Periksa versi:

``` bash
node --version
npm --version
git --version
docker --version
docker compose version
nest --version
```

Install NestJS CLI:

``` bash
npm install --global @nestjs/cli
```

## Quick Start

### 1. Clone repository

``` bash
git clone https://github.com/<organization>/aixel-backend.git
cd aixel-backend
```

### 2. Install dependencies

``` bash
npm ci
```

Jika repository belum memiliki `package-lock.json`, jalankan
`npm install` satu kali dan commit lockfile yang dihasilkan.

### 3. Siapkan environment

``` bash
cp .env.example .env
```

Pada Windows PowerShell:

``` powershell
Copy-Item .env.example .env
```

Isi nilai lokal pada `.env`. Jangan commit file `.env`.

### 4. Jalankan infrastruktur lokal

``` bash
docker compose up -d postgres redis minio mailpit
docker compose ps
```

### 5. Jalankan migration dan seed

``` bash
npm run migration:run
npm run seed
```

> Perintah migration dan seed hanya dapat dijalankan setelah konfigurasi
> TypeORM, file migration awal, dan seed runner tersedia. Jangan
> menganggap database sudah siap hanya karena container PostgreSQL
> berjalan.

### 6. Jalankan API

``` bash
npm run start:dev
```

Jika konfigurasi `main.ts` dan Swagger sudah diterapkan, API berjalan
pada `http://localhost:5000` dan dokumentasi tersedia di
`http://localhost:5000/api/docs`.

### 7. Hentikan infrastruktur

``` bash
docker compose down
```

Untuk menghapus volume database dan data lokal secara permanen:

``` bash
docker compose down -v
```

**Peringatan:** `down -v` menghapus data PostgreSQL, Redis, dan MinIO
pada volume Docker yang dideklarasikan.

## Environment Variables

Contoh lengkap tersedia di [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).
Variabel inti:

  Variable               Keterangan
  ---------------------- ------------------------------------------
  `NODE_ENV`             `development`, `test`, atau `production`
  `PORT`                 Port API, default rancangan 5000
  `APP_URL`              URL backend
  `FRONTEND_URL`         Origin frontend yang diizinkan
  `DATABASE_URL`         Connection string PostgreSQL
  `REDIS_URL`            Connection string Redis
  `JWT_ACCESS_SECRET`    Secret access token
  `JWT_REFRESH_SECRET`   Secret refresh token
  `LLM_PROVIDER`         `ollama`, `gemini`, atau `openai`
  `EMBEDDING_PROVIDER`   Provider embedding
  `GEMINI_API_KEY`       API key Gemini
  `OPENAI_API_KEY`       API key OpenAI
  `OLLAMA_BASE_URL`      URL service Ollama
  `S3_ENDPOINT`          Endpoint MinIO/S3
  `S3_BUCKET`            Nama bucket
  `S3_ACCESS_KEY`        Access key storage
  `S3_SECRET_KEY`        Secret key storage
  `SMTP_HOST`            SMTP host
  `SMTP_PORT`            SMTP port
  `MAIL_FROM`            Alamat pengirim

## Struktur Repository

``` text
aixel-backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── dto/
│     ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── attributes/
│   │   ├── knowledge-base/
│   │   ├── course-materials/
│   │   ├── question-bank/
│   │   ├── rubrics/
│   │   ├── rules/
│   │   ├── pretest/
│   │   ├── goals/
│   │   ├── course/
│   │   ├── mentoring/
│   │   ├── mentor/
│   │   ├── interviews/
│   │   ├── member-attributes/
│   │   ├── certificates/
│   │   ├── notifications/
│   │   ├── dashboards/
│   │   ├── ai-monitoring/
│   │   ├── interventions/
│   │   ├── audit/
│   │   └── health/
│   ├── ai/
│   │   ├── providers/
│   │   ├── rag/
│   │   ├── prompt/
│   │   └── grading/
│   ├── queues/
│   ├── storage/
│   └── mail/
├── docs/
├── test/
├── docker/
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── package.json
└── package-lock.json
```

Struktur di atas adalah struktur target. Folder dan module dibuat
bertahap sesuai fase implementasi.

## Perintah Pengembangan

  Command                      Fungsi
  ---------------------------- -----------------------------------------
  `npm run start`              Menjalankan aplikasi
  `npm run start:dev`          Development dengan watch
  `npm run start:debug`        Debug mode
  `npm run build`              Build TypeScript
  `npm run start:prod`         Menjalankan hasil build
  `npm run lint`               Menjalankan linter jika script tersedia
  `npm run test`               Unit test
  `npm run test:e2e`           End-to-end test
  `npm run test:cov`           Test coverage
  `npm run migration:run`      Menjalankan migration
  `npm run migration:revert`   Revert migration terakhir
  `npm run seed`               Menjalankan seed
  `npm run infra:up`           Menyalakan layanan lokal
  `npm run infra:down`         Menghentikan layanan lokal

Perintah bergantung pada script yang benar-benar terdaftar di
`package.json`.

## Database dan Migration

-   PostgreSQL menjadi database utama.
-   TypeORM digunakan untuk entity dan migration.
-   `synchronize` harus tetap `false`.
-   Perubahan schema harus dikirim melalui migration.
-   Extension `vector`, kolom vector, HNSW index, partial unique index,
    dan CHECK constraint dapat memerlukan SQL migration eksplisit.

Panduan lengkap: [docs/DATABASE.md](docs/DATABASE.md).

## API dan Swagger

Rancangan prefix API:

``` text
/api/v1
```

Swagger direncanakan tersedia pada:

``` text
http://localhost:5000/api/docs
```

Konfigurasi URI versioning, global prefix `api`, dan Swagger harus
diterapkan di `src/main.ts`. Detail konvensi API ada di
[docs/API.md](docs/API.md).

## Background Jobs

BullMQ menggunakan Redis sebagai backend queue. Pekerjaan yang berat
atau tidak harus selesai dalam siklus HTTP sebaiknya diproses oleh
worker terpisah. Rancangan deployment menggunakan image aplikasi yang
sama dengan proses API dan worker yang berbeda.

Detail: [docs/WORKERS.md](docs/WORKERS.md).

## AI Integration

Provider yang direncanakan:

-   Gemini.
-   OpenAI.
-   Ollama.

Pemilihan provider menggunakan `LLM_PROVIDER` dan `EMBEDDING_PROVIDER`.
Implementasi sebaiknya memakai interface `LlmProvider` dan
`EmbeddingProvider` agar business logic tidak bergantung langsung pada
SDK provider.

Detail: [docs/AI_INTEGRATION.md](docs/AI_INTEGRATION.md).

## Testing

Prioritas pengujian:

1.  Unit test aturan bisnis: progres level, cooldown, kuota mentee, dan
    kalkulasi kelulusan.
2.  E2E test alur penting: authentication, batas goal, level lock,
    mentor request, dan evaluasi.
3.  Mock `LlmProvider` agar unit test deterministik.
4.  Pengujian kualitas prompt dilakukan terpisah dari CI wajib.
5.  CI menjalankan lint, build, unit test, E2E test dengan
    PostgreSQL/Redis, dan Docker build.

Detail: [docs/TESTING.md](docs/TESTING.md).

## Git Workflow

Branch yang digunakan:

-   `main`: production.
-   `develop`: integrasi dan staging.
-   `feature/<module>-<description>`: pengembangan fitur.
-   `fix/<description>`: perbaikan bug.
-   `hotfix/<description>`: perbaikan darurat production.

Alur kontribusi:

1.  Buat branch dari `develop`.
2.  Implementasikan perubahan.
3.  Jalankan lint, test, dan build.
4.  Buat Pull Request ke `develop`.
5.  Minta review dan pastikan CI lulus.
6.  Merge menggunakan squash merge.
7.  Rilis dari `develop` ke `main` melalui Pull Request dan tag SemVer.

Gunakan Conventional Commits, misalnya:

``` text
feat(auth): implement refresh token rotation
fix(goals): prevent duplicate active goals
chore: update docker infrastructure
docs(api): document authentication endpoints
test(mentoring): add quota validation tests
```

Detail: [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

## Dokumentasi Tambahan

-   [Architecture](docs/ARCHITECTURE.md)
-   [API conventions](docs/API.md)
-   [Database and migrations](docs/DATABASE.md)
-   [Environment variables](docs/ENVIRONMENT.md)
-   [AI integration](docs/AI_INTEGRATION.md)
-   [Background workers](docs/WORKERS.md)
-   [Testing strategy](docs/TESTING.md)
-   [Deployment](docs/DEPLOYMENT.md)
-   [Contribution guide](docs/CONTRIBUTING.md)
-   [Security](docs/SECURITY.md)
-   [Implementation roadmap](docs/ROADMAP.md)

## Troubleshooting

### Port sudah digunakan

Periksa port yang digunakan, lalu ubah mapping port pada Compose atau
port API pada `.env`.

Windows:

``` powershell
netstat -ano | findstr :5000
```

### Container tidak berjalan

``` bash
docker compose ps
docker compose logs postgres
docker compose logs redis
```

### Database gagal terkoneksi

Periksa `DATABASE_URL`, status container, port, username, password, dan
nama database.

### Redis gagal terkoneksi

Periksa `REDIS_URL` dan pastikan Redis berjalan:

``` bash
docker compose logs redis
```

### Migration tidak ditemukan

Pastikan file migration berada pada direktori yang sesuai dengan glob di
`src/config/data-source.ts`, dan TypeORM CLI menggunakan DataSource yang
benar.

### Swagger tidak tersedia

Pastikan `SwaggerModule.setup()` sudah dipanggil dan aplikasi berhasil
listen pada port yang benar.

## Security

-   Jangan commit `.env`, API key, JWT secret, credential database, atau
    credential object storage.
-   Gunakan secret yang berbeda untuk development, staging, dan
    production.
-   Gunakan HTTPS di production.
-   Aktifkan validasi request dan rate limiting.
-   Hash password menggunakan Argon2.
-   Batasi CORS pada origin frontend yang benar.
-   Jangan aktifkan TypeORM `synchronize` di production.
-   Terapkan least privilege untuk database dan object storage.
-   Jangan menulis token, password, atau data sensitif ke log.

## License

Tambahkan lisensi repository sesuai keputusan pemilik proyek.
