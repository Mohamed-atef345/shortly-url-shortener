# Shortly Frontend

A modern, high-performance URL shortening web application built with **Next.js 14**, **React 19**, and **Tailwind CSS v4**. Features a stunning dark theme with lime green accents, smooth animations, and a fully responsive design.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)

---

## ✨ Features

### User Experience

- **Modern Landing Page** - Bold typography, gradient animations, and marquee effects
- **Dark Mode First** - Sleek dark theme with vibrant lime green (#d4ff00) accents
- **Responsive Design** - Mobile-first approach with adaptive layouts
- **Micro-animations** - Smooth Framer Motion transitions throughout

### Core Functionality

- **User Authentication** - Register, login, and session management with JWT
- **URL Shortening** - Create shortened links with optional custom slugs
- **Analytics Dashboard** - View click statistics, charts, and link performance
- **Link Management** - Copy, edit, and delete your shortened URLs
- **Admin Portal** - Manage users, view system stats, and suspend accounts

### Technical Highlights

- **React Compiler** - Enabled for optimal performance
- **Server Components** - Leveraging Next.js App Router architecture
- **Type Safety** - Full TypeScript coverage with Zod validation
- **API Integration** - Ready to connect with the Shortly backend via Eden Treaty

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (auth)/               # Auth route group
│   │   │   ├── login/page.tsx    # Login page
│   │   │   └── register/page.tsx # Registration page
│   │   ├── dashboard/            # Protected dashboard routes
│   │   │   ├── layout.tsx        # Dashboard layout with sidebar
│   │   │   ├── page.tsx          # Main dashboard (URL list)
│   │   │   ├── settings/         # User settings
│   │   │   └── urls/[shortCode]/ # URL analytics detail
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Landing page
│   │   └── globals.css           # Global styles & Tailwind config
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── auth/                 # Authentication components
│   │   │   └── AuthForm.tsx      # Reusable login/register form
│   │   ├── layout/               # Layout components
│   │   │   ├── Header.tsx        # Navigation header
│   │   │   └── Sidebar.tsx       # Dashboard sidebar
│   │   └── urls/                 # URL management components
│   │       └── CreateUrlModal.tsx
│   │
│   ├── providers/                # React Context providers
│   │   ├── AuthProvider.tsx      # Authentication state
│   │   ├── QueryProvider.tsx     # TanStack Query client
│   │   └── ThemeProvider.tsx     # Dark/light mode
│   │
│   ├── lib/                      # Utilities
│   │   ├── api.ts                # Eden Treaty API client
│   │   └── utils.ts              # Helper functions (cn, formatDate, etc.)
│   │
│   ├── styles/
│   │   └── animations.ts         # Framer Motion variants
│   │
│   ├── hooks/                    # Custom React hooks
│   └── types/                    # TypeScript type definitions
│
├── public/                       # Static assets
├── components.json               # shadcn/ui configuration
├── tailwind.config.ts            # Tailwind configuration
├── next.config.js                # Next.js configuration
└── package.json
```

---

## 🛠️ Tech Stack

| Category          | Technology              | Purpose                    |
| ----------------- | ----------------------- | -------------------------- |
| **Framework**     | Next.js 14 (App Router) | Full-stack React framework |
| **Language**      | TypeScript 5            | Type safety                |
| **Styling**       | Tailwind CSS v4         | Utility-first CSS          |
| **Components**    | shadcn/ui               | Accessible UI components   |
| **Animations**    | Framer Motion           | Declarative animations     |
| **Forms**         | React Hook Form + Zod   | Form handling & validation |
| **State**         | TanStack Query          | Server state management    |
| **API Client**    | Eden Treaty             | Type-safe API calls        |
| **Icons**         | Lucide React            | Modern icon set            |
| **Notifications** | Sonner                  | Toast notifications        |

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) 1.0+ (recommended) or Node.js 18+
- Shortly Backend running on `http://localhost:3001`

### Installation

```bash
# Navigate to frontend directory
cd shortly/frontend

# Install dependencies
bun install

# Create environment file
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

### Development

```bash
# Start development server
bun run dev
```

The app will be available at **http://localhost:3000**

### Production Build

```bash
# Build for production
bun run build

# Start production server
bun run start
```

---

## 🎨 Design System

### Color Palette

| Variable       | Light Mode | Dark Mode  | Usage                   |
| -------------- | ---------- | ---------- | ----------------------- |
| `--primary`    | Lime Green | Lime Green | Buttons, accents, links |
| `--background` | White      | #0a0a0a    | Page background         |
| `--foreground` | Black      | White      | Text content            |
| `--muted`      | Gray 100   | Gray 800   | Secondary backgrounds   |
| `--border`     | Gray 200   | Gray 700   | Borders, dividers       |

### Typography

- **Font Family**: Inter (Google Fonts)
- **Headings**: Bold, tight tracking, uppercase for hero sections
- **Body**: Regular weight, comfortable line height

### Animations

Located in `src/styles/animations.ts`:

- `fadeIn` - Opacity fade
- `slideUp` - Slide from bottom
- `staggerContainer` - Children animation stagger
- `scaleUp` - Scale with opacity

---

## 📱 Pages Overview

### Landing Page (`/`)

- Hero section with animated gradient text
- Feature cards with hover effects
- Marquee banner
- Call-to-action buttons

### Login (`/login`)

- Email/password form
- Form validation with error messages
- Link to registration

### Register (`/register`)

- Email/password/confirm password form
- Password matching validation
- Link to login

### Dashboard (`/dashboard`)

- **Stats Cards**: Total clicks, active links, top location
- **URL List**: Searchable table of shortened URLs
- **Create Modal**: Form to create new short links
- **Actions**: Copy, delete, view analytics

### Admin (`/admin`)

- **System Stats**: Overview of total users, URLs, and clicks
- **User Management**: Table of all users with status indicators
- **Actions**: Suspend/Unsuspend users, Delete accounts (and their URLs)

---

## 🔌 API Integration

The frontend connects to the Shortly backend using fetch with JWT authentication:

```typescript
// Example: Fetching user's URLs
const response = await fetch(`${API_URL}/api/urls`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### Available Endpoints

| Method | Endpoint                         | Description        |
| ------ | -------------------------------- | ------------------ |
| POST   | `/api/auth/register`             | Create new account |
| POST   | `/api/auth/login`                | Authenticate user  |
| GET    | `/api/auth/me`                   | Get current user   |
| GET    | `/api/urls`                      | List user's URLs   |
| POST   | `/api/urls`                      | Create short URL   |
| DELETE | `/api/urls/:shortCode`           | Delete URL         |
| GET    | `/api/urls/:shortCode/analytics` | Get URL analytics  |

---

## 🧪 Available Scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `bun run dev`   | Start development server with hot reload |
| `bun run build` | Build for production                     |
| `bun run start` | Start production server                  |
| `bun run lint`  | Run ESLint                               |

---

## 🐳 Docker (Optional)

```dockerfile
# Build
docker build -t shortly-frontend .

# Run
docker run -p 3000:3000 shortly-frontend
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
