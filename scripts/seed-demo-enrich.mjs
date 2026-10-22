// Enrichment pass: extra casts, accept ALL pending bottles, two-way chat.
const base = "https://bottled-slowly-ai-u1fl2k1.verdent.app";
const j = (r) => r.json();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const extraTexts = [
  "Bugün gün batımını kaçırdım, pencereden sadece gri binalar gördüm. Senin bugünün nasıldı?",
  "Yıllardır aynı kahve dükkanına gidiyorum, garson artık siparişimi ezbere biliyor. Senin de böyle bir yerin var mı?",
  "İnsanın hayatta en az bir kişiyle derin konuşabilmesi gerektiğini düşünüyorum. Belki buradan bulurum.",
  "Dün gece 3'e kadar eski fotoğraflara baktım. Nostalji iyidir ama bazen hüzünlü. Sen de yapar mısın?",
];

const chatLines = [
  "Şişen bana ulaştı! Çok güzel yazmışsın.",
  "Teşekkürler, yazarken keyif aldım. Sen nasılsın?",
  "İyiyim, hafta sonunu iple çekiyorum. Senin planın var mı?",
  "Biraz dinlenmek, biraz kitap. Sakin bir hafta sonu gibi.",
  "Süper, ben de yorgunluktan bunalmıştım biraz.",
  "Bazen durup nefes almak gerekiyor. Bu uygulama tam bunun için.",
];

async function api(path, opts = {}, token) {
  const res = await fetch(base + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), ...(opts.headers || {}) },
  });
  return { s: res.status, d: await res.json().catch(() => ({})) };
}

async function loginRetry(email, password) {
  for (let i = 0; i < 5; i++) {
    const r = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    if (r.s === 200) return r.d.token;
    if (r.s === 429) { await sleep(2500); continue; }
    console.log("login fail", email, r.s);
    return null;
  }
  console.log("login 429 exhausted", email);
  return null;
}

(async () => {
  let adm = await api("/api/admin/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@projectstar.app", password: "AdminPass1" }) });
  for (let i = 0; i < 5 && adm.s !== 200; i++) { await sleep(4000); adm = await api("/api/admin/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@projectstar.app", password: "AdminPass1" }) }); }
  if (adm.s !== 200) { console.log("admin login failed", adm.s); return; }
  const ah = adm.d.token;

  const all = await api("/api/admin/users?page=1&pageSize=100", {}, ah);
  if (!all.d.users) { console.log("users list fail", all.s, JSON.stringify(all.d).slice(0, 150)); return; }
  const demo = all.d.users.filter((u) => u.email.includes("testmail.dev")).sort((a, b) => a.id - b.id);
  console.log("demo users:", demo.length);

  const tokens = [];
  for (const u of demo) {
    const t = await loginRetry(u.email, "Demo1234!");
    if (t) tokens.push({ uid: u.id, username: u.username, token: t });
    await sleep(700);
  }
  console.log("logged in:", tokens.length);

  // 1. one extra cast per user (3rd of daily limit 3)
  let casts = 0;
  for (let i = 0; i < tokens.length; i++) {
    const u = tokens[i];
    const create = await api("/api/messages", { method: "POST", body: JSON.stringify({ content: extraTexts[i % extraTexts.length], vesselKey: ["parchment", "heart", "basic_capsule", "star_message"][i % 4] }) }, u.token);
    if (create.s !== 201) { console.log("draft fail", u.username, create.s); continue; }
    const cast = await api(`/api/messages/${create.d.id}/cast`, { method: "POST" }, u.token);
    if (cast.s === 200) casts++; else console.log("cast fail", u.username, cast.s, JSON.stringify(cast.d).slice(0, 120));
    await sleep(400);
  }
  console.log("extra casts:", casts);

  // 2. accept ALL pending incoming
  let accepted = 0;
  for (const u of tokens) {
    for (let round = 0; round < 10; round++) {
      const inc = await api("/api/discoveries/incoming", {}, u.token);
      const items = inc.d.items || [];
      if (!items.length) break;
      const acc = await api(`/api/discoveries/${items[0].recipientId}/accept`, { method: "POST" }, u.token);
      if (acc.s === 200) { accepted++; console.log(u.username, "<- accepted from", items[0].sender.username); }
      else break;
      await sleep(300);
    }
  }
  console.log("total accepted:", accepted);

  // 3. two-way chat: 2 rounds, the side with fewer messages speaks
  let sent = 0;
  for (let round = 0; round < 2; round++) {
    for (const u of tokens) {
      const cv = await api("/api/conversations", {}, u.token);
      for (const conv of cv.d.conversations || []) {
        const detail = await api(`/api/conversations/${conv.id}`, {}, u.token);
        const msgs = detail.d.messages || [];
        const mine = msgs.filter((m) => m.senderId === u.uid).length;
        const theirs = msgs.length - mine;
        if (mine <= theirs) {
          const m = await api(`/api/conversations/${conv.id}/messages`, { method: "POST", body: JSON.stringify({ content: chatLines[sent % chatLines.length] }) }, u.token);
          if (m.s === 201) sent++;
          await sleep(250);
        }
      }
    }
  }
  console.log("chat messages sent:", sent);

  // 4. final admin stats
  const st = await api("/api/admin/dashboard/stats", {}, ah);
  console.log("stats:", JSON.stringify(st.d));
  const ch = await api("/api/admin/messages/chats?page=1&pageSize=10", {}, ah);
  console.log("chats total:", ch.d.pagination?.total);
})().catch((e) => console.error(e));
