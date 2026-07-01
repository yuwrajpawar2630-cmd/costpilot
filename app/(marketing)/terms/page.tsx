import { ESTIMATE_DISCLAIMER } from "@/types";
import { getMetadata } from "@/lib/seo";

export const metadata = getMetadata({
  title: "Terms & Conditions — CostPilot AI",
  description:
    "Review the Terms of Service for using CostPilot AI construction estimating platform and services.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 prose prose-zinc">
      <h1>Terms &amp; Conditions</h1>
      <p className="text-sm text-zinc-500">Last updated: June 2026</p>

      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          Welcome to CostPilot AI. By accessing, browsing, or using our website and SaaS estimating platform
          (collectively, the &quot;Service&quot;), you agree to comply with and be bound by these Terms &amp; Conditions
          (&quot;Terms&quot;). These Terms constitute a binding legal agreement between you and CostPilot AI (&quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;). If you do not agree to these Terms, you must immediately cease all use of our Service.
        </p>
      </section>

      <section>
        <h2>2. Eligibility</h2>
        <p>
          To use our Service, you must be at least 18 years of age and possess the legal authority to enter into these Terms
          and establish a binding agreement. By using the Service, you represent and warrant that you meet these eligibility
          requirements and that your use of the Service does not violate any applicable law or regulation.
        </p>
      </section>

      <section>
        <h2>3. User Accounts</h2>
        <p>
          To access certain features of the Service, you must register and create a user account. You agree to provide accurate,
          current, and complete information during the registration process and to update such information as necessary.
          You are solely responsible for safeguarding your account password and for any and all activities that occur under
          your account. You must notify us immediately of any unauthorized use or security breach of your account.
        </p>
      </section>

      <section>
        <h2>4. Subscription Plans</h2>
        <p>
          CostPilot AI offers various subscription tiers, including a Free Plan and multiple paid plans (Starter, Pro, Enterprise)
          designed to fit your estimating needs. The specific features, monthly estimate limits, and pricing for each plan are
          detailed on our pricing page and are subject to change.
        </p>
      </section>

      <section>
        <h2>5. Free Plan Limitations</h2>
        <p>
          Our Free Plan is designed to allow users to evaluate the capabilities of our AI estimating engine. The Free Plan
          includes up to two (2) blueprint analyses per calendar month. We reserve the right to modify, restrict, or terminate
          the Free Plan, or any individual Free Plan account, at any time and for any reason without prior notice.
        </p>
      </section>

      <section>
        <h2>6. Paid Plans</h2>
        <p>
          By subscribing to a paid plan, you agree to pay the specified monthly subscription fee associated with that tier.
          Paid plans grant you an increased number of monthly estimates and additional features. Subscriptions are billed on
          a recurring monthly basis and will automatically renew under the same terms unless cancelled.
        </p>
      </section>

      <section>
        <h2>7. Payments</h2>
        <p>
          All payments are processed securely through our third-party payment processor, Stripe. By providing your credit card or
          other payment information, you authorize Stripe to charge your payment method for all applicable fees, including recurring
          subscription fees, taxes, and transaction charges. You represent and warrant that you have the legal right to use
          any payment method you provide.
        </p>
      </section>

      <section>
        <h2>8. Cancellations</h2>
        <p>
          You may cancel your subscription at any time. To cancel, navigate to your Account Settings page and follow the cancellation
          instructions under the Billing tab. Upon cancellation, your subscription will remain active until the end of your current
          billing cycle, after which your account will be downgraded to the Free Plan or suspended as applicable. You will not be
          charged for subsequent billing periods.
        </p>
      </section>

      <section>
        <h2>9. Acceptable Use</h2>
        <p>
          You agree to use the Service only for lawful purposes and in accordance with these Terms. You shall not:
        </p>
        <ul>
          <li>Upload any files that contain viruses, malware, trojan horses, or other destructive code.</li>
          <li>Attempt to reverse engineer, decompile, or extract the source code or underlying AI models of the platform.</li>
          <li>Use the Service to build a competing product, service, or machine learning model.</li>
          <li>Interfere with, disrupt, or place an unreasonable load on our servers, networks, or database systems.</li>
          <li>Use any automated system (including crawlers, scrapers, or bots) to extract data from the Service.</li>
        </ul>
      </section>

      <section>
        <h2>10. Intellectual Property</h2>
        <p>
          The Service, including its user interface, design, software, logo, trademarks, and AI algorithms, is the exclusive
          property of CostPilot AI and is protected by copyright, trademark, and other intellectual property laws.
          You retain all ownership rights to the blueprint PDFs and project data you upload. By uploading content, you grant us
          a worldwide, non-exclusive, royalty-free license to access, store, and process your files solely for the purpose of
          providing and improving the estimating service for you.
        </p>
      </section>

      <section>
        <h2>11. AI Generated Estimates Disclaimer</h2>
        <p className="font-medium text-zinc-900 bg-zinc-100 p-4 rounded-lg border border-zinc-200">
          {ESTIMATE_DISCLAIMER}
        </p>
        <p className="mt-4">
          Our AI-generated estimates are based on statistical analysis and automated processing of your blueprints.
          They are intended to serve as a rough order of magnitude (ROM) and a draft starting point. They do not constitute
          professional engineering, architectural, or bidding advice. You must independently verify all quantities, material
          specifications, labor rates, and project conditions before submitting bids, entering contracts, or purchasing materials.
        </p>
      </section>

      <section>
        <h2>12. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law, in no event shall CostPilot AI, its founders, employees, partners,
          or suppliers be liable for any direct, indirect, incidental, special, consequential, or punitive damages. This includes,
          without limitation, loss of profits, loss of data, cost overruns, construction delays, material defects, lost bids,
          or other commercial damages arising out of or in connection with your use of or inability to use the Service, even if
          we have been advised of the possibility of such damages.
        </p>
      </section>

      <section>
        <h2>13. Service Availability</h2>
        <p>
          We endeavor to keep the Service online and accessible at all times. However, we do not guarantee that the Service will
          be uninterrupted, timely, secure, or error-free. We may occasionally perform scheduled or emergency maintenance,
          resulting in temporary service disruptions. We reserve the right to modify, suspend, or discontinue the Service, or
          any part thereof, at any time without liability.
        </p>
      </section>

      <section>
        <h2>14. Account Suspension</h2>
        <p>
          We reserve the right, in our sole discretion, to suspend or terminate your account and restrict your access to the Service
          immediately and without prior notice, if we believe you have violated these Terms, engaged in fraudulent or illegal activity,
          or placed an excessive burden on our technical infrastructure.
        </p>
      </section>

      <section>
        <h2>15. Governing Law</h2>
        <p>
          These Terms and your relationship with CostPilot AI shall be governed by and construed in accordance with the laws of the
          United States, without regard to its conflict of law provisions. Any legal action or proceeding arising out of these Terms
          shall be brought exclusively in the federal or state courts located in the United States.
        </p>
      </section>

      <section>
        <h2>16. Contact Information</h2>
        <p>
          If you have any questions, comments, or concerns regarding these Terms &amp; Conditions, please contact our legal team at:
        </p>
        <p>
          <strong>Email:</strong>{" "}
          <a href="mailto:support@costpilotsai.com" className="text-orange-600 hover:underline">
            support@costpilotsai.com
          </a>
        </p>
      </section>
    </div>
  );
}

