<p align="center">
  <img src="./public/forke-assets/email-banners/main-banner.png" width="100%" alt="Forke Banner" />
</p>

# ⚡ Forke Dashboard Application

<p align="center">
  <i>The core productivity engine for Forke — where developers discover micro-tasks, submit solutions, earn XP, and founders manage escrow-backed sprints.</i>
</p>

<p align="center">
  <a href="https://www.forke.space/?source=github"><strong>Official Website</strong></a> ·
  <a href="https://github.com/forke-org/.github"><strong>Org Profile</strong></a> ·
  <a href="https://github.com/forke-org/forke-marketing"><strong>Marketing Repo</strong></a> ·
  <a href="https://github.com/forke-org/forke-admin"><strong>Admin Repo</strong></a> ·
  <a href="https://github.com/forke-org/forke-backend"><strong>Backend Repo</strong></a>
</p>

---

## 📖 Overview

`forke-dashboard` is the main web application portal of **Forke**. It connects developers looking to earn cash through scoped, bite-sized tasks with startups and founders seeking fast engineering velocity.

### ✨ Key Features
* 🎯 **Micro-Task Feed & Filters:** Real-time feed of tasks categorized by tech stack, difficulty, estimated completion time, and payout.
* 🎮 **RPG Gamification & Levels:** Live XP progression tracking, leveling system (Script Kiddie → Sprint Soldier → Forke Legend), streaks, and leaderboard ranks.
* 🤖 **AI-Powered Code Submissions:** Claude-assisted automated checks and syntax review on incoming pull requests and PR diffs.
* 💳 **Escrow Payout Engine:** Secure milestone holds and instant UPI payment triggers upon client verification.
* 💬 **Collaborative Workspaces:** Real-time commenting, file attachments via Cloudflare R2, and notifications.

---

## 🛠️ Tech Stack

* **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Turbopack, React 19)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Database & ORM:** PostgreSQL, [Drizzle ORM](https://orm.drizzle.team/)
* **Authentication:** NextAuth / [Auth.js v5](https://authjs.dev/)
* **File Storage:** Cloudflare R2 (S3-compatible)
* **UI Components:** TipTap Rich Text, Lucide React, Remix Icons, QR Code Generators

---

## 🚀 Getting Started Locally

### Prerequisites
* **Node.js:** `v20.x` or `v22.x`+
* **Package Manager:** `npm`, `pnpm`, or `bun`
* **PostgreSQL:** Local PostgreSQL instance or Docker container

### 1. Clone the repository
```bash
git clone https://github.com/forke-org/forke-dashboard.git
cd forke-dashboard
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file by copying the sample:
```bash
cp .env.example .env.local
```

Ensure your `.env.local` contains the necessary development configuration:
```env
# Database Connection
DATABASE_URL="postgresql://forke:forke_secret@localhost:5433/forke_dev"

# Auth.js / NextAuth
AUTH_SECRET="your_generated_secret_here" # generate with: npx auth secret
AUTH_TRUST_HOST="true"
AUTH_URL="http://localhost:3001"

# Cross-Service URLs
NEXT_PUBLIC_APP_URL="http://localhost:3001"
NEXT_PUBLIC_MARKETING_URL="http://localhost:3000"
NEXT_PUBLIC_DASHBOARD_URL="http://localhost:3001"
NEXT_PUBLIC_ADMIN_URL="http://localhost:3002"
NEXT_PUBLIC_API_URL="http://localhost:8080/api/v1"

# File Encryption Key & Salts
ANALYTICS_IP_SALT="local_dev_salt_string"
FILE_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# OAuth (Optional for local development)
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
```

### 4. Run the development server
```bash
npm run dev
```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js dev server |
| `npm run build` | Builds the production dashboard application with memory optimizations |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint to check for code quality and syntax issues |

---

## 📂 Project Structure

```
forke-dashboard/
├── app/              # App Router routes (task feed, workspaces, submissions, settings)
├── components/       # UI components (TaskCards, XPBadges, CodeDiffs, Modals)
├── constants/        # System configuration, skill definitions, leveling tables
├── lib/              # Drizzle database client, Auth.js handlers, helper utilities
├── public/           # Static assets, logos, forky illustrations
├── types/            # TypeScript interfaces and schema types
└── ...
```

---

## 🍊 Meet Forky!

<p align="center">
  <img src="./public/forke-assets/forky-reactions/locked_in_forky.png" width="160" alt="Locked In Forky" /> &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="./public/forke-assets/forky-reactions/grind_mode_forky.png" width="160" alt="Grind Mode Forky" /> &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="./public/forke-assets/forky-reactions/loot_goblin_forky.png" width="160" alt="Loot Goblin Forky" /> &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="./public/forke-assets/forky-reactions/confused_forky.png" width="160" alt="Confused Forky" />
</p>

---

## 📄 License

This repository is **source-available, not open-source**. The code is public for
transparency and reference, but **all rights are reserved** — you may read and fork
it on GitHub, but you may **not** use, deploy, copy, or commercialize it without
prior written permission. See [LICENSE](./LICENSE) for the full terms.
