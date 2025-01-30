# Smart Outreach

A single-admin outreach automation platform using Node.js, Next.js, Supabase, Redis, Selenium, Pinecone, and GPT.

## Features

- Single-admin authentication system
- Knowledge base management with document upload and website crawling
- Campaign creation and management
- Automated lead scraping and email discovery
- Email outreach automation with Gmail integration

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Supabase account
- OpenAI API key
- Pinecone account
- Gmail OAuth credentials

## Setup

1. Clone the repository:
```bash
git clone [repository-url]
cd smart-outreach
```

2. Install dependencies:
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables:
```bash
# Copy example env files
cp .env.example .env
```

4. Start the services:
```bash
# Start Redis and Selenium
docker-compose up -d

# Start frontend development server
cd frontend
npm run dev

# In another terminal, start backend development server
cd backend
npm run dev
```

5. Initialize the database:
```bash
npm run db:reset
```

## Development

- Frontend runs on http://localhost:3000
- Backend runs on http://localhost:4000
- Redis runs on localhost:6379
- Selenium runs on localhost:4444

## Project Structure

```
.
├── frontend/            # Next.js frontend application
│   ├── src/
│   │   ├── pages/      # Next.js pages
│   │   ├── components/ # React components
│   │   ├── lib/        # Utility functions
│   │   └── styles/     # CSS styles
│   └── public/         # Static assets
├── backend/            # Node.js backend application
│   ├── src/
│   │   ├── config/     # Configuration files
│   │   ├── services/   # Business logic
│   │   ├── workers/    # Background workers
│   │   ├── queues/     # Queue definitions
│   │   └── utils/      # Utility functions
├── scripts/           # Database and utility scripts
└── docker-compose.yml # Docker services configuration
```

## License

MIT 