import { LegalPage } from "../components/LegalPage";
import { usePageTitle } from "../hooks/usePageTitle";

export function PrivacyPage() {
  usePageTitle("Privacy Policy");
  return (
    <LegalPage title="Privacy Policy" updated="2026-08-10">
      <h2 id="overview">1. Overview</h2>
      <p>
        This policy explains what personal data PrepUniv collects, why, and how
        it's handled, in line with Nigeria's Data Protection Act / NDPR.
      </p>

      <h2 id="what-we-collect">2. What We Collect</h2>
      <ul>
        <li>
          Account info: full name, email, password (stored securely, hashed — we
          never see your plain password).
        </li>
        <li>
          Payment info: handled entirely by our payment provider; PrepUniv does
          not store your card or bank card details. For Creators, we collect
          bank account number and bank name/code solely to process payouts.
        </li>
        <li>
          Usage data: quiz attempts, scores, wallet transaction history, reports
          filed.
        </li>
        <li>
          Technical data: basic device/browser info for security and
          troubleshooting.
        </li>
      </ul>

      <h2 id="how-we-use">3. How We Use Your Data</h2>
      <ul>
        <li>
          To operate your account, process payments, and deliver quiz
          attempts/results.
        </li>
        <li>To pay Creators their earnings.</li>
        <li>To review Creator applications and investigate reports.</li>
        <li>
          To communicate with you about your account, transactions, or platform
          updates.
        </li>
        <li>We do not sell your personal data to third parties.</li>
      </ul>

      <h2 id="who-we-share">4. Who We Share Data With</h2>
      <ul>
        <li>Our payment provider (to process top-ups and payouts).</li>
        <li>
          Our hosting/database provider (to store and serve your data securely).
        </li>
        <li>We may disclose data if required by law.</li>
      </ul>

      <h2 id="retention">5. Data Retention</h2>
      <p>
        We retain your account and transaction data for as long as your account
        is active, and as needed to meet legal/financial record‑keeping
        obligations after account closure.
      </p>

      <h2 id="rights">6. Your Rights</h2>
      <p>
        Under Nigerian data protection law, you have the right to access,
        correct, or request deletion of your personal data, subject to our legal
        obligation to retain financial transaction records. Contact us at
        [support email placeholder] to exercise these rights.
      </p>

      <h2 id="children">7. Children's Privacy</h2>
      <p>
        PrepUniv is intended for users 16 and older and is not directed at
        children under that age.
      </p>

      <h2 id="security">8. Security</h2>
      <p>
        We use reasonable technical and organizational measures to protect your
        data, including secure password storage and encrypted payment processing
        via our provider. No system is 100% secure, and we can't guarantee
        absolute security.
      </p>

      <h2 id="policy-changes">9. Changes to This Policy</h2>
      <p>
        We may update this policy from time to time; material changes will be
        communicated in‑app.
      </p>

      <h2 id="contact">10. Contact</h2>
      <p>Questions about this policy: [support email placeholder].</p>
    </LegalPage>
  );
}
