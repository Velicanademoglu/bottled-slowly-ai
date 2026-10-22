const base = "https://bottled-slowly-ai-u1fl2k1.verdent.app";
const j = (r) => r.json();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const api = async (p, o = {}, t) => {
  const r = await fetch(base + p, { ...o, headers: { "Content-Type": "application/json", ...(t ? { Authorization: "Bearer " + t } : {}) } });
  return { s: r.status, d: await j(r).catch(() => ({})) };
};

(async () => {
  let adm = await api("/api/admin/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@projectstar.app", password: "AdminPass1" }) });
  for (let i = 0; i < 4 && adm.s !== 200; i++) { await sleep(5000); adm = await api("/api/admin/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@projectstar.app", password: "AdminPass1" }) }); }
  const ah = adm.d.token;
  const st = await api("/api/admin/dashboard/stats", {}, ah);
  console.log("stats:", JSON.stringify(st.d));
  const ch = await api("/api/admin/messages/chats?page=1&pageSize=20", {}, ah);
  console.log("chats total:", ch.d.pagination?.total);
  for (const c of (ch.d.chats || []).slice(0, 10)) {
    const det = await api(`/api/admin/messages/chats/${c.id}`, {}, ah).catch(() => null);
    const n = det && det.d && det.d.messages ? det.d.messages.length : "?";
    console.log(`conv ${c.id}: msgCount=${n}`);
  }
})();
