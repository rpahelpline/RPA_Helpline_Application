import { preview } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = parseInt(process.env.PORT || '4173');
const host = '0.0.0.0';

try {
  const server = await preview({
    build: {
      outDir: resolve(__dirname, 'dist'),
    },
    preview: {
      port: port,
      host: host,
      strictPort: false,
      allowedHosts: [
        'rpa-helpline-application.onrender.com',
        '.onrender.com',
        'localhost',
        '127.0.0.1',
      ],
    },
  });

  console.log(`✓ Server running at http://${host}:${port}`);
  console.log(`✓ Preview server ready`);
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}

