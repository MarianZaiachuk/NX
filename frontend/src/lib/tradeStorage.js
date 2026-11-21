const ACTIVE_TRADE_KEY = "nx:active-ai-trade";

export function readActiveTrade() {
  try {
    const raw = localStorage.getItem(ACTIVE_TRADE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.tradeId || !parsed.unlockTime) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveActiveTrade(trade) {
  localStorage.setItem(
    ACTIVE_TRADE_KEY,
    JSON.stringify({
      tradeId: trade.trade_id,
      unlockTime: trade.unlock_time,
      startTime: Date.now(),
    }),
  );
}

export function clearActiveTrade() {
  localStorage.removeItem(ACTIVE_TRADE_KEY);
}

