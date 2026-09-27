process.env.DATABASE_URL ??= 'postgresql://pymelegal:pymelegal_dev_pw@localhost:5432/pymelegal';
process.env.AUTH_SECRET ??= 'test-secret-not-for-production-use-only-in-ci';
process.env.APP_URL ??= 'http://localhost:3000';
process.env.LEY_21719_FECHA_PUBLICACION ??= '2024-12-13';
process.env.LEY_21719_VIGENCIA_GENERAL ??= '2026-12-01';
