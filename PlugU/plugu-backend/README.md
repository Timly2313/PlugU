# PlugU - Complete Supabase Backend

A production-ready backend for a hybrid Social Media + Marketplace app.

## 📁 Project Structure

```
plugu-backend/
├── supabase/
│   ├── migrations/
│   │   ├── 001_core_complete.sql      # Main database schema
│   │   └── 002_storage_policies.sql   # Storage bucket policies
│   └── functions/
│       ├── handle_new_user/           # Auto-create profile on signup
│       ├── search_listings/           # Advanced listing search
│       ├── create_listing/            # Create + moderate listing
│       ├── track_listing_view/        # Analytics tracking
│       ├── create_post/               # Create + moderate post
│       ├── like_post/                 # Like/unlike + notification
│       ├── comment_post/              # Comment + reply + notification
│       ├── send_message/              # Send message + create convo
│       ├── get_conversations/         # Get user conversations
│       ├── send_notification/         # Send notification (admin)
│       ├── mark_notifications_read/   # Mark as read
│       ├── track_profile_view/        # Profile view analytics
│       ├── track_search/              # Search keyword analytics
│       ├── review_listing/            # Create review
│       └── moderate_content/          # AI content moderation
├── frontend-examples/
│   ├── auth.js                        # Auth + location
│   ├── posts.js                       # Posts + feed + likes
│   ├── listings.js                    # Listings + search + reviews
│   ├── messaging.js                   # Messages + realtime
│   ├── notifications.js               # Notifications
│   └── profile.js                     # Profile + follow + upload
└── README.md
```

## 🚀 Setup Instructions

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Note your `Project URL` and `anon/service_role` keys

### 2. Run SQL Migrations
1. Open Supabase SQL Editor
2. Run `001_core_complete.sql` first
3. Run `002_storage_policies.sql` second

### 3. Create Storage Buckets
In Supabase Dashboard > Storage:
- Create bucket: `avatars` (public)
- Create bucket: `post-media` (public)
- Create bucket: `listing-images` (public)

### 4. Deploy Edge Functions
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions
supabase functions deploy handle_new_user
supabase functions deploy search_listings
supabase functions deploy create_listing
supabase functions deploy track_listing_view
supabase functions deploy create_post
supabase functions deploy like_post
supabase functions deploy comment_post
supabase functions deploy send_message
supabase functions deploy get_conversations
supabase functions deploy send_notification
supabase functions deploy mark_notifications_read
supabase functions deploy track_profile_view
supabase functions deploy track_search
supabase functions deploy review_listing
supabase functions deploy moderate_content
```

### 5. Configure Auth Webhook
In Supabase Dashboard > Auth > Hooks:
- Set `handle_new_user` as the `user.created` webhook

### 6. Configure Database Webhooks (for moderation)
In Supabase Dashboard > Database > Webhooks:
- Create webhook on `moderation_queue` table, `INSERT` event
- Target: `moderate_content` Edge Function

### 7. Update Frontend Config
Replace in `frontend-examples/auth.js`:
```javascript
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';
```

## 🔐 Security

- All tables have RLS enabled
- Users can only modify their own data
- Public read access where appropriate
- Edge functions validate auth tokens
- Content moderation via AI before publishing

## 📊 Scalability

- GIST indexes on coordinates for geo queries
- Trigram indexes for text search
- Partial indexes for active content
- JSONB for flexible metadata
- Efficient counter columns with triggers
- RPC functions for complex queries

## 🔔 Realtime

Enabled for: posts, comments, post_likes, messages, conversations, notifications, listings, follows

## 🧪 Testing

```bash
# Test auth
node -e "require('./frontend-examples/auth.js')"

# Test feed
node -e "require('./frontend-examples/posts.js')"
```

## 📱 React Native Integration

1. Install dependencies:
```bash
npx create-expo-app PlugU
npm install @supabase/supabase-js @react-native-async-storage/async-storage expo-location
```

2. Copy frontend examples to your project
3. Import and use the modules

## 📝 Notes

- Replace simple keyword moderation in `moderate_content` with OpenAI API for production
- Add rate limiting on Edge Functions
- Consider adding caching layer (Redis) for feed
- Implement push notifications with Expo or Firebase
