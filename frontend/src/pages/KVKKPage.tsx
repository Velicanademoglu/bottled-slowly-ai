import { Link } from "react-router-dom";

export default function KVKKPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-12">
      <div className="max-w-2xl mx-auto card p-6 sm:p-8 space-y-6 text-gray-300">
        <h1 className="text-2xl font-bold text-white">KVKK Aydınlatma Metni</h1>
        <p>Son güncelleme: Eylül 2026</p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">1. Veri Sorumlusu</h2>
          <p>PROJECT STAR, kullanıcı verilerinin veri sorumlusu olarak işlenmesini sağlar.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">2. İşlenen Kişisel Veriler</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Kimlik bilgileri: e-posta, kullanıcı adı, doğum tarihi, yaş</li>
            <li>İletişim bilgileri: e-posta adresi</li>
            <li>Konum bilgileri: yalnızca seçilen ülke (kesin konum değil)</li>
            <li>İlgi alanları, dil bilgisi, biyografi ve profil fotoğrafı</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">3. Verilerin İşlenme Amaçları</h2>
          <p>Verileriniz eşleştirme, mesajlaşma, güvenlik, dolandırıcılığın önlenmesi ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenir.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">4. Haklarınız</h2>
          <p>KVKK kapsamında verilerinize erişme, düzeltme, silme, işlemeyi sınırlama ve itiraz etme hakkına sahipsiniz.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">5. İletişim</h2>
          <p>E-posta: kvkk@projectstar.app</p>
        </section>

        <div className="pt-4 border-t border-white/10">
          <Link to="/privacy" className="text-cosmic-400 hover:underline">Privacy Policy</Link>
          {" • "}
          <Link to="/terms" className="text-cosmic-400 hover:underline">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
