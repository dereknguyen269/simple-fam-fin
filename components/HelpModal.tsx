import React, { useState } from 'react';
import { X, BookOpen, LayoutDashboard, RotateCw, Database, Filter, ChevronDown, ChevronRight, Table2, Users, Share2 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [openSection, setOpenSection] = useState<string | null>('getting-started');

  if (!isOpen) return null;

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <BookOpen className="text-blue-500" size={20} />,
      content: (
        <div className="space-y-2 text-sm text-gray-600">
          <p>Welcome to <strong>FamilyFinance</strong>! This app helps you track family expenses, visualize spending habits, and plan your budget.</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Dashboard:</strong> View summaries, charts, and trends.</li>
            <li><strong>Transactions:</strong> Add, edit, and view detailed expense logs.</li>
            <li><strong>Local & Cloud:</strong> Data is saved to your browser automatically. You can also sync with Google Sheets.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'dashboard',
      title: 'Dashboard & Analysis',
      icon: <LayoutDashboard className="text-purple-500" size={20} />,
      content: (
        <div className="space-y-2 text-sm text-gray-600">
          <p>The dashboard provides a visual overview of your finances.</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Current Month Snapshot:</strong> Shows real-time spending vs the previous month.</li>
            <li><strong>Date Filters:</strong> Use the "Analysis Period" buttons (This Month, Last Month, Custom) to analyze specific timeframes.</li>
            <li><strong>Breakdowns:</strong> See spending by Category (Pie Chart) and by Family Member (Bar Chart).</li>
          </ul>
        </div>
      )
    },
    {
      id: 'transactions',
      title: 'Managing Transactions',
      icon: <Table2 className="text-green-500" size={20} />,
      content: (
        <div className="space-y-2 text-sm text-gray-600">
          <p>Go to the <strong>Transactions</strong> view to manage records.</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Add Record:</strong> Click the green "Add Record" button to log an Income or Expense.</li>
            <li><strong>Editing:</strong> Hover over any row and click the Pencil icon to edit details inline.</li>
            <li><strong>Filtering:</strong> Use the dropdowns to filter by Category or Member, or use the Search bar to find specific items.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'recurring',
      title: 'Recurring Rules',
      icon: <RotateCw className="text-orange-500" size={20} />,
      content: (
        <div className="space-y-2 text-sm text-gray-600">
          <p>Automate your regular expenses like Rent, Netflix, or Salary.</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Click <strong>Recurring Rules</strong> in the Transactions view.</li>
            <li>Set up a rule (e.g., "Monthly Rent").</li>
            <li>The app will automatically check and generate a new transaction whenever the due date arrives.</li>
            <li><strong>Note:</strong> Recurring items are marked with a <RotateCw size={12} className="inline" /> icon in the table.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'sync',
      title: 'Google Sheets Sync',
      icon: <Database className="text-green-600" size={20} />,
      content: (
        <div className="space-y-2 text-sm text-gray-600">
          <p>Collaborate with your family by syncing data to a real Google Sheet in real-time.</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Go to <strong>Settings</strong> and look for the "Data Source" section.</li>
            <li>Choose your configuration mode:
              <ul className="list-circle list-inside ml-4 mt-1 space-y-1">
                <li><strong>Managed Service:</strong> Only need to enter your Spreadsheet ID (credentials pre-configured)</li>
                <li><strong>Custom Config:</strong> Enter your own Google Cloud Client ID, API Key, and Spreadsheet ID</li>
              </ul>
            </li>
            <li>Detailed setup instructions are available inside the Settings menu under "How to Connect?".</li>
            <li>Once connected, your data syncs automatically. Any changes made in the app are pushed to Google Sheets immediately.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'sharing',
      title: 'Sharing & Collaboration',
      icon: <Share2 className="text-indigo-600" size={20} />,
      content: (
        <div className="space-y-3 text-sm text-gray-600">
          <p>To work together with family members, you need to share both the <strong>Google Spreadsheet</strong> and the <strong>setup information</strong>.</p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
            <h4 className="font-bold text-blue-900 flex items-center gap-2">
              <Users size={16} />
              Step 1: Share Your Spreadsheet
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 ml-2">
              <li>Open your Google Spreadsheet (the one you're using for FamilyFinance)</li>
              <li>Click the <strong>"Share"</strong> button in the top-right corner</li>
              <li>Type in your family members' email addresses</li>
              <li><strong className="text-red-600">Important:</strong> Change their permission to <strong>"Editor"</strong> (not "Viewer")</li>
              <li>Click "Send" to invite them</li>
            </ol>
            <p className="text-xs text-blue-700 italic mt-2">
              💡 If they're only "Viewers", they can see expenses but can't add new ones.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
            <h4 className="font-bold text-purple-900 flex items-center gap-2">
              <Share2 size={16} />
              Step 2: Share Setup Information
            </h4>
            <p>Your family needs the same setup info to connect to your shared spreadsheet. Pick one way:</p>

            <div className="ml-2 space-y-2">
              <div>
                <p className="font-semibold text-purple-800">Option A: Download & Share a File (Easiest)</p>
                <ol className="list-decimal list-inside space-y-1 ml-2 text-xs">
                  <li>Go to <strong>Settings</strong> (gear icon in the app)</li>
                  <li>Find the "Data Source" section</li>
                  <li>Click <strong>"Export Config"</strong> button</li>
                  <li>A small file will download to your computer</li>
                  <li>Send this file to family members (email, WhatsApp, etc.)</li>
                  <li>They can upload it during setup or in Settings</li>
                </ol>
              </div>

              <div>
                <p className="font-semibold text-purple-800">Option B: Copy & Share a Link</p>
                <ol className="list-decimal list-inside space-y-1 ml-2 text-xs">
                  <li>Go to <strong>Settings</strong> → Data Source section</li>
                  <li>Click <strong>"Share Link"</strong> button</li>
                  <li>Copy the link that appears</li>
                  <li>Send the link to family members (text, email, etc.)</li>
                  <li>When they click the link, the app will ask if they want to use your setup</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h4 className="font-bold text-green-900 mb-2">✅ Tips for Success</h4>
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
              <li>Everyone must connect to the <strong>same spreadsheet</strong> (same Spreadsheet ID)</li>
              <li>Everyone should use Google Sheets connection (not "Local Storage")</li>
              <li>Changes appear automatically—no need to refresh the page</li>
              <li>If someone can't connect, double-check they have "Editor" permission on the spreadsheet</li>
              <li>Keep the setup file or link handy in case you need to add more people later</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-blue-600" size={24} />
            Help & Tutorials
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center justify-between p-4 text-left transition-colors ${openSection === section.id ? 'bg-blue-50/50' : 'bg-white hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center gap-3 font-semibold text-gray-700">
                  {section.icon}
                  {section.title}
                </div>
                {openSection === section.id ? (
                  <ChevronDown size={18} className="text-gray-400" />
                ) : (
                  <ChevronRight size={18} className="text-gray-400" />
                )}
              </button>

              {openSection === section.id && (
                <div className="p-4 bg-white border-t border-gray-100 animate-slide-in-from-top-2">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            Close Tutorial
          </button>
        </div>
      </div>
    </div>
  );
};