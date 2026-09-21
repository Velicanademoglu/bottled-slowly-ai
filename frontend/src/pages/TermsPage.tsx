export default function TermsPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-12">
      <div className="max-w-2xl mx-auto card p-6 sm:p-8 space-y-6 text-gray-300">
        <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
        <p>Last updated: September 2026</p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
          <p>
            By using PROJECT STAR you agree to these Terms of Service. You must be at least 18 years old or the minimum age in your country to use the app.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">2. User Conduct</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Be respectful to other users.</li>
            <li>Do not harass, spam, or share harmful content.</li>
            <li>Do not create fake profiles or impersonate others.</li>
            <li>Do not attempt to exploit the reward or matching systems.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">3. Purchases and Subscriptions</h2>
          <p>
            In-app purchases are processed by Apple or Google. Subscriptions renew automatically unless canceled at least 24 hours before renewal.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">4. Termination</h2>
          <p>
            We may suspend or terminate accounts that violate these terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">5. Contact</h2>
          <p>Email: support@projectstar.app</p>
        </section>
      </div>
    </div>
  );
}
