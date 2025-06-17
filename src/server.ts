import fastify from 'fastify';
import cors from '@fastify/cors';
import routes from '@/routes';

const app = fastify({ logger: false }).withTypeProvider(); // LOG servidor

const start = async () => {
  app.register(cors);
  app.register(routes);

  try {
    const port = parseInt('3333');
    const host = '0.0.0.0';

    await app.listen({ port, host });
    console.log(`Servidor rodando no http://localhost:${port}`);

    console.log(`
        📖 Endpoints disponíveis:
          GET  /ping             - Health check
          POST /analyze/url      - Analisa JavaScript de URL
    `);
  } catch (err) {
    console.error(err);
  }
};

start();
