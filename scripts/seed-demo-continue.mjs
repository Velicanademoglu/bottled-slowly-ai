// Continuation: accept discoveries + chat for the demo users already created.
const base = "https://bottled-slowly-ai-u1fl2k1.verdent.app";
const j = (r) => r.json();

const chats = [
  "Selam! Mesajın bana ulaştı, çok sevdim.",
  "Gerçekten güzel bir bakış açın var, devam edelim mi sohbete?",
  "Bence de! İnsan bazen sadece dinlenmek istiyor.",
  "Ben de kitap kurduyum aslında, hangi türleri seversin?",
  "Şimdilik polisiye ve bilimkurgu diyebilirim.",
  "Harika, o zaman sana birkaç önerim olacak!",
  "Bu uygulama fikri baya iyiymiş, yavaş yavaş yazmak keyifli.",
  "Evet, aceleye getirmiyor insanı. Zamanla tanışıyoruz.",
];

async function api(path, opts = {}, token) {
  const res = await fetch(base + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), ...(opts.headers || {}) },
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

const run = async () => {
  const adm = await api("/api/admin/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@projectstar.app", password: "AdminPass1" }) });
  const ah = adm.data.token;

  const all = await api("/api/admin/users?page=1&pageSize=100", {}, ah);
  const demoUsers = all.data.users.filter((u) => u.email.includes("testmail.dev"));
  console.log("demo users found:", demoUsers.length);

  let accepted = 0, chatMsgs = 0;
  const tokens = [];
  for (const u of demoUsers) {
    const login = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: u.email, password: "Demo1234!" }) });
    if (login.status !== 200) { console.log("login fail", u.username, login.status); continue; }
    tokens.push({ uid: u.id, username: u.username, token: login.data.token });
  }

  for (const u of tokens) {
    const convs = await api("/api/conversations", {}, u.token);
    const existing = (convs.data.conversations || []).length;
    if (existing > 0) { console.log(u.username, "already has", existing, "conversations"); continue; }

    const inc = await api("/api/discoveries/incoming", {}, u.token);
    const items = inc.data.items || [];
    if (!items.length) { console.log(u.username, "no incoming"); continue; }
    const acc = await api(`/api/discoveries/${items[0].recipientId}/accept`, { method: "POST" }, u.token);
    if (acc.status !== 200) { console.log("accept fail", u.username, acc.status); continue; }
    accepted++;
    const convs2 = await api("/api/conversations", {}, u.token);
    const conv = (convs2.data.conversations || [])[0];
    if (!conv) continue;
    const m = await api(`/api/conversations/${conv.id}/messages`, { method: "POST", body: JSON.stringify({ content: chats[chatMsgs % chats.length] }) }, u.token);
    if (m.status === 201) chatMsgs++;
    console.log(u.username, "accepted bottle from", items[0].sender.username, "-> chat started");
  }

  for (const u of tokens) {
    const convs = await api("/api/conversations", {}, u.token);
    const conv = (convs.data.conversations || [])[0];
    if (!conv) continue;
    const detail = await api(`/api/conversations/${conv.id}`, {}, u.token);
    const msgs = detail.data.messages || [];
    const mine = msgs.filter((m) => m.senderId === u.uid).length;
    if (mine === 0) {
      const m = await api(`/api/conversations/${conv.id}/messages`, { method: "POST", body: JSON.stringify({ content: chats[(chatMsgs + 3) % chats.length] }) }, u.token);
      if (m.status === 201) chatMsgs++;
      console.log(u.username, "replied in conversation", conv.id);
    }
  }

  console.log(`accepted: ${accepted}, new chat messages: ${chatMsgs}`);

  const st = await api("/api/admin/dashboard/stats", {}, ah);
  console.log("admin stats:", JSON.stringify(st.data));
  const sp = await api("/api/admin/messages/space?page=1&pageSize=5", {}, ah);
  console.log("space messages total:", sp.data.pagination?.total);
  const ch = await api("/api/admin/messages/chats?page=1&pageSize=5", {}, ah);
  console.log("chats total:", ch.data.pagination?.total);
};

run().catch((e) => { console.error("FAIL", e); process.exit(1); });
