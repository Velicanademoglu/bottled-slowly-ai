const base = "https://bottled-slowly-ai-u1fl2k1.verdent.app";
const email = "onboard" + Date.now() + "@test.com";
const username = "onb" + Date.now().toString().slice(-6);

const run = async () => {
  const h = { "Content-Type": "application/json" };
  console.log("1. register");
  const reg = await fetch(base + "/api/auth/register", {
    method: "POST", headers: h,
    body: JSON.stringify({ email, username, password: "Test1234!", tosAccepted: true, adultConfirmed: true }),
  });
  console.log("   register:", reg.status);

  const login = await fetch(base + "/api/auth/login", {
    method: "POST", headers: h,
    body: JSON.stringify({ email, password: "Test1234!" }),
  });
  const ld = await login.json();
  console.log("   login:", login.status);
  const auth = { ...h, Authorization: "Bearer " + ld.token };

  console.log("2. profile update (onboarding finish)");
  const upd = await fetch(base + "/api/profile/me", {
    method: "PUT", headers: auth,
    body: JSON.stringify({ birthDate: "1995-05-10", gender: "MALE", country: "Turkey", bio: "test", onboardingCompleted: true }),
  });
  const updData = await upd.json();
  console.log("   update:", upd.status, JSON.stringify(updData).slice(0, 200));

  console.log("3. preferences");
  const pref = await fetch(base + "/api/profile/preferences", {
    method: "PUT", headers: auth,
    body: JSON.stringify({ preferredGender: "EVERYONE", minAge: 18, maxAge: 99, conversationGoals: ["Casual"] }),
  });
  console.log("   prefs:", pref.status, (await pref.text()).slice(0, 150));

  console.log("4. add language");
  const lang = await fetch(base + "/api/profile/languages", {
    method: "POST", headers: auth,
    body: JSON.stringify({ language: "Turkish", level: "Native" }),
  });
  console.log("   lang:", lang.status, (await lang.text()).slice(0, 150));

  console.log("5. add interest");
  const intr = await fetch(base + "/api/profile/interests", {
    method: "POST", headers: auth,
    body: JSON.stringify({ interest: "Music" }),
  });
  console.log("   interest:", intr.status, (await intr.text()).slice(0, 150));

  console.log("6. claim profile completion");
  const claim = await fetch(base + "/api/stardust/claim/profile-completion", { method: "POST", headers: auth });
  console.log("   claim:", claim.status, (await claim.text()).slice(0, 150));

  console.log("7. space page data: balance + app config + personas");
  const bal = await fetch(base + "/api/stardust/balance", { headers: auth });
  console.log("   balance:", bal.status, (await bal.text()).slice(0, 100));
  const cfg = await fetch(base + "/api/app/config");
  console.log("   config:", cfg.status, (await cfg.text()).slice(0, 200));
  const per = await fetch(base + "/api/ai/personas", { headers: auth });
  console.log("   personas:", per.status, (await per.text()).slice(0, 100));

  console.log("8. profile me (auth refresh)");
  const me = await fetch(base + "/api/profile/me", { headers: auth });
  const meData = await me.json();
  console.log("   me:", me.status, "persona:", meData.persona, "onboarding:", meData.onboardingCompleted, "stardust:", meData.stardustBalance);
};
run().catch((e) => { console.error("FAILED:", e); process.exit(1); });
