Local server for Elvora demo

How to run:

1. Install Node.js (v18+ recommended)
2. In project folder run (PowerShell):

   npm install
   npm run start

3. Server will listen on `http://localhost:3000` by default.

Useful endpoints:
- POST /api/register  (multipart/form-data) — accepts form fields and files (ktpFile, selfieKtp)
- POST /api/login     (application/json) — body { identifier, password }
- GET  /api/_debug/users — list registered users (debug only)

Expose to public:
- For quick testing, use `ngrok http 3000` and share the generated URL.
- For production, deploy to a VPS or platform (Render, Heroku, DigitalOcean App Platform, Azure, AWS) and configure large-file storage with S3/Azure Blob.

Scaling notes:
- Local disk is fine for demos but not for "super besar" storage. For large-scale storage use S3 / Azure Blob / Google Cloud Storage and stream uploads to the cloud (multipart upload).
- Use a real database (Postgres, MySQL, or managed DB) for user data.
- Protect endpoints (HTTPS, rate limit, auth) and validate uploads (size/type) in production.
