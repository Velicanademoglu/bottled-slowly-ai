import { prisma } from "../db.js";

const cache = new Map<string, string>();

export async function getSetting(key: string, defaultValue = ""): Promise<string> {
  if (cache.has(key)) return cache.get(key)!;
  const setting = await prisma.appSetting.findUnique({ where: { key } });
  const value = setting?.value ?? defaultValue;
  cache.set(key, value);
  return value;
}

export async function setSetting(key: string, value: string, category = "general"): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value, category },
    update: { value, category },
  });
  cache.set(key, value);
}

export async function getSettingsByCategory(category: string): Promise<Record<string, string>> {
  const settings = await prisma.appSetting.findMany({ where: { category } });
  return settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);
}

export function clearSettingsCache() {
  cache.clear();
}
