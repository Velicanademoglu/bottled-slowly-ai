-- Tiered call subscriptions: voice ($5/mo) and video ($15/mo)
ALTER TABLE "UserPremium" ADD COLUMN "voiceUntil" TIMESTAMP(3);
ALTER TABLE "UserPremium" ADD COLUMN "videoUntil" TIMESTAMP(3);
