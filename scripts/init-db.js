/**
 * Convenience script to run Prisma generate + migrate + seed
 * Use with: npm run init-db
 *
 * Note: In CI or production, it's better to run `npx prisma migrate deploy`
 * rather than `migrate dev`.
 */
const { execSync } = require('child_process');

try {
  console.log('Running: npx prisma generate');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('Running: npx prisma migrate dev --name init --preview-feature');
  // remove --preview-feature if your prisma doesn't need it
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });

  console.log('Running seed script: node prisma/seed.js');
  execSync('node prisma/seed.js', { stdio: 'inherit' });

  console.log('DB init complete.');
} catch (err) {
  console.error('Error during init-db:', err.message);
  process.exit(1);
}
