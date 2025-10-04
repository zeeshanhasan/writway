export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-semibold text-[var(--color-primary)] mb-8">Privacy Policy</h1>
        
        <p className="text-[var(--color-neutral-mid)] mb-8">
          <strong>Last Updated:</strong> January 15, 2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">1. Introduction</h2>
          <p className="mb-4">
            This Privacy Policy explains how Writway Technologies Inc. ("Writway", "we", "our", or "us") collects, uses, and protects your personal data when you use our platform and services. Our registered office is at [Insert Address], and you can contact us at <a href="mailto:support@writway.com" className="text-[var(--color-accent)] hover:underline">support@writway.com</a> for any privacy-related inquiries.
          </p>
          <p className="mb-4">
            This Policy explains your rights regarding your personal data and how we comply with data protection laws. Please read it carefully. By using our services, you agree to the terms described here. If you do not agree, you must discontinue use of our platform.
          </p>
          <p className="mb-4">
            We may update this Privacy Policy periodically. If significant changes affect your rights or how we process your data, we will notify you through email or the Writway dashboard. Please review this page regularly for the latest version.
          </p>
          <p className="mb-4">
            Our services are designed for legal professionals, paralegals, and small legal firms, not for children. We do not knowingly collect information from individuals under 18.
          </p>
          <p className="mb-4">
            Our platform may link to third-party sites, forms, and applications (including integrations with Google Workspace, Microsoft Outlook, or similar services). Writway is not responsible for their privacy practices—please review their respective privacy policies before connecting.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">2. What Personal Data We Collect</h2>
          
          <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-3">2.1 Data You Provide</h3>
          <p className="mb-4">We collect personal data when you:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Register or sign in using Google Workspace or another method.</li>
            <li>Create or manage an organization/tenant account.</li>
            <li>Add or invite clients, staff, or administrators.</li>
            <li>Contact us for support or inquiries.</li>
            <li>Subscribe to updates, newsletters, or free trials.</li>
            <li>Provide billing information via Stripe.</li>
          </ul>
          <p className="mb-4">
            This data may include your name, email address, phone number, job title, organization details, billing information, and any content you upload (e.g., documents, notes, messages).
          </p>

          <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-3">2.2 Data We Collect Automatically</h3>
          <p className="mb-4">When you use Writway, we automatically collect:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Device and browser information.</li>
            <li>IP address and time zone.</li>
            <li>Activity logs (logins, workflows executed, system usage).</li>
            <li>Interaction data for analytics and platform optimization.</li>
          </ul>
          <p className="mb-4">
            Some of this information is collected via cookies and tracking tools. See our Cookies Policy for details.
          </p>

          <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-3">2.3 Data from Connected Services</h3>
          <p className="mb-4">When you connect third-party accounts (e.g., Google Workspace, Gmail, Google Drive, or Microsoft Outlook), we may collect:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Your name, email, and profile information.</li>
            <li>Email metadata and content (as needed for workflow automation).</li>
            <li>Calendar data (e.g., meeting scheduling).</li>
            <li>Files (for client documentation and workflow attachments).</li>
          </ul>
          <p className="mb-4">
            Writway's use of Google API data strictly adheres to the Google API Services User Data Policy, including Limited Use requirements. We will not use or share your Google data for advertising.
          </p>

          <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-3">2.4 Data from Others</h3>
          <p className="mb-4">We may receive your personal data from:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Your employer or organization (e.g., for account setup).</li>
            <li>Colleagues adding you to a shared workspace.</li>
            <li>Our payment and service providers (e.g., billing verification).</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">3. How We Use Your Personal Data</h2>
          <p className="mb-4">We use your data lawfully for the following purposes:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>To create and manage your account and organization workspace.</li>
            <li>To provide and improve Writway's services and automation tools.</li>
            <li>To process payments, subscriptions, and billing.</li>
            <li>To send account-related updates and notifications.</li>
            <li>To ensure platform security, fraud prevention, and legal compliance.</li>
            <li>To respond to support requests or feedback.</li>
            <li>To conduct product analytics and performance improvements.</li>
          </ul>
          
          <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-3">Additional Notes on Data from Google Services</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Writway accesses Google user data solely to perform user-facing CRM and workflow automation functions.</li>
            <li>We never use Google data for advertising or marketing.</li>
            <li>We will not allow human access to this data except where required for security, debugging, or legal compliance.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">4. Lawful Basis for Processing</h2>
          <p className="mb-4">We process your data under the following legal bases:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Contractual necessity</strong> – to deliver the service you or your employer requested.</li>
            <li><strong>Legitimate interest</strong> – for analytics, fraud prevention, and product improvement.</li>
            <li><strong>Legal obligation</strong> – where required by applicable law.</li>
            <li><strong>Consent</strong> – for marketing emails or when connecting third-party integrations.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">5. Sharing Your Data</h2>
          <p className="mb-4">We may share your data with:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Service providers (e.g., Stripe for billing, AWS or S3 for storage, Google for email synchronization).</li>
            <li>Sub-processors who perform tasks under contract (e.g., analytics or hosting).</li>
            <li>Legal authorities if required by law.</li>
            <li>Successor entities in the event of a merger, acquisition, or asset sale (with notice to you).</li>
          </ul>
          <p className="mb-4">
            All third-party processors act on our instructions and are bound by confidentiality and data protection obligations.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">6. International Data Transfers</h2>
          <p className="mb-4">
            Your data may be processed or stored outside your country, including in the United States, Canada, or the European Union. When data is transferred internationally, we ensure it is protected through:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Standard Contractual Clauses or equivalent safeguards.</li>
            <li>Verified data protection adequacy under applicable laws.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">7. Security</h2>
          <p className="mb-4">
            We use encryption, secure access controls, and monitored infrastructure to protect your personal data. However, no system is fully secure, and you acknowledge the inherent risks of online transmission.
          </p>
          <p className="mb-4">
            If a breach occurs, we will take immediate measures to contain it and notify affected users as required by law.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">8. Your Rights</h2>
          <p className="mb-4">Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Access and receive a copy of your personal data.</li>
            <li>Request correction or deletion of your data.</li>
            <li>Restrict or object to processing.</li>
            <li>Withdraw consent (where applicable).</li>
            <li>Port your data to another provider.</li>
          </ul>
          <p className="mb-4">
            If you are an end user under a client account, please contact your organization directly to exercise these rights. We will assist them as required.
          </p>
          <p className="mb-4">
            To exercise your rights, contact us at <a href="mailto:support@writway.com" className="text-[var(--color-accent)] hover:underline">support@writway.com</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">9. Data Retention</h2>
          <p className="mb-4">We retain data:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>For active accounts:</strong> as long as your organization remains a customer.</li>
            <li><strong>For legal, financial, or audit purposes:</strong> as required by law.</li>
            <li><strong>For inactive accounts:</strong> until deletion is requested or required.</li>
          </ul>
          <p className="mb-4">
            We may anonymize data for analytics and product improvement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">10. Contact</h2>
          <p className="mb-4">
            If you have questions or complaints regarding this policy or your data, contact: <a href="mailto:support@writway.com" className="text-[var(--color-accent)] hover:underline">support@writway.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}

