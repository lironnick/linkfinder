import axios from 'axios';
import cheerio from 'cheerio';

type ScrapResult = {
  url_base: string;
  tipo: string;
  total_links_encontrados: number;
  links: string[];
};

class Scrap {
  private concurrencyLimit = 5;

  async getScrap({ url }: { url: string }): Promise<ScrapResult> {
    if (!url) throw new Error('URL é obrigatória');

    const visitedUrls = new Set<string>();
    const allLinks = new Set<string>();
    const baseUrl = new URL(url);

    const isSourceCode = url.match(/\.(js|css|html|ts|jsx|tsx|json)$/i);

    const queue: string[] = [url];

    const resolveUrl = (from: string, to: string) => {
      try {
        return new URL(to, from).toString();
      } catch {
        return null;
      }
    };

    const extractLinksFromSource = (content: string, currentUrl: string) => {
      // URLs em strings
      const urlRegex = /(https?:\/\/[^\s"']+)/g;
      const matches = content.match(urlRegex) || [];
      for (const match of matches) {
        const parsed = this.safeParseUrl(match);
        if (parsed && parsed.hostname === baseUrl.hostname) {
          allLinks.add(match);
          if (!visitedUrls.has(match)) queue.push(match);
        }
      }
      // imports/requires
      const importRegex = /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g;
      let importMatch;
      while ((importMatch = importRegex.exec(content)) !== null) {
        const importPath = importMatch[1];
        const absoluteUrl = resolveUrl(currentUrl, importPath);
        if (!absoluteUrl) continue;
        const parsed = this.safeParseUrl(absoluteUrl);
        if (parsed && parsed.hostname === baseUrl.hostname) {
          allLinks.add(absoluteUrl);
          if (!visitedUrls.has(absoluteUrl)) queue.push(absoluteUrl);
        }
      }
    };

    const extractLinksFromHtml = (html: string, currentUrl: string) => {
      const $ = cheerio.load(html);
      $('a[href]').each((_, link) => {
        const href = $(link).attr('href');
        if (!href) return;
        const absoluteUrl = resolveUrl(currentUrl, href);
        if (!absoluteUrl) return;
        const parsed = this.safeParseUrl(absoluteUrl);
        if (parsed && parsed.hostname === baseUrl.hostname) {
          allLinks.add(absoluteUrl);
          if (!visitedUrls.has(absoluteUrl)) queue.push(absoluteUrl);
        }
      });
    };

    let processed = 0;

    const processUrl = async (currentUrl: string) => {
      if (visitedUrls.has(currentUrl)) return;
      visitedUrls.add(currentUrl);
      try {
        const response = await axios.get(currentUrl, {
          timeout: 10000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
        });
        if (isSourceCode) {
          extractLinksFromSource(response.data, currentUrl);
        } else {
          extractLinksFromHtml(response.data, currentUrl);
        }
      } catch (error: any) {
        // Silencia erros de requisição
      } finally {
        processed++;
        this.showProgress(processed, queue.length + processed, allLinks.size);
      }
    };

    while (queue.length > 0) {
      const batch = queue.splice(0, this.concurrencyLimit);
      await Promise.allSettled(batch.map(processUrl));
    }

    this.showFinalResult(processed, allLinks.size);

    return {
      url_base: url,
      tipo: isSourceCode ? 'código fonte' : 'página web',
      total_links_encontrados: allLinks.size,
      links: Array.from(allLinks),
    };
  }

  private safeParseUrl(url: string): URL | null {
    try {
      return new URL(url);
    } catch {
      return null;
    }
  }

  private showProgress(current: number, total: number, found: number) {
    const progress = Math.round((current / total) * 100);
    const barLength = 30;
    const filledLength = Math.round((progress / 100) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    console.log(`[${bar}] ${progress}% | Processados: ${current}/${total} | Links encontrados: ${found}`);
  }

  private showFinalResult(processed: number, found: number) {
    console.log('\n=== Scraping Concluído ===');
    console.log(`Total de URLs processadas: ${processed}`);
    console.log(`Total de links únicos encontrados: ${found}`);
    console.log('===========================\n');
  }
}

export { Scrap };
