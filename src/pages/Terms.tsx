import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
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

        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-400 mb-10">Last updated: January 1, 2025</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Kinetix ("the Platform"), you agree to be
              bound by these Terms of Service and all applicable laws and
              regulations. If you do not agree with any of these terms, you are
              prohibited from using or accessing this site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Use of the Platform
            </h2>
            <p>
              Kinetix provides a cryptocurrency trading interface for
              informational and demonstration purposes. You agree to use the
              Platform only for lawful purposes and in accordance with these
              Terms. You are responsible for ensuring that your use of the
              Platform complies with all laws and regulations applicable in your
              jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Risk Disclaimer
            </h2>
            <p>
              Cryptocurrency trading involves significant risk of loss. Past
              performance is not indicative of future results. You acknowledge
              that you are solely responsible for any investment decisions made
              using this Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Intellectual Property
            </h2>
            <p>
              The Platform and its original content, features, and functionality
              are and will remain the exclusive property of Kinetix and its
              licensors. Our trademarks and trade dress may not be used in
              connection with any product or service without the prior written
              consent of Kinetix.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Limitation of Liability
            </h2>
            <p>
              In no event shall Kinetix, its directors, employees, partners,
              agents, suppliers, or affiliates, be liable for any indirect,
              incidental, special, consequential or punitive damages, including
              without limitation, loss of profits, data, use, goodwill, or other
              intangible losses, resulting from your access to or use of (or
              inability to access or use) the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Changes to Terms
            </h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. We will provide notice of any significant
              changes by updating the date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Contact
            </h2>
            <p>
              If you have any questions about these Terms, please contact us at{" "}
              <a
                href="mailto:legal@kinetix.trade"
                className="text-blue-400 hover:underline"
              >
                legal@kinetix.trade
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
