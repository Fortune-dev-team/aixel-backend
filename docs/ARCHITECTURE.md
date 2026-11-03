# Aixel Backend Architecture

## 1. Tujuan

Dokumen ini menjelaskan batas tanggung jawab komponen backend Aixel,
hubungan antarlapisan, dan prinsip desain yang perlu dijaga selama
implementasi.

## 2. Architectural Overview

Aixel menggunakan backend modular berbasis NestJS. Domain dipisahkan
menjadi module agar controller, service, DTO, entity, dan aturan bisnis
memiliki batas tanggung jawab yang jelas.

``` mermaid
flowchart TB
    Client[Web Client] --> API[REST API / NestJS]
    API --> Common[Common Layer]
    API --> Modules[Domain Modules]
    Modules --> DB[(PostgreSQL)]
    Modules --> Cache[(Redis)]
    Modules --> Storage[MinIO / S3]
    Modules --> AI[AI Provider Layer]
    Modules --> Queue[BullMQ]
    Queue --> Worker[Worker]
    Worker --> DB
    Worker --> AI
    API --> WS[Socket.IO]
    API --> Email[SMTP / Nodemailer]
```

## 3. Architectural Layers

### API / Presentation

Tanggung jawab: - Menerima HTTP request. - Memvalidasi input melalui
DTO. - Memeriksa authentication dan authorization. - Memanggil
application service. - Mengembalikan response sesuai kontrak API.

Controller tidak sebaiknya berisi query database kompleks atau aturan
bisnis yang besar.

### Application / Domain Modules

Tanggung jawab: - Menjalankan use case. - Mengkoordinasikan repository
dan provider. - Menegakkan business invariant. - Mengelola transaksi
yang diperlukan.

Module domain yang direncanakan:

  Module              Ruang lingkup
  ------------------- ----------------------------------------
  auth                Register, login, token, reset password
  users               Profil dan data pengguna
  attributes          Atribut kompetensi
  knowledge-base      Dokumen dan basis pengetahuan
  course-materials    Materi pembelajaran
  question-bank       Bank soal
  rubrics             Rubrik penilaian
  rules               Aturan sistem
  pretest             Tes awal
  goals               Target dan progres
  course              Course dan aktivitas belajar
  mentoring           Proses mentoring
  mentor              Data dan ketersediaan mentor
  interviews          Wawancara dan evaluasi
  member-attributes   Atribut anggota
  certificates        Sertifikat
  notifications       Notifikasi
  dashboards          Ringkasan data
  ai-monitoring       Monitoring penggunaan AI
  interventions       Intervensi pembelajaran
  audit               Audit trail
  health              Health check

Daftar ini adalah domain target; keberadaan folder tidak berarti use
case telah selesai.

### Infrastructure

Berisi integrasi eksternal: - TypeORM dan PostgreSQL. - Redis dan
BullMQ. - MinIO/S3. - SMTP. - AI provider. - WebSocket adapter.

### Common

Berisi komponen lintas domain: - Decorators. - Guards. - Exception
filters. - Interceptors. - Pipes. - DTO umum.

## 4. Cross-cutting Components

Komponen yang direncanakan:

-   `@CurrentUser()`: mengambil identitas user dari request.
-   `@Roles()`: mendeklarasikan role yang diizinkan.
-   `@Public()`: menandai endpoint yang tidak memerlukan autentikasi.
-   `JwtAuthGuard`: validasi JWT.
-   `RolesGuard`: otorisasi berdasarkan role.
-   `AllExceptionsFilter`: format error konsisten.
-   `ResponseInterceptor`: format response sukses.
-   `AuditInterceptor`: pencatatan aktivitas yang perlu diaudit.
-   `BaseEntity`: UUID, `createdAt`, dan `updatedAt`.

## 5. API Request Lifecycle

``` mermaid
sequenceDiagram
    participant C as Client
    participant N as NestJS
    participant G as Guards
    participant V as Validation Pipe
    participant S as Service
    participant D as PostgreSQL
    C->>N: HTTP Request
    N->>G: Authentication / Authorization
    G-->>N: Allowed
    N->>V: Validate DTO
    V-->>N: Validated Input
    N->>S: Execute Use Case
    S->>D: Query / Transaction
    D-->>S: Result
    S-->>N: Domain Result
    N-->>C: HTTP Response
```

Urutan aktual dapat dipengaruhi oleh lifecycle NestJS dan konfigurasi
global.

## 6. Data Ownership

-   PostgreSQL adalah sumber data utama.
-   Redis adalah cache dan queue backend, bukan pengganti database
    utama.
-   MinIO/S3 menyimpan binary file; metadata file dapat disimpan di
    PostgreSQL.
-   Provider AI adalah layanan eksternal; hasil yang perlu dipertahankan
    harus disimpan sesuai kebutuhan use case.

## 7. Design Principles

1.  Pisahkan controller dari business logic.
2.  Gunakan DTO untuk input dan output API.
3.  Gunakan migration untuk semua perubahan schema.
4.  Jangan mengaktifkan `synchronize` pada production.
5.  Isolasi SDK AI di balik interface provider.
6.  Gunakan queue untuk pekerjaan berat.
7.  Buat unit test untuk business invariant.
8.  Hindari ketergantungan antar-module yang membentuk circular
    dependency.
9.  Catat operasi penting melalui audit mechanism.
10. Jangan menyimpan secret dalam source code.
