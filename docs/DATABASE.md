# Database Guide

## 1. Database Technology

-   PostgreSQL sebagai relational database utama.
-   TypeORM sebagai ORM.
-   `pg` sebagai PostgreSQL driver.
-   `pgvector` untuk penyimpanan dan pencarian embedding.

## 2. Connection

Contoh:

``` env
DATABASE_URL=postgresql://postgres:password@localhost:5432/aixel_db
```

DataSource CLI berada di:

``` text
src/config/data-source.ts
```

Contoh konfigurasi:

``` typescript
import 'dotenv/config';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
```

Sesuaikan glob dengan output build dan lokasi file aktual. Pastikan CLI
menemukan entity serta migration yang benar.

## 3. Migration Policy

`synchronize` harus `false`. Perubahan schema dilakukan melalui
migration dan direview melalui Pull Request.

Script yang direncanakan:

``` bash
npm run migration:generate -- src/database/migrations/CreateUsers
npm run migration:run
npm run migration:revert
```

Periksa sintaks CLI TypeORM sesuai versi yang terpasang. Migration yang
sudah dijalankan pada environment bersama tidak boleh diedit diam-diam;
buat migration baru untuk koreksi.

## 4. pgvector

Aktifkan extension melalui migration:

``` sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Contoh kolom vector:

``` sql
-- Dimensi harus sesuai model embedding yang dipilih.
-- Contoh ini hanya ilustrasi untuk embedding 768 dimensi.
ALTER TABLE knowledge_chunks
ADD COLUMN embedding vector(768);
```

Dimensi embedding harus konsisten antara provider, konfigurasi, dan
schema database.

Index HNSW dapat dibuat melalui SQL migration setelah tipe vector dan
kebutuhan distance metric ditentukan. Pertimbangkan ukuran data, pola
query, dan biaya index sebelum memilih parameter index.

## 5. Constraints and Indexes

Aturan integritas yang relevan dapat memerlukan SQL migration
eksplisit: - Foreign key. - Unique constraint. - CHECK constraint. -
Partial unique index. - Index untuk kolom pencarian dan relasi. - Vector
index.

Jangan mengandalkan validasi aplikasi saja untuk invariant yang harus
dijaga database.

## 6. Transaction

Gunakan transaction untuk operasi yang terdiri dari beberapa perubahan
data yang harus berhasil atau gagal sebagai satu kesatuan.

Contoh pola TypeORM:

``` typescript
await dataSource.transaction(async (manager) => {
  // Gunakan manager yang diberikan untuk seluruh query transaksi.
});
```

Untuk concurrency-sensitive business rules, definisikan invariant,
isolation requirement, locking strategy, dan retry behavior sebelum
implementasi.

## 7. Seed

Seed digunakan untuk data awal yang diperlukan pada environment
development atau deployment tertentu, misalnya: - Kategori contoh. -
Atribut contoh. - Default system rules. - Admin pertama.

Seed harus idempotent jika memungkinkan: menjalankan seed berulang kali
tidak boleh membuat duplikasi data. Kredensial admin awal harus
diberikan melalui environment/secret, bukan hardcoded.

## 8. Backup and Restore

Production perlu backup terjadwal menggunakan `pg_dump` dan penyimpanan
backup pada object storage yang aman. Uji restore secara berkala; file
backup yang belum pernah diuji restore belum dapat dianggap sebagai
strategi pemulihan yang tervalidasi.

## 9. Local Database Commands

``` bash
docker compose up -d postgres
docker compose logs -f postgres
docker compose exec postgres pg_isready -U postgres
```

Untuk menghentikan:

``` bash
docker compose stop postgres
```
