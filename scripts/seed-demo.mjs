// Demo content seeder: creates test users, completes onboarding, casts
// space messages, accepts discoveries and exchanges chat messages on live.
const base = "https://bottled-slowly-ai-u1fl2k1.verdent.app";
const ADMIN = { email: "admin@projectstar.app", password: "AdminPass1" };
const j = (r) => r.json();
const stamp = Date.now().toString(36);

const personas = [
  { username: "yildizgezgini", gender: "MALE", age: 29, city: "İstanbul", bio: "Gece yürüyüşleri ve filmler hakkında konuşmayı seven bir yazılımcı.", interests: ["sinema", "yazılım", "astronomi"] },
  { username: "denizkizi_", gender: "FEMALE", age: 26, city: "İzmir", bio: "Kitaplar, kedi videoaları ve uzun telefon konuşmaları. Yeni insanlarla tanışmayı seviyorum.", interests: ["kitap", "kediler", "müzik"] },
  { username: "ay_isigi", gender: "FEMALE", age: 31, city: "Ankara", bio: "Sabah koşuları, akşam çayı. Hayattan küçük şeylerle mutlu olan biri.", interests: ["koşu", "yemek", "seyahat"] },
  { username: "gecekartali", gender: "MALE", age: 34, city: "Bursa", bio: "Müzik prodüksiyonuyla uğraşıyorum, gitar çalıyorum, festival gezmeyi seviyorum.", interests: ["müzik", "gitar", "festivaller"] },
  { username: "ufukceligi", gender: "MALE", age: 23, city: "Eskişehir", bio: "Öğrenciyim. Fotoğrafçılık ve bisiklet beni hayatta tutuyor.", interests: ["fotoğraf", "bisiklet", "oyun"] },
  { username: "pusula_yildizi", gender: "FEMALE", age: 28, city: "Antalya", bio: "Deniz kenarında yaşıyorum, yoga yapıyorum, dünyayı gezmek en büyük hayalim.", interests: ["yoga", "seyahat", "doğa"] },
  { username: "kuyruklu_yildiz", gender: "FEMALE", age: 35, city: "Berlin", bio: "Yurt dışında yaşayan bir Türk. Vatan özlemi ve bilimkurgu sohbetlerine açığım.", interests: ["bilimkurgu", "piyano", "astronomi"] },
  { username: "gokyuzu_avcisi", gender: "MALE", age: 27, city: "Londra", bio: "Mühendislik okudum ama kalbim hep sanatta. Çizim ve retro oyunlar sevdalısıyım.", interests: ["çizim", "retro oyunlar", "sanat"] },
];

const texts = [
  "Bu gece gökyüzü inanılmaz güzel. Sen de baktın mı son olarak yıldızlara?",
  "Merhaba! Uzun süredir aklımda olan bir soruyu soracağım: hayatında yaptığın en cesur şey neydi?",
  "Yalnızlık bazen güzel ama paylaşınca daha güzel oluyor. Senin için hangisi?",
  "Bugün işten ayrıldım ve özgürlüğü ilk kez gerçekten hissettim. Sen hiç ani bir karar verdin mi?",
  "Selam! Kitap önerilerini merak ediyorum, son okuduğun ve hayatını değiştiren kitap neydi?",
  "Farklı bir şehirde yaşıyorum ve yeni insanlarla tanışmak istiyorum. Senin şehrinde akşam nereye gidilir?",
  "Bazen bir yabancıya yazmak, tanıdığına yazmaktan daha kolay geliyor. Sence neden böyle?",
  "Müzik zevkini merak ettim. En çok hangi şarkı seni kendine getiriyor?",
  "Hayatımda ilk kez şişeye mesaj yazıyorum. Umarım iyi birine ulaşır. Sen nasılsın?",
  "Sabah 5'te kalkıp deniz kenarında yürümek günümü kurtarıyor. Senin ritüelin var mı?",
  "Geçen hafta bisikletle 40 km pedalladım, hâlâ kaslarım ağrıyor ama bayıldım. Sen sporcu musun?",
  "Küçükken astronot olmak istiyordum, şimdi hâlâ gökyüzüne bakınca gülümserim. Senin çocukluk hayalin neydi?",
];

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

const freeVessels = ["parchment", "heart", "basic_capsule", "star_message"];

async function api(path, opts = {}, token) {
  const res = await fetch(base + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), ...(opts.headers || {}) },
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

const run = async () => {
  const log = (...a) => console.log(...a);
  const users = [];
  let castOk = 0, castFail = 0;

  // --- 1. Admin login ---
  const adm = await api("/api/admin/auth/login", { method: "POST", body: JSON.stringify(ADMIN) });
  if (adm.status !== 200) { console.error("admin login FAIL", adm.status); process.exit(1); }
  const ah = adm.data.token;
  log("admin login:", adm.status);

  // --- 2. Create users + onboarding + verify ---
  for (let i = 0; i < personas.length; i++) {
    const p = personas[i];
    const email = `demo${stamp}${i}@testmail.dev`;
    const reg = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ email, username: p.username, password: "Demo1234!", tosAccepted: true, adultConfirmed: true }) });
    if (reg.status !== 201) { log("REGISTER FAIL", p.username, reg.status, JSON.stringify(reg.data)); continue; }
    const token = reg.data.token;
    const uid = reg.data.user.id;

    const birth = `19${60 + ((p.age + 4) % 40)}-0${1 + (i % 9)}-1${i % 9}`;
    await api("/api/profile/me", { method: "PUT", body: JSON.stringify({ birthDate: birth, gender: p.gender, country: p.city.includes("Berlin") ? "Germany" : p.city.includes("Londra") ? "United Kingdom" : "Turkey", bio: p.bio, onboardingCompleted: true }) }, token);
    await api("/api/profile/preferences", { method: "PUT", body: JSON.stringify({ preferredGender: "EVERYONE", minAge: 18, maxAge: 65, conversationGoals: ["friendship", "deep_talks"] }) }, token);
    await api("/api/profile/languages", { method: "POST", body: JSON.stringify({ language: "Turkish", level: "NATIVE" }) }, token);
    for (const interest of p.interests) {
      await api("/api/profile/interests", { method: "POST", body: JSON.stringify({ interest }) }, token);
    }
    const ver = await api(`/api/admin/users/${uid}/verify-email`, { method: "POST" }, ah);
    log(`user ${p.username}: id=${uid} verify=${ver.status}`);
    users.push({ ...p, email, token, uid, casts: 0 });
  }

  // --- 3. Grant stardust to two users so they can send premium vessels ---
  if (users.length >= 2) {
    for (const u of [users[0], users[3]]) {
      await api(`/api/admin/users-extra/${u.uid}/grant-stardust`, { method: "POST", body: JSON.stringify({ amount: 250, reason: "demo" }) }, ah);
    }
    log("stardust granted to", users[0].username, "+", users[3].username);
  }

  // --- 4. Cast messages (2 per user) ---
  let t = 0;
  for (const u of users) {
    for (let k = 0; k < 2; k++) {
      const vesselKey = k === 1 && (u === users[0] || u === users[3]) ? "crystal_heart" : freeVessels[(u.uid + k) % freeVessels.length];
      const create = await api("/api/messages", { method: "POST", body: JSON.stringify({ content: texts[t % texts.length], vesselKey }) }, u.token);
      t++;
      if (create.status !== 201) { log("DRAFT FAIL", u.username, create.status); castFail++; continue; }
      const cast = await api(`/api/messages/${create.data.id}/cast`, { method: "POST" }, u.token);
      if (cast.status === 200) { castOk++; u.casts++; }
      else { log("CAST FAIL", u.username, cast.status, JSON.stringify(cast.data)); castFail++; }
    }
  }
  log(`casts: ${castOk} ok, ${castFail} fail`);

  // --- 5. Accept discoveries + chat ---
  let accepted = 0, chatMsgs = 0;
  for (const u of users) {
    const inc = await api("/api/discoveries/incoming", {}, u.token);
    const items = inc.data.items || [];
    if (!items.length) continue;
    const acc = await api(`/api/discoveries/${items[0].recipientId}/accept`, { method: "POST" }, u.token);
    if (acc.status !== 200) { log("ACCEPT FAIL", u.username, acc.status, JSON.stringify(acc.data)); continue; }
    accepted++;
    const convs = await api("/api/conversations", {}, u.token);
    const list0 = convs.data.conversations || convs.data || [];
    const conv = list0.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    if (!conv) continue;
    const convId = conv.id || conv.conversationId;
    const m1 = await api(`/api/conversations/${convId}/messages`, { method: "POST", body: JSON.stringify({ content: chats[chatMsgs % chats.length] }) }, u.token);
    if (m1.status === 201) chatMsgs++;
  }
  // partner replies
  for (const u of users) {
    const convs = await api("/api/conversations", {}, u.token);
    const list1 = convs.data.conversations || convs.data || [];
    const conv = list1.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    if (!conv) continue;
    const convId = conv.id || conv.conversationId;
    const msgs = await api(`/api/conversations/${convId}`, {}, u.token);
    const list = msgs.data.messages || [];
    const mine = list.filter((m) => m.senderId === u.uid).length;
    if (mine === 0) {
      const m = await api(`/api/conversations/${convId}/messages`, { method: "POST", body: JSON.stringify({ content: chats[(chatMsgs + 3) % chats.length] }) }, u.token);
      if (m.status === 201) chatMsgs++;
    }
  }
  log(`accepted: ${accepted}, chat messages: ${chatMsgs}`);

  // --- 6. Verify via admin ---
  const st = await api("/api/admin/dashboard/stats", {}, ah);
  log("admin stats:", JSON.stringify(st.data));
  const sp = await api("/api/admin/messages/space?page=1&pageSize=5", {}, ah);
  log("space messages total:", sp.data.pagination?.total);
  const ch = await api("/api/admin/messages/chats?page=1&pageSize=5", {}, ah);
  log("chats total:", ch.data.pagination?.total);
  log("\nTEST LOGIN (ornek):", users[0]?.email, "/ Demo1234!");
};

run().catch((e) => { console.error("FAIL", e); process.exit(1); });
