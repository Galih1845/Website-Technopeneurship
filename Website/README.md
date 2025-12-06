# Elvora — Situs Layanan Keuangan & Perdagangan

Situs statis sederhana yang menampilkan layanan: saham, sukuk, obligasi, dan ekspor-impor. Ini adalah versi frontend-only (HTML/CSS/JS). Logo proyek ditempatkan di folder `images`.

Cara menjalankan
- Buka `Index.html` di browser (double-click atau drag ke browser). Tidak perlu server untuk mayoritas fitur.

Menambahkan logo
- Letakkan file logo Anda di `images/logo.png` atau `images/logo.jpg`. Nama default yang dipakai adalah `images/logo.png`. Jika tidak ada, teks merk akan tampil.

Menambahkan gambar layanan
- Untuk ilustrasi tiap layanan, letakkan gambar dengan nama: `images/saham.jpg`, `images/sukuk.jpg`, `images/obligasi.jpg`, `images/eksporimpor.jpg`.

Edit konten
- Daftar layanan ada di `script.js` (array `services`). Ubah `title`, `short`, dan `details` sesuai kebutuhan.

Form & data
- Form pendaftaran/inquiry disimpan di `localStorage` pada kunci `inquiries`. Untuk melihat daftar inquiry, buka Console di browser dan jalankan:

```
JSON.parse(localStorage.getItem('inquiries')||'[]')
```

Catatan
- Ini adalah situs frontend saja. Untuk produksi, hubungkan endpoint backend untuk menyimpan registrasi/inquiry, autentikasi, dan manajemen instrumen keuangan.
