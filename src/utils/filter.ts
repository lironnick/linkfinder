export function filtrarURLs(urls: any, termosDeBusca: any) {
  // Converte os termos de busca para minúsculas para uma comparação case-insensitive
  const termosEmMinusculas = termosDeBusca.map((term: any) => term.toLowerCase());

  return urls.filter((url: any) => {
    // Converte a URL para minúsculas para a comparação
    const urlEmMinusculas = url.toLowerCase();
    // Verifica se a URL inclui qualquer um dos termos de busca
    return termosEmMinusculas.some((term: any) => urlEmMinusculas.includes(term));
  });
}
