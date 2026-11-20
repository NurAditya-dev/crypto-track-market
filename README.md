# React + Vite

## Mengaktifkan login Google

1. Salin `.env.example` ke `.env.local`. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` dengan Project URL dan publishable key dari proyek Supabase.
2. Di Google Cloud, konfigurasikan layar persetujuan OAuth dan buat OAuth client jenis **Web application**. Masukkan origin website ke **Authorized JavaScript origins** dan URL callback yang ditampilkan penyedia Google di Supabase ke **Authorized redirect URIs**.
3. Di Supabase Authentication, aktifkan penyedia **Google** dan simpan Client ID serta Client Secret dari Google di pengaturan penyedia tersebut.
4. Di **URL Configuration**, atur **Site URL** ke alamat website dan izinkan URL beranda untuk setiap lingkungan, misalnya `http://localhost:5173/` untuk Vite. Setelah login, pengguna kembali ke beranda.
5. Jalankan ulang `npm run dev`. Untuk produksi, isi kedua variabel di lingkungan build lalu build dan deploy ulang. Pilih **Masuk dengan Google**, selesaikan persetujuan, lalu periksa nama akun setelah halaman dimuat ulang dan coba **Keluar**.

[Panduan Google OAuth di Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
