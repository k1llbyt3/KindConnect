# 🤝 KindConnect (Base Version)

A high-fidelity NGO triage and volunteer coordination platform.

## 🚀 Setup Instructions

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file in the root (copy from `.env.example`) and add your keys:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_GEMINI_API_KEY` (Get from [Google AI Studio](https://aistudio.google.com/))
   - ... (other Firebase config fields)

3. **Firebase Configuration**:
   - **Firestore**: Go to the Firebase Console -> Build -> Firestore Database. 
   - Click **Create Database** (Select **Native Mode**).
   - **Rules**: Copy the contents of `firestore.rules` from this project and paste them into the "Rules" tab in the Firebase Console.
   - **Indexes**: The app requires a composite index. Click the link that appears in your **browser console** the first time you run the app to auto-generate it.

4. **Run Locally**:
   ```bash
   npm run dev
   ```

## 🛠 Features (Base)
- **AI Triage**: Uses Gemini 1.5 Flash to score reports (or local fallback if API fails).
- **Real-time Feed**: Live updates as new reports come in.
- **Seed System**: One-click test data generation to verify end-to-end flow.

---
*Built for the NGO Codeathon - Foundation Layer.*
