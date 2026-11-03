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

## 8. CORS

Izinkan origin frontend yang berasal dari `FRONTEND_URL`. Jangan
menggunakan wildcard origin bersama `credentials: true` untuk
production.

## 9. API Versioning

Gunakan URI versioning agar perubahan kontrak dapat dikelola secara
eksplisit. Perubahan breaking sebaiknya diperkenalkan pada versi baru.
