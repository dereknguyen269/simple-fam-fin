import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Database } from 'lucide-react';

interface StaticPageLayoutProps {
  children: React.ReactNode;
}

export const StaticPageLayout: React.FC<StaticPageLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 sm:px-8 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/images/simple_famfin.png" alt="SimpleFamFin Logo" className="h-10 w-auto object-contain" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 text-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="/images/simple_famfin.png" alt="SimpleFamFin Logo" className="h-8 w-auto object-contain" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Simple Family Finance - Your privacy-first solution for household budget management.
              </p>
              <div className="flex flex-col gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Shield size={14} />
                  <span>Privacy First</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database size={14} />
                  <span>Your Data, Your Control</span>
                </div>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/about"
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/dereknguyen269/simple-fam-fin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/dereknguyen269/simple-fam-fin/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    Changelog
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/privacy"
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cookies"
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/contact"
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/dereknguyen269/simple-fam-fin/discussions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    Community
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/dereknguyen269/simple-fam-fin/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    Report Issues
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${import.meta.env.VITE_SUPPORT_EMAIL}`}
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    Email Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-600 text-sm text-center md:text-left">
                © {new Date().getFullYear()} SimpleFamFin. Open source and built with ❤️ for families who value transparency.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <a
                  href="https://github.com/dereknguyen269/simple-fam-fin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-600 transition-colors"
                >
                  GitHub
                </a>
                <span>•</span>
                <Link
                  to="/privacy"
                  className="hover:text-green-600 transition-colors"
                >
                  Privacy
                </Link>
                <span>•</span>
                <Link
                  to="/terms"
                  className="hover:text-green-600 transition-colors"
                >
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
