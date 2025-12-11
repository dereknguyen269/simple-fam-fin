import React from 'react';
import { Heart, Shield, Users, Zap, Globe, Github } from 'lucide-react';
import { StaticPageLayout } from './StaticPageLayout';

interface AboutPageProps {
  onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  return (
    <StaticPageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-6">
            <img src="/images/simple_famfin.png" alt="SimpleFamFin Logo" className="h-20 w-auto mx-auto object-contain" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">About SimpleFamFin</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simple Family Finance - Your privacy-first solution for household budget management
          </p>
        </div>

        {/* Mission */}
        <section className="mb-16">
          <div className="bg-green-50 border border-green-100 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                <Heart className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-lg">
              We believe that managing family finances should be simple, transparent, and private.
              SimpleFamFin empowers families to take control of their financial future without
              compromising their data privacy or paying expensive subscription fees.
            </p>
          </div>
        </section>

        {/* Core Values */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="text-blue-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Privacy First</h3>
              <p className="text-gray-600">
                Your financial data belongs to you. We use local storage and optional Google Sheets
                integration, putting you in complete control of where your data lives.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="text-green-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Simple & Fast</h3>
              <p className="text-gray-600">
                No complicated features you'll never use. Just the essentials: track expenses,
                set budgets, manage goals, and visualize your financial health.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-purple-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Family Focused</h3>
              <p className="text-gray-600">
                Designed for families who want to collaborate on finances. Track individual spending,
                share budgets, and work together toward common financial goals.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="text-orange-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Open Source</h3>
              <p className="text-gray-600">
                Built with transparency in mind. Our code is open source, allowing anyone to verify
                our privacy claims and contribute to making it better.
              </p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="mb-16">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                SimpleFamFin was born out of frustration with existing personal finance tools.
                We found that most apps either:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Required expensive monthly subscriptions</li>
                <li>Demanded access to your bank accounts</li>
                <li>Stored your sensitive financial data on their servers</li>
                <li>Were too complicated for everyday family use</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                We decided to build something different - a tool that respects your privacy,
                keeps things simple, and doesn't charge you monthly fees just to see where your
                money goes.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Today, SimpleFamFin helps families around the world take control of their finances
                with confidence and peace of mind.
              </p>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Built With Modern Technology</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-8">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Frontend</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• React + TypeScript</li>
                  <li>• Tailwind CSS</li>
                  <li>• Lucide Icons</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Data Storage</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Local Storage (Browser)</li>
                  <li>• Google Sheets API (Optional)</li>
                  <li>• Client-side encryption</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Open Source */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white text-center">
            <Github className="mx-auto mb-4" size={48} />
            <h2 className="text-3xl font-bold mb-4">Open Source & Free</h2>
            <p className="text-green-100 text-lg mb-6 max-w-2xl mx-auto">
              SimpleFamFin is completely free and open source. We believe financial tools should
              be accessible to everyone, not just those who can afford expensive subscriptions.
            </p>
            <a
              href="https://github.com/dereknguyen269/simple-fam-fin"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-lg font-bold hover:bg-green-50 transition-colors"
            >
              <Github size={20} />
              View on GitHub
            </a>
          </div>
        </section>
      </div>
    </StaticPageLayout>
  );
};
