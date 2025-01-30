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

# Knowledge Base System

A comprehensive knowledge base system that allows users to upload documents and crawl websites, processes the content into embeddings, and makes it searchable using vector similarity search.

## Features

- Document Upload: Support for PDF, DOCX, and TXT files
- Website Crawling: Crawl websites up to a specified depth
- Content Processing: Split content into chunks and create embeddings
- Vector Search: Store and search embeddings using Pinecone
- Beautiful UI: Modern interface built with Next.js and Tailwind CSS

## Prerequisites

- Node.js 18+
- Redis server running locally or accessible
- Supabase account and project
- Pinecone account and index
- OpenAI API key

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the environment variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # Pinecone
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_ENV=your_pinecone_environment
   PINECONE_INDEX=your_pinecone_index_name
   ```

## Installation

1. Install dependencies for all packages:
   ```bash
   npm run install:all
   ```

2. Start the development environment:
   ```bash
   npm run dev
   ```

This will start:
- Frontend server at http://localhost:3000
- Backend server at http://localhost:4000
- Worker processes for handling document processing and crawling

## Architecture

### Frontend

- Next.js application with TypeScript
- Tailwind CSS for styling
- Supabase client for authentication and data access

### Backend

- Node.js server with TypeScript
- BullMQ for job queues
- Puppeteer for website crawling
- LangChain for document processing

### Workers

Two main worker processes:
1. Embedding Worker: Processes documents and creates embeddings
2. Crawl Worker: Crawls websites and extracts content

### Storage

- Supabase:
  - Document metadata
  - Chunk content and metadata
  - File attachments (PDFs, DOCXs, etc.)
- Pinecone:
  - Vector embeddings for similarity search
- Redis:
  - Job queues for processing

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Available Scripts

- `npm run dev`: Start all services in development mode
- `npm run dev:frontend`: Start only the frontend
- `npm run dev:backend`: Start only the backend
- `npm run dev:workers`: Start only the workers
- `npm test`: Run tests
- `npm run build`: Build for production

## API Routes

### Knowledge Base

- `POST /api/kb/process`: Process an uploaded document
- `POST /api/kb/crawl`: Start a website crawl

## Database Schema

### knowledge_docs
```sql
CREATE TABLE public.knowledge_docs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  file_path text,
  source_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### knowledge_doc_chunks
```sql
CREATE TABLE public.knowledge_doc_chunks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  doc_id uuid NOT NULL REFERENCES public.knowledge_docs(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  chunk_content text NOT NULL,
  embedding vector(1536),
  token_length integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 