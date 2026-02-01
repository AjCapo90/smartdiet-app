import { buildApp } from './app/app';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port, host });
    console.log(`🚀 Calo API running at http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
