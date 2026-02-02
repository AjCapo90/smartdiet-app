# Calo - Adaptive Nutrition 🥗

**Complete your perfect nutrition week.**

Calo helps you stick to your diet plan with flexibility. Upload your nutritionist's meal plan, log what you actually eat, and get smart recommendations to hit your weekly macro targets.

## Features

- 📷 **Diet Plan Import** - Upload a photo of your diet plan (OCR extraction)
- 🎤 **Voice Meal Logging** - Log meals by speaking naturally
- 📊 **Weekly Progress** - Track macros with beautiful visualizations
- 💡 **Smart Recommendations** - Get suggestions to complete your nutrition week
- 🔄 **Flexible Eating** - Eat what you want, then compensate with adjusted meals

## Tech Stack

- **Monorepo**: NX 22.x
- **Frontend**: Angular 21, Tailwind CSS
- **Backend**: Fastify 5.x, TypeScript
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: Drizzle
- **AI**: OpenAI Vision API (GPT-4o)

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
# Clone the repo
git clone https://github.com/AjCapo90/smartdiet-app.git
cd smartdiet-app

# Install dependencies
npm install

# Generate database
npx drizzle-kit generate
npx drizzle-kit migrate

# Start development servers
npm run dev
```

### Development

```bash
# Start all apps
npx nx run-many --target=serve --all

# Start specific app
npx nx serve web    # Angular frontend on http://localhost:4200
npx nx serve api    # Fastify API on http://localhost:3000

# Run tests
npx nx test shared-types

# Build for production
npx nx build web --configuration=production
npx nx build api --configuration=production
```

## Project Structure

```
calo/
├── apps/
│   ├── web/          # Angular frontend
│   └── api/          # Fastify backend
├── libs/
│   └── shared/
│       └── types/    # Shared TypeScript types
├── docs/             # Documentation
└── tools/            # Build scripts
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT tokens |
| GET | `/api/diet-plans` | List diet plans |
| POST | `/api/diet-plans` | Create diet plan |
| GET | `/api/meals` | List logged meals |
| POST | `/api/meals` | Log a meal |
| GET | `/api/progress/week` | Get weekly progress |
| GET | `/api/progress/recommendations` | Get meal suggestions |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full API documentation.

## Environment Variables

```env
# API
JWT_SECRET=your-secret-key
COOKIE_SECRET=your-cookie-secret
DATABASE_URL=calo.db
OPENAI_API_KEY=sk-...  # For OCR/AI features

# Frontend
API_URL=http://localhost:3000
```

## Roadmap

- [x] Project scaffold (NX + Angular + Fastify)
- [x] Core data models
- [x] Authentication flow
- [x] Dashboard UI
- [x] Meal logging with voice input
- [x] Weekly progress tracking
- [ ] Diet plan OCR extraction
- [ ] AI meal parsing
- [ ] Push notifications
- [ ] PWA support

## Contributing

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Commit your changes: `git commit -m 'feat: add something'`
3. Push to the branch: `git push origin feat/your-feature`
4. Open a Pull Request

## License

MIT

---

Built with ❤️ by Alessandro & Hex ⬡
// deploy trigger Mon Feb  2 20:06:33 CET 2026
