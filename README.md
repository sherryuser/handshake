# Theory of Steam Users' Handshakes

A Next.js 14 web application that discovers the shortest connection paths between Steam users through their friend networks using a bidirectional breadth-first search algorithm.

## Features

- 🔍 **Intelligent Search**: Find connections between any Steam users or professional players
- ⚡ **Fast Algorithm**: Bidirectional BFS with Redis caching for optimal performance
- 🎮 **Steam Integration**: Real-time Steam API integration with friend network analysis
- 📱 **Responsive Design**: Beautiful, mobile-first UI with glass morphism design
- 🔗 **Social Sharing**: Share results with auto-generated OpenGraph cards
- 🎯 **Pro Player Database**: Search connections to professional CS2 players
- 📊 **Analytics**: Detailed search statistics and performance metrics

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **UI Components**: shadcn/ui, Radix UI, Lucide Icons
- **Animations**: Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Caching**: Upstash Redis
- **State Management**: TanStack React Query
- **Validation**: Zod
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Redis instance (Upstash recommended)
- Steam Web API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd handshake
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   # Steam Web API
   STEAM_API_KEY=your_steam_api_key_here
   
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/handshake?schema=public"
   
   # Redis Cache
   UPSTASH_REDIS_REST_URL=your_upstash_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
   
   # NextAuth.js
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_here
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## API Endpoints

### POST /api/handshake
Search for connections between two Steam users.

**Request:**
```json
{
  "source": "76561198046783516",
  "target": "s1mple"
}
```

**Response:**
```json
{
  "success": true,
  "degree": 2,
  "path": [/* SteamUser objects */],
  "searchId": "unique_search_id",
  "requesterUser": {/* SteamUser */},
  "targetUser": {/* SteamUser */},
  "stats": {
    "searchTime": 1234,
    "nodesExplored": 42,
    "cacheHits": 8
  }
}
```

### GET /api/pros
Get list of professional players.

### GET /api/profile?ids=steamid1,steamid2
Batch fetch Steam user profiles.

## Algorithm Details

The core search uses a **bidirectional breadth-first search (BFS)** algorithm:

1. **Bidirectional Search**: Searches simultaneously from both source and target users
2. **Depth Limitation**: Maximum search depth of 4 degrees
3. **Branching Control**: Limits friends per user to prevent explosion (300 max)
4. **Caching Strategy**: 
   - Friend lists cached for 7 days
   - Search results cached for 1 day
   - User profiles cached for 1 hour
5. **Private Profile Handling**: Graceful handling of private Steam profiles

## Database Schema

```sql
-- Users table
users (
  id64 VARCHAR PRIMARY KEY,  -- Steam ID64
  name VARCHAR,
  avatar VARCHAR,
  created_at TIMESTAMP,
  last_seen_at TIMESTAMP
)

-- Professional players
pros (
  id64 VARCHAR PRIMARY KEY,
  handle VARCHAR UNIQUE,
  team VARCHAR,
  aliases TEXT[]
)

-- Search history
searches (
  id VARCHAR PRIMARY KEY,
  requester_id64 VARCHAR,
  target_id64 VARCHAR,
  degree INTEGER,
  success BOOLEAN,
  path JSONB,
  created_at TIMESTAMP
)

-- Search counters
counters (
  entity_id64 VARCHAR PRIMARY KEY,
  search_count INTEGER
)
```

## Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set environment variables** in Vercel dashboard

3. **Configure build settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Environment Setup

- **Database**: Use Vercel Postgres or external PostgreSQL
- **Redis**: Use Upstash Redis for caching
- **Steam API**: Register at [steamcommunity.com/dev](https://steamcommunity.com/dev)

## Performance Optimizations

- **Redis Caching**: Multi-level caching strategy
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **React Query**: Intelligent client-side caching
- **Skeleton Loading**: Smooth loading experiences

## Future Enhancements

- Steam OAuth integration for personalized searches
- Steam groups as weak connection links
- Daily precomputation for popular users
- Global leaderboard of shortest paths
- WebSocket real-time search updates
- Advanced analytics dashboard

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Steam Web API for providing user data
- Professional CS2 players data
- Open source community for excellent tools and libraries
