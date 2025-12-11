import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, Lock, Database, UserCheck, AlertCircle } from 'lucide-react';
import { StaticPageLayout } from './StaticPageLayout';

interface PrivacyPageProps {
  onBack: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
  return (
    <StaticPageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="text-blue-600" size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Privacy First Notice */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Privacy First Commitment</h2>
              <p className="text-gray-700 leading-relaxed">
                SimpleFamFin is built with privacy as a core principle. We don't collect, store, or sell your
                financial data. Your information stays on your device or in your own Google Drive - never on our servers.
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="prose prose-gray max-w-none space-y-8">
          {/* Data Collection */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Database className="text-purple-600" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">1. Data Collection</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">What We DON'T Collect:</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Your financial transactions or expense data</li>
                <li>Bank account information or credentials</li>
                <li>Personal identification information</li>
                <li>Location data or device information</li>
                <li>Browsing history or usage patterns</li>
              </ul>

              <h3 className="font-bold text-gray-900 mb-2 mt-6">What We MAY Collect (Optional):</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Google Account Email:</strong> Only if you choose to use Google Sheets sync</li>
                <li><strong>Anonymous Usage Statistics:</strong> Only if you opt-in to help us improve the app</li>
                <li><strong>Crash Reports:</strong> To fix bugs and improve stability (no personal data included)</li>
              </ul>
            </div>
          </section>

          {/* Data Storage */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Lock className="text-blue-600" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">2. How Your Data is Stored</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Local Storage Mode:</h3>
                  <p className="text-gray-700">
                    All your financial data is stored locally in your browser's storage. This data never leaves
                    your device and is not accessible to us or anyone else.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Google Sheets Sync (Optional):</h3>
                  <p className="text-gray-700">
                    If you choose to enable Google Sheets sync, your data is stored in YOUR Google Drive,
                    in a spreadsheet that YOU own and control. We never have access to this data. You can
                    revoke our app's access at any time through your Google Account settings.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Usage */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="text-green-600" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">3. How We Use Your Data</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                Since we don't collect your financial data, we can't use it. Simple as that.
              </p>
              <p className="text-gray-700">
                If you opt-in to anonymous usage statistics, we may use aggregated, non-identifiable data to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mt-2">
                <li>Understand which features are most popular</li>
                <li>Identify and fix bugs</li>
                <li>Improve app performance</li>
                <li>Plan future features</li>
              </ul>
            </div>
          </section>

          {/* Third Party Services */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <UserCheck className="text-orange-600" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">4. Third-Party Services</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Google Sheets API:</h3>
                  <p className="text-gray-700">
                    If you enable Google Sheets sync, we use Google's API to read and write data to YOUR
                    spreadsheet. This connection is secured by Google's OAuth 2.0 authentication. We only
                    request the minimum permissions needed (access to spreadsheets you create).
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">No Analytics or Tracking:</h3>
                  <p className="text-gray-700">
                    We do not use Google Analytics, Facebook Pixel, or any other third-party tracking services.
                    Your usage of SimpleFamFin is completely private.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-red-600" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">5. Your Rights</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">You have complete control over your data:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Access:</strong> All your data is accessible to you at any time</li>
                <li><strong>Export:</strong> You can export your data as CSV or JSON anytime</li>
                <li><strong>Delete:</strong> You can delete all your data with one click</li>
                <li><strong>Revoke Access:</strong> Disconnect Google Sheets sync anytime</li>
                <li><strong>Data Portability:</strong> Take your data to another service easily</li>
              </ul>
            </div>
          </section>

          {/* Security */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Lock className="text-indigo-600" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">6. Security</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                We take security seriously, even though we don't store your data:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>All connections use HTTPS encryption</li>
                <li>Google OAuth 2.0 for secure authentication</li>
                <li>No passwords are stored (Google handles authentication)</li>
                <li>Open source code for transparency and community review</li>
                <li>Regular security updates and dependency patches</li>
              </ul>
            </div>
          </section>

          {/* Children's Privacy */}
          <section>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Children's Privacy</h2>
              <p className="text-gray-700">
                SimpleFamFin is designed for family use but is not specifically directed at children under 13.
                We do not knowingly collect personal information from children. If you are a parent and believe
                your child has provided us with personal information, please contact us.
              </p>
            </div>
          </section>

          {/* Changes to Policy */}
          <section>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this privacy policy from time to time. We will notify you of any changes by
                posting the new policy on this page and updating the "Last updated" date. We encourage you
                to review this policy periodically.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Questions About Privacy?</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this privacy policy or how we handle data, please don't hesitate to reach out.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </section>
        </div>
      </div>
    </StaticPageLayout>
  );
};
