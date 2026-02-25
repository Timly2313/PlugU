# PlugU Backend Deployment Guide

This guide walks you through deploying the PlugU backend to production using Supabase.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- A Supabase project (create at [supabase.com](https://supabase.com))
- Node.js 18+ and npm/yarn

## Step 1: Project Setup

### 1.1 Link to Your Supabase Project

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Verify link
supabase status
```

### 1.2 Configure Environment Variables

```bash
# Copy the example environment file
cp supabase/functions/.env.example supabase/functions/.env

# Edit with your actual values
nano supabase/functions/.env
```

Required variables:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
```

Optional (for AI moderation):
```env
OPENAI_API_KEY=sk-your-openai-key
EMAIL_VALIDATION_API_KEY=your-key
PHONE_VALIDATION_API_KEY=your-key
```

## Step 2: Database Deployment

### 2.1 Deploy Migrations

```bash
# Push all migrations to production
supabase db push

# Or apply specific migrations
supabase migration up
```

### 2.2 Verify Database Schema

Check in Supabase Dashboard:
1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to Table Editor
4. Verify all tables are created

### 2.3 Refresh Materialized Views

```sql
-- Run in SQL Editor
SELECT refresh_all_feed_views();
```

## Step 3: Edge Functions Deployment

### 3.1 Deploy All Functions

```bash
# Deploy all Edge Functions
npm run functions:deploy:all

# Or deploy individually
supabase functions deploy createPost
supabase functions deploy getFeed
supabase functions deploy likePost
supabase functions deploy commentPost
supabase functions deploy createListing
supabase functions deploy getUserListings
supabase functions deploy moderateContent
supabase functions deploy sendMessage
supabase functions deploy fetchNotifications
```

### 3.2 Set Environment Variables in Dashboard

1. Go to Supabase Dashboard > Settings > Functions
2. Add all environment variables from `.env`
3. Click Save

### 3.3 Verify Function Deployment

```bash
# List deployed functions
supabase functions list

# Check function logs
supabase functions logs createPost
```

## Step 4: Configure Authentication

### 4.1 Enable Auth Providers (Optional)

In Supabase Dashboard > Authentication > Providers:
- Enable Email provider
- Configure OAuth providers (Google, Apple, etc.)

### 4.2 Configure Email Templates

Customize email templates in:
Supabase Dashboard > Authentication > Email Templates

### 4.3 Set Site URL

In Supabase Dashboard > Authentication > URL Configuration:
- Site URL: `https://your-app.com`
- Redirect URLs: Add your app URLs

## Step 5: Configure Storage

### 5.1 Create Storage Buckets

```sql
-- Run in SQL Editor or use Dashboard
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('posts', 'posts', true),
  ('listings', 'listings', true),
  ('messages', 'messages', false);
```

### 5.2 Set Storage Policies

In Supabase Dashboard > Storage > Policies:

**avatars bucket:**
- Allow public read access
- Allow authenticated users to upload (max 5MB)
- Allow users to delete their own files

**posts bucket:**
- Allow public read access
- Allow authenticated users to upload (max 50MB)

**listings bucket:**
- Allow public read access
- Allow authenticated users to upload (max 50MB)

## Step 6: Configure Realtime

### 6.1 Enable Realtime for Tables

Realtime is already configured in migrations. Verify in:
Supabase Dashboard > Database > Replication

### 6.2 Test Realtime Connection

```javascript
const subscription = supabase
  .channel('public:posts')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' },
    (payload) => console.log('Change received!', payload)
  )
  .subscribe();
```

## Step 7: Production Checklist

### Security

- [ ] RLS policies enabled on all tables
- [ ] Service role key kept secret
- [ ] JWT secret rotated
- [ ] Rate limiting configured
- [ ] CORS origins restricted

### Performance

- [ ] Indexes created on frequently queried fields
- [ ] Materialized views refreshed
- [ ] Connection pooling enabled (if using external connections)
- [ ] CDN configured for media (optional)

### Monitoring

- [ ] Error tracking enabled (Sentry recommended)
- [ ] Database monitoring enabled
- [ ] Function logs reviewed
- [ ] Performance metrics tracked

### Backup

- [ ] Automated backups enabled (Supabase Pro)
- [ ] Point-in-time recovery configured
- [ ] Database dump for disaster recovery

## Step 8: Scaling Considerations

### Phase 1: 0-100K Users (Supabase Pro)

- Use Supabase Pro plan ($25/month)
- Enable connection pooling
- Set up read replicas for feed queries
- Monitor database performance

### Phase 2: 100K-1M Users (Supabase Enterprise)

- Upgrade to Enterprise plan
- Multiple read replicas
- Advanced connection pooling
- CDN for media delivery
- Background job processing

### Phase 3: 1M+ Users (Custom Infrastructure)

- Consider dedicated infrastructure
- Database sharding for user data
- Separate notification service
- Advanced caching (Redis)
- Microservices architecture

## Step 9: Testing Production Deployment

### 9.1 Health Check

```bash
# Test API endpoints
curl https://your-project.supabase.co/functions/v1/getFeed

# Test with authentication
curl -H "Authorization: Bearer ${JWT}" \
  https://your-project.supabase.co/functions/v1/getFeed
```

### 9.2 End-to-End Testing

1. Create a test user
2. Create a post
3. Like the post
4. Add a comment
5. Create a listing
6. Send a message
7. Check notifications

### 9.3 Load Testing

Use tools like Artillery or k6:

```javascript
// load-test.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 0 },
  ],
};

export default function () {
  const res = http.get('https://your-project.supabase.co/functions/v1/getFeed');
  check(res, { 'status was 200': (r) => r.status === 200 });
}
```

## Step 10: Troubleshooting

### Common Issues

**Function deployment fails:**
```bash
# Check function logs
supabase functions logs function-name

# Redeploy
supabase functions deploy function-name
```

**Database migration fails:**
```bash
# Check migration status
supabase migration list

# Repair if needed
supabase migration repair 001_core --status applied
```

**RLS policy errors:**
```sql
-- Check RLS is enabled
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'posts';

-- List policies
SELECT * FROM pg_policies WHERE tablename = 'posts';
```

**Performance issues:**
```sql
-- Check slow queries
SELECT query, mean_exec_time FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

## Maintenance

### Regular Tasks

**Weekly:**
- Review error logs
- Check performance metrics
- Monitor storage usage

**Monthly:**
- Refresh materialized views
- Analyze and vacuum database
- Review and optimize queries

**Quarterly:**
- Security audit
- Performance optimization
- Capacity planning

### Automated Maintenance

Set up scheduled functions:

```sql
-- Create cron job for refreshing views
SELECT cron.schedule('refresh-feed-views', '0 */6 * * *', 
  'SELECT refresh_all_feed_views()');
```

## Support

- Supabase Documentation: [supabase.com/docs](https://supabase.com/docs)
- Supabase Status: [status.supabase.com](https://status.supabase.com)
- Community Discord: [discord.gg/supabase](https://discord.gg/supabase)

## Rollback Plan

If deployment fails:

1. **Revert migrations:**
```bash
supabase db reset
```

2. **Redeploy previous functions:**
```bash
git checkout previous-version
supabase functions deploy
```

3. **Restore from backup:**
- Use Supabase Dashboard > Database > Backups
- Or use CLI: `supabase db restore`

---

**Congratulations!** Your PlugU backend is now deployed to production.
