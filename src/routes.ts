import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { LinkFinder } from '@/lib/scanner';
import { filtrarURLs } from '@/utils/filter';
import { Scrap } from '@/lib/scan';

export default async function routes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get('/ping', (request, reply) => {
    return { status: 'pong', timestamp: new Date().toISOString() };
  });

  fastify.post('/scrap', async (request, reply) => {
    const { url } = <{ url: string }>request.body;

    console.log({ url });

    const finder = new Scrap();

    try {
      const content = await finder.getScrap({ url });

      return content;
    } catch (error) {
      reply.code(400);
      return {
        error: 'Erro ao processar URL',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  });

  fastify.post('/analyze/url', async (request, reply) => {
    const { url, baseUrl, filter } = <{ url: string; baseUrl?: string; filter?: any[] }>request.body;
    const finder = new LinkFinder();

    try {
      const content = await finder.downloadContent(url);
      const links = finder.extractLinks(content, baseUrl || url);

      const filters = filtrarURLs(links, filter);

      const result = {
        source: url,
        filter,
        urls: filters,
        links: finder.getAllLinks(),
        stats: finder.getStats({ filters }),
        processedAt: new Date().toISOString(),
      };

      return result;
    } catch (error) {
      reply.code(400);
      return {
        error: 'Erro ao processar URL',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  });
}
