import { getEnv, isMockAI, isMockOCR, isMockStorage, isMockAntivirus } from './env';

function main() {
  const env = getEnv();
  // eslint-disable-next-line no-console
  console.log('✔ Variables de entorno válidas.');
  // eslint-disable-next-line no-console
  console.log(`  APP_URL: ${env.APP_URL}`);
  // eslint-disable-next-line no-console
  console.log(`  IA: ${isMockAI() ? 'MODO MOCK' : env.AI_PROVIDER}`);
  // eslint-disable-next-line no-console
  console.log(`  OCR: ${isMockOCR() ? 'MODO MOCK' : env.OCR_PROVIDER}`);
  // eslint-disable-next-line no-console
  console.log(`  Almacenamiento: ${isMockStorage() ? 'local (dev)' : 's3'}`);
  // eslint-disable-next-line no-console
  console.log(`  Antivirus: ${isMockAntivirus() ? 'MODO MOCK' : 'externo'}`);
}

main();
