# Arena Polymarket — Copa do Mundo 2026

Interface em português para explorar **cotações de mercados de predição** da Copa do Mundo FIFA 2026 no [Polymarket](https://polymarket.com), com mercados simulados da UCDB, favoritos, alertas de preço e apostas com saldo virtual.

![Dashboard — mercados ao vivo](docs/screenshots/01-dashboard-light.png)

## Screenshots

| Tela | Descrição |
|------|-----------|
| [Dashboard](docs/screenshots/01-dashboard-light.png) | Listagem de mercados, filtros e seção “Em alta” |
| [Tema escuro](docs/screenshots/02-dashboard-dark.png) | Mesma visão com dark mode |
| [Busca](docs/screenshots/03-search-results.png) | Resultados filtrados por “Copa do Mundo” |
| [Detalhe do evento](docs/screenshots/04-event-details.png) | Probabilidades, gráficos e order book |
| [Mercados UCDB](docs/screenshots/05-ucdb-markets.png) | Mercados simulados da universidade |
| [Favoritos](docs/screenshots/06-favorites.png) | Página de mercados salvos |

## Funcionalidades

- Pesquisa de mercados da Copa 2026 (termos em PT ou EN, tradução automática)
- Probabilidades/cotações em tempo real (Sim/Não ou múltiplas opções)
- Volume, liquidez e status do mercado
- Histórico de preços e order book via CLOB API
- Mercados simulados UCDB com saldo inicial de US$ 1.000
- Favoritos, alertas de variação e tour de onboarding
- Login opcional com Google (Firebase)
- Tema claro/escuro

## Stack

- React 19 + TypeScript + Vite
- Express (proxy das APIs Polymarket)
- Tailwind CSS 4 + shadcn/ui
- Recharts (gráficos)
- Firebase Auth + Firestore (opcional)

## Pré-requisitos

- Node.js 18+

## Executar localmente

```bash
npm install
npm run dev
```

Abra **http://localhost:3000**

### Build de produção

```bash
npm run build
npm start
```

## APIs utilizadas

| API | Base URL | Uso | Autenticação |
|-----|----------|-----|--------------|
| **Gamma API** | `https://gamma-api.polymarket.com` | Eventos e mercados | Pública |
| **CLOB API** | `https://clob.polymarket.com` | Preços e order book | Pública (leitura) |

Documentação: [docs.polymarket.com](https://docs.polymarket.com/api-reference/introduction)

> A Gamma e a CLOB (leitura) são públicas. `POLYMARKET_API_KEY` só é necessária para trading autenticado.

## Endpoints locais (proxy)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/markets?q=Copa do Mundo` | Busca mercados |
| `GET` | `/api/events/:slug` | Detalhe de evento |
| `GET` | `/api/prices/:tokenId` | Histórico de preços |
| `GET` | `/api/wallet?email=` | Saldo simulado |
| `POST` | `/api/bets` | Registrar aposta simulada |

## Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```env
POLYMARKET_API_KEY=""
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
```

Firebase é opcional — o app funciona sem login.

## Estrutura do projeto

```
polymarket-explorer/
├── docs/screenshots/     # Prints do site (README)
├── public/               # PWA (manifest, service worker)
├── scripts/              # Automação (captura de screenshots)
├── src/
│   ├── components/       # UI (Dashboard, EventDetails, etc.)
│   ├── lib/              # Utilitários (favoritos, mercados)
│   └── services/         # Firestore
├── lib/                  # Proxy Polymarket (server-side)
├── components/ui/        # shadcn/ui
├── server.ts             # Express + Vite dev server
└── firestore.rules       # Regras Firestore (opcional)
```

## Exemplos de pesquisa

- `Copa do Mundo` → traduzido para "world cup"
- `World Cup` → busca direta
- `FIFA` → mercados FIFA
- `Grupo A` → vencedores de grupos

## Regenerar screenshots

Com o servidor rodando (`npm run dev`):

```bash
npm run screenshots
```

## Licença

MIT — veja [LICENSE](LICENSE).
