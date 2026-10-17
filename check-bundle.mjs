const run = async () => {
  const base = "https://bottled-slowly-ai-u1fl2k1.verdent.app";
  const html = await (await fetch(base + "/")).text();
  const scripts = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
  console.log("scripts:", scripts);
  for (const s of scripts) {
    const js = await (await fetch(base + s)).text();
    console.log(
      s,
      "len:", js.length,
      "| onrender URL:", js.includes("onrender"),
      "| verdent URL:", js.includes("bottled-slowly-ai-u1fl2k1"),
      "| isNativePlatform:", js.includes("isNativePlatform")
    );
  }
};
run().catch((e) => { console.error(e); process.exit(1); });
