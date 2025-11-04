# Curalink - Healthcare Research Platform

A Next.js application connecting patients with researchers, facilitating collaboration through clinical trials, publications, and direct messaging.

## 🚀 Features

- **Patient Dashboard**
  - Search and connect with medical researchers
  - Browse clinical trials and research publications
  - Track favorite researchers and studies
  - Secure messaging system

- **Researcher Dashboard**
  - Manage publications and clinical trials
  - Connect with patients and collaborators
  - Track research impact and citations
  - Share expertise and findings

- **Advanced Search**
  - Search researchers by specialty and location
  - Filter clinical trials by condition
  - Search publications via PubMed integration
  - Real-time search results

- **Authentication & Security**
  - JWT-based authentication
  - Role-based access control (Patient/Researcher)
  - Secure API routes
  - Password encryption

## 🛠️ Tech Stack

- **Framework:** Next.js 16.0.1 (App Router)
- **Database:** PostgreSQL with Prisma ORM 6.18.0
- **Caching:** Redis (Upstash)
- **Authentication:** JWT (jsonwebtoken)
- **UI:** React 19, Tailwind CSS, Lucide Icons
- **External APIs:** PubMed/NCBI E-utilities
- **Deployment:** Vercel

## 📋 Prerequisites

- Node.js 18.x or higher
- PostgreSQL database
- Redis instance
- npm or yarn package manager

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd my-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
copy .env.example .env
```

Edit `.env` with your actual values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/curalink"
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
REDIS_URL="redis://default:password@localhost:6379"
PUBMED_API_KEY=""
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Set Up Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed database with sample data
npm run prisma:seed
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📦 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production (includes Prisma generation)
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations (production mode)
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:seed` - Seed database with sample data

## 🗂️ Project Structure

```
my-app/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── researchers/     # Researcher data endpoints
│   │   └── ...
│   ├── patient/             # Patient pages
│   │   ├── dashboard/       # Patient dashboard
│   │   └── onboarding/      # Patient onboarding
│   ├── researcher/          # Researcher pages
│   │   └── dashboard/       # Researcher dashboard
│   ├── globals.css          # Global styles
│   ├── layout.js            # Root layout
│   └── page.js              # Home page
├── components/              # React components
│   └── ui/                  # UI components (Button, Card, Input, Modal)
├── lib/                     # Utility libraries
│   ├── clinicalTrials.js    # Clinical trials API client
│   ├── prisma.js            # Prisma client instance
│   ├── pubmed.js            # PubMed API client
│   └── redis.js             # Redis client
├── prisma/                  # Database schema and migrations
│   ├── schema.prisma        # Prisma schema
│   ├── seed.js              # Database seeding script
│   └── migrations/          # Database migrations
├── store/                   # Redux state management
│   ├── index.js             # Store configuration
│   ├── ReduxProvider.js     # Redux provider component
│   └── slices/              # Redux slices
├── public/                  # Static assets
├── .env.example             # Environment variables template
├── DEPLOYMENT.md            # Deployment guide
├── next.config.js           # Next.js configuration
├── package.json             # Dependencies and scripts
└── vercel.json              # Vercel deployment config
```

## 🔐 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | Yes | - |
| `REDIS_URL` | Redis connection string | Yes | - |
| `PUBMED_API_KEY` | PubMed API key for enhanced rate limits | No | - |
| `NEXT_PUBLIC_API_URL` | Application base URL | Yes | - |

## 🚢 Deployment

### Deploy to Vercel (Recommended)

See the comprehensive [DEPLOYMENT.md](./DEPLOYMENT.md) guide for step-by-step instructions.

**Quick Deploy:**

1. Push your code to GitHub/GitLab/Bitbucket
2. Import project in Vercel dashboard
3. Set environment variables
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] Redis instance set up
- [ ] JWT secret generated (32+ characters)
- [ ] `NEXT_PUBLIC_API_URL` set to production URL
- [ ] Build tested locally (`npm run build`)
- [ ] `.env` files not committed (check `.gitignore`)

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key models:

- **User**: Base user account (email, password, role)
- **PatientProfile**: Patient-specific data
- **ResearcherProfile**: Researcher-specific data and credentials
- **Publication**: Research publications
- **ClinicalTrial**: Clinical trial information
- **Message**: Direct messaging between users
- **FavoriteResearcher**: Patient's favorite researchers

View full schema in `prisma/schema.prisma`.

## 🔍 Key Features Details

### Search Functionality

- **Researcher Search**: Multi-field search (name, specialty, location)
- **Publication Search**: Integrates with PubMed API
- **Clinical Trials**: Filters by condition, status, location
- **Redis Caching**: Caches PubMed results for 24 hours

### Authentication Flow

1. User registers (Patient or Researcher)
2. Completes role-specific onboarding
3. JWT token issued on login
4. Token validated on each API request
5. Role-based access to dashboards

### Real-Time Features

- Dashboard updates after adding publications/trials
- Immediate count refresh on profile
- Live search results
- Instant messaging (via polling)

## 🧪 Testing

```bash
# Run linter
npm run lint

# Check build
npm run build

# Test production build locally
npm start
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Verify DATABASE_URL format
echo $env:DATABASE_URL  # PowerShell

# Test connection
npm run prisma:studio
```

### Prisma Client Errors

```bash
# Regenerate Prisma client
npm run prisma:generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Redis Connection Issues

```bash
# Verify REDIS_URL format
echo $env:REDIS_URL  # PowerShell

# Test Redis connection (if using redis-cli)
redis-cli -u $REDIS_URL ping
```

### Build Errors

```bash
# Clear Next.js cache
Remove-Item -Recurse -Force .next  # PowerShell

# Clean install
Remove-Item -Recurse -Force node_modules
npm install
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Invalidate session

### Researcher Endpoints

- `GET /api/researchers` - Search researchers
- `GET /api/researchers/:id` - Get researcher details
- `GET /api/publications` - Get publications
- `GET /api/trials` - Get clinical trials

See individual route files in `app/api/` for detailed request/response formats.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🙋 Support

For deployment issues, see [DEPLOYMENT.md](./DEPLOYMENT.md).

For bugs or feature requests, please contact the development team.

---

**Built with ❤️ using Next.js and Vercel**
