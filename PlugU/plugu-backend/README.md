# PlugU Backend

A production-ready, scalable backend for the PlugU social content platform built with Supabase. Designed to support 100K+ users in the first growth phase and millions of listings long-term.

## Features

- **Complete Social Platform**: Posts, likes, comments, tags, user profiles
- **Marketplace**: Listings with categories, search, and location-based discovery
- **Real-time Messaging**: Conversations and direct messaging
- **AI Moderation**: Text, image, email, and phone validation
- **High Performance**: Materialized views, optimized indexes, pagination
- **Security**: Row Level Security (RLS), JWT authentication, rate limiting
- **Scalability**: Designed for horizontal scaling with Supabase

## Architecture

```
plugu-backend/
├── supabase/
│   ├── migrations/           # SQL schema migrations
│   │   ├── 001_core.sql     # Core tables, indexes, RLS
│   │   ├── 002_feed_views.sql # Materialized views for feeds
│   │   └── 003_rpcs.sql     # Stored procedures and functions
│   ├── functions/           # Edge Functions (TypeScript)
│   │   ├── _shared/         # Shared modules
│   │   │   ├── db.ts       # Database utilities
│   │   │   ├── auth.ts     # Authentication & authorization
│   │   │   ├── response.ts # Response helpers
│   │   │   ├── validate.ts # Input validation
│   │   │   └── moderation.ts # AI moderation
│   │   ├── createPost/     # Create social post
│   │   ├── getFeed/        # Get personalized feed
│   │   ├── likePost/       # Like/unlike post
│   │   ├── commentPost/    # Comment on post
│   │   ├── createListing/  # Create marketplace listing
│   │   ├── getUserListings/# Get user's listings
│   │   ├── moderateContent/# AI moderation endpoint
│   │   ├── sendMessage/    # Send message
│   │   └── fetchNotifications/ # Get notifications
│   └── config.toml         # Supabase configuration
├── docs/                   # Documentation
├── examples/               # Integration examples
│   └── react-native/      # React Native examples
└── package.json           # NPM scripts
```

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Deno](https://deno.land/) (for Edge Functions)

### 1. Install Dependencies

```bash
# Install Supabase CLI globally
npm install -g supabase

# Or use npx
npx supabase --version
```

### 2. Clone and Setup

```bash
git clone <repository-url>
cd plugu-backend

# Copy environment variables
cp supabase/functions/.env.example supabase/functions/.env

# Edit .env with your actual values
nano supabase/functions/.env
```

### 3. Start Local Development

```bash
# Start Supabase locally
supabase start

# Check status
supabase status
```

### 4. Run Migrations

```bash
# Reset database and apply all migrations
supabase db reset

# Or push migrations to linked project
supabase db push
```

### 5. Deploy Edge Functions

```bash
# Deploy all functions
npm run functions:deploy:all

# Or deploy individually
supabase functions deploy createPost
supabase functions deploy getFeed
# ... etc
```

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `profiles` | Extended user profiles |
| `posts` | Social media posts |
| `post_likes` | Post like relationships |
| `comments` | Post comments |
| `tags` | Content categorization |
| `post_tags` | Post-tag relationships |
| `listings` | Marketplace listings |
| `listing_tags` | Listing-tag relationships |
| `conversations` | Chat conversations |
| `conversation_participants` | Conversation members |
| `messages` | Chat messages |
| `notifications` | User notifications |
| `reviews` | User/listing reviews |

### Materialized Views

| View | Purpose |
|------|---------|
| `feed_posts_view` | Optimized posts feed with engagement scores |
| `feed_listings_view` | Optimized listings feed with ranking |
| `user_feed_preferences_view` | User content preferences |
| `trending_content_view` | Trending posts and listings |

## Edge Functions

### Posts

| Function | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| `createPost` | POST | `/functions/v1/createPost` | Create a new post |
| `getFeed` | GET | `/functions/v1/getFeed` | Get personalized feed |
| `likePost` | POST | `/functions/v1/likePost` | Like/unlike a post |
| `commentPost` | POST | `/functions/v1/commentPost` | Comment on a post |

### Listings

| Function | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| `createListing` | POST | `/functions/v1/createListing` | Create a listing |
| `getUserListings` | GET | `/functions/v1/getUserListings` | Get user's listings |

### Messaging

| Function | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| `sendMessage` | POST | `/functions/v1/sendMessage` | Send a message |
| `fetchNotifications` | GET | `/functions/v1/fetchNotifications` | Get notifications |

### Moderation

| Function | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| `moderateContent` | POST | `/functions/v1/moderateContent` | AI content moderation |

## API Usage Examples

### Create a Post

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/createPost`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: 'Hello, PlugU!',
      mediaUrls: ['https://example.com/image.jpg'],
      location: 'New York, NY',
      tagIds: ['uuid-tag-1', 'uuid-tag-2'],
    }),
  }
);

const { data } = await response.json();
```

### Get Feed

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/getFeed?type=personalized&page=1&limit=20`,
  {
    headers: {
      'Authorization': `Bearer ${jwt}`,
    },
  }
);

const { data } = await response.json();
```

### Like a Post

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/likePost`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      postId: 'uuid-post-id',
    }),
  }
);

const { data } = await response.json();
// data.liked = true/false
```

### Create a Listing

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/createListing`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Vintage Camera',
      description: 'A beautiful vintage camera in great condition.',
      price: 299.99,
      category: 'Electronics',
      condition: 'good',
      images: ['https://example.com/camera1.jpg'],
      location: 'Los Angeles, CA',
    }),
  }
);
```

### Send a Message

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/sendMessage`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversationId: 'uuid-conversation-id',
      content: 'Hi, is this still available?',
    }),
  }
);
```

## AI Moderation

The backend includes comprehensive AI moderation:

### Text Moderation
- Uses OpenAI Moderation API (with fallback)
- Detects hate speech, harassment, self-harm, sexual content, violence
- Configurable thresholds

### Image Moderation
- Scans for NSFW content
- Configurable with AWS Rekognition, Google Vision, or Azure

### Email Validation
- Validates format
- Checks for disposable emails
- Detects role accounts

### Phone Validation
- Validates international format (E.164)
- Carrier detection
- Line type identification

### Configuration

Set in `supabase/functions/.env`:

```env
OPENAI_API_KEY=sk-your-key
EMAIL_VALIDATION_API_KEY=your-key
PHONE_VALIDATION_API_KEY=your-key
```

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies for:
- Users can only modify their own data
- Public content is readable by everyone
- Private content requires authentication

### Rate Limiting

Built-in rate limiting (configurable):
- 100 requests per minute per IP
- Automatic 429 responses when exceeded

### Authentication

- JWT-based authentication
- Supabase Auth integration
- Optional anonymous access for public content

## Performance

### Indexes

All frequently queried fields are indexed:
- Primary keys (UUID)
- Foreign keys
- Search fields (with GIN for text search)
- Location (with GiST for geo queries)
- Timestamps (for sorting)

### Materialized Views

Feed queries use materialized views for O(1) performance:
- `feed_posts_view`: Pre-calculated engagement scores
- `feed_listings_view`: Pre-calculated ranking scores
- Auto-refresh on data changes

### Pagination

All list endpoints support cursor-based pagination:
- `page`: Page number (1-based)
- `limit`: Items per page (max 100)
- `cursor`: For efficient deep pagination

## Realtime

Supabase Realtime is enabled for:
- Posts
- Comments
- Likes
- Messages
- Notifications

Subscribe in your frontend:

```typescript
const subscription = supabase
  .channel('public:posts')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' },
    (payload) => console.log('Change received!', payload)
  )
  .subscribe();
```

## Deployment

### Deploy to Production

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push database migrations
supabase db push

# Deploy all Edge Functions
npm run functions:deploy:all
```

### Environment Variables

Set in Supabase Dashboard:
1. Go to Project Settings > Functions
2. Add environment variables from `.env`

### Monitoring

- Use Supabase Dashboard for metrics
- Enable Sentry integration for error tracking
- Set up log drains for external monitoring

## Development

### Local Testing

```bash
# Start all services
supabase start

# Serve Edge Functions locally
supabase functions serve

# Test specific function
curl -X POST http://localhost:54321/functions/v1/createPost \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test post"}'
```

### Database Migrations

```bash
# Create new migration
supabase migration new my_migration

# Apply migrations
supabase migration up

# Reset database (careful!)
supabase db reset
```

### Type Generation

```bash
# Generate TypeScript types from database
npm run types:generate
```

## Scaling

### Phase 1: 100K Users

- Supabase Pro plan
- Read replicas for feed queries
- Edge Functions for compute-heavy operations
- Materialized views for feed performance

### Phase 2: 1M+ Users

- Supabase Enterprise
- Multiple read replicas
- Connection pooling (PgBouncer)
- CDN for media (Supabase Storage)
- Background jobs for notifications

### Phase 3: 10M+ Users

- Custom infrastructure
- Sharding for user data
- Separate notification service
- AI recommendation engine
- Advanced caching (Redis)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- Documentation: [docs.plugu.app](https://docs.plugu.app)
- Issues: [GitHub Issues](https://github.com/plugu/backend/issues)
- Discord: [PlugU Community](https://discord.gg/plugu)
