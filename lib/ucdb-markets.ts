import type { PolymarketEvent } from './polymarket';

type UcdbTone = 'engraçada' | 'seria' | 'intermediaria';

interface UcdbMarketDef {
  id: string;
  title: string;
  description: string;
  tone: UcdbTone;
  yesPrice: number;
  volume: number;
  endDate: string;
}

const UCDB_MARKETS: UcdbMarketDef[] = [
  // Engraçadas
  { id: 'ucdb-001', tone: 'engraçada', title: 'A fila do RU da UCDB vai passar de 40 minutos em 2026?', description: 'Resolve Sim se a fila média do Restaurante Universitário ultrapassar 40 minutos em qualquer dia útil de 2026.', yesPrice: 0.72, volume: 8420, endDate: '2026-12-31' },
  { id: 'ucdb-002', tone: 'engraçada', title: 'Algum aluno vai pedir extensão de TCC por causa de gato?', description: 'Mercado resolve Sim se houver relato público ou meme viral de pedido de prorrogação de TCC envolvendo um gato no campus.', yesPrice: 0.41, volume: 5230, endDate: '2026-11-30' },
  { id: 'ucdb-003', tone: 'engraçada', title: 'O elevador do bloco A vai quebrar mais de 5 vezes este semestre?', description: 'Conta cada registro de pane confirmado pelo setor de manutenção da UCDB Campo Grande.', yesPrice: 0.88, volume: 12100, endDate: '2026-07-31' },
  { id: 'ucdb-004', tone: 'engraçada', title: 'Vai rolar churrasco não-oficial no estacionamento pós-prova?', description: 'Resolve Sim se houver churrasco espontâneo com 10+ pessoas no estacionamento após prova final.', yesPrice: 0.56, volume: 6890, endDate: '2026-12-15' },
  { id: 'ucdb-005', tone: 'engraçada', title: 'Professor vai esquecer de compartilhar a tela no Teams?', description: 'Sim se ocorrer pelo menos 3 vezes em aulas gravadas oficiais de qualquer curso da UCDB.', yesPrice: 0.93, volume: 15700, endDate: '2026-08-30' },
  { id: 'ucdb-006', tone: 'engraçada', title: 'Alguém vai levar cachorro-quente do camelô para dentro da sala?', description: 'Mercado humorístico sobre infiltração gastronômica nas salas de aula.', yesPrice: 0.34, volume: 4120, endDate: '2026-10-31' },
  { id: 'ucdb-007', tone: 'engraçada', title: 'Grupo de WhatsApp da turma vai ter briga por política?', description: 'Resolve Sim se houver mensagens apagadas + alguém saindo do grupo por discussão política.', yesPrice: 0.67, volume: 9340, endDate: '2026-12-31' },
  { id: 'ucdb-008', tone: 'engraçada', title: 'Vai existir meme da UCDB no TikTok com +100k views?', description: 'Sim se algum vídeo mencionando UCDB ou campus ultrapassar 100 mil visualizações em 2026.', yesPrice: 0.48, volume: 7650, endDate: '2026-12-31' },
  { id: 'ucdb-009', tone: 'engraçada', title: 'Biblioteca vai ficar sem tomada disponível na véspera de prova?', description: 'Sim se relatos simultâneos de "zero tomadas" forem confirmados em 3+ datas de prova.', yesPrice: 0.91, volume: 11200, endDate: '2026-12-20' },

  // Intermediárias
  { id: 'ucdb-010', tone: 'intermediaria', title: 'UCDB vai subir no ranking MEC até o top 40?', description: 'Baseado no ranking oficial de instituições privadas do MEC publicado em 2026.', yesPrice: 0.38, volume: 18900, endDate: '2026-12-31' },
  { id: 'ucdb-011', tone: 'intermediaria', title: 'Medicina UCDB terá nota de corte acima de 780 no ENEM?', description: 'Resolve Sim se a nota de corte do vestibular/ENEM para Medicina superar 780 pontos.', yesPrice: 0.55, volume: 22400, endDate: '2026-03-31' },
  { id: 'ucdb-012', tone: 'intermediaria', title: 'Novo laboratório de IA será inaugurado em 2026?', description: 'Sim se a UCDB inaugurar laboratório dedicado a inteligência artificial ou data science.', yesPrice: 0.44, volume: 14300, endDate: '2026-12-31' },
  { id: 'ucdb-013', tone: 'intermediaria', title: 'Time de futsal da UCDB ganha inter-universitário regional?', description: 'Campeonato inter-universitário da região Centro-Oeste incluindo UCDB Campo Grande.', yesPrice: 0.29, volume: 9800, endDate: '2026-11-30' },
  { id: 'ucdb-014', tone: 'intermediaria', title: 'Mensalidade média vai aumentar acima de 8% em 2026?', description: 'Compara reajuste médio divulgado pela instituição para o ano letivo de 2026.', yesPrice: 0.62, volume: 31200, endDate: '2026-02-28' },
  { id: 'ucdb-015', tone: 'intermediaria', title: 'Feira de estágios terá mais de 50 empresas participantes?', description: 'Sim se a feira de estágios e empregos da UCDB contar com 50+ empresas confirmadas.', yesPrice: 0.51, volume: 8700, endDate: '2026-09-30' },
  { id: 'ucdb-016', tone: 'intermediaria', title: 'Curso de Direito terá aprovação acima de 70% na OAB?', description: 'Taxa de aprovação dos formandos UCDB no exame da OAB edição 2026.', yesPrice: 0.47, volume: 16500, endDate: '2026-12-31' },
  { id: 'ucdb-017', tone: 'intermediaria', title: 'Parceria internacional com universidade europeia em 2026?', description: 'Sim se UCDB anunciar acordo formal de intercâmbio com instituição europeia.', yesPrice: 0.58, volume: 10900, endDate: '2026-12-31' },
  { id: 'ucdb-018', tone: 'intermediaria', title: 'Semana Acadêmica atrairá mais de 2.000 visitantes?', description: 'Contagem oficial de participantes nos eventos da Semana Acadêmica UCDB 2026.', yesPrice: 0.63, volume: 7200, endDate: '2026-10-15' },

  // Sérias
  { id: 'ucdb-019', tone: 'seria', title: 'UCDB receberá selo de excelência institucional em 2026?', description: 'Selo reconhecido pelo MEC ou entidade nacional de avaliação de ensino superior.', yesPrice: 0.35, volume: 25600, endDate: '2026-12-31' },
  { id: 'ucdb-020', tone: 'seria', title: 'Taxa de evasão cairá abaixo de 12% neste ano?', description: 'Indicador oficial de evasão do semestre 2026.1 comparado ao ano anterior.', yesPrice: 0.42, volume: 19800, endDate: '2026-12-31' },
  { id: 'ucdb-021', tone: 'seria', title: 'Hospital universitário ampliará leitos de UTI?', description: 'Sim se houver inauguração ou ampliação documentada de leitos de UTI no complexo hospitalar.', yesPrice: 0.28, volume: 34100, endDate: '2026-12-31' },
  { id: 'ucdb-022', tone: 'seria', title: 'Pós-graduação stricto sensu terá nova linha de pesquisa?', description: 'Aprovação de nova linha de pesquisa em programas de mestrado ou doutorado da UCDB.', yesPrice: 0.39, volume: 12400, endDate: '2026-12-31' },
  { id: 'ucdb-023', tone: 'seria', title: 'Projeto de energia solar no campus será implementado?', description: 'Instalação efetiva de painéis solares em área do campus Campo Grande.', yesPrice: 0.33, volume: 28700, endDate: '2026-12-31' },
  { id: 'ucdb-024', tone: 'seria', title: 'Índice de empregabilidade dos formandos superará 85%?', description: 'Pesquisa de empregabilidade dos concluintes 2025/2026 publicada pela UCDB.', yesPrice: 0.54, volume: 21300, endDate: '2026-12-31' },
  { id: 'ucdb-025', tone: 'seria', title: 'Novo campus ou polo de expansão será anunciado?', description: 'Anúncio oficial de novo polo ou campus UCDB em qualquer cidade.', yesPrice: 0.22, volume: 45200, endDate: '2026-12-31' },
  { id: 'ucdb-026', tone: 'seria', title: 'Comitê de ética aprovará 100+ projetos de pesquisa?', description: 'Total de projetos aprovados pelo comitê de ética em pesquisa no ano de 2026.', yesPrice: 0.61, volume: 9600, endDate: '2026-12-31' },
  { id: 'ucdb-027', tone: 'seria', title: 'Programa de bolsas integrais aumentará vagas em 2026?', description: 'Sim se o edital de bolsas 2026 tiver mais vagas que o edital anterior.', yesPrice: 0.49, volume: 17800, endDate: '2026-04-30' },
];

function toEvent(def: UcdbMarketDef): PolymarketEvent {
  const noPrice = 1 - def.yesPrice;
  return {
    id: def.id,
    title: def.title,
    title_pt: def.title,
    description: def.description,
    description_pt: def.description,
    image: '',
    startDate: new Date().toISOString(),
    endDate: def.endDate,
    volume: def.volume,
    liquidity: Math.round(def.volume * 0.15),
    commentCount: Math.floor(def.volume / 500),
    active: true,
    source: 'ucdb',
    tone: def.tone,
    markets: [{
      id: `${def.id}-m1`,
      question: def.title,
      question_pt: def.title,
      outcomes: '["Sim","Não"]',
      outcomes_pt: '["Sim","Não"]',
      outcomePrices: JSON.stringify([def.yesPrice.toFixed(2), noPrice.toFixed(2)]),
      volume: String(def.volume),
      liquidity: String(Math.round(def.volume * 0.15)),
    }],
  };
}

export function getUcdbMarkets(filter?: string, tone?: string): PolymarketEvent[] {
  let list = UCDB_MARKETS;
  if (tone && tone !== 'all') {
    list = list.filter((m) => m.tone === tone);
  }
  if (filter) {
    const term = filter.toLowerCase();
    list = list.filter(
      (m) => m.title.toLowerCase().includes(term) || m.description.toLowerCase().includes(term),
    );
  }
  return list.map(toEvent);
}

export function getUcdbMarketById(id: string): PolymarketEvent | null {
  const def = UCDB_MARKETS.find((m) => m.id === id);
  return def ? toEvent(def) : null;
}
