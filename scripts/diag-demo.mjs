const base = "https://bottled-slowly-ai-u1fl2k1.verdent.app";
const j = (r) => r.json();
const api = async (p, o = {}, t) => {
  const r = await fetch(base + p, { ...o, headers: { "Content-Type": "application/json", ...(t ? { Authorization: "Bearer " + t } : {}) } });
  return { s: r.status, d: await j(r).catch(() => ({})) };
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function diag() {
  const adm = await api("/api/admin/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@projectstar.app", password: "AdminPass1" }) });
  console.log("admin login:", adm.s);
  if (adm.s !== 200) { await sleep(3000); return diag(); }
  const ah = adm.d.token;
  const all = await api("/api/admin/users?page=1&pageSize=100", {}, ah);
  if (!all.d.users) { console.log("users list fail", all.s, JSON.stringify(all.d).slice(0, 200)); return; }
  const demo = all.d.users.filter((u) => u.email.includes("testmail.dev"));
  for (const u of demo) {
    const l = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: u.email, password: "Demo1234!" }) });
    if (l.s !== 200) { console.log(u.username, "login", l.s); await sleep(1200); continue; }
    const t = l.d.token;
    const inc = await api("/api/discoveries/incoming", {}, t);
    const cv = await api("/api/conversations", {}, t);
    const tr = await api("/api/discoveries/traveling", {}, t);
    console.log(u.username, "| incoming:", (inc.d.items || []).length, "| convs:", (cv.d.conversations || []).length, "| traveling:", JSON.stringify(tr.d).slice(0, 160));
    await sleep(900);
  }
  const sp = await api("/api/admin/messages/space?page=1&pageSize=50", {}, ah);
  const msgs = (sp.d.messages || []).map((m) => `${m.id}:${m.status}:v=${m.vesselKey}:by=${m.sender?.username || m.senderId}`);
  console.log("--- space msgs (latest 50) ---");
  console.log(msgs.join("\n"));
}

diag().catch((e) => console.error(e));
