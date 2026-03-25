# 🏰 KIIT KHOJ — Technical Documentation

Welcome to the internal engineering guide for **KIIT KHOJ**, a ultra-modern, high-performance portal designed for the students of KIIT University.

---

## 🚀 1. Tech Stack Overview

We chose a "Modern Vanilla" approach—avoiding heavy frameworks to ensure the site is lightning-fast, zero-cost, and easy to maintain.

### **Frontend**
- **Core Engine**: [Vite.js](https://vitejs.dev/) (Ultra-fast build tool).
- **Language**: Vanilla JavaScript (ES6+). No React/Vue/Angular needed—keeps the bundle size tiny.
- **Styling**: **Pure Vanilla CSS**. We use custom CSS variables and Glassmorphism techniques for that premium "Apple-like" feel.
- **Routing**: A custom-built **Hash-based Router** (`src/router.js`). It handles page transitions without reloading.

### **Backend (BaaS)**
- **Platform**: [Supabase](https://supabase.com/).
- **Database**: PostgreSQL (Relational data for Users, PDFs, and Forums).
- **Authentication**: **Google Sign-In** restricted to `@kiit.ac.in` domains.
- **Storage**: Supabase Buckets (Stores the actual PDF question papers).

### **Deployment**
- **Hosting**: [Vercel](https://vercel.com/) (Integrated with Git for automatic updates).
- **Domain**: Automated SSL and edge-caching for global speed.

---

## 📂 2. File Structure

```text
KIIT-KHOJ/
├── public/              # Static assets (Icons, Manifest)
├── src/
│   ├── components/      # Reusable UI Blocks
│   │   ├── auth.js      # 🔐 Supabase Auth & Session logic
│   │   ├── navbar.js    # 🧭 Dynamic Navigation
│   │   └── particles.js # ✨ Background "Magic" effects
│   ├── pages/           # High-level Views
│   │   ├── home.js      # 🏠 Landing page
│   │   ├── search.js    # 🔍 PDF Search & Forum
│   │   ├── placement.js # 💼 Interview Experiences
│   │   └── admin.js     # ⚙️ User Tracking & Management
│   ├── styles/          # Module-based CSS files
│   ├── main.js          # 🏁 App Entry & IP Lockdown
│   ├── router.js        # 🚥 Page Navigator
│   └── supabase.js      # 🔌 Database Connection
├── index.html           # 🧱 Main Shell
├── sw.js                # 🚀 PWA Service Worker (Offline Support)
└── manifest.json        # 📲 App Information
```

---

## 🛡️ 3. Security & IP Protection

Protecting your code and idea was a top priority. We implemented **Four Layers of Defense**:

1.  **Frontend Deterrents**:
    - **Global Lockdown**: Right-click and developer shortcuts (F12, Ctrl+U) are blocked via "Event Capturing" in `main.js`.
    - **Anti-Copy**: Text selection is disabled globally using CSS `user-select: none !important`.
2.  **Anti-Scraping**:
    - Metadata in `index.html` tells search engines NOT to archive or index your private images/PDFs.
3.  **Access Restriction**:
    - **Calm Login Gate**: Sensitive pages (Search, Placements) check for an active user session. If not logged in, they show a peaceful "Join the Community" prompt.
4.  **Database Level (RLS)**:
    - We use **Row Level Security** in Supabase. Even if someone hacks the frontend, the database itself refuses to show data to anyone who doesn't have a valid `@kiit.ac.in` email.

---

## 📲 4. The "App" Experience (PWA)

KIIT KHOJ is a **Progressive Web App**. 
- **Offline Mode**: Uses a Service Worker (`sw.js`) to cache the site so it loads instantly even on weak KIIT Wi-Fi.
- **Native Install**: Includes a `manifest.json` so users can "Add to Home Screen" on Android/iPhone and use it like a native mobile app.

---

## 🔧 5. Maintenance Guide

- **Adding a New Subject**: Simply update `src/data/subjects.js`.
- **Managing Users**: Visit the Admin tab (only visible to your email) to see who is logging in and when.
- **Updating Security**: The global lockdown logic is located at the very top of `src/main.js`.

---
*Created with 💚 for KIIT Juniors by KIIT Senior.*
