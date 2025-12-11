<div align="center">
<img width="1200" height="475" alt="GHBanner" src="/public/demo/simple_famfin_demo.png" />
</div>

# SimpleFamFin - Simple Family Finance

A privacy-first, open-source family budget management application. Track expenses, manage budgets, set financial goals, and collaborate with family members - all while keeping your data under your control.

## ✨ Features

- 📊 **Expense Tracking** - Track income and expenses with categories and tags
- 💰 **Budget Management** - Set and monitor budgets by category
- 🎯 **Financial Goals** - Create and track savings goals
- 👨‍👩‍👧‍👦 **Family Collaboration** - Share finances with family members
- 🔄 **Recurring Expenses** - Manage subscriptions and recurring bills
- 💳 **Multiple Wallets** - Track different accounts and payment methods
- 📈 **Visual Analytics** - Beautiful charts and insights
- 🔒 **Privacy First** - Your data stays on your device or your Google Drive
- ☁️ **Google Sheets Sync** - Optional cloud backup and sync
- 🌐 **Multi-language** - Support for multiple languages
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## 🚀 Tech Stack

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Routing**: React Router
- **Storage**: Local Storage / Google Sheets API

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in the required environment variables (see below)
3. Run the app:
   `npm run dev`

## Environment Variables

This app requires the following environment variables in your `.env` file:

### Required for Google Sheets Integration:
- `VITE_GOOGLE_CLIENT_ID` - Your Google OAuth 2.0 Client ID
  - Get it from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- `VITE_GOOGLE_API_KEY` - Your Google API Key
  - Get it from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

### Optional for Feedback Form:
- `VITE_WEB3FORMS_ACCESS_KEY` - Your Web3Forms API key for the feedback form
  - Get a free key at [web3forms.com](https://web3forms.com)
- `VITE_SUPPORT_EMAIL` - Support email address (e.g., support@yourdomain.com)

**Setup Steps:**
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and fill in your API keys and configuration values
3. Restart the dev server to load the new environment variables

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dereknguyen269/simple-fam-fin)

1. Click the "Deploy with Vercel" button above, or:
   - Create a new Vercel account at https://vercel.com
   - Connect your GitHub account to Vercel
   - Import this repository to Vercel

2. **Configure Environment Variables** in Vercel:
   - Go to your project settings → Environment Variables
   - Add all required variables from `.env.example`:
     - `VITE_GOOGLE_CLIENT_ID`
     - `VITE_GOOGLE_API_KEY`
     - `VITE_WEB3FORMS_ACCESS_KEY` (optional)
     - `VITE_SUPPORT_EMAIL` (optional)

3. Deploy the app

**Note:** Make sure to add environment variables before deploying, or redeploy after adding them.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 💬 Support

- 📧 Email: support@simplefamfin.com
- 💬 [GitHub Discussions](https://github.com/dereknguyen269/simple-fam-fin/discussions)
- 🐛 [Report Issues](https://github.com/dereknguyen269/simple-fam-fin/issues)

## ⭐ Show Your Support

If you find this project helpful, please give it a star! It helps others discover the project.

---

Made with ❤️ for families who value transparency and privacy.
