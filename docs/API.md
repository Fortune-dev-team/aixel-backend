# API Conventions

## 1. Base URL

Development:

``` text
http://localhost:5000
```

Rancangan global prefix dan URI versioning:

``` text
/api/v1
```

Contoh pola endpoint:

``` text
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
```

Contoh tersebut adalah konvensi, bukan pernyataan bahwa endpoint sudah
diimplementasikan.

## 2. Swagger / OpenAPI

Rancangan URL Swagger:

``` text
/api/docs
```

JSON OpenAPI:

``` text
/api/docs-json
```

Gunakan decorator `@ApiTags`, `@ApiOperation`, `@ApiResponse`,
`@ApiBearerAuth`, dan decorator parameter yang sesuai agar dokumentasi
selalu mengikuti controller.

## 3. HTTP Methods

  Method   Penggunaan
  -------- ------------------------------------------
  GET      Membaca resource
  POST     Membuat resource atau menjalankan action
  PUT      Mengganti keseluruhan resource
  PATCH    Mengubah sebagian resource
  DELETE   Menghapus resource

## 4. Status Codes

  Status   Makna
  -------- -----------------------------------------
  200      Request berhasil
  201      Resource berhasil dibuat
  204      Berhasil tanpa response body
  400      Input tidak valid
  401      Belum terautentikasi
  403      Tidak memiliki izin
  404      Resource tidak ditemukan
  409      Konflik dengan kondisi data
  422      Validasi semantik gagal, jika digunakan
  429      Rate limit terlampaui
  500      Kesalahan internal

## 5. Response Format

Rancangan response sukses menggunakan envelope:

``` json
{
  "data": {
    "id": "resource-uuid"
  },
  "meta": {}
}
```

Rancangan response error:

``` json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  },
  "requestId": "request-id"
}
```

Pastikan implementasi interceptor dan exception filter memiliki kontrak
yang konsisten. Jangan membungkus response dua kali.

## 6. Validation

Global `ValidationPipe` direncanakan menggunakan:

-   `whitelist: true`
-   `forbidNonWhitelisted: true`
-   `transform: true`

Contoh DTO:

``` typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

## 7. Authentication

Rancangan authentication memakai: - JWT access token. - JWT refresh
token. - Argon2 untuk password hashing. - Passport JWT strategy. - Guard
global dengan mekanisme pengecualian melalui `@Public()`.

Kebijakan expiry, rotation, revocation, dan penyimpanan refresh token
harus ditetapkan serta diuji sebelum production.

### Uji register, login, dan dashboard dengan Postman

Jalankan PostgreSQL lokal dan API terlebih dahulu. Dengan konfigurasi
Docker Compose repository ini, database tersedia di port `5433`; pastikan
`.env` menggunakan `DATABASE_URL=postgresql://postgres:password@127.0.0.1:5433/aixel_db`
dan menetapkan `JWT_ACCESS_SECRET`. Jalankan API dengan
`npm run start:dev`; base URL default adalah `http://localhost:5000`.

Semua request berikut memakai prefix `/api/v1`.

1. **Register** — buat request `POST
   http://localhost:5000/api/v1/auth/register`, pilih **Body → raw → JSON**:

   ```json
   {
     "fullName": "User Uji",
     "email": "user.uji@example.com",
     "password": "Password123!",
     "confirmPassword": "Password123!"
   }
   ```

   Harapkan status `201` berisi `accessToken` dan data user. Register
   publik sengaja membuat role `tim`, bukan admin.

2. **Login** — buat request `POST
   http://localhost:5000/api/v1/auth/login` dengan Body JSON:

   ```json
   {
     "email": "user.uji@example.com",
     "password": "Password123!"
   }
   ```

   Harapkan status `200`. Salin nilai `accessToken` dari response.

3. **Jadikan akun admin untuk pengujian lokal saja** — dashboard dibatasi
   untuk role `admin`, sehingga akun hasil register biasa akan menerima
   `403` sebelum dipromosikan. Pada database lokal milik sendiri, jalankan
   SQL berikut melalui psql/DBeaver:

   ```sql
   UPDATE users
   SET system_role = 'admin'
   WHERE email = 'user.uji@example.com';
   ```

   Jika database berjalan dari Compose, perintah PowerShell-nya:

   ```powershell
   docker compose exec postgres psql -U postgres -d aixel_db -c "UPDATE users SET system_role = 'admin' WHERE email = 'user.uji@example.com';"
   ```

   Jangan lakukan promosi role lewat endpoint publik atau pada database
   bersama/production.

4. **Login kembali** dengan request pada langkah 2 dan salin token baru.
   Strategi JWT membaca role terbaru dari database pada setiap request;
   token baru tetap disarankan agar alur pengujian jelas.

5. **Akses dashboard** — buat request `GET
   http://localhost:5000/api/v1/admin/dashboard/overview`. Pada tab
   **Authorization**, pilih **Bearer Token** dan tempel token baru. Harapkan
   status `200` beserta ringkasan dashboard.

Endpoint dashboard lain yang tersedia:

- `GET /api/v1/admin/dashboard/member-statistics`
- `GET /api/v1/admin/dashboard/competency-statistics`
- `GET /api/v1/admin/dashboard/activity-summary?page=1&limit=20`

`401` biasanya berarti token hilang/tidak valid/kedaluwarsa; `403` berarti
token valid tetapi role akun bukan `admin`. Jika register mengembalikan
`409`, gunakan email baru atau hapus akun uji lokal yang sudah terdaftar.

## 8. CORS

Izinkan origin frontend yang berasal dari `FRONTEND_URL`. Jangan
menggunakan wildcard origin bersama `credentials: true` untuk
production.

## 9. API Versioning

Gunakan URI versioning agar perubahan kontrak dapat dikelola secara
eksplisit. Perubahan breaking sebaiknya diperkenalkan pada versi baru.
