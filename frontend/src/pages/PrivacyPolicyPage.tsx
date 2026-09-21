export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-12">
      <div className="max-w-2xl mx-auto card p-6 sm:p-8 space-y-6 text-gray-300">
        <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
        <p>Last updated: September 2026</p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">1. Information We Collect</h2>
          <p>
            PROJECT STAR collects the information you provide when registering, completing your profile, and using the app. This may include your email, username, age, country, languages, interests, bio, and photos.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide matching, messaging, and discovery features.</li>
            <li>To personalize your experience and show relevant content.</li>
            <li>To keep the platform safe and enforce our rules.</li>
            <li>To process purchases and prevent fraud.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">3. Location Data</h2>
          <p>
            We do not collect precise GPS location. We only use the country you select for matching and analytics.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">4. Data Retention and Deletion</h2>
          <p>
            You can request account deletion at any time. We will remove your profile data within 30 days, except where required by law.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">5. Contact Us</h2>
          <p>Email: privacy@projectstar.app</p>
        </section>
      </div>
    </div>
  );
}
