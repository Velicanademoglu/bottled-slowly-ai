// E2E bot test: male user casts -> female bot accepts -> chat -> bot replies.
const base = "https://bottled-slowly-ai-u1fl2k1.verdent.app";
const j = (r) => r.json();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const api = async (p, o = {}, t) => {
  const r = await fetch(base + p, { ...o, headers: { "Content-Type": "application/json", ...(t ? { Authorization: "Bearer " + t } : {}) } });
  return { s: r.status, d: await j(r).catch(() => ({})) };
};

(async () => {
  const stamp = Date.now().toString(36);
  const email = `bottest${stamp}@testmail.dev`;
  const reg = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ email, username: "bottest" + stamp.slice(-5), password: "Test1234!", tosAccepted: true, adultConfirmed: true }) });
  console.log("register:", reg.s);
  if (reg.s !== 201) return console.log(JSON.stringify(reg.d));
  const t = reg.d.token;
  const uid = reg.d.user.id;

  // onboarding: MALE user, prefers FEMALE, English interests to bias toward bots
  await api("/api/profile/me", { method: "PUT", body: JSON.stringify({ birthDate: "1995-06-15", gender: "MALE", country: "Turkey", bio: "Yeni insanlarla tanismayi seven, merakli biriyim.", onboardingCompleted: true }) }, t);
  await api("/api/profile/preferences", { method: "PUT", body: JSON.stringify({ preferredGender: "FEMALE", minAge: 18, maxAge: 45, conversationGoals: ["Friendship", "Deep conversations"] }) }, t);
  await api("/api/profile/languages", { method: "POST", body: JSON.stringify({ language: "English", level: "FLUENT" }) }, t);
  await api("/api/profile/interests", { method: "POST", body: JSON.stringify({ interest: "Music" }) }, t);
  await api("/api/profile/interests", { method: "POST", body: JSON.stringify({ interest: "Travel" }) }, t);
  const prefCheck = await api("/api/profile/me", {}, t);
  console.log("pref saved:", prefCheck.d.preferences?.preferredGender, "| completion:", prefCheck.d.completion);
  console.log("onboarding done, userId:", uid);

  const draft = await api("/api/messages", { method: "POST", body: JSON.stringify({ content: "Merhaba! Bu gece uzun bir yuruyus yaptim ve yildizlari izlerken birine yazmak istedim. Sen nasilsin?", vesselKey: "parchment" }) }, t);
  console.log("draft:", draft.s);
  const cast = await api(`/api/messages/${draft.d.id}/cast`, { method: "POST" }, t);
  console.log("cast:", cast.s, "-> recipient:", JSON.stringify(cast.d.recipient || cast.d));
  if (cast.s !== 200) return;

  // wait for bot accept (30-120s + first msg)
  let conv = null;
  for (let i = 0; i < 10; i++) {
    await sleep(20000);
    const cv = await api("/api/conversations", {}, t);
    conv = (cv.d.conversations || [])[0];
    if (conv) break;
    console.log(`waiting for bot accept... (${(i + 1) * 20}s)`);
  }
  if (!conv) return console.log("FAIL: no conversation after 200s");
  console.log("conversation created:", conv.id);

  const det = await api(`/api/conversations/${conv.id}`, {}, t);
  const msgs = det.d.messages || [];
  console.log("bot first message:", msgs.map((m) => m.content).join(" | "));

  // send a question, wait for bot reply
  const send = await api(`/api/conversations/${conv.id}/messages`, { method: "POST", body: JSON.stringify({ content: "Tesekkurler! Peki sen gun icinde en cok neyi yapiyorsun? Bir hobin var mi?" }) }, t);
  console.log("chat sent:", send.s);

  let botReply = null;
  for (let i = 0; i < 6; i++) {
    await sleep(15000);
    const det2 = await api(`/api/conversations/${conv.id}`, {}, t);
    const list = det2.d.messages || [];
    const last = list[list.length - 1];
    if (last && last.senderId !== uid) { botReply = last.content; break; }
    console.log(`waiting for bot reply... (${(i + 1) * 15}s)`);
  }
  console.log(botReply ? "BOT REPLY: " + botReply : "FAIL: no bot reply in 90s");
})();
