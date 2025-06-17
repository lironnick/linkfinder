import https from 'https';
import http from 'http';
import { URL } from 'url';

// Interfaces
export type LinkFinderResultProps = {
  source: string;
  filters: any[];
  all: string[];
  links: string[];
  urls: string[];
  stats: {
    total: number;
    filters: number;
    urls: number;
    endpoints: number;
    api: number;
  };
  processedAt: string;
};

export type AnalyzeUrlBodyProps = {
  url: string;
  baseUrl?: string;
};

export type AnalyzeTextBodyProps = {
  content: string;
  filename?: string;
};

// Classe principal LinkFinder
class LinkFinder {
  private patterns: RegExp[];
  private foundLinks: Set<string>;

  constructor() {
    this.patterns = [
      // URLs completas
      /https?:\/\/[^\s"'<>]+/gi,

      // Endpoints relativos
      /["'`]\/[a-zA-Z0-9\/_\-\.]*["'`]/gi,

      // API endpoints
      /["'`]\/api\/[a-zA-Z0-9\/_\-\.]*["'`]/gi,

      // Endpoints com parâmetros
      /["'`]\/[a-zA-Z0-9\/_\-\.]*\?[a-zA-Z0-9=&_\-]*["'`]/gi,

      // Rotas do tipo "/users/{id}"
      /["'`]\/[a-zA-Z0-9\/_\-\.]*\{[a-zA-Z0-9_]*\}[a-zA-Z0-9\/_\-\.]*["'`]/gi,

      // Endpoints em objetos
      /url\s*:\s*["'`]\/[a-zA-Z0-9\/_\-\.]*["'`]/gi,

      // Ajax calls
      /\.get\s*\(\s*["'`]\/[a-zA-Z0-9\/_\-\.]*["'`]/gi,
      /\.post\s*\(\s*["'`]\/[a-zA-Z0-9\/_\-\.]*["'`]/gi,
      /\.put\s*\(\s*["'`]\/[a-zA-Z0-9\/_\-\.]*["'`]/gi,
      /\.delete\s*\(\s*["'`]\/[a-zA-Z0-9\/_\-\.]*["'`]/gi,

      // Fetch API
      /fetch\s*\(\s*["'`][^"'`]*["'`]/gi,

      // XMLHttpRequest
      /\.open\s*\(\s*["'`][^"'`]*["'`]\s*,\s*["'`][^"'`]*["'`]/gi,

      // Axios
      /axios\.(get|post|put|delete|patch)\s*\(\s*["'`][^"'`]*["'`]/gi,

      // jQuery AJAX
      /\$\.(get|post|ajax)\s*\(\s*["'`][^"'`]*["'`]/gi,
    ];

    this.foundLinks = new Set();
  }

  reset(): void {
    this.foundLinks.clear();
  }

  extractLinks(content: string, baseUrl?: string): string[] {
    const links = new Set<string>();

    this.patterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          let cleanLink = this.cleanLink(match);

          if (cleanLink && this.isValidLink(cleanLink)) {
            // Se temos uma baseUrl e o link é relativo, constrói URL completa
            if (baseUrl && cleanLink.startsWith('/') && !cleanLink.startsWith('//')) {
              try {
                const base = new URL(baseUrl);
                cleanLink = `${base.protocol}//${base.host}${cleanLink}`;
              } catch (e) {
                // Mantém o link original se não conseguir construir a URL
              }
            }

            links.add(cleanLink);
            this.foundLinks.add(cleanLink);
          }
        });
      }
    });

    return Array.from(links);
  }

  private cleanLink(match: string): string {
    let cleanLink = match.replace(/["'`]/g, '').trim();

    // Remove prefixos de métodos
    cleanLink = cleanLink.replace(
      /^(\.get|\.post|\.put|\.delete|fetch|url\s*:|\.open|axios\.(get|post|put|delete|patch)|\$\.(get|post|ajax))\s*\(\s*/,
      ''
    );
    cleanLink = cleanLink.replace(/\s*,.*$/, '');

    return cleanLink;
  }

  private isValidLink(link: string): boolean {
    if (link.length < 2) return false;

    const invalidExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.css', '.ico', '.svg', '.woff', '.woff2', '.ttf'];
    if (invalidExtensions.some((ext) => link.toLowerCase().endsWith(ext))) {
      return false;
    }

    if (link.startsWith('#') || link === '/') return false;

    return true;
  }

  async downloadContent(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https:') ? https : http;

      const request = client.get(
        url,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; LinkFinder/1.0)',
          },
          timeout: 10000,
        },
        (response) => {
          let data = '';

          response.on('data', (chunk) => {
            data += chunk;
          });

          response.on('end', () => {
            resolve(data);
          });
        }
      );

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  getStats({ filters }: { filters: any[] }): LinkFinderResultProps['stats'] {
    const links = Array.from(this.foundLinks);

    return {
      total: links.length,
      filters: filters.length,
      urls: links.filter((link) => link.startsWith('http')).length,
      endpoints: links.filter((link) => link.startsWith('/')).length,
      api: links.filter((link) => link.includes('/api/')).length,
    };
  }

  getAllLinks(): string[] {
    return Array.from(this.foundLinks).sort();
  }
}

export { LinkFinder };
