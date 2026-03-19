# KIIT KHOJ 🔍

> Your ultimate PYQ portal for KIIT University (Batch 2022-2026)

## Features

- 🎨 **Magical Dark Mode** — Glassmorphism, floating particles, cursor glow effects
- 🔍 **Smart Search** — Fuzzy autocomplete across 50+ subjects
- 📄 **PDF Viewer** — Preview & download midsem + endsem merged PYQs
- 📤 **Upload PYQs** — Drag & drop PDF upload for any subject
- 💬 **Discussion Forum** — Per-subject Q&A with anonymous mode
- 💼 **Placement Talks** — Share & read interview experiences
- 🔐 **KIIT Auth** — Google Sign-In restricted to @kiit.ac.in
- ⚙️ **Admin Dashboard** — User management, content moderation
- 📱 **PWA** — Installable on phones, Play Store eligible

## Tech Stack

- **Frontend**: Vite + Vanilla JS + Vanilla CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Vercel (free)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase
1. Go to [supabase.com](https://supabase.com) → Create free account (no card needed!)
2. Create a new project
3. Enable **Authentication** → Google Sign-In provider
4. Create a **Storage bucket** named `pdfs` (set as public)
5. Run this SQL in the **SQL Editor**:

```sql
-- PDF uploads
CREATE TABLE pdfs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploader_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Discussion posts
CREATE TABLE discussions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  username TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES discussions(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Placement experiences
CREATE TABLE placements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL,
  role TEXT,
  questions TEXT,
  experience TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  username TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE placements ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Anyone can read, authenticated users can insert
CREATE POLICY "Anyone can read pdfs" ON pdfs FOR SELECT USING (true);
CREATE POLICY "Auth users can insert pdfs" ON pdfs FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Uploader or admin can delete pdfs" ON pdfs FOR DELETE USING (
  auth.uid() = uploaded_by OR 
  auth.jwt() ->> 'email' = '22052858@kiit.ac.in'
);

CREATE POLICY "Anyone can read discussions" ON discussions FOR SELECT USING (true);
CREATE POLICY "Auth users can insert discussions" ON discussions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Author or admin can delete discussions" ON discussions FOR DELETE USING (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'email' = '22052858@kiit.ac.in'
);

CREATE POLICY "Anyone can read placements" ON placements FOR SELECT USING (true);
CREATE POLICY "Auth users can insert placements" ON placements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Author or admin can delete placements" ON placements FOR DELETE USING (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'email' = '22052858@kiit.ac.in'
);
```

6. Copy your **Project URL** and **anon key** from Settings → API

### 3. Configure Environment
Create a `.env` file:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Locally
```bash
npm run dev
```
Opens at http://localhost:5173

## Deploy (Free — No Card)

### Vercel (Recommended)
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import repo → Add env variables
4. Deploy → Get free URL like `kiit-khoj.vercel.app`

## Play Store
1. Deploy to Vercel first
2. Go to [PWABuilder.com](https://pwabuilder.com)
3. Enter your URL → Generate APK
4. Upload to Google Play Console ($25 one-time)

## Admin Access
- Admin email: hidden (pre-configured)
- Access at `#/admin` after login
- See all user emails, manage content
- Also visible in Supabase Dashboard → Authentication → Users

## © 2026 KIIT KHOJ. All rights reserved.
