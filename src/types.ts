export interface Market {
  id: string;
  question: string;
  question_pt?: string;
  outcomes: string; // JSON string array like "['Yes', 'No']"
  outcomes_pt?: string; 
  outcomePrices: string; // JSON string array like "['0.5', '0.5']"
  volume: string;
  liquidity: string;
  clobTokenIds?: string;
  slug?: string;
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
  groupItemTitle?: string;
}

export interface PolymarketEvent {
  id: string;
  title: string;
  title_pt?: string;
  description: string;
  description_pt?: string;
  image: string;
  startDate: string;
  endDate: string;
  volume: number;
  liquidity: number;
  commentCount: number;
  active: boolean;
  slug?: string;
  source?: 'polymarket' | 'ucdb';
  tone?: 'engraçada' | 'seria' | 'intermediaria';
  markets: Market[];
}

export interface UserBet {
  id?: string;
  eventId: string;
  eventTitle?: string;
  marketId: string;
  userEmail: string;
  userName?: string;
  photoURL?: string;
  outcome: string;
  amount: number;
  price: number;
  potentialReturn?: number;
  status?: 'ativa' | 'ganha' | 'perdida';
  timestamp?: string;
}

export interface UserWallet {
  balance: number;
  initial: number;
  spent: number;
  totalBets: number;
}
