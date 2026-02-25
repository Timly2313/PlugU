-- PlugU Social Content Platform - Core Database Schema
-- Migration: 001_core.sql
-- Description: Core tables, constraints, indexes, and RLS policies
-- Supports: 100K+ users (phase 1), millions of listings (long-term)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

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
    is_pinned BOOLEAN DEFAULT false,
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
    currency VARCHAR(3) DEFAULT 'USD',
    price_type VARCHAR(20) DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'negotiable', 'free', 'swap')),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    condition VARCHAR(50),
    images JSONB DEFAULT '[]',
    image_metadata JSONB DEFAULT '{}',
    location VARCHAR(255),
    coordinates POINT,
    is_negotiable BOOLEAN DEFAULT false,
    is_shipping_available BOOLEAN DEFAULT false,
    is_pickup_available BOOLEAN DEFAULT true,
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
    is_muted BOOLEAN DEFAULT false,
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
    is_edited BOOLEAN DEFAULT false,
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

-- User likes table (who liked whom)
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

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified) WHERE is_verified = true;

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

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_user_likes_liked_id ON user_likes(liked_id);
CREATE INDEX IF NOT EXISTS idx_user_views_viewed_id ON user_views(viewed_id);
CREATE INDEX IF NOT EXISTS idx_user_search_keywords_user_id ON user_search_keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_keywords_keyword ON user_search_keywords(keyword);

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

-- Tags RLS policies
CREATE POLICY "Tags are viewable by everyone" ON tags
    FOR SELECT USING (true);

CREATE POLICY "Only admins can create tags" ON tags
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
    -- Drop existing publications if they exist
    DROP PUBLICATION IF EXISTS supabase_realtime;
    
    -- Create new publication
    CREATE PUBLICATION supabase_realtime;
    
    -- Add tables to publication
    ALTER PUBLICATION supabase_realtime ADD TABLE posts;
    ALTER PUBLICATION supabase_realtime ADD TABLE comments;
    ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE listings;
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
