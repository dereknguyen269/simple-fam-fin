import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, AlertTriangle, CheckCircle, XCircle, Scale } from 'lucide-react';
import { StaticPageLayout } from './StaticPageLayout';

interface TermsPageProps {
  onBack: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
  return (
    <StaticPageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="text-indigo-600" size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Scale className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using SimpleFamFin, you agree to be bound by these Terms of Service.
                If you disagree with any part of these terms, please do not use our application.
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="prose prose-gray max-w-none space-y-8">
          {/* Use of Service */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">1. Use of Service</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">License to Use:</h3>
              <p className="text-gray-700 mb-4">
                SimpleFamFin grants you a personal, non-exclusive, non-transferable, limited license to use
                the application for personal or family financial management purposes.
              </p>

              <h3 className="font-bold text-gray-900 mb-2 mt-4">You May:</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Use the app for personal and family financial tracking</li>
                <li>Export your data at any time</li>
                <li>Share the app with family members</li>
                <li>Modify the open-source code for personal use</li>
              </ul>
            </div>
          </section>

          {/* Prohibited Uses */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="text-red-600" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">2. Prohibited Uses</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">You agree NOT to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Use the app for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the app's functionality</li>
                <li>Use the app to transmit viruses or malicious code</li>
                <li>Reverse engineer the app (except as allowed by open source license)</li>
                <li>Resell or commercially exploit the app without permission</li>
                <li>Impersonate others or provide false information</li>
              </ul>
            </div>
          </section>

          {/* User Responsibilities */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-purple-600" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">3. Your Responsibilities</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">Data Accuracy:</h3>
              <p className="text-gray-700 mb-4">
                You are responsible for the accuracy of the financial data you enter. SimpleFamFin is a tool
                to help you track and manage your finances, but you are ultimately responsible for your
                financial decisions.
              </p>

              <h3 className="font-bold text-gray-900 mb-2 mt-4">Account Security:</h3>
              <p className="text-gray-700 mb-4">
                If you use Google Sheets sync, you are responsible for maintaining the security of your
                Google account. We recommend using strong passwords and enabling two-factor authentication.
              </p>

              <h3 className="font-bold text-gray-900 mb-2 mt-4">Backups:</h3>
              <p className="text-gray-700">
                While we strive to provide a reliable service, you are responsible for backing up your data.
                We recommend regularly exporting your data or using Google Sheets sync for automatic backups.
              </p>
            </div>
          </section>

          {/* Disclaimer of Warranties */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-yellow-600" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">4. Disclaimer of Warranties</h2>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                <strong>SimpleFamFin is provided "AS IS" and "AS AVAILABLE" without warranties of any kind.</strong>
              </p>
              <p className="text-gray-700 mb-4">We do not warrant that:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>The app will be uninterrupted, secure, or error-free</li>
                <li>The results obtained from using the app will be accurate or reliable</li>
                <li>Any errors in the app will be corrected</li>
                <li>The app will meet your specific requirements</li>
              </ul>
              <p className="text-gray-700 mt-4">
                <strong>SimpleFamFin is not a substitute for professional financial advice.</strong> Always
                consult with qualified financial advisors for important financial decisions.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Scale className="text-orange-600" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">5. Limitation of Liability</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by law, SimpleFamFin and its creators shall not be liable for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Any indirect, incidental, special, or consequential damages</li>
                <li>Loss of profits, data, or business opportunities</li>
                <li>Damages resulting from your use or inability to use the app</li>
                <li>Financial losses resulting from decisions made based on app data</li>
                <li>Unauthorized access to or alteration of your data</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Some jurisdictions do not allow the exclusion of certain warranties or limitations of liability,
                so some of the above limitations may not apply to you.
              </p>
            </div>
          </section>

          {/* Open Source */}
          <section>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">6. Open Source License</h2>
              <p className="text-gray-700 mb-4">
                SimpleFamFin is open source software. The source code is available under the MIT License,
                which allows you to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Use the code for personal or commercial purposes</li>
                <li>Modify and distribute the code</li>
                <li>Create derivative works</li>
              </ul>
              <p className="text-gray-700 mt-4">
                See the LICENSE file in the repository for full details.
              </p>
            </div>
          </section>

          {/* Third-Party Services */}
          <section>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">7. Third-Party Services</h2>
              <p className="text-gray-700 mb-4">
                SimpleFamFin may integrate with third-party services (such as Google Sheets). Your use of
                these services is subject to their respective terms of service and privacy policies:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Google Sheets: <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Terms of Service</a></li>
                <li>Google Drive: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Privacy Policy</a></li>
              </ul>
            </div>
          </section>

          {/* Termination */}
          <section>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">8. Termination</h2>
              <p className="text-gray-700 mb-4">
                You may stop using SimpleFamFin at any time. We reserve the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Modify or discontinue the app at any time</li>
                <li>Refuse service to anyone for any reason</li>
                <li>Terminate or suspend access for violations of these terms</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Upon termination, you should delete all copies of the app and export any data you wish to keep.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">9. Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these terms at any time. We will notify users of any material
                changes by updating the "Last updated" date. Your continued use of SimpleFamFin after changes
                constitutes acceptance of the new terms.
              </p>
            </div>
          </section>

          {/* Governing Law */}
          <section>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">10. Governing Law</h2>
              <p className="text-gray-700">
                These terms shall be governed by and construed in accordance with the laws of your jurisdiction,
                without regard to its conflict of law provisions.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Questions About These Terms?</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please contact us.
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
