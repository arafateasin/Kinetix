import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Button
          variant="ghost"
          className="mb-8 text-gray-400 hover:text-white"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-10">Last updated: January 1, 2025</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Information We Collect
            </h2>
            <p>
              We collect information you provide directly to us, such as when
              you create an account, make a trade, or contact us for support.
              This may include your email address, username, and transaction
              history.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. How We Use Your Information
            </h2>
            <p>
              We use the information we collect to operate and improve the
              Platform, process transactions, send technical notices and support
              messages, and respond to your comments and questions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Information Sharing
            </h2>
            <p>
              We do not share, sell, or otherwise disclose your personal
              information for purposes other than those described in this
              policy, except as required by law or with your express consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Data Security
            </h2>
            <p>
              We take reasonable measures to help protect information about you
              from loss, theft, misuse and unauthorized access, disclosure,
              alteration, and destruction. All data is encrypted in transit and
              at rest.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Cookies
            </h2>
            <p>
              We use cookies and similar tracking technologies to track activity
              on our Platform and hold certain information to improve and
              analyze our service. You can instruct your browser to refuse all
              cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Your Rights
            </h2>
            <p>
              Depending on your location, you may have the right to access,
              correct, or delete the personal information we hold about you. To
              exercise these rights, please contact us at{" "}
              <a
                href="mailto:privacy@kinetix.trade"
                className="text-blue-400 hover:underline"
              >
                privacy@kinetix.trade
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by updating the date at the top of this
              policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
