# DocxToMarkdown - Native Web Converter

**DocxToMarkdown** adalah aplikasi berbasis web *pure client-side* yang memungkinkan Anda mengonversi dokumen Microsoft Word (`.docx`) menjadi format Markdown (`.md`) secara instan dan 100% aman di dalam browser Anda.

Aplikasi ini menggunakan teknologi web modern (HTML5, CSS3, Vanilla JS) dan berjalan sepenuhnya tanpa backend server, sehingga menjamin kerahasiaan dokumen Anda.

---

## Fitur Utama

- **Drag & Drop File:** Seret file `.docx` Anda langsung ke area konverter atau jelajahi file lokal.
- **Client-Side Parsing:** Konversi cepat menggunakan library Javascript di browser lokal (tidak ada data terkirim ke server).
- **Split Screen / Tabbed View:** Lihat hasil Markdown mentah dan hasil visual rendernya secara berdampingan (di desktop) atau bergantian (di mobile).
- **Pengekstrakan Gambar & Panel Aset:** Gambar yang tertanam dalam file `.docx` otomatis diekstrak dan ditampilkan di panel kiri galeri aset. Pengguna dapat mengunduhnya satu per satu atau secara massal (*Download All Images*).
- **Ekspor ZIP Bundle (MD + Gambar):** Mendownload hasil konversi dalam satu file arsip `.zip` yang berisi file `.md` bersih serta folder `media/` yang menampung seluruh gambar terkait. Path gambar di dalam file `.md` otomatis disesuaikan menjadi path relatif (misal: `! [alt](media/image-1.png)`).
- **Workspace Lanjutan ala VS Code:**
  - Tampilan editor penuh mirip VS Code untuk mengunggah folder lokal berisi dokumen Markdown dan gambar (seperti hasil ekstrak file ZIP).
  - Dilengkapi *activity bar*, sidebar explorer folder yang dapat diciutkan (*collapsible file tree*), tab dokumen aktif, dan split editor-preview.
  - **Resolusi Gambar Relatif Otomatis:** Menghubungkan path gambar relatif seperti `media/image.png` ke Blob URL memori browser lokal secara dinamis agar gambar tampil langsung di pratinjau workspace.
  - **Dukungan Mobile Penuh:** Pada layar ponsel, sidebar explorer otomatis menutup saat file dipilih, dan tersedia tombol toggle cepat **Preview** & **Code** di header panel.
- **Customization Settings:**
  - Aktifkan/nonaktifkan konversi tabel (GFM Tables).
  - Dukungan teks coret (~~Strikethrough~~).
  - Offset Heading Level (menggeser tingkat heading secara dinamis, misal H1 menjadi H2).
  - Atur penanganan gambar (konversi ke Base64 inline, penanda placeholder, atau diabaikan).
  - Pilih karakter pembatas garis horizontal (`---`, `***`, `___`).
- **Aksi Cepat:**
  - Tombol **Copy** satu klik untuk menyalin Markdown ke clipboard.
  - Tombol **Download MD** untuk mengunduh dokumen berupa file `.md` mandiri.
  - Tombol **Download ZIP** untuk mengunduh bundel `.md` + aset media.
- **Tema Gelap & Terang:** Tema gelap futuristik bawaan dengan opsi perpindahan ke tema terang yang elegan, terintegrasi penuh ke semua area termasuk VS Code Workspace.


---

## Kebutuhan Sistem

- **Node.js** (versi 16 atau lebih baru direkomendasikan)
- **npm** (biasanya dibundel bersama Node.js)

---

## Petunjuk Instalasi & Konfigurasi

Ikuti langkah-langkah di bawah untuk menjalankan aplikasi di lingkungan pengembangan lokal Anda:

1. **Instal Dependensi:**
   Buka terminal di dalam direktori proyek ini dan jalankan perintah berikut untuk menginstal `vite` (dev server):
   ```bash
   npm install
   ```

2. **Jalankan Development Server:**
   Mulai server pengembangan lokal dengan menjalankan:
   ```bash
   npm run dev
   ```

3. **Buka Aplikasi:**
   Vite akan menjalankan server lokal (biasanya pada alamat `http://localhost:5173`). Buka URL yang tertera pada terminal Anda di browser (Google Chrome, Firefox, Safari, atau Edge).

---

## Struktur Direktori

```text
docs-to-md/
├── PRD.md               # Product Requirements Document
├── README.md            # Dokumentasi panduan instalasi (File ini)
├── index.html           # Struktur HTML utama
├── style.css            # Custom CSS untuk tema gelap/terang & tata letak
├── app.js               # Logic parser dan interaksi UI
└── package.json         # Konfigurasi dependensi npm (Vite)
```

---

## Keamanan & Privasi

Aplikasi ini **tidak mengirimkan data apapun ke server luar**. 
Seluruh pemrosesan dokumen `.docx` menjadi HTML menggunakan `mammoth.js`, konversi HTML ke Markdown menggunakan `turndown.js`, dan visualisasi pratinjau menggunakan `marked.js` dilakukan sepenuhnya di dalam memori web browser lokal Anda. Dokumen Anda aman 100%.
