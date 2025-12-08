
import React from 'react';
import { ArrowRight, PieChart, Shield, Users, Database, Wallet, TrendingUp } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 sm:px-8 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-200">
            <Wallet size={24} />
          </div>
          <span className="text-xl font-bold text-gray-800 tracking-tight">FamilyFinance</span>
        </div>
        <button
          onClick={onGetStarted}
          className="px-5 py-2 text-sm font-medium text-green-700 hover:bg-green-50 rounded-lg transition-colors"
        >
          Sign In
        </button>
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
              <span>v1.0 Now Available</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Master your family <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">finances</span> together.
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
              Stop fighting over spreadsheets. Track shared expenses, set monthly budgets, and sync with Google Sheets for complete control.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 shadow-xl shadow-green-200 hover:shadow-2xl hover:shadow-green-200/50 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1"
              >
                Get Started Free <ArrowRight size={20} />
              </button>
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
              >
                Try Demo
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                  </div>
                ))}
              </div>
              <p>Trusted by 1,000+ families</p>
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

        {/* Features Section */}
        <section className="bg-gray-50 py-20 px-4 sm:px-8 border-t border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to manage money</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">Simple enough for personal use, powerful enough for the whole family.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                  <PieChart size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Visual Insights</h3>
                <p className="text-gray-600 leading-relaxed">
                  Understand where your money goes with interactive charts and monthly breakdowns.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                  <Database size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Google Sheets Sync</h3>
                <p className="text-gray-600 leading-relaxed">
                  Connect your own Google Sheet to keep data ownership and collaborate in real-time.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-6">
                  <Shield size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Private & Secure</h3>
                <p className="text-gray-600 leading-relaxed">
                  Your data lives in your browser or your Google Drive. No external servers or tracking.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white">
              <Wallet size={16} />
            </div>
            <span className="font-bold text-gray-900">FamilyFinance</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} FamilyFinance. Open source and privacy first.
          </p>
        </div>
      </footer>
    </div>
  );
};
