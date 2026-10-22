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
  for (const uid of [31, 32, 33, 34, 36]) {
    const c = await api(`/api/admin/users-extra/${uid}/conversations`, {}, ah);
    const items = c.d.conversations || c.d.items || c.d || [];
    const arr = Array.isArray(items) ? items : [];
    for (const it of arr) {
      const cnt = it.messages ? it.messages.length : (it.messageCount ?? "?");
      console.log(`user ${uid} conv ${it.id || it.conversationId}: messages=${cnt}`);
    }
    await sleep(300);
  }
})();
