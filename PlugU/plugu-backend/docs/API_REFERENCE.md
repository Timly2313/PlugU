# PlugU API Reference

Complete API reference for the PlugU backend.

## Base URL

```
https://your-project.supabase.co/functions/v1
```

## Authentication

All endpoints (except public feeds) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Posts

### Create Post

Creates a new social media post.

**Endpoint:** `POST /createPost`

**Request Body:**
```json
{
  "content": "Hello, PlugU!",
  "mediaUrls": ["https://example.com/image.jpg"],
  "mediaMetadata": {},
  "location": "New York, NY",
  "coordinates": { "lat": 40.7128, "lng": -74.0060 },
  "tagIds": ["uuid-tag-1", "uuid-tag-2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "post": {
      "id": "uuid",
      "user_id": "uuid",
      "content": "Hello, PlugU!",
      "media_urls": ["https://example.com/image.jpg"],
      "location": "New York, NY",
      "like_count": 0,
      "comment_count": 0,
      "created_at": "2024-01-01T00:00:00Z",
      "username": "johndoe",
      "display_name": "John Doe",
      "avatar_url": "https://...",
      "moderation": {
        "flagged": false,
        "score": 0.1
      }
    }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "...",
    "duration": 150
  }
}
```

### Get Feed

Retrieves personalized feed for the authenticated user.

**Endpoint:** `GET /getFeed`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Feed type: `personalized`, `trending`, `following`, `user`, `nearby` |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 100) |
| category | string | Filter by category |
| location | string | Filter by location |
| userId | string | For `user` type feed |
| lat | number | Latitude for `nearby` type |
| lng | number | Longitude for `nearby` type |
| radius | number | Search radius in km (default: 10) |

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "has_more": true
    }
  }
}
```

### Like Post

Toggles like status on a post.

**Endpoint:** `POST /likePost`

**Request Body:**
```json
{
  "postId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "liked": true,
    "post_id": "uuid",
    "like_count": 42
  }
}
```

### Comment on Post

Adds a comment to a post.

**Endpoint:** `POST /commentPost`

**Request Body:**
```json
{
  "postId": "uuid",
  "content": "Great post!",
  "parentId": "uuid"  // Optional: for replies
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comment": {
      "id": "uuid",
      "post_id": "uuid",
      "user_id": "uuid",
      "content": "Great post!",
      "like_count": 0,
      "created_at": "2024-01-01T00:00:00Z",
      "username": "johndoe",
      "display_name": "John Doe",
      "avatar_url": "https://..."
    }
  }
}
```

## Listings

### Create Listing

Creates a new marketplace listing.

**Endpoint:** `POST /createListing`

**Request Body:**
```json
{
  "title": "Vintage Camera",
  "description": "A beautiful vintage camera in great condition.",
  "price": 299.99,
  "currency": "USD",
  "priceType": "fixed",
  "category": "Electronics",
  "subcategory": "Cameras",
  "condition": "good",
  "images": ["https://example.com/camera1.jpg"],
  "location": "Los Angeles, CA",
  "coordinates": { "lat": 34.0522, "lng": -118.2437 },
  "isNegotiable": false,
  "isShippingAvailable": true,
  "isPickupAvailable": true,
  "expiresAt": "2024-02-01T00:00:00Z",
  "tagIds": ["uuid-tag-1"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "listing": {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Vintage Camera",
      "description": "A beautiful vintage camera...",
      "price": 299.99,
      "currency": "USD",
      "category": "Electronics",
      "images": ["https://example.com/camera1.jpg"],
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "username": "johndoe",
      "display_name": "John Doe",
      "moderation": {
        "flagged": false,
        "title_score": 0.1,
        "description_score": 0.05
      }
    }
  }
}
```

### Get User Listings

Retrieves listings for a specific user.

**Endpoint:** `GET /getUserListings`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | string | User ID (optional, defaults to current user) |
| status | string | Filter by status: `active`, `reserved`, `sold`, `hidden` |
| page | number | Page number |
| limit | number | Items per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "listings": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "has_more": true
    }
  }
}
```

## Messages

### Send Message

Sends a message in a conversation.

**Endpoint:** `POST /sendMessage`

**Request Body:**
```json
{
  "conversationId": "uuid",
  "content": "Hi, is this still available?",
  "mediaUrls": ["https://example.com/image.jpg"],
  "replyToId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender_id": "uuid",
      "content": "Hi, is this still available?",
      "media_urls": [],
      "status": "sent",
      "created_at": "2024-01-01T00:00:00Z",
      "username": "johndoe",
      "display_name": "John Doe",
      "avatar_url": "https://..."
    }
  }
}
```

## Notifications

### Fetch Notifications

Retrieves notifications for the authenticated user.

**Endpoint:** `GET /fetchNotifications`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| unreadOnly | boolean | Only return unread notifications |
| page | number | Page number |
| limit | number | Items per page |
| markRead | boolean | Mark notifications as read |
| notificationIds | string[] | Specific notification IDs to mark as read |

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "post_like",
        "title": "New Like",
        "body": "John Doe liked your post",
        "actor": {
          "id": "uuid",
          "username": "johndoe",
          "display_name": "John Doe",
          "avatar_url": "https://..."
        },
        "is_read": false,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "unread_count": 5
  }
}
```

## Moderation

### Moderate Content

AI-powered content moderation endpoint.

**Endpoint:** `POST /moderateContent`

**Request Body - Text Check:**
```json
{
  "type": "text",
  "content": "Text to moderate",
  "contentType": "post"
}
```

**Request Body - Image Check:**
```json
{
  "type": "image",
  "imageUrl": "https://example.com/image.jpg",
  "contentType": "post"
}

// Or batch check:
{
  "type": "image",
  "imageUrls": ["https://example.com/1.jpg", "https://example.com/2.jpg"]
}
```

**Request Body - Email Validation:**
```json
{
  "type": "email",
  "email": "user@example.com"
}
```

**Request Body - Phone Validation:**
```json
{
  "type": "phone",
  "phone": "+1234567890"
}
```

**Request Body - Flag Content (Moderators only):**
```json
{
  "action": "flag",
  "targetType": "post",
  "targetId": "uuid",
  "reason": "inappropriate_content"
}
```

**Request Body - Approve Content (Moderators only):**
```json
{
  "action": "approve",
  "targetType": "post",
  "targetId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "text",
    "result": {
      "flagged": false,
      "score": 0.1,
      "categories": {
        "hate": 0.01,
        "harassment": 0.02,
        "selfHarm": 0.0,
        "sexual": 0.0,
        "violence": 0.05
      },
      "action": "allow"
    }
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details
    }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "..."
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| BAD_REQUEST | 400 | Invalid request format |
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict |
| VALIDATION_ERROR | 422 | Input validation failed |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

## Rate Limiting

API requests are rate-limited:
- 100 requests per minute per IP
- 1000 requests per hour per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

## Pagination

List endpoints support cursor-based pagination:

```
GET /getFeed?page=2&limit=20
```

Response includes pagination info:
```json
{
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 100,
    "has_more": true
  }
}
```

## Realtime Subscriptions

Subscribe to changes using Supabase Realtime:

```javascript
// Posts
supabase
  .channel('public:posts')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, callback)
  .subscribe();

// Comments
supabase
  .channel('public:comments')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, callback)
  .subscribe();

// Messages (per conversation)
supabase
  .channel('conversation:uuid')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: 'conversation_id=eq.uuid'
  }, callback)
  .subscribe();

// Notifications
supabase
  .channel('public:notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: 'user_id=eq.current-user-id'
  }, callback)
  .subscribe();
```

## Database Functions (RPC)

Direct database function calls:

### Get Personalized Feed
```sql
SELECT * FROM get_personalized_feed(
  p_user_id => 'uuid',
  p_limit => 20,
  p_offset => 0
);
```

### Get Trending Feed
```sql
SELECT * FROM get_trending_feed(
  p_limit => 20,
  p_offset => 0
);
```

### Get Nearby Listings
```sql
SELECT * FROM get_nearby_listings(
  p_latitude => 40.7128,
  p_longitude => -74.0060,
  p_radius_km => 10,
  p_limit => 20,
  p_offset => 0
);
```

### Get Post Comments
```sql
SELECT * FROM get_post_comments(
  p_post_id => 'uuid',
  p_limit => 20,
  p_offset => 0
);
```

### Get User Stats
```sql
SELECT * FROM get_user_stats(p_user_id => 'uuid');
```

## Webhooks

Configure webhooks in Supabase Dashboard for:
- New user registration
- Post creation
- Listing creation
- Message sent

Webhook payload format:
```json
{
  "type": "INSERT",
  "table": "posts",
  "record": {
    "id": "uuid",
    "user_id": "uuid",
    "content": "...",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "schema": "public",
  "old_record": null
}
```

---

For more information, visit the [PlugU Documentation](https://docs.plugu.app).
