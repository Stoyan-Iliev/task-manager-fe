## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` to configure your API connection:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8080
VITE_API_TIMEOUT=10000

# Development Tools
VITE_ENABLE_DEVTOOLS=true
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`