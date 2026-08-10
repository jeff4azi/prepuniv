import { LegalPage } from "../components/LegalPage";

export function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="2026-08-10">
      <h2 id="acceptance">1. Acceptance of Terms</h2>
      <p>By creating a PrepUniv account, you agree to these Terms. If you don't agree, please don't use the platform.</p>

      <h2 id="what-is-prepuniv">2. What PrepUniv Is</h2>
      <p>PrepUniv is a platform where approved Creators build practice quizzes for university/course-specific exam preparation, and Learners pay a small fee to attempt them. PrepUniv is a marketplace and payment facilitator — we don't guarantee the accuracy or quality of any individual Creator's quiz content.</p>

      <h2 id="eligibility">3. Eligibility</h2>
      <p>You must be at least 16 years old to create a PrepUniv account. By signing up, you confirm you meet this requirement.</p>

      <h2 id="accounts">4. Accounts</h2>
      <p>You're responsible for keeping your login credentials secure and for all activity under your account. Notify us immediately if you suspect unauthorized access.</p>

      <h2 id="wallet-payments">5. Wallet & Payments</h2>
      <p>PrepUniv uses a wallet system: you top up funds, which are held as platform credit — not a stored cash balance, and not directly withdrawable as cash by Learners.</p>
      <p>Wallet credit can only be spent on quiz attempts within PrepUniv.</p>
      <p>Once you pay to attempt a specific quiz, that quiz is permanently unlocked on your account — you may retake it an unlimited number of times at no additional cost, for as long as PrepUniv operates and that quiz remains available.</p>
      <p>All payments are processed via our third-party payment provider. PrepUniv does not store your card details.</p>

      <h2 id="no-refunds">6. No Refunds</h2>
      <p>All quiz payments are final. Given the small transaction amounts involved, we do not offer refunds — including for cases where you're dissatisfied with quiz content, believe a question is flawed, or no longer wish to use a purchased quiz. If a quiz contains a genuine error, please use the "Report" feature so the Creator or our team can address it going forward; this does not entitle you to a refund of amounts already paid.</p>
      <p>The one exception: if you paid and were charged successfully by our payment provider but never received wallet credit due to a technical failure on our end, contact us (see Section 13) and we'll investigate and correct it — this is a delivery fix, not a refund.</p>

      <h2 id="creator-terms">7. Creator Terms</h2>
      <p>Creators must apply and be approved before publishing quizzes.</p>
      <p>Creators earn 65% of each quiz payment; PrepUniv retains 35% as a platform fee.</p>
      <p>Creators may edit their quizzes at any time; edits apply immediately to future attempts. Past attempt results and reviews are preserved as they were at the time of that attempt and won't change retroactively.</p>
      <p>Creator content must be original or clearly your own derivative work. Do not upload verbatim copyrighted exam material (e.g. past questions owned by an examining body such as JAMB or WAEC) without the right to do so. PrepUniv may remove content that violates this and may suspend Creator status for repeated violations.</p>
      <p>Payouts are requested manually, subject to a minimum balance threshold and a request frequency limit (shown in-app), and are paid to the bank account details you provide. You're responsible for keeping those details accurate.</p>

      <h2 id="prohibited-conduct">8. Prohibited Conduct</h2>
      <p>You agree not to: share your account, attempt to circumvent payment for quiz access, upload harmful or illegal content, harass other users or Creators, misuse the report system to target competitors in bad faith, or attempt to reverse-engineer or scrape the platform.</p>

      <h2 id="content-moderation">9. Content Moderation</h2>
      <p>We rely on Creator vetting and a reactive report system rather than pre-publish review. We may unpublish or remove quizzes that violate these Terms, with or without notice.</p>

      <h2 id="account-suspension">10. Account Suspension</h2>
      <p>We may suspend or terminate accounts that violate these Terms, engage in fraud, or abuse other users.</p>

      <h2 id="disclaimer">11. Disclaimer</h2>
      <p>PrepUniv is a study aid, not a guarantee of exam performance. We make no warranty about the accuracy or completeness of any Creator's content.</p>

      <h2 id="changes-to-terms">12. Changes to These Terms</h2>
      <p>We may update these Terms from time to time. Continued use after changes means you accept the updated Terms.</p>

      <h2 id="contact">13. Contact</h2>
      <p>Questions about these Terms, or payment issues covered under Section 6's exception, can be sent to [support email placeholder].</p>
    </LegalPage>
  );
}
