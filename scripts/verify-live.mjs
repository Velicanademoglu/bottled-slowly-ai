const base = "https://bottled-slowly-ai-u1fl2k1.verdent.app";
const email = "sectest" + Date.now() + "@test.com";
const j = (r) => r.json();

const run = async () => {
  // 1-3: user flow
  const reg = await fetch(base + "/api/auth/register", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username: "sec" + Date.now().toString().slice(-6), password: "Test1234!", tosAccepted: true, adultConfirmed: true }),
  });
  console.log("1 kayit:", reg.status);

  const login = await fetch(base + "/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "Test1234!" }),
  });
  const ld = await j(login);
  console.log("2 giris:", login.status);

  const h = { Authorization: "Bearer " + ld.token, "Content-Type": "application/json" };
  const prof = await fetch(base + "/api/profile/me", { headers: h });
  const uid = (await j(prof)).id;
  console.log("3 profil:", prof.status, "userId:", uid);

  const msg = await fetch(base + "/api/messages", {
    method: "POST", headers: h,
    body: JSON.stringify({ content: "guvenlik testi", vesselKey: "parchment" }),
  });
  const md = await j(msg);
  console.log("4 mesaj:", msg.status, "id:", md.id);

  // 5: unauthenticated access
  const noauth = await fetch(base + "/api/profile/me");
  console.log("5 authsuz erisim (401 bekleniyor):", noauth.status);

  // 6-10: admin read access
  const adm = await fetch(base + "/api/admin/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@projectstar.app", password: "AdminPass1" }),
  });
  const ad = await j(adm);
  const ah = { Authorization: "Bearer " + ad.token, "Content-Type": "application/json" };
  console.log("6 admin giris:", adm.status);

  const stats = await fetch(base + "/api/admin/dashboard/stats", { headers: ah });
  console.log("7 admin stats:", stats.status);

  const space = await fetch(base + "/api/admin/messages/space", { headers: ah });
  const sd = await j(space);
  console.log("8 admin uzay mesajlari:", space.status, "toplam:", sd.pagination.total);

  const chats = await fetch(base + "/api/admin/messages/chats", { headers: ah });
  const cd = await j(chats);
  console.log("9 admin sohbetler:", chats.status, "toplam:", cd.pagination.total);

  const userMsgs = await fetch(base + "/api/admin/users-extra/" + uid + "/messages", { headers: ah });
  console.log("10 admin kullanici mesajlari:", userMsgs.status);

  // 11: grant
  const grant = await fetch(base + "/api/admin/users-extra/" + uid + "/grant-stardust", {
    method: "POST", headers: ah, body: JSON.stringify({ amount: 100, reason: "test" }),
  });
  console.log("11 admin bakiye yukleme:", grant.status);

  // 12: normal user tries admin delete (must 403)
  const secDel = await fetch(base + "/api/admin/messages/space/" + md.id, { method: "DELETE", headers: h });
  console.log("12 normal kullanici silme denemesi (403 bekleniyor):", secDel.status);

  // 13: admin deletes the space message
  const admdel = await fetch(base + "/api/admin/messages/space/" + md.id, { method: "DELETE", headers: ah });
  console.log("13 admin mesaj silme:", admdel.status);

  // 14-16: ban enforcement
  const ban = await fetch(base + "/api/admin/users/" + uid + "/status", {
    method: "POST", headers: ah, body: JSON.stringify({ status: "BANNED" }),
  });
  console.log("14 ban:", ban.status);
  const bannedAccess = await fetch(base + "/api/profile/me", { headers: h });
  console.log("15 banli kullanici erisimi (403 bekleniyor):", bannedAccess.status);
  const banlift = await fetch(base + "/api/admin/users/" + uid + "/status", {
    method: "POST", headers: ah, body: JSON.stringify({ status: "ACTIVE" }),
  });
  console.log("16 ban kaldirma:", banlift.status);

  // 17-18: user deletion + token invalidation
  const deluser = await fetch(base + "/api/admin/users/" + uid, { method: "DELETE", headers: ah });
  console.log("17 admin kullanici silme:", deluser.status);
  const goneAccess = await fetch(base + "/api/profile/me", { headers: h });
  console.log("18 silinen kullanici erisimi (401 bekleniyor):", goneAccess.status);
};

run().catch((e) => { console.error("FAIL", e); process.exit(1); });
