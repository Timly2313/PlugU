-- PlugU Social Content Platform - COMPLETE Production Backend
-- Migration: 001_core_complete.sql
-- Description: Core tables, constraints, indexes, RLS, RPC functions, triggers
-- Supports: 100K+ users (phase 1), millions of listings (long-term)

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    cover_image_url TEXT,
    location VARCHAR(255),
    longitude DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    is_email_valid BOOLEAN DEFAULT true,
    is_phone_valid BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    listing_count INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    last_active_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tags table (for categorization)
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50),
    color VARCHAR(7),
    icon VARCHAR(100),
    usage_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Posts table (social content)
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_urls JSONB DEFAULT '[]',
    media_metadata JSONB DEFAULT '{}',
    location VARCHAR(255),
    coordinates POINT,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT false,
    flag_reason VARCHAR(100),
    moderation_score DECIMAL(3,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted', 'under_review')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Post tags junction table
CREATE TABLE IF NOT EXISTS post_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, tag_id)
);

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT false,
    moderation_score DECIMAL(3,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comment likes table
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- Follows table (user follows)
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- =============================================================================
-- LISTINGS TABLES
-- =============================================================================

-- Listings table (marketplace/classifieds)
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'ZAR',
    category VARCHAR(100) NOT NULL,
    condition VARCHAR(50),
    images JSONB DEFAULT '[]',
    image_metadata JSONB DEFAULT '{}',
    location VARCHAR(255),
    coordinates POINT,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    inquiry_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'reserved', 'sold', 'hidden', 'deleted', 'under_review')),
    is_flagged BOOLEAN DEFAULT false,
    flag_reason VARCHAR(100),
    moderation_score DECIMAL(3,2),
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Listing tags junction table
CREATE TABLE IF NOT EXISTS listing_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(listing_id, tag_id)
);

-- Reviews table (for listings and users)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    is_flagged BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- MESSAGING TABLES
-- =============================================================================

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    type VARCHAR(20) DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'listing')),
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ DEFAULT now(),
    message_count INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversation participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    unread_count INTEGER DEFAULT 0,
    last_read_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_urls JSONB DEFAULT '[]',
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_flagged BOOLEAN DEFAULT false,
    moderation_score DECIMAL(3,2),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- NOTIFICATION TABLES
-- =============================================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}',
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    target_type VARCHAR(50),
    target_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    email_likes BOOLEAN DEFAULT true,
    email_comments BOOLEAN DEFAULT true,
    email_follows BOOLEAN DEFAULT true,
    email_messages BOOLEAN DEFAULT true,
    email_listings BOOLEAN DEFAULT true,
    push_likes BOOLEAN DEFAULT true,
    push_comments BOOLEAN DEFAULT true,
    push_follows BOOLEAN DEFAULT true,
    push_messages BOOLEAN DEFAULT true,
    push_listings BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    weekly_digest BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- =============================================================================
-- ANALYTICS TABLES
-- =============================================================================

-- User likes table (who liked whom - profile likes)
CREATE TABLE IF NOT EXISTS user_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    liker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    liked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(liker_id, liked_id)
);

-- User views table (profile views)
CREATE TABLE IF NOT EXISTS user_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    viewed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    source VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User search keywords table
CREATE TABLE IF NOT EXISTS user_search_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    keyword VARCHAR(255) NOT NULL,
    filters JSONB DEFAULT '{}',
    result_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Listing views table (track individual listing views)
CREATE TABLE IF NOT EXISTS listing_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- MODERATION QUEUE TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('post', 'listing', 'comment', 'message')),
    content_id UUID NOT NULL,
    content_text TEXT,
    content_media_urls JSONB DEFAULT '[]',
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    ai_moderation_result JSONB DEFAULT '{}',
    ai_moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (ai_moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
    ai_moderation_score DECIMAL(3,2),
    human_reviewed BOOLEAN DEFAULT false,
    human_review_result VARCHAR(20),
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_profiles_coordinates ON profiles USING GIST(point(longitude, latitude)) WHERE longitude IS NOT NULL AND latitude IS NOT NULL;

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_posts_is_flagged ON posts(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_posts_coordinates ON posts USING GIST(coordinates) WHERE coordinates IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_content_trgm ON posts USING GIN(content gin_trgm_ops);

-- Post likes indexes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON post_likes(created_at DESC);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);
CREATE INDEX IF NOT EXISTS idx_tags_is_featured ON tags(is_featured) WHERE is_featured = true;

-- Post tags indexes
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);

-- Listings indexes
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_is_flagged ON listings(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_listings_coordinates ON listings USING GIST(coordinates) WHERE coordinates IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm ON listings USING GIN(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_description_trgm ON listings USING GIN(description gin_trgm_ops);

-- Listing tags indexes
CREATE INDEX IF NOT EXISTS idx_listing_tags_listing_id ON listing_tags(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_tags_tag_id ON listing_tags(tag_id);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_listing_id ON conversations(listing_id) WHERE listing_id IS NOT NULL;

-- Conversation participants indexes
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON reviews(listing_id) WHERE listing_id IS NOT NULL;

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_user_likes_liked_id ON user_likes(liked_id);
CREATE INDEX IF NOT EXISTS idx_user_views_viewed_id ON user_views(viewed_id);
CREATE INDEX IF NOT EXISTS idx_user_search_keywords_user_id ON user_search_keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_keywords_keyword ON user_search_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id ON listing_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(ai_moderation_status) WHERE ai_moderation_status = 'pending';

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers for all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moderation_queue_updated_at BEFORE UPDATE ON moderation_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update post counts trigger
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET post_count = post_count + 1 WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET post_count = post_count - 1 WHERE id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_counts
    AFTER INSERT OR DELETE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- Update listing counts trigger
CREATE OR REPLACE FUNCTION update_listing_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET listing_count = listing_count + 1 WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET listing_count = listing_count - 1 WHERE id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_listing_counts
    AFTER INSERT OR DELETE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_listing_counts();

-- Update post like counts trigger
CREATE OR REPLACE FUNCTION update_post_like_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_like_counts
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_like_counts();

-- Update comment counts trigger
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_counts
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

-- Update conversation last_message_at trigger
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_message_at = NEW.created_at,
        message_count = message_count + 1
    WHERE id = NEW.conversation_id;

    -- Update unread counts for all participants except sender
    UPDATE conversation_participants
    SET unread_count = unread_count + 1
    WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Update tag usage counts trigger
CREATE OR REPLACE FUNCTION update_tag_usage_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_tag_counts
    AFTER INSERT OR DELETE ON post_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_counts();

CREATE TRIGGER trigger_update_listing_tag_counts
    AFTER INSERT OR DELETE ON listing_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_counts();

-- Update follower counts trigger
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
        UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET follower_count = follower_count - 1 WHERE id = OLD.following_id;
        UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_follower_counts
    AFTER INSERT OR DELETE ON follows
    FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- Auto-create notification settings on profile creation
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_notification_settings
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_default_notification_settings();

-- =============================================================================
-- RPC FUNCTIONS (for complex operations)
-- =============================================================================

-- Get feed with author info and engagement
CREATE OR REPLACE FUNCTION get_feed(
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    content TEXT,
    media_urls JSONB,
    location VARCHAR(255),
    view_count INTEGER,
    like_count INTEGER,
    comment_count INTEGER,
    share_count INTEGER,
    status VARCHAR(20),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    author_username VARCHAR(50),
    author_display_name VARCHAR(100),
    author_avatar_url TEXT,
    is_liked BOOLEAN,
    tags JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.content,
        p.media_urls,
        p.location,
        p.view_count,
        p.like_count,
        p.comment_count,
        p.share_count,
        p.status,
        p.created_at,
        p.updated_at,
        pr.username AS author_username,
        pr.display_name AS author_display_name,
        pr.avatar_url AS author_avatar_url,
        EXISTS (
            SELECT 1 FROM post_likes pl 
            WHERE pl.post_id = p.id AND pl.user_id = p_user_id
        ) AS is_liked,
        COALESCE(
            (SELECT jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug, 'color', t.color))
             FROM post_tags pt
             JOIN tags t ON pt.tag_id = t.id
             WHERE pt.post_id = p.id),
            '[]'::jsonb
        ) AS tags
    FROM posts p
    JOIN profiles pr ON p.user_id = pr.id
    WHERE p.status = 'active'
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search listings with advanced filtering
CREATE OR REPLACE FUNCTION search_listings(
    p_query TEXT DEFAULT NULL,
    p_category VARCHAR(100) DEFAULT NULL,
    p_min_price DECIMAL(12,2) DEFAULT NULL,
    p_max_price DECIMAL(12,2) DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT 'active',
    p_latitude DOUBLE PRECISION DEFAULT NULL,
    p_longitude DOUBLE PRECISION DEFAULT NULL,
    p_radius_km DOUBLE PRECISION DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title VARCHAR(255),
    description TEXT,
    price DECIMAL(12,2),
    currency VARCHAR(3),
    category VARCHAR(100),
    condition VARCHAR(50),
    images JSONB,
    location VARCHAR(255),
    coordinates POINT,
    view_count INTEGER,
    like_count INTEGER,
    inquiry_count INTEGER,
    status VARCHAR(20),
    created_at TIMESTAMPTZ,
    distance_km DOUBLE PRECISION,
    seller_username VARCHAR(50),
    seller_avatar_url TEXT,
    seller_reputation INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.user_id,
        l.title,
        l.description,
        l.price,
        l.currency,
        l.category,
        l.condition,
        l.images,
        l.location,
        l.coordinates,
        l.view_count,
        l.like_count,
        l.inquiry_count,
        l.status,
        l.created_at,
        CASE 
            WHEN p_latitude IS NOT NULL AND p_longitude IS NOT NULL AND l.coordinates IS NOT NULL THEN
                ST_Distance(
                    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
                    ST_SetSRID(ST_MakePoint(ST_X(l.coordinates), ST_Y(l.coordinates)), 4326)::geography
                ) / 1000
            ELSE NULL
        END AS distance_km,
        pr.username AS seller_username,
        pr.avatar_url AS seller_avatar_url,
        pr.reputation_score AS seller_reputation
    FROM listings l
    JOIN profiles pr ON l.user_id = pr.id
    WHERE 
        (p_status IS NULL OR l.status = p_status)
        AND (p_category IS NULL OR l.category = p_category)
        AND (p_min_price IS NULL OR l.price >= p_min_price)
        AND (p_max_price IS NULL OR l.price <= p_max_price)
        AND (
            p_query IS NULL 
            OR l.title ILIKE '%' || p_query || '%'
            OR l.description ILIKE '%' || p_query || '%'
        )
        AND (
            p_latitude IS NULL 
            OR p_longitude IS NULL 
            OR p_radius_km IS NULL 
            OR l.coordinates IS NULL
            OR ST_DWithin(
                ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(ST_X(l.coordinates), ST_Y(l.coordinates)), 4326)::geography,
                p_radius_km * 1000
            )
        )
    ORDER BY 
        CASE WHEN p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
            ST_Distance(
                ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(ST_X(l.coordinates), ST_Y(l.coordinates)), 4326)::geography
            )
        END ASC NULLS LAST,
        l.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user profile with stats
CREATE OR REPLACE FUNCTION get_user_profile_with_stats(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    username VARCHAR(50),
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    cover_image_url TEXT,
    location VARCHAR(255),
    longitude DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    website VARCHAR(255),
    is_verified BOOLEAN,
    is_premium BOOLEAN,
    follower_count INTEGER,
    following_count INTEGER,
    post_count INTEGER,
    listing_count INTEGER,
    reputation_score INTEGER,
    settings JSONB,
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    avg_rating DECIMAL(2,1),
    total_reviews INTEGER,
    is_following BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.display_name,
        p.bio,
        p.avatar_url,
        p.cover_image_url,
        p.location,
        p.longitude,
        p.latitude,
        p.website,
        p.is_verified,
        p.is_premium,
        p.follower_count,
        p.following_count,
        p.post_count,
        p.listing_count,
        p.reputation_score,
        p.settings,
        p.last_active_at,
        p.created_at,
        COALESCE((SELECT AVG(r.rating)::DECIMAL(2,1) FROM reviews r WHERE r.reviewee_id = p_user_id AND r.status = 'active'), 0) AS avg_rating,
        COALESCE((SELECT COUNT(*)::INTEGER FROM reviews r WHERE r.reviewee_id = p_user_id AND r.status = 'active'), 0) AS total_reviews,
        EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = auth.uid() AND f.following_id = p_user_id) AS is_following
    FROM profiles p
    WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get nearby listings
CREATE OR REPLACE FUNCTION get_nearby_listings(
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_radius_km DOUBLE PRECISION DEFAULT 10,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title VARCHAR(255),
    description TEXT,
    price DECIMAL(12,2),
    currency VARCHAR(3),
    category VARCHAR(100),
    images JSONB,
    location VARCHAR(255),
    coordinates POINT,
    status VARCHAR(20),
    created_at TIMESTAMPTZ,
    distance_km DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.user_id,
        l.title,
        l.description,
        l.price,
        l.currency,
        l.category,
        l.images,
        l.location,
        l.coordinates,
        l.status,
        l.created_at,
        ST_Distance(
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(ST_X(l.coordinates), ST_Y(l.coordinates)), 4326)::geography
        ) / 1000 AS distance_km
    FROM listings l
    WHERE l.status = 'active'
        AND l.coordinates IS NOT NULL
        AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(ST_X(l.coordinates), ST_Y(l.coordinates)), 4326)::geography,
            p_radius_km * 1000
        )
    ORDER BY distance_km ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get nearby users
CREATE OR REPLACE FUNCTION get_nearby_users(
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_radius_km DOUBLE PRECISION DEFAULT 10,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    username VARCHAR(50),
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(255),
    distance_km DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.display_name,
        p.avatar_url,
        p.bio,
        p.location,
        ST_Distance(
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography
        ) / 1000 AS distance_km
    FROM profiles p
    WHERE p.longitude IS NOT NULL 
        AND p.latitude IS NOT NULL
        AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
            p_radius_km * 1000
        )
        AND p.id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID)
    ORDER BY distance_km ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get conversation messages with pagination
CREATE OR REPLACE FUNCTION get_conversation_messages(
    p_conversation_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_before_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    conversation_id UUID,
    sender_id UUID,
    content TEXT,
    media_urls JSONB,
    reply_to_id UUID,
    status VARCHAR(20),
    created_at TIMESTAMPTZ,
    sender_username VARCHAR(50),
    sender_avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.media_urls,
        m.reply_to_id,
        m.status,
        m.created_at,
        pr.username AS sender_username,
        pr.avatar_url AS sender_avatar_url
    FROM messages m
    JOIN profiles pr ON m.sender_id = pr.id
    WHERE m.conversation_id = p_conversation_id
        AND (p_before_id IS NULL OR m.id < p_before_id)
    ORDER BY m.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get conversations for user
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    type VARCHAR(20),
    listing_id UUID,
    last_message_at TIMESTAMPTZ,
    message_count INTEGER,
    unread_count INTEGER,
    participant_usernames TEXT[],
    participant_avatars TEXT[],
    last_message_content TEXT,
    last_message_sender_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.type,
        c.listing_id,
        c.last_message_at,
        c.message_count,
        cp.unread_count,
        ARRAY_AGG(DISTINCT pr.username) FILTER (WHERE pr.id != p_user_id) AS participant_usernames,
        ARRAY_AGG(DISTINCT pr.avatar_url) FILTER (WHERE pr.id != p_user_id) AS participant_avatars,
        (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_content,
        (SELECT m.sender_id FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_sender_id
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
    JOIN profiles pr ON cp2.user_id = pr.id
    WHERE cp.user_id = p_user_id
    GROUP BY c.id, cp.unread_count
    ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get notifications for user
CREATE OR REPLACE FUNCTION get_user_notifications(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_unread_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
    id UUID,
    type VARCHAR(50),
    title VARCHAR(255),
    body TEXT,
    data JSONB,
    actor_id UUID,
    actor_username VARCHAR(50),
    actor_avatar_url TEXT,
    target_type VARCHAR(50),
    target_id UUID,
    is_read BOOLEAN,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.title,
        n.body,
        n.data,
        n.actor_id,
        pr.username AS actor_username,
        pr.avatar_url AS actor_avatar_url,
        n.target_type,
        n.target_id,
        n.is_read,
        n.read_at,
        n.created_at
    FROM notifications n
    LEFT JOIN profiles pr ON n.actor_id = pr.id
    WHERE n.user_id = p_user_id
        AND (NOT p_unread_only OR n.is_read = false)
    ORDER BY n.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notifications 
    SET is_read = true, read_at = now()
    WHERE user_id = p_user_id AND is_read = false;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get post comments with nested replies
CREATE OR REPLACE FUNCTION get_post_comments(
    p_post_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    post_id UUID,
    user_id UUID,
    parent_id UUID,
    content TEXT,
    like_count INTEGER,
    status VARCHAR(20),
    created_at TIMESTAMPTZ,
    username VARCHAR(50),
    display_name VARCHAR(100),
    avatar_url TEXT,
    reply_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.parent_id,
        c.content,
        c.like_count,
        c.status,
        c.created_at,
        pr.username,
        pr.display_name,
        pr.avatar_url,
        (SELECT COUNT(*) FROM comments r WHERE r.parent_id = c.id AND r.status = 'active') AS reply_count
    FROM comments c
    JOIN profiles pr ON c.user_id = pr.id
    WHERE c.post_id = p_post_id
        AND c.parent_id IS NULL
        AND c.status = 'active'
    ORDER BY c.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get comment replies
CREATE OR REPLACE FUNCTION get_comment_replies(p_comment_id UUID)
RETURNS TABLE (
    id UUID,
    post_id UUID,
    user_id UUID,
    parent_id UUID,
    content TEXT,
    like_count INTEGER,
    status VARCHAR(20),
    created_at TIMESTAMPTZ,
    username VARCHAR(50),
    display_name VARCHAR(100),
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.parent_id,
        c.content,
        c.like_count,
        c.status,
        c.created_at,
        pr.username,
        pr.display_name,
        pr.avatar_url
    FROM comments c
    JOIN profiles pr ON c.user_id = pr.id
    WHERE c.parent_id = p_comment_id
        AND c.status = 'active'
    ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Track listing view (FIXED dedup/throttle)
CREATE OR REPLACE FUNCTION track_listing_view(
    p_listing_id UUID,
    p_viewer_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- If viewer_id is NULL, we can't dedupe per-user; just increment.
    IF p_viewer_id IS NULL THEN
        INSERT INTO listing_views (listing_id, viewer_id)
        VALUES (p_listing_id, NULL);

        UPDATE listings
        SET view_count = view_count + 1
        WHERE id = p_listing_id;

        RETURN;
    END IF;

    -- Only record/increment if no view exists in the last 5 minutes for this listing+viewer
    IF NOT EXISTS (
        SELECT 1
        FROM listing_views lv
        WHERE lv.listing_id = p_listing_id
          AND lv.viewer_id = p_viewer_id
          AND lv.created_at > now() - interval '5 minutes'
    ) THEN
        INSERT INTO listing_views (listing_id, viewer_id)
        VALUES (p_listing_id, p_viewer_id);

        UPDATE listings
        SET view_count = view_count + 1
        WHERE id = p_listing_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Track profile view
CREATE OR REPLACE FUNCTION track_profile_view(
    p_viewed_id UUID,
    p_viewer_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_views (viewer_id, viewed_id)
    VALUES (p_viewer_id, p_viewed_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Track search keyword
CREATE OR REPLACE FUNCTION track_search(
    p_user_id UUID DEFAULT NULL,
    p_keyword VARCHAR(255) DEFAULT NULL,
    p_filters JSONB DEFAULT '{}',
    p_result_count INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_search_keywords (user_id, keyword, filters, result_count)
    VALUES (p_user_id, p_keyword, p_filters, p_result_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create review (FIXED parameter order)
CREATE OR REPLACE FUNCTION create_review(
    p_reviewer_id UUID,
    p_reviewee_id UUID,
    p_rating INTEGER,
    p_listing_id UUID DEFAULT NULL,
    p_title VARCHAR(255) DEFAULT NULL,
    p_content TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_review_id UUID;
BEGIN
    INSERT INTO reviews (reviewer_id, reviewee_id, listing_id, rating, title, content)
    VALUES (p_reviewer_id, p_reviewee_id, p_listing_id, p_rating, p_title, p_content)
    RETURNING id INTO v_review_id;

    -- Update reputation score
    UPDATE profiles
    SET reputation_score = reputation_score + (p_rating - 3) * 2
    WHERE id = p_reviewee_id;

    RETURN v_review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get listing reviews
CREATE OR REPLACE FUNCTION get_listing_reviews(
    p_listing_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    reviewer_id UUID,
    rating INTEGER,
    title VARCHAR(255),
    content TEXT,
    created_at TIMESTAMPTZ,
    reviewer_username VARCHAR(50),
    reviewer_avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.reviewer_id,
        r.rating,
        r.title,
        r.content,
        r.created_at,
        pr.username AS reviewer_username,
        pr.avatar_url AS reviewer_avatar_url
    FROM reviews r
    JOIN profiles pr ON r.reviewer_id = pr.id
    WHERE r.listing_id = p_listing_id
        AND r.status = 'active'
    ORDER BY r.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Send message and create notification
CREATE OR REPLACE FUNCTION send_message(
    p_conversation_id UUID,
    p_sender_id UUID,
    p_content TEXT,
    p_media_urls JSONB DEFAULT '[]',
    p_reply_to_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_message_id UUID;
    v_recipient_id UUID;
BEGIN
    -- Insert message
    INSERT INTO messages (conversation_id, sender_id, content, media_urls, reply_to_id)
    VALUES (p_conversation_id, p_sender_id, p_content, p_media_urls, p_reply_to_id)
    RETURNING id INTO v_message_id;

    -- Get recipient and create notification
    SELECT cp.user_id INTO v_recipient_id
    FROM conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id
        AND cp.user_id != p_sender_id
    LIMIT 1;

    IF v_recipient_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, body, actor_id, target_type, target_id, data)
        VALUES (
            v_recipient_id,
            'message',
            'New Message',
            substring(p_content from 1 for 100),
            p_sender_id,
            'conversation',
            p_conversation_id,
            jsonb_build_object('message_id', v_message_id, 'conversation_id', p_conversation_id)
        );
    END IF;

    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create conversation
CREATE OR REPLACE FUNCTION create_conversation(
    p_user_ids UUID[],
    p_type VARCHAR(20) DEFAULT 'direct',
    p_title VARCHAR(255) DEFAULT NULL,
    p_listing_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
    v_user_id UUID;
BEGIN
    -- Create conversation
    INSERT INTO conversations (type, title, listing_id)
    VALUES (p_type, p_title, p_listing_id)
    RETURNING id INTO v_conversation_id;

    -- Add participants
    FOREACH v_user_id IN ARRAY p_user_ids
    LOOP
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES (v_conversation_id, v_user_id)
        ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END LOOP;

    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Posts RLS policies
CREATE POLICY "Active posts are viewable by everyone" ON posts
    FOR SELECT USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can create posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- Post likes RLS policies
CREATE POLICY "Post likes are viewable by everyone" ON post_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like posts" ON post_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" ON post_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Comments RLS policies
CREATE POLICY "Active comments are viewable by everyone" ON comments
    FOR SELECT USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can create comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- Comment likes RLS policies
CREATE POLICY "Comment likes are viewable by everyone" ON comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like comments" ON comment_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own comment likes" ON comment_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Tags RLS policies
CREATE POLICY "Tags are viewable by everyone" ON tags
    FOR SELECT USING (true);

CREATE POLICY "Only verified users can create tags" ON tags
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND is_verified = true
    ));

-- Post tags RLS policies
CREATE POLICY "Post tags are viewable by everyone" ON post_tags
    FOR SELECT USING (true);

CREATE POLICY "Post owners can add tags" ON post_tags
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid()
    ));

-- Listings RLS policies
CREATE POLICY "Active listings are viewable by everyone" ON listings
    FOR SELECT USING (status IN ('active', 'reserved', 'sold') OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can create listings" ON listings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings" ON listings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings" ON listings
    FOR DELETE USING (auth.uid() = user_id);

-- Listing tags RLS policies
CREATE POLICY "Listing tags are viewable by everyone" ON listing_tags
    FOR SELECT USING (true);

CREATE POLICY "Listing owners can add tags" ON listing_tags
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM listings WHERE id = listing_id AND user_id = auth.uid()
    ));

-- Reviews RLS policies
CREATE POLICY "Active reviews are viewable by everyone" ON reviews
    FOR SELECT USING (status = 'active' OR auth.uid() = reviewer_id);

CREATE POLICY "Authenticated users can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update their own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = reviewer_id);

-- Follows RLS policies
CREATE POLICY "Follows are viewable by everyone" ON follows
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can follow" ON follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Conversations RLS policies
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = id AND user_id = auth.uid()
    ));

-- Conversation participants RLS policies
CREATE POLICY "Users can view conversation participants" ON conversation_participants
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM conversation_participants AS cp 
        WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
    ));

CREATE POLICY "Users can join conversations" ON conversation_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Messages RLS policies
CREATE POLICY "Users can view conversation messages" ON messages
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    ));

CREATE POLICY "Conversation participants can send messages" ON messages
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Notifications RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Notification settings RLS policies
CREATE POLICY "Users can view their notification settings" ON notification_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their notification settings" ON notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their notification settings" ON notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- User likes RLS policies
CREATE POLICY "User likes are viewable by everyone" ON user_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like profiles" ON user_likes
    FOR INSERT WITH CHECK (auth.uid() = liker_id);

CREATE POLICY "Users can unlike profiles" ON user_likes
    FOR DELETE USING (auth.uid() = liker_id);

-- User views RLS policies
CREATE POLICY "Users can view their own profile views" ON user_views
    FOR SELECT USING (auth.uid() = viewed_id);

CREATE POLICY "Authenticated users can record profile views" ON user_views
    FOR INSERT WITH CHECK (auth.uid() = viewer_id OR viewer_id IS NULL);

-- User search keywords RLS policies
CREATE POLICY "Users can view their own search history" ON user_search_keywords
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Authenticated users can save search keywords" ON user_search_keywords
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Listing views RLS policies
CREATE POLICY "Listing views are system-only" ON listing_views
    FOR SELECT USING (false);

CREATE POLICY "System can record listing views" ON listing_views
    FOR INSERT WITH CHECK (true);

-- Moderation queue RLS policies
CREATE POLICY "Users can view their own moderation items" ON moderation_queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create moderation items" ON moderation_queue
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update moderation items" ON moderation_queue
    FOR UPDATE USING (true);

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Insert default tags
INSERT INTO tags (name, slug, description, category, color, is_featured) VALUES
    ('Technology', 'technology', 'Tech news, gadgets, and innovations', 'general', '#3B82F6', true),
    ('Lifestyle', 'lifestyle', 'Daily life, wellness, and personal growth', 'general', '#10B981', true),
    ('Fashion', 'fashion', 'Clothing, accessories, and style trends', 'general', '#EC4899', true),
    ('Food', 'food', 'Recipes, restaurants, and culinary experiences', 'general', '#F59E0B', true),
    ('Travel', 'travel', 'Destinations, tips, and travel stories', 'general', '#8B5CF6', true),
    ('Sports', 'sports', 'Athletics, fitness, and outdoor activities', 'general', '#EF4444', true),
    ('Music', 'music', 'Artists, albums, and music discussions', 'general', '#6366F1', true),
    ('Art', 'art', 'Visual arts, design, and creative works', 'general', '#14B8A6', true),
    ('Business', 'business', 'Entrepreneurship, marketing, and finance', 'general', '#64748B', true),
    ('Education', 'education', 'Learning, courses, and academic topics', 'general', '#84CC16', true),
    ('Electronics', 'electronics', 'Phones, laptops, and electronic devices', 'listing', '#3B82F6', true),
    ('Furniture', 'furniture', 'Home and office furniture', 'listing', '#8B5CF6', true),
    ('Vehicles', 'vehicles', 'Cars, motorcycles, and transportation', 'listing', '#EF4444', true),
    ('Real Estate', 'real-estate', 'Housing, apartments, and property', 'listing', '#10B981', true),
    ('Services', 'services', 'Professional and personal services', 'listing', '#F59E0B', true)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- REALTIME SUBSCRIPTIONS
-- =============================================================================

-- Enable realtime for key tables
BEGIN;
    DROP PUBLICATION IF EXISTS supabase_realtime;
    CREATE PUBLICATION supabase_realtime;

    ALTER PUBLICATION supabase_realtime ADD TABLE posts;
    ALTER PUBLICATION supabase_realtime ADD TABLE comments;
    ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE listings;
    ALTER PUBLICATION supabase_realtime ADD TABLE follows;
COMMIT;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE profiles IS 'Extended user profiles linked to Supabase auth.users';
COMMENT ON TABLE posts IS 'Social media posts with content, media, and engagement metrics';
COMMENT ON TABLE listings IS 'Marketplace listings for buying, selling, and trading';
COMMENT ON TABLE conversations IS 'Chat conversations between users';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE notifications IS 'User notification system for platform activities';
COMMENT ON COLUMN posts.is_flagged IS 'AI moderation flag for inappropriate content';
COMMENT ON COLUMN listings.is_flagged IS 'AI moderation flag for inappropriate listings';
COMMENT ON COLUMN profiles.is_email_valid IS 'Email validation status via AI verification';
COMMENT ON COLUMN profiles.is_phone_valid IS 'Phone validation status via AI verification';
COMMENT ON TABLE moderation_queue IS 'Queue for AI and human content moderation';
