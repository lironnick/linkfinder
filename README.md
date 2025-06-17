# Link Finder API

## 🚀 Funcionalidades

- ✅ Análise de URLs remotas contendo JavaScript

## 📦 Instalação

```bash
# Clona o repositório
git clone <url-do-repositorio>
cd <url-do-repositorio>

# Instala as dependências
yarn install

# Desenvolvimento
yarn dev
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
PORT=3333        # Porta do servidor (padrão: 3000)
HOST=0.0.0.0     # Host do servidor (padrão: 0.0.0.0)
```

## 📖 Endpoints da API

### GET `/ping`

Health check da API.

### POST `/analyze/url`

Analisa JavaScript de uma URL remota.

**Body:**

```json
{
  "url": "https://example.com/script.js",
  "baseUrl": "https://example.com" // opcional
}
```

Pelo `terminal` usando o modulo `HTTPie`.

```bash
http POST :3333/analyze/url url="https://example.com/script.js" baseUrl="https://example.com"
```

### POST `/scarp`

Analisa JavaScript de uma URL remota.

**Body:**

```json
{
  "url": "https://example.com/script.js"
}
```

Pelo `terminal` usando o modulo `HTTPie`.

```bash
http POST :3333/scrap url="https://example.com/script.js"
```
