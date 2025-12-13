import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, PieChart, Shield, Users, Database, Wallet, TrendingUp, Check, Share2, Zap, Clock, Heart, Github } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 sm:px-8 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <img src="/images/simple_famfin.png" alt="SimpleFamFin Logo" className="h-10 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/dereknguyen269/simple-fam-fin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="GitHub Repository"
          >
            <Github size={24} />
          </a>
          <button
            onClick={onGetStarted}
            className="px-5 py-2 text-sm font-medium text-green-700 hover:bg-green-50 rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-20 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>✨ Real-time Sync • Family Collaboration</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Family finances, <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">simplified</span> and <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">synced</span>.
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
              Track expenses together, share budgets in real-time, and keep everyone on the same page. Your data syncs instantly via Google Sheets—no more "Did you log that?" moments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 shadow-xl shadow-green-200 hover:shadow-2xl hover:shadow-green-200/50 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1"
              >
                {t('landing.getStarted')} <ArrowRight size={20} />
              </button>
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
              >
                View Demo Data
              </button>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500 pt-4">
              <div className="flex items-center gap-2">
                <Check className="text-green-600" size={16} />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-green-600" size={16} />
                <span>100% Private</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-green-600" size={16} />
                <a
                  href="https://github.com/dereknguyen269/simple-fam-fin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-700 hover:underline transition-colors"
                >
                  Open Source
                </a>
              </div>
            </div>
          </div>

          <div className="relative lg:h-[600px] flex items-center justify-center animate-in slide-in-from-right-10 duration-700">
            {/* Abstract Background Blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-200/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-200/30 rounded-full blur-2xl ml-20 -mt-20"></div>

            {/* App Preview Card */}
            <div className="relative bg-white/80 backdrop-blur-xl border border-white/50 p-6 rounded-3xl shadow-2xl w-full max-w-md transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Balance</p>
                  <h3 className="text-3xl font-bold text-gray-800">$12,450.00</h3>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <TrendingUp size={20} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Wallet size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">Salary Deposit</p>
                    <p className="text-xs text-gray-500">Today, 9:00 AM</p>
                  </div>
                  <span className="font-bold text-green-600">+$3,200</span>
                </div>

                <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <PieChart size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">Grocery Run</p>
                    <p className="text-xs text-gray-500">Yesterday</p>
                  </div>
                  <span className="font-bold text-gray-800">-$145.20</span>
                </div>

                <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm opacity-60">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <Users size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">School Tuition</p>
                    <p className="text-xs text-gray-500">Oct 24</p>
                  </div>
                  <span className="font-bold text-gray-800">-$500.00</span>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 animate-bounce">
                <div className="bg-green-500 w-3 h-3 rounded-full"></div>
                <p className="text-sm font-bold text-gray-700">Sync Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* App Screenshots Section */}
        <div className="bg-gradient-to-b from-gray-50 to-white py-20 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                See SimpleFamFin in Action
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                A clean, intuitive interface designed for families. Track expenses, visualize spending, and stay organized together.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* Screenshot 1 */}
              <div className="group relative animate-in slide-in-from-left duration-700">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                  <img
                    src="/demo/demo_1.png"
                    alt="SimpleFamFin Dashboard - Expense tracking and budget overview"
                    className="w-full h-auto transform transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                    <h3 className="text-white font-bold text-lg mb-1">Dashboard Overview</h3>
                    <p className="text-white/90 text-sm">Track all your expenses and budgets at a glance</p>
                  </div>
                </div>
              </div>

              {/* Screenshot 2 */}
              <div className="group relative animate-in slide-in-from-right duration-700 md:mt-12">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                  <img
                    src="/demo/demo_2.png"
                    alt="SimpleFamFin Analytics - Visual spending insights and charts"
                    className="w-full h-auto transform transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                    <h3 className="text-white font-bold text-lg mb-1">Visual Analytics</h3>
                    <p className="text-white/90 text-sm">Beautiful charts to understand your spending patterns</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-12">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-green-200 transition-all transform hover:-translate-y-1"
              >
                Try It Now - It's Free
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 px-4 sm:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">Powerful features designed for families who want to stay organized and in sync.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                  <PieChart size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Visual Insights</h3>
                <p className="text-gray-600 leading-relaxed">
                  Beautiful charts and graphs show spending by category, member, and time period. Understand your family's financial patterns at a glance.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                  <Database size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Always Up-to-Date</h3>
                <p className="text-gray-600 leading-relaxed">
                  Your data lives in <strong>your own</strong> Google Spreadsheet. When someone adds an expense, everyone sees it within seconds on all their devices.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-6">
                  <Shield size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Your Data Stays Yours</h3>
                <p className="text-gray-600 leading-relaxed">
                  Everything stays on your device or in your Google Drive. We never see, store, or sell your financial information. You're in complete control.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                  <Share2 size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Easy Sharing</h3>
                <p className="text-gray-600 leading-relaxed">
                  Share your spreadsheet with family members. Send them a simple file or link so everyone can connect to the same place.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-6">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Set It and Forget It</h3>
                <p className="text-gray-600 leading-relaxed">
                  Tell the app about regular bills (rent, Netflix, salary) once, and it'll automatically add them every month. No more manual entry!
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 mb-6">
                  <Users size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Multi-Member Tracking</h3>
                <p className="text-gray-600 leading-relaxed">
                  Assign transactions to family members. See who spent what, when, and where. Perfect for accountability and planning.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Collaboration Section */}
        <section className="bg-white py-20 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                  <Share2 size={14} />
                  <span>Built for Collaboration</span>
                </div>
                <h2 className="text-4xl font-bold text-gray-900">
                  Keep your whole family <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">on the same page</span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  FamilyFinance is designed for families who manage money together. Everyone can see and add expenses in real-time—no more asking "Did you write that down?"
                </p>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                      <Check size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 mb-1">Step 1: Share Your Spreadsheet</h4>
                      <p className="text-gray-600 text-sm">Add family members to your Google Sheet and give them "Editor" permission so they can add expenses too.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                      <Check size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 mb-1">Step 2: Share Setup Info</h4>
                      <p className="text-gray-600 text-sm">Download a small file or copy a link to share. Family members can use it to connect to the same spreadsheet in seconds.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                      <Check size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 mb-1">Step 3: Stay Updated Automatically</h4>
                      <p className="text-gray-600 text-sm">When anyone adds an expense, everyone else sees it within seconds. No need to refresh or ask for updates.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onGetStarted}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  See How It Works <ArrowRight size={18} />
                </button>
              </div>

              <div className="relative">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border border-indigo-100">
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                          M
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">Mom</p>
                          <p className="text-xs text-gray-500">Added grocery expense</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Whole Foods</span>
                        <span className="font-bold text-gray-800">-$127.50</span>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold">
                          D
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">Dad</p>
                          <p className="text-xs text-gray-500">Added income</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Salary Deposit</span>
                        <span className="font-bold text-green-600">+$3,200</span>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 opacity-60">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          K
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">Kids</p>
                          <p className="text-xs text-gray-500">Added expense</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">School Supplies</span>
                        <span className="font-bold text-gray-800">-$45.00</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-2 text-sm text-indigo-600 font-semibold">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                    <span>Everyone sees this instantly ✨</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="bg-gray-50 py-20 px-4 sm:px-8 border-t border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Perfect for every family scenario</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">Whether you're managing household expenses or planning long-term goals, we've got you covered.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                  <Heart size={24} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Couples</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  "We finally stopped arguing about who paid for what. Everything's in one place, and we both can see it instantly."
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4">
                  <Users size={24} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Growing Families</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  "With kids' activities and household bills, tracking everything manually was chaos. Now it's automatic and organized."
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                  <Clock size={24} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Busy Professionals</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  "Set up recurring bills once, and forget about it. The app handles the rest while I focus on work and family time."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-gradient-to-br from-green-600 to-emerald-600 py-20 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to take control of your family finances?
            </h2>
            <p className="text-xl text-green-50 mb-8 max-w-2xl mx-auto">
              Join thousands of families who've simplified their money management. Setup takes less than 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-white text-green-700 rounded-xl font-bold text-lg hover:bg-gray-50 shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1"
              >
                Get Started Now <ArrowRight size={20} />
              </button>
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-green-700 text-white border-2 border-white/30 rounded-xl font-bold text-lg hover:bg-green-800 transition-all flex items-center justify-center gap-2"
              >
                Try Demo First
              </button>
            </div>
            <p className="text-green-100 text-sm mt-6">
              ✓ No credit card required  •  ✓ Free forever  •  ✓ Your data stays yours
            </p>
          </div>
        </section>
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
                  <button
                    onClick={onGetStarted}
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    Features
                  </button>
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
