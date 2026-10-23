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
  const u = await api("/api/admin/users/39", {}, ah);
  console.log("user 39 gender:", u.d.profile?.gender, "| pref:", u.d.preferences?.preferredGender, "| minAge:", u.d.preferences?.minAge, "| maxAge:", u.d.preferences?.maxAge);
})();
