const DEMO_STORAGE_KEY = "nx:demo:state:v1";
const DEMO_USER_ID = "32196215-0000-4000-8000-000000000001";
const DEMO_TRADE_DURATION_MS = 15 * 1000;

export const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

function money(val) {
  return Number(val).toFixed(2);
}

function makeUuid(prefix = "demo") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function createInitialDemoState() {
  const now = Date.now();
  return {
    user: {
      user_id: DEMO_USER_ID,
      uid: 842910,
      email: "demo@nx-sim.local",
      phone: null,
      referral_code: "NXDEMO88",
      display_name: "Demo Trader",
      status: "Verified",
      balance: "250.00",
      spot_balance: "1450.00",
      total_deposit: "1000.00",
      today_profit: "36.00",
      is_admin: true,
      has_signals_access: true,
      agent_level: 2,
      active_trade: null,
      latest_trade: {
        trade_id: "00000000-0000-4000-8000-000000000101",
        status: "COMPLETED",
        stake_amount: "9.00",
        payout_amount: "12.00",
        profit_amount: "3.00",
        unlock_time: new Date(now - 600_000).toISOString(),
        created_at: new Date(now - 1_800_000).toISOString(),
        completed_at: new Date(now - 600_000).toISOString(),
      },
    },
    transactions: [
      {
        id: "tx-demo-1",
        type: "deposit",
        amount: "1000.00",
        status: "Completed",
        created_at: new Date(now - 86_400_000 * 3).toISOString(),
      },
      {
        id: "tx-demo-2",
        type: "withdrawal",
        amount: "120.00",
        status: "Approved",
        created_at: new Date(now - 86_400_000).toISOString(),
      },
    ],
    referrals: {
      referral_code: "NXDEMO88",
      agent_level: 2,
      total_referrals: 4,
      total_deposit_sum: "2450.00",
      level_1: [
        { email_masked: "ale***com", total_referrals: 2, total_deposit: "1200.00" },
        { email_masked: "mar***net", total_referrals: 0, total_deposit: "650.00" },
      ],
      level_2: [
        { email_masked: "kat***com", total_referrals: 1, total_deposit: "400.00" },
      ],
      level_3: [
        { email_masked: "dmyt***dev", total_referrals: 0, total_deposit: "200.00" },
      ],
    },
    adminUsers: [
      {
        id: DEMO_USER_ID,
        email: "demo@nx-sim.local",
        display_name: "Demo Trader",
        status: "Verified",
        is_admin: true,
        balance: "250.00",
        has_signals_access: true,
        created_at: new Date(now - 86_400_000 * 14).toISOString(),
        referral_code: "NXDEMO88",
        referred_by_code: null,
      },
      {
        id: "32196215-0000-4000-8000-000000000002",
        email: "alex.quant@demo.local",
        display_name: "Alex Quant",
        status: "Verified",
        is_admin: false,
        balance: "418.00",
        has_signals_access: true,
        created_at: new Date(now - 86_400_000 * 7).toISOString(),
        referral_code: "ALEX42",
        referred_by_code: "NXDEMO88",
      },
      {
        id: "32196215-0000-4000-8000-000000000003",
        email: "maria.k@demo.local",
        display_name: "Maria K.",
        status: "Pending",
        is_admin: false,
        balance: "95.00",
        has_signals_access: false,
        created_at: new Date(now - 86_400_000 * 2).toISOString(),
        referral_code: "MARIA77",
        referred_by_code: "NXDEMO88",
      },
    ],
    adminWithdrawals: [
      {
        id: "wd-demo-101",
        user_id: "32196215-0000-4000-8000-000000000002",
        user_email: "alex.quant@demo.local",
        user_uid: "910244",
        amount: "150.00",
        fee: "7.50",
        wallet_address: "TDemoRecipient99999999999999999999",
        status: "Pending",
        created_at: new Date(now - 3_600_000).toISOString(),
      },
    ],
    kycRecords: {},
    settings: {
      referral_deposit_threshold: "500.00",
    },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore corrupted storage
  }
  const initial = createInitialDemoState();
  saveState(initial);
  return initial;
}

function saveState(state) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
}

export function resetDemoState() {
  const fresh = createInitialDemoState();
  saveState(fresh);
  localStorage.setItem("token", "demo-jwt-token");
  localStorage.removeItem("nx:active_trade");
  return fresh;
}

function settleExpiredTrade(state) {
  const active = state.user.active_trade;
  if (!active || active.status !== "IN_PROGRESS") {
    return;
  }
  if (Date.now() >= new Date(active.unlock_time).getTime()) {
    const completed = {
      ...active,
      status: "COMPLETED",
      completed_at: new Date().toISOString(),
    };
    state.user.balance = money(Number(state.user.balance) + Number(active.payout_amount));
    state.user.today_profit = money(Number(state.user.today_profit) + Number(active.profit_amount));
    state.user.latest_trade = completed;
    state.user.active_trade = null;
    const adminUser = state.adminUsers.find((u) => u.id === state.user.user_id);
    if (adminUser) {
      adminUser.balance = state.user.balance;
    }
    saveState(state);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseJsonBody(init) {
  if (!init || !init.body) return {};
  try {
    return JSON.parse(init.body);
  } catch {
    return {};
  }
}

async function handleDemoRequest(urlString, init = {}) {
  const url = new URL(urlString, window.location.origin);
  const path = url.pathname;
  const method = (init.method || "GET").toUpperCase();
  const state = loadState();
  settleExpiredTrade(state);

  // Auth endpoints
  if (path === "/api/auth/login" && method === "POST") {
    const body = parseJsonBody(init);
    if (body.email && body.email.trim()) {
      state.user.email = body.email.trim();
      saveState(state);
    }
    return jsonResponse({ access_token: "demo-jwt-token", token_type: "bearer" });
  }

  if (path === "/api/auth/register" && method === "POST") {
    const body = parseJsonBody(init);
    if (body.display_name) state.user.display_name = body.display_name;
    if (body.email) state.user.email = body.email;
    saveState(state);
    return jsonResponse({ access_token: "demo-jwt-token", token_type: "bearer" });
  }

  if (path === "/api/auth/send-code" && method === "POST") {
    return jsonResponse({ status: "ok", message: "Demo verification code: 123456" });
  }

  // User & Trading endpoints
  if (path === "/api/users/me/state" && method === "GET") {
    return jsonResponse({
      ...state.user,
      server_time: new Date().toISOString(),
    });
  }

  if (path === "/api/trades/delegate" && method === "POST") {
    if (state.user.active_trade) {
      return jsonResponse({ detail: "User already has an active trade" }, 409);
    }
    const stake = 9.0;
    const payout = 12.0;
    const profit = 3.0;
    const currentBal = Number(state.user.balance);
    if (currentBal < stake) {
      return jsonResponse({ detail: "Insufficient funds balance ($9.00 required)" }, 409);
    }
    const now = Date.now();
    const trade = {
      trade_id: makeUuid("trade"),
      status: "IN_PROGRESS",
      stake_amount: money(stake),
      payout_amount: money(payout),
      profit_amount: money(profit),
      unlock_time: new Date(now + DEMO_TRADE_DURATION_MS).toISOString(),
      created_at: new Date(now).toISOString(),
      completed_at: null,
    };
    state.user.balance = money(currentBal - stake);
    state.user.active_trade = trade;
    saveState(state);
    return jsonResponse({
      user_id: state.user.user_id,
      balance: state.user.balance,
      trade,
      server_time: new Date().toISOString(),
    });
  }

  if (path.startsWith("/api/trades/status/") && method === "GET") {
    const tradeId = path.split("/").pop();
    const trade =
      (state.user.active_trade && state.user.active_trade.trade_id === tradeId
        ? state.user.active_trade
        : null) ||
      (state.user.latest_trade && state.user.latest_trade.trade_id === tradeId
        ? state.user.latest_trade
        : null) ||
      state.user.active_trade ||
      state.user.latest_trade;
    if (!trade) {
      return jsonResponse({ detail: "Trade not found" }, 404);
    }
    return jsonResponse({
      user_id: state.user.user_id,
      balance: state.user.balance,
      trade,
      server_time: new Date().toISOString(),
    });
  }

  if (path === "/api/session/current" && method === "GET") {
    const now = Date.now();
    return jsonResponse({
      is_active: true,
      is_locked: false,
      session_start: new Date(now - 10 * 60 * 1000).toISOString(),
      session_end: new Date(now + 50 * 60 * 1000).toISOString(),
      server_time: new Date(now).toISOString(),
    });
  }

  if (path === "/api/users/me/referrals" && method === "GET") {
    return jsonResponse(state.referrals);
  }

  if (path === "/api/wallet/transfer" && method === "POST") {
    const body = parseJsonBody(init);
    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      return jsonResponse({ detail: "Invalid amount" }, 400);
    }
    const funds = Number(state.user.balance);
    const spot = Number(state.user.spot_balance);
    if (body.from_wallet === "Funds" && body.to_wallet === "Spot") {
      if (funds < amount) return jsonResponse({ detail: "Insufficient funds" }, 400);
      state.user.balance = money(funds - amount);
      state.user.spot_balance = money(spot + amount);
    } else if (body.from_wallet === "Spot" && body.to_wallet === "Funds") {
      if (spot < amount) return jsonResponse({ detail: "Insufficient funds" }, 400);
      state.user.spot_balance = money(spot - amount);
      state.user.balance = money(funds + amount);
    } else {
      return jsonResponse({ detail: "Invalid wallets" }, 400);
    }
    saveState(state);
    return jsonResponse({
      status: "ok",
      balance: state.user.balance,
      spot_balance: state.user.spot_balance,
    });
  }

  if (path === "/api/wallet/deposit-info" && method === "GET") {
    return jsonResponse({
      type: "static",
      address: "TDemoAddress000000000000000000NXSIM",
      currency: "USDT",
      network: "TRC20",
    });
  }

  if (path === "/api/wallet/demo-faucet" && method === "POST") {
    const credit = 100.0;
    state.user.spot_balance = money(Number(state.user.spot_balance) + credit);
    state.user.total_deposit = money(Number(state.user.total_deposit) + credit);
    state.transactions.unshift({
      id: makeUuid("dep"),
      type: "deposit",
      amount: money(credit),
      status: "Completed",
      created_at: new Date().toISOString(),
    });
    saveState(state);
    return jsonResponse({ status: "ok", spot_balance: state.user.spot_balance });
  }

  if (path === "/api/wallet/withdraw" && method === "POST") {
    const body = parseJsonBody(init);
    const amount = Number(body.amount);
    if (!amount || amount < 10) {
      return jsonResponse({ detail: "Minimum withdrawal is 10 USDT" }, 400);
    }
    const spot = Number(state.user.spot_balance);
    if (spot < amount) {
      return jsonResponse({ detail: "Insufficient spot balance" }, 400);
    }
    state.user.spot_balance = money(spot - amount);
    const wdId = makeUuid("wd");
    const createdAt = new Date().toISOString();
    state.transactions.unshift({
      id: wdId,
      type: "withdrawal",
      amount: money(amount),
      status: "Pending",
      created_at: createdAt,
    });
    state.adminWithdrawals.unshift({
      id: wdId,
      user_id: state.user.user_id,
      user_email: state.user.email,
      user_uid: String(state.user.uid),
      amount: money(amount),
      fee: money(amount * 0.05),
      wallet_address: body.wallet_address || "TDemoWallet",
      status: "Pending",
      created_at: createdAt,
    });
    saveState(state);
    return jsonResponse({
      status: "ok",
      message: "Withdrawal requested successfully",
      withdrawal_id: wdId,
    });
  }

  if (path === "/api/wallet/history" && method === "GET") {
    return jsonResponse(state.transactions);
  }

  if (path === "/api/session/kyc" && method === "POST") {
    const body = parseJsonBody(init);
    state.user.status = "Pending";
    state.kycRecords[state.user.user_id] = {
      ...body,
      created_at: new Date().toISOString(),
    };
    const u = state.adminUsers.find((item) => item.id === state.user.user_id);
    if (u) u.status = "Pending";
    saveState(state);
    return jsonResponse({ status: "ok" });
  }

  if (path === "/api/users/me/phone" && method === "POST") {
    const body = parseJsonBody(init);
    state.user.phone = body.phone || null;
    saveState(state);
    return jsonResponse({ status: "ok" });
  }

  if (
    (path === "/api/users/me/password" || path === "/api/users/me/fund-password") &&
    method === "POST"
  ) {
    return jsonResponse({ status: "ok" });
  }

  // Admin endpoints
  if (path === "/api/admin/users" && method === "GET") {
    const search = (url.searchParams.get("search") || "").toLowerCase();
    const statusFilter = url.searchParams.get("status");
    const filtered = state.adminUsers.filter((u) => {
      const matchSearch =
        !search ||
        (u.email && u.email.toLowerCase().includes(search)) ||
        (u.display_name && u.display_name.toLowerCase().includes(search));
      const matchStatus = !statusFilter || u.status === statusFilter;
      return matchSearch && matchStatus;
    });
    return jsonResponse({
      users: filtered,
      total: filtered.length,
      page: 1,
      total_pages: 1,
    });
  }

  const userPatchMatch = path.match(/^\/api\/admin\/users\/([^/]+)$/);
  if (userPatchMatch && method === "PATCH") {
    const userId = userPatchMatch[1];
    const body = parseJsonBody(init);
    const target = state.adminUsers.find((u) => u.id === userId);
    if (!target) return jsonResponse({ detail: "User not found" }, 404);
    if (body.status !== undefined) target.status = body.status;
    if (body.balance !== undefined) target.balance = money(body.balance);
    if (body.has_signals_access !== undefined) target.has_signals_access = body.has_signals_access;
    if (userId === state.user.user_id) {
      state.user.status = target.status;
      state.user.balance = target.balance;
      state.user.has_signals_access = target.has_signals_access;
    }
    saveState(state);
    return jsonResponse({ message: "User updated successfully" });
  }

  const impMatch = path.match(/^\/api\/admin\/users\/([^/]+)\/impersonate$/);
  if (impMatch && method === "POST") {
    return jsonResponse({ access_token: "demo-jwt-token", token_type: "bearer" });
  }

  const kycMatch = path.match(/^\/api\/admin\/users\/([^/]+)\/kyc$/);
  if (kycMatch && method === "GET") {
    return jsonResponse(state.kycRecords[kycMatch[1]] || null);
  }

  if (path === "/api/admin/withdrawals" && method === "GET") {
    const statusFilter = url.searchParams.get("status");
    const filtered =
      statusFilter && statusFilter !== "All"
        ? state.adminWithdrawals.filter((w) => w.status === statusFilter)
        : state.adminWithdrawals;
    return jsonResponse(filtered);
  }

  const wdActionMatch = path.match(/^\/api\/admin\/withdrawals\/([^/]+)\/(approve|reject)$/);
  if (wdActionMatch && method === "POST") {
    const [, wdId, action] = wdActionMatch;
    const wd = state.adminWithdrawals.find((w) => w.id === wdId);
    if (!wd) return jsonResponse({ detail: "Withdrawal not found" }, 404);
    wd.status = action === "approve" ? "Approved" : "Rejected";
    const tx = state.transactions.find((t) => t.id === wdId);
    if (tx) tx.status = wd.status;
    if (action === "reject" && wd.user_id === state.user.user_id) {
      state.user.spot_balance = money(Number(state.user.spot_balance) + Number(wd.amount));
    }
    saveState(state);
    return jsonResponse({ message: `Withdrawal ${wd.status.toLowerCase()}` });
  }

  if (path === "/api/admin/settings" && method === "GET") {
    return jsonResponse(state.settings);
  }

  if (path === "/api/admin/settings" && method === "PATCH") {
    const body = parseJsonBody(init);
    if (body.referral_deposit_threshold !== undefined) {
      state.settings.referral_deposit_threshold = money(body.referral_deposit_threshold);
    }
    saveState(state);
    return jsonResponse(state.settings);
  }

  return jsonResponse({ detail: `Unhandled demo endpoint: ${method} ${path}` }, 404);
}

export function installDemoFetch() {
  if (!IS_DEMO_MODE || typeof window === "undefined") {
    return;
  }
  if (window.__nxDemoFetchInstalled) {
    return;
  }
  window.__nxDemoFetchInstalled = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const urlStr = typeof input === "string" ? input : input?.url || "";
    if (urlStr.startsWith("/api/")) {
      return handleDemoRequest(urlStr, init);
    }
    return originalFetch(input, init);
  };
}
