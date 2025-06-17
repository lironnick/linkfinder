import axios from 'axios';
import cheerio from 'cheerio';
// import { URL } from 'url';
import urlParser from 'url';

class Scrap {
  async getScrap({ url }: { url: string }) {
    if (!url) {
      throw new Error('URL é obrigatória');
    }

    const visitedUrls = new Set();
    const urlsToVisit = [url];
    const allLinks = new Set();
    const baseUrl = new URL(url);

    const isSourceCode = url.match(/\.(js|css|html|ts|jsx|tsx|json)$/i);

    const showProgress = (current: any, total: number, currentUrl: any) => {
      const progress = Math.round((current / total) * 100);
      const barLength = 30;
      const filledLength = Math.round((progress / 100) * barLength);
      const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

      console.clear(); // Limpa o console para atualização
      console.log('\n=== Progresso do Scraping ===');
      // console.log(`URL atual: ${currentUrl}`);
      console.log(`[${bar}] ${progress}%`);
      console.log(`Processados: ${current} de ${total}`);
      console.log(`Links encontrados: ${allLinks.size}`);
      console.log('===========================\n');
    };

    // Contador inicial
    let totalUrls = 1;
    let processedUrls = 0;

    while (urlsToVisit.length > 0) {
      const currentUrl = urlsToVisit.pop();

      if (visitedUrls.has(currentUrl)) {
        processedUrls++;
        showProgress(processedUrls, totalUrls, currentUrl);
        continue;
      }

      try {
        console.log(`Analisando: ${currentUrl}`);
        const response = await axios.get(currentUrl, {
          timeout: 10000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
        });

        visitedUrls.add(currentUrl);
        processedUrls++;

        if (isSourceCode) {
          const content = response.data;

          // Procura por URLs em strings
          const urlRegex = /(https?:\/\/[^\s"']+)/g;
          const matches = content.match(urlRegex);

          if (matches) {
            matches.forEach((match: any) => {
              try {
                const parsedUrl = new URL(match);
                if (parsedUrl.hostname === baseUrl.hostname) {
                  allLinks.add(match);
                  if (!visitedUrls.has(match) && !urlsToVisit.includes(match)) {
                    urlsToVisit.push(match);
                    totalUrls++;
                  }
                }
              } catch (error) {
                console.error(`Erro ao processar URL: ${match}`);
              }
            });
          }

          // Procura por imports/requires
          const importRegex = /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g;
          let importMatch;
          while ((importMatch = importRegex.exec(content)) !== null) {
            const importPath = importMatch[1];
            try {
              const absoluteUrl = urlParser.resolve(currentUrl, importPath);
              const parsedUrl = new URL(absoluteUrl);
              if (parsedUrl.hostname === baseUrl.hostname) {
                allLinks.add(absoluteUrl);
                if (!visitedUrls.has(absoluteUrl) && !urlsToVisit.includes(absoluteUrl)) {
                  urlsToVisit.push(absoluteUrl);
                  totalUrls++;
                }
              }
            } catch (error) {
              console.error(`Erro ao processar import: ${importPath}`);
            }
          }
        } else {
          const $ = cheerio.load(response.data);
          $('a').each((i, link) => {
            const href = $(link).attr('href');
            if (href) {
              try {
                const absoluteUrl = urlParser.resolve(currentUrl, href);
                const parsedUrl = new URL(absoluteUrl);
                if (parsedUrl.hostname === baseUrl.hostname) {
                  allLinks.add(absoluteUrl);
                  if (!visitedUrls.has(absoluteUrl) && !urlsToVisit.includes(absoluteUrl)) {
                    urlsToVisit.push(absoluteUrl);
                    totalUrls++;
                  }
                }
              } catch (error) {
                console.error(`Erro ao processar URL: ${href}`);
              }
            }
          });
        }

        showProgress(processedUrls, totalUrls, currentUrl);

        // Aguarda 1 segundo entre as requisições
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error(`Erro ao acessar ${currentUrl}:`, error.message);
        processedUrls++;
        showProgress(processedUrls, totalUrls, currentUrl);
      }
    }

    // Mostra resultado final
    console.log('\n=== Scraping Concluído ===');
    console.log(`Total de URLs processadas: ${processedUrls}`);
    console.log(`Total de links únicos encontrados: ${allLinks.size}`);
    console.log('===========================\n');

    return {
      url_base: url,
      tipo: isSourceCode ? 'código fonte' : 'página web',
      total_links_encontrados: allLinks.size,
      links: Array.from(allLinks),
    };
  }
}

export { Scrap };
