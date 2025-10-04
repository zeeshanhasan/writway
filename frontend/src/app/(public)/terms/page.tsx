export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-semibold text-[var(--color-primary)] mb-8">Terms of Service</h1>
        
        <p className="text-[var(--color-neutral-mid)] mb-8">
          <strong>Last Updated:</strong> January 15, 2025
        </p>

        <p className="mb-8">
          Welcome to Writway Technologies Inc. ("Writway", "we", "us", or "our").<br />
          These Terms of Service ("Terms") govern your access to and use of our platform, applications, websites, and services (collectively, the "Services").
        </p>

        <p className="mb-8">
          By creating an account, accessing, or using Writway, you agree to be bound by these Terms. If you do not agree, you must not use the Services.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">1. Overview</h2>
          <p className="mb-4">
            Writway provides a software-as-a-service (SaaS) platform that helps paralegals, law offices, and legal teams automate documentation workflows, client communication, and task management.
          </p>
          <p className="mb-4">
            The Services include features such as client and case management, workflow automation, Google Workspace integration, and subscription billing.
          </p>
          <p className="mb-4">
            You may use Writway only in compliance with these Terms and all applicable laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">2. Eligibility</h2>
          <p className="mb-4">To use Writway:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>You must be at least 18 years old and legally capable of entering into a binding agreement.</li>
            <li>You must have authority to act on behalf of your organization (if registering a business account).</li>
            <li>You may not use Writway if you are prohibited from doing so under applicable laws.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">3. Account Registration and Access</h2>
          <p className="mb-4">When creating an account (directly or via Google Workspace):</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>You must provide accurate and complete information.</li>
            <li>You are responsible for maintaining the confidentiality of your credentials.</li>
            <li>You are responsible for all activities that occur under your account.</li>
            <li>If you believe your account has been compromised, contact <a href="mailto:support@writway.com" className="text-[var(--color-accent)] hover:underline">support@writway.com</a> immediately.</li>
          </ul>
          <p className="mb-4">
            We reserve the right to suspend or terminate accounts that violate these Terms or pose a security or legal risk.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">4. Organizational Accounts & Multi-Tenant Use</h2>
          <p className="mb-4">
            Writway supports multi-user organizations ("Tenants"). Each Tenant is managed by one or more Administrators who control user access, permissions, and billing.
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Super Admins</strong> (Writway internal) have oversight over all tenants for security and billing management.</li>
            <li><strong>Org Admins</strong> manage users, workflows, and subscriptions within their organization.</li>
            <li><strong>Users/Staff</strong> may be invited to collaborate but have restricted access based on role permissions.</li>
          </ul>
          <p className="mb-4">
            If you access Writway through your employer or organization, your account and data belong to that organization.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">5. Subscriptions and Billing</h2>
          
          <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-3">5.1 Free Trial</h3>
          <p className="mb-4">
            Writway may offer a free trial to allow new users to explore core features. Trials are time-limited and subject to change.
          </p>

          <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-3">5.2 Paid Plans</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Continued access after the trial requires a paid subscription. Billing and payments are managed via Stripe or equivalent providers.</li>
            <li>Fees are billed monthly or annually, as selected.</li>
            <li>Subscriptions auto-renew unless cancelled before the renewal date.</li>
            <li>All fees are non-refundable except as required by law.</li>
          </ul>

          <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-3">5.3 Taxes</h3>
          <p className="mb-4">
            You are responsible for all applicable taxes, levies, or duties (excluding Writway's income taxes).
          </p>

          <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-3">5.4 Cancellation</h3>
          <p className="mb-4">
            You may cancel your subscription at any time via your billing settings. Upon cancellation, access remains active until the current billing cycle ends.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">6. Acceptable Use</h2>
          <p className="mb-4">You agree not to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Use Writway for any unlawful purpose or to violate legal ethics or client confidentiality.</li>
            <li>Upload or share material that infringes intellectual property, privacy, or proprietary rights.</li>
            <li>Attempt to gain unauthorized access to other tenants' data.</li>
            <li>Interfere with or disrupt the security, performance, or integrity of the Services.</li>
            <li>Use bots, scrapers, or automated systems without written permission.</li>
          </ul>
          <p className="mb-4">
            Writway reserves the right to suspend or terminate access for violations of this clause.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">7. Data Ownership and Privacy</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>You retain all rights to data and content you upload ("Customer Data").</li>
            <li>Writway acts as a data processor for information you or your organization manage through the platform.</li>
            <li>We process personal data in accordance with our <a href="/privacy" className="text-[var(--color-accent)] hover:underline">Privacy Policy</a>, which forms part of these Terms.</li>
            <li>If you use Writway to handle client data, you are solely responsible for ensuring compliance with applicable privacy, confidentiality, and legal obligations.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">8. Integrations and Third-Party Services</h2>
          <p className="mb-4">
            Writway integrates with third-party services such as Google Workspace, Microsoft Outlook, and Stripe.
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>By connecting your account, you grant Writway permission to access and process data strictly for functionality (e.g., syncing emails, documents, and calendar events).</li>
            <li>Writway's use of Google data adheres to the Google API Services User Data Policy, including Limited Use.</li>
            <li>We are not responsible for third-party services or their data handling practices. Please review their respective terms and privacy policies.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">9. Intellectual Property</h2>
          <p className="mb-4">
            All intellectual property in the Services (including software, UI/UX, trademarks, and documentation) is owned or licensed by Writway.
          </p>
          <p className="mb-4">
            You are granted a limited, non-exclusive, non-transferable license to use the Services during your active subscription.
          </p>
          <p className="mb-4">You may not:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Copy, modify, or distribute the platform's source code or UI.</li>
            <li>Reverse-engineer or decompile any software components.</li>
            <li>Use Writway's branding without written consent.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">10. Confidentiality</h2>
          <p className="mb-4">
            You and Writway agree to keep all confidential information (including client data, trade secrets, or business information) strictly confidential and use it only for purposes of providing or receiving the Services.
          </p>
          <p className="mb-4">
            This obligation survives termination of the agreement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">11. Termination and Suspension</h2>
          <p className="mb-4">We may suspend or terminate your access if:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>You breach these Terms or fail to pay subscription fees.</li>
            <li>You misuse the Services or compromise security.</li>
            <li>We are required to do so by law.</li>
          </ul>
          <p className="mb-4">Upon termination:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Your account and organization data may be deleted after 30 days.</li>
            <li>Some data may be retained as required for legal or audit purposes.</li>
            <li>You may terminate your account at any time via settings or by contacting <a href="mailto:support@writway.com" className="text-[var(--color-accent)] hover:underline">support@writway.com</a>.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">12. Disclaimers</h2>
          <p className="mb-4">
            Writway is provided "as is" and "as available", without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, or non-infringement.
          </p>
          <p className="mb-4">We do not warrant that:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>The Services will be uninterrupted or error-free.</li>
            <li>All workflows will suit every use case.</li>
            <li>Integrations will always remain available or compatible.</li>
          </ul>
          <p className="mb-4">
            You are solely responsible for verifying outputs before using them in any legal or professional context.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">13. Limitation of Liability</h2>
          <p className="mb-4">To the maximum extent permitted by law:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Writway shall not be liable for any indirect, consequential, or incidental damages (including loss of profits, data, or reputation).</li>
            <li>Our total aggregate liability for any claim under these Terms shall not exceed the amount you paid to Writway in the preceding 12 months.</li>
            <li>Some jurisdictions do not allow such exclusions, so these limits may not apply to you.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">14. Indemnification</h2>
          <p className="mb-4">You agree to indemnify and hold harmless Writway, its officers, directors, and employees from any claims, damages, or expenses arising from:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Your use or misuse of the Services.</li>
            <li>Your violation of these Terms or applicable laws.</li>
            <li>Your content or data uploaded to the platform.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">15. Modifications</h2>
          <p className="mb-4">
            We may modify these Terms at any time. If we make significant changes, we will notify you via email or dashboard alerts. Continued use of Writway after updates constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">16. Governing Law & Jurisdiction</h2>
          <p className="mb-4">
            These Terms are governed by and construed in accordance with the laws of England and Wales, without regard to conflict of law principles.
          </p>
          <p className="mb-4">
            You agree to the exclusive jurisdiction of the English courts for any disputes arising from these Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">17. Contact</h2>
          <p className="mb-4">
            If you have questions about these Terms or need support, contact: <a href="mailto:support@writway.com" className="text-[var(--color-accent)] hover:underline">support@writway.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}

