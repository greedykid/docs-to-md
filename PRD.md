# Product Requirement Document (PRD)
## Proyek: DocxToMarkdown - Native Web Converter

---

## 1. Ringkasan Proyek (Overview)
**DocxToMarkdown** adalah aplikasi berbasis web native yang berfungsi untuk mengonversi dokumen Microsoft Word (`.docx`) menjadi format Markdown (`.md`). Aplikasi ini berjalan sepenuhnya di sisi klien (client-side/browser), mengutamakan kecepatan, kesederhanaan, dan keamanan data tanpa memerlukan proses unggah ke server luar.

## 2. Tujuan Proyek (Objectives)
* **Efisiensi:** Mempercepat alur kerja penulis, developer, dan content creator dalam memindahkan dokumen dari Word ke platform berbasis Markdown (seperti GitHub, Notion, atau static site generators).
* **Privasi Maksimal:** Memastikan keamanan dokumen pengguna dengan melakukan pemrosesan data 100% di browser lokal.
* **Tanpa Instalasi:** Menghadirkan alat yang ringan, responsif, dan langsung bisa digunakan di browser modern mana pun.

---

## 3. Profil Pengguna (User Persona)
* **Technical Writer / Blogger:** Menulis draf di Word/Google Docs dan ingin menerbitkannya ke blog berbasis Markdown (Hugo, Jekyll, Dev.to).
* **Developer:** Mengonversi dokumentasi teknis format `.docx` lama milik perusahaan ke repositori GitHub/GitLab.
* **Mahasiswa / Akademisi:** Memindahkan catatan kuliah ke aplikasi berbasis Markdown seperti Obsidian.

---

## 4. Ruang Lingkup Fitur (Scope of Features)

### 4.1 Fitur Utama (In-Scope)
* **Sistem Unggah File:**
  * Area *Drag-and-Drop* file `.docx`.
  * Tombol eksplorasi file lokal standard.
* **Mesin Konversi (Parser):**
  * Konversi otomatis elemen teks utama: Heading (H1-H6), Tebal (*Bold*), Miring (*Italic*), dan Coret (*Strikethrough*).
  * Konversi daftar/list (Ordered & Unordered list).
  * Konversi tabel standar (baris dan kolom).
  * Konversi tautan (Hyperlink) dan penanda gambar (Image tags).
  * Konversi blok kode (Code blocks) dan kutipan (Blockquotes).
* **Antarmuka Pengguna (UI) Dua Panel:**
  * **Panel Kiri:** Area input/unggah dokumen.
  * **Panel Kanan:** Hasil konversi teks Markdown mentah (Raw) beserta pratinjau hasil render (Preview).
* **Aksi Cepat (Quick Actions):**
  * Tombol *Copy to Clipboard* untuk menyalin Markdown secara instan.
  * Tombol *Download* untuk langsung mengunduh file berupa ekstensi `.md`.

### 4.2 Di Luar Ruang Lingkup (Out-of-Scope)
* Sistem login, registrasi, atau penyimpanan database pengguna.
* Konversi massal (*bulk conversion*) banyak file sekaligus (Fase 1 hanya fokus pada satu file per sesi).
* Editor Markdown tingkat lanjut (aplikasi ini hanya bersifat sebagai konverter, bukan editor teks penuh).

---

## 5. Kebutuhan Fungsional (Functional Requirements)

| ID | Fitur | Deskripsi | Prioritas |
| :--- | :--- | :--- | :--- |
| **FR-01** | Drag & Drop Input | Pengguna dapat menjatuhkan file `.docx` langsung ke area browser. | High |
| **FR-02** | Client-Side Parsing | Proses konversi menggunakan library JavaScript (misal: `mammoth.js`) langsung di browser tanpa API backend. | High |
| **FR-03** | Split Screen View | Menampilkan kode Markdown mentah berdampingan dengan visual preview-nya. | Medium |
| **FR-04** | One-Click Export | Menyediakan opsi cepat untuk menyalin teks atau mengunduh dokumen `.md`. | High |
| **FR-05** | Error Handling | Menampilkan pesan peringatan yang jelas jika file rusak atau bukan format `.docx`. | High |

---

## 6. Kebutuhan Non-Fungsional (Non-Functional Requirements)

* **Kinerja (Performance):** Proses konversi untuk file berukuran standar (< 10MB) harus selesai dalam waktu kurang dari 2 detik.
* **Keamanan & Privasi:** Tidak ada data sensitif dari dokumen yang dikirim ke jaringan atau server pihak ketiga. 
* **Kompatibilitas Browser:** Berjalan optimal di versi terbaru Google Chrome, Mozilla Firefox, Safari, dan Microsoft Edge.
* **Teknologi Utama (Tech Stack):**
  * **Frontend:** HTML5, CSS3 (atau Tailwind CSS via CDN untuk estetika cepat), Vanilla JavaScript (ES6+).
  * **Library Pendukung:** `mammoth.js` (untuk ekstraksi konten `.docx`) dan `marked.js` (opsional, untuk render preview Markdown ke HTML).

---

## 7. Alur Pengguna (User Flow)
1. Pengguna membuka aplikasi web.
2. Pengguna menyeret file `.docx` ke area *dropzone* (atau klik tombol "Pilih File").
3. Aplikasi membaca file dan langsung memproses konversi di latar belakang.
4. Teks Markdown otomatis muncul di panel hasil.
5. Pengguna memeriksa hasil lewat tab *Preview* atau langsung menekan tombol *Copy* / *Download* untuk mengambil hasilnya.