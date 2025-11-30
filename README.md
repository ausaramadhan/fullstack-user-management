
# User Management System - Fullstack Developer CRUD

Aplikasi manajemen pengguna *end-to-end* yang dibangun menggunakan **Express.js** (Backend) dan **Next.js** (Frontend). Aplikasi ini menerapkan fitur keamanan tingkat lanjut seperti RBAC, Refresh Token Rotation, Audit Logging, serta optimasi performa menggunakan Redis Caching. Seluruh lingkungan pengembangan **dikemas menggunakan Docker** untuk kemudahan deployment dan konsistensi.

## Tech Stack

### Backend
- **Runtime:** Node.js (Express.js + TypeScript)
- **Database:** MySQL (Prisma ORM)
- **Cache:** Redis (ioredis)
- **Validation:** Zod
- **Logging:** Winston
- **Testing:** Jest & Supertest
- **Documentation:** Swagger UI

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios (dengan Interceptors untuk Auto-Refresh Token)

### DevOps & Infrastructure
- **Containerization:** Docker
- **Orchestration:** Docker Compose

### Code Quality 
- **Linter:** ESLint 
- **Formatter:** Prettier 
- **Command:** Jalankan `npm run lint` atau `npm run format` untuk mengecek kualitas kode.

---

##  Prasyarat

Sebelum menjalankan aplikasi, pastikan Anda telah menginstal:
- **Docker Desktop** (Sangat Direkomendasikan untuk setup otomatis)
- *Atau untuk setup manual:* Node.js v20+, MySQL (XAMPP), dan Redis Server.

---

##  Cara Menjalankan Aplikasi

### Metode 1: Menggunakan Docker (Direkomendasikan)
Metode ini adalah cara tercepat dan memenuhi kriteria *Acceptance Criteria* poin 7.

1. **Build dan Jalankan Container:**
   Buka terminal di root folder proyek dan jalankan:
   ```bash
   docker-compose up -d --build

_Tunggu hingga proses build selesai dan semua container (mysql, redis, backend, frontend) berjalan._

2.  **Migrasi Database & Seeding:**
    
    Database di dalam Docker awalnya kosong. Jalankan perintah ini untuk membuat tabel dan mengisi data admin default:
    
       ```Bash
    docker exec -it fullstack_backend npx prisma db push
    docker exec -it fullstack_backend npx prisma db seed
    ```
    
3.  **Akses Aplikasi:**
    
    -   **Frontend:** [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)
        
    -   **Backend API:** [http://localhost:8000](https://www.google.com/search?q=http://localhost:8000)
        
    -   **API Docs (Swagger):** [http://localhost:8000/docs](https://www.google.com/search?q=http://localhost:8000/docs)
        

----------

### Metode 2: Setup Manual (XAMPP/Localhost)

Jika Anda tidak menggunakan Docker, ikuti langkah ini:

#### 1. Setup Database & Redis

-   Nyalakan **MySQL** (via XAMPP). Buat database bernama `fullstack_database`.
    
-   Nyalakan **Redis Server** (Port 6379).
    

#### 2. Setup Backend
```Bash
cd backend
# Install dependencies
```Bash 
npm install

# Pastikan file .env sudah sesuai:
# DATABASE_URL="mysql://root:@localhost:3306/fullstack_database"
# REDIS_HOST=127.0.0.1

# Migrasi & Seed Data
npx prisma db push
npx prisma db seed

# Jalankan Server
npm run dev

```

#### 3. Setup Frontend

```Bash
cd frontend

# Install dependencies
npm install

# Jalankan Frontend
npm run dev

```

----------

##  Akun Login Default

Gunakan kredensial berikut untuk masuk sebagai **Super Admin**:

**Username**  **Password**  **Role**

`admin123`       `admin123`     **admin**

_Catatan: User dummy lainnya juga tersedia dengan password `password123`._

----------

##  Fitur Utama (Acceptance Criteria)


Aplikasi ini telah memenuhi seluruh kriteria teknis:

1.  **Dockerized Environment**
    
    -   Project berjalan sepenuhnya menggunakan `docker-compose` yang menyatukan Backend, Frontend, Database, dan Redis.
        
2.  **RBAC (Role-Based Access Control)**
    
    -   Middleware memastikan hanya Admin yang bisa melakukan CRUD penuh.
        
    -   User biasa dibatasi aksesnya.
        
3.  **Redis Caching**
    
    -   **List User:** Cache aktif (TTL 60s), filter/pagination memicu key cache unik.
        
    -   **Detail User:** Cache aktif, otomatis _invalidate_ (hapus) saat data di-update.
        
4.  **Keamanan Token**
    
    -   Login menghasilkan **Access Token** (pendek) dan **Refresh Token** (panjang).
        
    -   Refresh Token disimpan di Redis (TTL 7 hari) dan di-rotate setiap kali digunakan.
        
    -   Frontend memiliki _Interceptor_ otomatis untuk memperbarui token saat expired (401).
        
5.  **Audit Logging**
    
    -   Setiap aksi **CREATE**, **UPDATE**, dan **DELETE** dicatat di tabel `audit_logs` (MySQL).
        
6.  **Export CSV**
    
    -   Fitur download data user dalam format CSV tersedia di Dashboard.
        
7.  **Testing Coverage**
    
    -   Unit & Integration Test mencakup >80% kode backend.
        

----------

##  Menjalankan Testing

Untuk memverifikasi _coverage_ dan fungsi backend:

```Bash
cd backend
npm test

```

_Hasil tes akan menampilkan laporan coverage._

----------

## 📂 Struktur Direktori

```
FULLSTACK_TEST/
├── backend/               # Express.js API
│   ├── src/
│   │   ├── controllers/   # Logic handler
│   │   ├── middlewares/   # Auth & Validation
│   │   ├── services/      # Business logic & DB access
│   │   └── routes/        # API endpoints
│   ├── prisma/            # Schema & Seed
│   └── tests/             # Jest tests
├── frontend/              # Next.js App
│   ├── src/app/           # Pages (Login, Dashboard, CRUD)
│   └── src/utils/         # Axios interceptor
├── docker-compose.yml     # Konfigurasi Docker
├── fullstack_database.sql # SQL Dump
└── README.md              # Dokumentasi

```
