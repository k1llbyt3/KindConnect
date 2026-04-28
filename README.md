<div align="center">
  <img src="./public/logo.png" alt="KindConnect Logo" width="200"/>

# 🌟 KindConnect

**AI-Powered NGO Resource Coordination & Emergency Triage Platform**

[![React](https://img.shields.io/badge/React-19-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-purple.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12-orange.svg?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/AI-Gemini-teal.svg?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)

*Empowering non-profits with intelligent volunteer matching, predictive resource calculation, and automated impact generation.*

</div>

## ✨ Key Features

- **🧠 AI-Driven Insights**: Powered by the Gemini API for smart task briefs, crisis clustering, and weekly crisis insights.
- **⚡ Automated Impact Generation**: Automatically draft impact statements and micro-grant proposals.
- **🤝 Volunteer Management**: Intelligent volunteer matching with burnout detection.
- **📊 Real-time Dashboard**: Live impact feed and interactive Partner NGO portal for seamless resource funding and coordination.
- **🔒 Secure & Scalable**: Real-time robust database built on Firebase Firestore with strict access control rules.
- **🌓 Dark Mode**: Built-in support for seamless light and dark mode toggling.

## 💻 Tech Stack

- **Frontend**: React 19, React Router v7, Vite
- **Backend/Database**: Firebase (Firestore, Authentication)
- **AI Integration**: Google Gemini API

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18 or higher recommended) and npm installed.

### 1. Clone the repository 

```bash
git clone <your-repo-url>
cd KindConnect
```

### 2. Install Dependencies

Install all the required packages to run the frontend and backend tools:

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root of your project using the `.env.example` as a template:

```bash
cp .env.example .env
```

*Important: Fill in the variables inside `.env` with your actual Firebase configuration and Gemini API keys.*

### 4. Run the Development Server

Start the Vite development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## 🛡️ Firebase Setup 

If you need to update the Firestore rules or deploy:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

---
<div align="center">
Built with ❤️ for the Google Solution Challenge
</div>
