import React from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Info, Settings, Trash2 } from 'lucide-react';
import { StaticPageLayout } from './StaticPageLayout';

interface CookiesPageProps {
  onBack: () => void;
}

export const CookiesPage: React.FC<CookiesPageProps> = ({ onBack }) => {
  return (
    <StaticPageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Cookie className="text-amber-600" size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-lg text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Good News */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
              <Cookie className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Good News: We Don't Use Cookies!</h2>
              <p className="text-gray-700 leading-relaxed">
                SimpleFamFin does not use cookies for tracking, analytics, or advertising. We use browser's
                local storage to save your preferences and data locally on your device - which is not the same
                as cookies and doesn't track you across websites.
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="prose prose-gray max-w-none space-y-8">
          {/* What We Use Instead */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Settings className="text-blue-600" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">1. What We Use Instead of Cookies</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">Local Storage:</h3>
              <p className="text-gray-700 mb-4">
                We use your browser's local storage to save:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Your financial data (expenses, budgets, goals)</li>
                <li>App preferences (language, currency, theme)</li>
                <li>Google Sheets configuration (if you enable sync)</li>
              </ul>
              <p className="text-gray-700">
                This data stays on YOUR device and is never sent to our servers or shared with third parties.
              </p>
            </div>
          </section>

          {/* Why No Cookies */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Info className="text-purple-600" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">2. Why We Don't Use Cookies</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                We believe in privacy-first design. Here's why we don't use cookies:
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">❌ No Tracking Cookies</h3>
                  <p className="text-gray-700">
                    We don't track your behavior across websites or build profiles about you.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">❌ No Analytics Cookies</h3>
                  <p className="text-gray-700">
                    We don't use Google Analytics, Facebook Pixel, or similar tracking services.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">❌ No Advertising Cookies</h3>
                  <p className="text-gray-700">
                    We don't show ads or use cookies for targeted advertising.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">❌ No Third-Party Cookies</h3>
                  <p className="text-gray-700">
                    We don't allow third parties to set cookies on our site.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Session Storage */}
          <section>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">3. Session Storage</h2>
              <p className="text-gray-700 mb-4">
                In addition to local storage, we may use session storage for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Temporary authentication tokens (when using Google Sheets sync)</li>
                <li>Form data while you're filling out transactions</li>
                <li>UI state during your current session</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Session storage is automatically cleared when you close your browser tab.
              </p>
            </div>
          </section>

          {/* Google OAuth */}
          <section>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">4. Google OAuth Tokens</h2>
              <p className="text-gray-700 mb-4">
                If you enable Google Sheets sync, Google's OAuth service may set cookies to manage your
                authentication. These cookies are:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Set by Google, not by us</li>
                <li>Required for secure authentication</li>
                <li>Governed by Google's Privacy Policy</li>
                <li>Can be cleared through your Google Account settings</li>
              </ul>
              <p className="text-gray-700 mt-4">
                We have no control over or access to these Google cookies.
              </p>
            </div>
          </section>

          {/* Managing Your Data */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Trash2 className="text-red-600" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">5. Managing Your Local Data</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                You have full control over the data stored in your browser:
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Clear All Data:</h3>
                  <p className="text-gray-700">
                    Use the "Clear All Data" button in Settings to delete all locally stored information.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Browser Settings:</h3>
                  <p className="text-gray-700 mb-2">
                    You can also clear local storage through your browser settings:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                    <li><strong>Chrome:</strong> Settings → Privacy → Clear browsing data → Cookies and site data</li>
                    <li><strong>Firefox:</strong> Settings → Privacy → Clear Data → Cookies and Site Data</li>
                    <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                    <li><strong>Edge:</strong> Settings → Privacy → Clear browsing data</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Warning:</strong> Clearing local storage will delete all your financial data
                    stored locally. Make sure to export your data or sync with Google Sheets before clearing.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Browser Do Not Track */}
          <section>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">6. Do Not Track (DNT)</h2>
              <p className="text-gray-700">
                Since we don't track you in the first place, we respect Do Not Track (DNT) signals by default.
                Whether your browser sends a DNT signal or not, we don't track your activity.
              </p>
            </div>
          </section>

          {/* Updates to Policy */}
          <section>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">7. Changes to This Policy</h2>
              <p className="text-gray-700">
                If we ever decide to use cookies in the future (which we don't plan to), we will:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mt-2">
                <li>Update this policy with clear information</li>
                <li>Notify users through the app</li>
                <li>Provide options to opt-out</li>
                <li>Only use cookies that are strictly necessary</li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section>
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Questions About Cookies?</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about our cookie policy or data storage practices, please contact us.
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
