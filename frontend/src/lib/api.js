export const DEMO_USER_ID =
  import.meta.env.VITE_DEMO_USER_ID ?? "32196215-0000-4000-8000-000000000001";

export async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch {
      detail = response.statusText || detail;
    }
    throw new Error(detail);
  }

  return response.json();
}

export function getUserState() {
  return request(`/api/users/me/state`);
}

export function delegateTrade() {
  return request("/api/trades/delegate", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function getTradeStatus(tradeId) {
  return request(`/api/trades/status/${tradeId}`);
}

export function getReferralStats() {
  return request('/api/users/me/referrals');
}

export function transferWallet(amount, fromWallet, toWallet) {
  return request("/api/wallet/transfer", {
    method: "POST",
    body: JSON.stringify({
      amount: amount.toString(),
      from_wallet: fromWallet,
      to_wallet: toWallet,
    }),
  });
}

export function getGlobalSession() {
  return request('/api/session/current');
}

export function bindPhone(phone) {
  return request("/api/users/me/phone", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export function changePassword(oldPassword, newPassword) {
  return request("/api/users/me/password", {
    method: "POST",
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });
}

export function changeFundPassword(oldFundPassword, newFundPassword) {
  return request("/api/users/me/fund-password", {
    method: "POST",
    body: JSON.stringify({ old_fund_password: oldFundPassword, new_fund_password: newFundPassword }),
  });
}

export function getTransactionHistory() {
  return request('/api/wallet/history');
}
