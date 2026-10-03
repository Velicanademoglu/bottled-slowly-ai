# PROJECT STAR — Store Submission Guide

Bu doküman Google Play ve App Store başvuruları için gereken tüm metinleri ve cevapları içerir.
Marka adı değişecekse aşağıdaki metinlerde `PROJECT STAR` ifadesini güncelleyin.

---

## 1. Uygulama Bilgileri

| Alan | Değer |
|---|---|
| Uygulama adı | PROJECT STAR |
| Paket adı (Android) | com.projectstar.app |
| Bundle ID (iOS) | com.projectstar.app |
| Kategori (Play) | Social |
| Kategori (App Store) | Social Networking |
| İçerik derecelendirme | 18+ / Mature (kullanıcılar arası mesajlaşma) |
| Minimum yaş | 18 (kayıt sırasında onay zorunlu) |
| Fiyat | Ücretsiz (uygulama içi satın alma + ödüllü reklam) |

## 2. Kısa Açıklama (80 karakter — Google Play)

EN: `Cast your message into the universe. Someone out there is waiting.`
TR: `Mesajını evrene bırak. Bir yerlerde biri seni bekliyor.`

## 3. Uzun Açıklama (Google Play / App Store)

### EN
PROJECT STAR is a new kind of social discovery app. Write a message, place it inside a beautiful vessel — a parchment, a heart, a space capsule — and cast it into the universe. Our smart matching engine finds someone compatible for you: shared interests, languages, and conversation goals, with a touch of serendipity.

When your message is discovered, the receiver can accept it and start a real conversation — or send it on, and your message continues its journey to the next person, crossing countries and collecting a story along the way.

- Smart matching: 70% compatibility, 30% discovery
- Track your message's journey across the world on a live map
- Real-time chat with photos, voice messages, and short videos
- AI conversation starters to break the ice
- Stardust economy: earn rewards for daily activity, streaks, and missions
- Safe by design: report, block, moderation, and adult-only community (18+)

Someone out there is waiting.

### TR
PROJECT STAR yeni nesil bir sosyal keşif uygulaması. Bir mesaj yaz, güzel bir taşıyıcıya yerleştir — parşömen, kalp, uzay kapsülü — ve evrene bırak. Akıllı eşleştirme motorumuz senin için uyumlu birini bulur: ortak ilgi alanları, diller ve sohbet hedefleri, bir tutam da sürpriz.

Mesajın keşfedildiğinde, alıcı kabul edip gerçek bir sohbet başlatabilir — ya da yoluna devam ettirir; mesajın ülkeler arası yolculuğuna devam eder.

- Akıllı eşleştirme: %70 uyum, %30 keşif
- Mesajının dünya çapındaki yolculuğunu canlı haritada takip et
- Fotoğraf, sesli mesaj ve kısa video destekli gerçek zamanlı sohbet
- Buz kırıcı AI konuşma başlatıcıları
- Stardust ekonomisi: günlük aktivite, seri ve görevlerle ödül kazan
- Tasarım gereği güvenli: şikayet, engelleme, moderasyon ve yetişkin topluluk (18+)

Bir yerlerde biri seni bekliyor.

## 4. Anahtar Kelimeler (App Store, 100 karakter)

`pen pal,friends,chat,meet,message,universe,space,penpal,talk,stranger,letter`

## 5. Google Play — Data Safety Formu

| Soru | Cevap |
|---|---|
| Veri toplanıyor mu? | Evet |
| E-posta adresi | Toplanır — hesap oluşturma — şifrelenmiş iletim — silinebilir |
| Kullanıcı adı / profil bilgileri | Toplanır — uygulama işlevselliği — silinebilir |
| Kullanıcı içerikleri (mesajlar, fotoğraflar) | Toplanır — uygulama işlevselliği — silinebilir |
| Hassas konum | TOPLANMAZ |
| Yaklaşık konum (ülke) | Kullanıcı tarafından sağlanır — eşleştirme amaçlı |
| Cihaz kimlikleri | Reklam/ödül doğrulaması için toplanabilir |
| Veriler üçüncü taraflarla paylaşılıyor mu? | Hayır (yalnızca altyapı sağlayıcıları: hosting, e-posta) |
| Veriler şifreleniyor mu? | Evet (HTTPS/TLS) |
| Kullanıcı veri silme talebi | Evet — uygulama içi: Profil → Veri ve Gizlilik → Hesabımı sil |
| Veri dışa aktarma | Evet — Profil → Veri ve Gizlilik → Verilerimi indir |

## 6. App Store — App Privacy

- **Contact Info → Email Address**: Linked to user, App Functionality
- **User Content → Messages, Photos**: Linked to user, App Functionality
- **Identifiers → User ID**: Linked to user, App Functionality
- **Diagnostics**: Not linked, Analytics (opsiyonel)
- Tracking: Hayır (reklam SDK'sı eklenirse güncellenir)

## 7. İçerik Derecelendirme (IARC / App Store)

- Kullanıcılar arası iletişim: Evet (UGC)
- Şiddet, kumar, uyuşturucu içeriği: Yok
- Hedef kitle: 18+
- Not: Kayıt sırasında 18+ onayı zorunludur; reşit olmayan kullanıcı şikayeti için özel rapor kategorisi ("Underage concern") mevcuttur.

## 8. Gerekli URL'ler (yayın öncesi canlı olmalı)

| Sayfa | URL |
|---|---|
| Gizlilik Politikası | https://<domain>/privacy |
| Kullanım Şartları | https://<domain>/terms |
| KVKK | https://<domain>/kvkk |
| Hesap silme talimatı | https://<domain>/privacy (Bölüm 4) |
| Destek e-postası | support@projectstar.app |

## 9. Yayın Öncesi Kontrol Listesi

- [x] Hesap silme (uygulama içi, şifre onaylı)
- [x] Veri dışa aktarma (JSON, KVKK/GDPR)
- [x] 18+ yaş onayı (kayıt sırasında zorunlu)
- [x] Şartlar + Gizlilik onayı (kayıt sırasında zorunlu)
- [x] Gizlilik / Şartlar / KVKK sayfaları
- [x] Raporlama + engelleme sistemi
- [x] Uygulama ikonu ve splash (resources/)
- [x] PWA manifest + app-ads.txt
- [ ] Canlı domain'e deploy (Vercel + Render) — bk. PUBLISHING.md
- [ ] Gizlilik sayfası URL'si canlıda doğrulanmalı (Play Console zorunlu)
- [ ] Android AAB üretimi (Capacitor + Android Studio)
- [ ] iOS build (Mac + Xcode gerekli)
- [ ] Ekran görüntüleri: en az 2 telefon görüntüsü (Play), 6.5" + 5.5" (App Store)
- [ ] Mağaza hesapları: Google Play Developer ($25 tek seferlik), Apple Developer ($99/yıl)

## 10. Ekran Görüntüsü Önerileri

1. Space ana ekranı (CAST INTO SPACE)
2. Mesaj yolculuğu haritası (Discoveries → Traveling)
3. Gelen mesaj / Accept ekranı
4. Sohbet ekranı (medya desteği)
5. Profil kozmosu (seviye/gravity)
