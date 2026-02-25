-- PlugU Social Content Platform - Feed Materialized Views
-- Migration: 002_feed_views.sql
-- Description: High-performance materialized views for feeds
-- Purpose: Optimize feed queries for 100K+ users and millions of listings

-- =============================================================================
-- POSTS FEED MATERIALIZED VIEW
-- =============================================================================

-- Drop existing view if exists
DROP MATERIALIZED VIEW IF EXISTS feed_posts_view;

-- Create optimized posts feed view
CREATE MATERIALIZED VIEW feed_posts_view AS
SELECT 
    p.id,
    p.user_id,
    p.content,
    p.media_urls,
    p.media_metadata,
    p.location,
    p.coordinates,
    p.view_count,
    p.like_count,
    p.comment_count,
    p.share_count,
    p.is_flagged,
    p.status,
    p.is_pinned,
    p.metadata,
    p.created_at,
    p.updated_at,
    -- Profile data (denormalized for performance)
    prof.username,
    prof.display_name,
    prof.avatar_url,
    prof.is_verified,
    -- Engagement score for ranking (algorithm can be tuned)
    (
        (p.like_count * 1.0) + 
        (p.comment_count * 2.0) + 
        (p.share_count * 3.0) + 
        (p.view_count * 0.1)
    ) / 
    GREATEST(EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600, 1) AS engagement_score,
    -- Time decay factor (posts decay over time)
    EXP(-EXTRACT(EPOCH FROM (now() - p.created_at)) / (7 * 24 * 3600)) AS time_decay,
    -- Combined ranking score
    (
        (p.like_count * 1.0) + 
        (p.comment_count * 2.0) + 
        (p.share_count * 3.0) + 
        (p.view_count * 0.1)
    ) / 
    GREATEST(EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600, 1) * 
    EXP(-EXTRACT(EPOCH FROM (now() - p.created_at)) / (7 * 24 * 3600)) AS ranking_score
FROM posts p
JOIN profiles prof ON p.user_id = prof.id
WHERE p.status = 'active' 
    AND p.is_flagged = false
    AND p.created_at > now() - INTERVAL '90 days';

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_feed_posts_view_id ON feed_posts_view(id);
CREATE INDEX idx_feed_posts_view_created_at ON feed_posts_view(created_at DESC);
CREATE INDEX idx_feed_posts_view_user_id ON feed_posts_view(user_id);
CREATE INDEX idx_feed_posts_view_engagement_score ON feed_posts_view(engagement_score DESC);
CREATE INDEX idx_feed_posts_view_ranking_score ON feed_posts_view(ranking_score DESC);
CREATE INDEX idx_feed_posts_view_is_pinned ON feed_posts_view(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_feed_posts_view_coordinates ON feed_posts_view USING GIST(coordinates) WHERE coordinates IS NOT NULL;

-- =============================================================================
-- LISTINGS FEED MATERIALIZED VIEW
-- =============================================================================

-- Drop existing view if exists
DROP MATERIALIZED VIEW IF EXISTS feed_listings_view;

-- Create optimized listings feed view
CREATE MATERIALIZED VIEW feed_listings_view AS
SELECT 
    l.id,
    l.user_id,
    l.title,
    l.description,
    l.price,
    l.currency,
    l.price_type,
    l.category,
    l.subcategory,
    l.condition,
    l.images,
    l.image_metadata,
    l.location,
    l.coordinates,
    l.is_negotiable,
    l.is_shipping_available,
    l.is_pickup_available,
    l.view_count,
    l.like_count,
    l.inquiry_count,
    l.status,
    l.is_flagged,
    l.expires_at,
    l.metadata,
    l.created_at,
    l.updated_at,
    -- Profile data (denormalized for performance)
    prof.username,
    prof.display_name,
    prof.avatar_url,
    prof.is_verified,
    prof.reputation_score,
    -- Listing score for ranking
    (
        (l.view_count * 0.5) + 
        (l.like_count * 2.0) + 
        (l.inquiry_count * 5.0) +
        (prof.reputation_score * 0.1)
    ) AS listing_score,
    -- Freshness score (newer listings get boost)
    EXP(-EXTRACT(EPOCH FROM (now() - l.created_at)) / (14 * 24 * 3600)) AS freshness_score,
    -- Combined ranking score
    (
        (l.view_count * 0.5) + 
        (l.like_count * 2.0) + 
        (l.inquiry_count * 5.0) +
        (prof.reputation_score * 0.1)
    ) * EXP(-EXTRACT(EPOCH FROM (now() - l.created_at)) / (14 * 24 * 3600)) AS ranking_score,
    -- Price category for filtering
    CASE 
        WHEN l.price IS NULL THEN 'contact'
        WHEN l.price = 0 THEN 'free'
        WHEN l.price < 50 THEN 'under_50'
        WHEN l.price < 100 THEN 'under_100'
        WHEN l.price < 500 THEN 'under_500'
        WHEN l.price < 1000 THEN 'under_1000'
        ELSE 'over_1000'
    END AS price_category
FROM listings l
JOIN profiles prof ON l.user_id = prof.id
WHERE l.status = 'active' 
    AND l.is_flagged = false
    AND (l.expires_at IS NULL OR l.expires_at > now())
    AND l.created_at > now() - INTERVAL '180 days';

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_feed_listings_view_id ON feed_listings_view(id);
CREATE INDEX idx_feed_listings_view_created_at ON feed_listings_view(created_at DESC);
CREATE INDEX idx_feed_listings_view_user_id ON feed_listings_view(user_id);
CREATE INDEX idx_feed_listings_view_category ON feed_listings_view(category);
CREATE INDEX idx_feed_listings_view_price ON feed_listings_view(price);
CREATE INDEX idx_feed_listings_view_price_category ON feed_listings_view(price_category);
CREATE INDEX idx_feed_listings_view_ranking_score ON feed_listings_view(ranking_score DESC);
CREATE INDEX idx_feed_listings_view_listing_score ON feed_listings_view(listing_score DESC);
CREATE INDEX idx_feed_listings_view_coordinates ON feed_listings_view USING GIST(coordinates) WHERE coordinates IS NOT NULL;
CREATE INDEX idx_feed_listings_view_title_trgm ON feed_listings_view USING GIN(title gin_trgm_ops);

-- =============================================================================
-- USER FEED PERSONALIZATION VIEW
-- =============================================================================

-- Drop existing view if exists
DROP MATERIALIZED VIEW IF EXISTS user_feed_preferences_view;

-- Create user feed preferences view (for personalized feeds)
CREATE MATERIALIZED VIEW user_feed_preferences_view AS
WITH user_interactions AS (
    -- User's liked posts tags
    SELECT 
        pl.user_id,
        pt.tag_id,
        COUNT(*) as interaction_count,
        'like' as interaction_type
    FROM post_likes pl
    JOIN post_tags pt ON pl.post_id = pt.post_id
    GROUP BY pl.user_id, pt.tag_id
    
    UNION ALL
    
    -- User's commented posts tags
    SELECT 
        c.user_id,
        pt.tag_id,
        COUNT(*) * 2 as interaction_count, -- Comments weighted higher
        'comment' as interaction_type
    FROM comments c
    JOIN post_tags pt ON c.post_id = pt.post_id
    WHERE c.status = 'active'
    GROUP BY c.user_id, pt.tag_id
    
    UNION ALL
    
    -- User's own posts tags
    SELECT 
        p.user_id,
        pt.tag_id,
        COUNT(*) * 3 as interaction_count, -- Own content weighted highest
        'create' as interaction_type
    FROM posts p
    JOIN post_tags pt ON p.id = pt.post_id
    WHERE p.status = 'active'
    GROUP BY p.user_id, pt.tag_id
),
tag_scores AS (
    SELECT 
        user_id,
        tag_id,
        SUM(interaction_count) as total_score
    FROM user_interactions
    GROUP BY user_id, tag_id
)
SELECT 
    ts.user_id,
    ts.tag_id,
    t.name as tag_name,
    t.slug as tag_slug,
    ts.total_score as preference_score,
    ROW_NUMBER() OVER (PARTITION BY ts.user_id ORDER BY ts.total_score DESC) as rank,
    now() as calculated_at
FROM tag_scores ts
JOIN tags t ON ts.tag_id = t.id
WHERE ts.total_score > 0;

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_user_feed_preferences_view_user_tag ON user_feed_preferences_view(user_id, tag_id);
CREATE INDEX idx_user_feed_preferences_view_user_id ON user_feed_preferences_view(user_id);
CREATE INDEX idx_user_feed_preferences_view_score ON user_feed_preferences_view(preference_score DESC);

-- =============================================================================
-- TRENDING CONTENT VIEW
-- =============================================================================

-- Drop existing view if exists
DROP MATERIALIZED VIEW IF EXISTS trending_content_view;

-- Create trending content view
CREATE MATERIALIZED VIEW trending_content_view AS
WITH trending_posts AS (
    SELECT 
        'post' as content_type,
        p.id as content_id,
        p.user_id,
        p.content as title,
        p.like_count,
        p.comment_count,
        p.view_count,
        p.created_at,
        -- Trending score (velocity of engagement)
        (
            (p.like_count + p.comment_count * 2) / 
            GREATEST(EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600, 0.5)
        ) as trending_score,
        prof.username,
        prof.display_name,
        prof.avatar_url
    FROM posts p
    JOIN profiles prof ON p.user_id = prof.id
    WHERE p.status = 'active' 
        AND p.is_flagged = false
        AND p.created_at > now() - INTERVAL '48 hours'
),
trending_listings AS (
    SELECT 
        'listing' as content_type,
        l.id as content_id,
        l.user_id,
        l.title,
        l.like_count,
        l.inquiry_count as comment_count,
        l.view_count,
        l.created_at,
        -- Trending score
        (
            (l.like_count + l.inquiry_count * 3) / 
            GREATEST(EXTRACT(EPOCH FROM (now() - l.created_at)) / 3600, 0.5)
        ) as trending_score,
        prof.username,
        prof.display_name,
        prof.avatar_url
    FROM listings l
    JOIN profiles prof ON l.user_id = prof.id
    WHERE l.status = 'active' 
        AND l.is_flagged = false
        AND l.created_at > now() - INTERVAL '48 hours'
)
SELECT * FROM trending_posts
UNION ALL
SELECT * FROM trending_listings
ORDER BY trending_score DESC;

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_trending_content_view_type_id ON trending_content_view(content_type, content_id);
CREATE INDEX idx_trending_content_view_trending_score ON trending_content_view(trending_score DESC);
CREATE INDEX idx_trending_content_view_created_at ON trending_content_view(created_at DESC);

-- =============================================================================
-- REFRESH FUNCTIONS
-- =============================================================================

-- Function to refresh all feed views
CREATE OR REPLACE FUNCTION refresh_all_feed_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY feed_posts_view;
    REFRESH MATERIALIZED VIEW CONCURRENTLY feed_listings_view;
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_feed_preferences_view;
    REFRESH MATERIALIZED VIEW CONCURRENTLY trending_content_view;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh posts feed view
CREATE OR REPLACE FUNCTION refresh_posts_feed_view()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY feed_posts_view;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh listings feed view
CREATE OR REPLACE FUNCTION refresh_listings_feed_view()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY feed_listings_view;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh user preferences view
CREATE OR REPLACE FUNCTION refresh_user_preferences_view()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_feed_preferences_view;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh trending content view
CREATE OR REPLACE FUNCTION refresh_trending_content_view()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY trending_content_view;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- AUTO-REFRESH TRIGGERS
-- =============================================================================

-- Trigger function to schedule refresh (using pg_cron if available)
CREATE OR REPLACE FUNCTION schedule_feed_refresh()
RETURNS TRIGGER AS $$
BEGIN
    -- Note: Actual scheduling should be done via external cron job or pg_cron
    -- This trigger just logs that a refresh is needed
    PERFORM pg_notify('feed_refresh_needed', json_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', now()
    )::text);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers to notify when refresh is needed
CREATE TRIGGER trigger_notify_posts_refresh
    AFTER INSERT OR UPDATE OR DELETE ON posts
    FOR EACH STATEMENT EXECUTE FUNCTION schedule_feed_refresh();

CREATE TRIGGER trigger_notify_listings_refresh
    AFTER INSERT OR UPDATE OR DELETE ON listings
    FOR EACH STATEMENT EXECUTE FUNCTION schedule_feed_refresh();

CREATE TRIGGER trigger_notify_likes_refresh
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH STATEMENT EXECUTE FUNCTION schedule_feed_refresh();

CREATE TRIGGER trigger_notify_comments_refresh
    AFTER INSERT OR DELETE ON comments
    FOR EACH STATEMENT EXECUTE FUNCTION schedule_feed_refresh();

-- =============================================================================
-- FEED QUERY FUNCTIONS
-- =============================================================================

-- Function to get personalized feed for a user
CREATE OR REPLACE FUNCTION get_personalized_feed(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    content TEXT,
    media_urls JSONB,
    username VARCHAR,
    display_name VARCHAR,
    avatar_url TEXT,
    is_verified BOOLEAN,
    like_count INTEGER,
    comment_count INTEGER,
    created_at TIMESTAMPTZ,
    ranking_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH user_tags AS (
        SELECT tag_id, preference_score
        FROM user_feed_preferences_view
        WHERE user_id = p_user_id
        LIMIT 20
    )
    SELECT 
        fpv.id,
        fpv.user_id,
        fpv.content,
        fpv.media_urls,
        fpv.username,
        fpv.display_name,
        fpv.avatar_url,
        fpv.is_verified,
        fpv.like_count,
        fpv.comment_count,
        fpv.created_at,
        fpv.ranking_score * COALESCE(ut.preference_score, 1) as adjusted_score
    FROM feed_posts_view fpv
    LEFT JOIN post_tags pt ON fpv.id = pt.post_id
    LEFT JOIN user_tags ut ON pt.tag_id = ut.tag_id
    WHERE fpv.user_id != p_user_id -- Don't show user's own posts
    GROUP BY fpv.id, fpv.user_id, fpv.content, fpv.media_urls, 
             fpv.username, fpv.display_name, fpv.avatar_url, 
             fpv.is_verified, fpv.like_count, fpv.comment_count, 
             fpv.created_at, fpv.ranking_score, ut.preference_score
    ORDER BY adjusted_score DESC, fpv.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending feed
CREATE OR REPLACE FUNCTION get_trending_feed(
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    content_type TEXT,
    content_id UUID,
    user_id UUID,
    title TEXT,
    like_count INTEGER,
    comment_count INTEGER,
    view_count INTEGER,
    created_at TIMESTAMPTZ,
    trending_score DECIMAL,
    username VARCHAR,
    display_name VARCHAR,
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM trending_content_view
    ORDER BY trending_score DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get nearby listings
CREATE OR REPLACE FUNCTION get_nearby_listings(
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_radius_km DECIMAL DEFAULT 10,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title VARCHAR,
    description TEXT,
    price DECIMAL,
    currency VARCHAR,
    images JSONB,
    location VARCHAR,
    username VARCHAR,
    display_name VARCHAR,
    avatar_url TEXT,
    distance_km DECIMAL,
    ranking_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        flv.id,
        flv.user_id,
        flv.title,
        flv.description,
        flv.price,
        flv.currency,
        flv.images,
        flv.location,
        flv.username,
        flv.display_name,
        flv.avatar_url,
        -- Calculate distance using Haversine formula
        (6371 * acos(
            cos(radians(p_latitude)) * 
            cos(radians(ST_Y(flv.coordinates::geometry))) * 
            cos(radians(ST_X(flv.coordinates::geometry)) - radians(p_longitude)) + 
            sin(radians(p_latitude)) * 
            sin(radians(ST_Y(flv.coordinates::geometry)))
        ))::DECIMAL(10,2) as distance_km,
        flv.ranking_score
    FROM feed_listings_view flv
    WHERE flv.coordinates IS NOT NULL
        AND (6371 * acos(
            cos(radians(p_latitude)) * 
            cos(radians(ST_Y(flv.coordinates::geometry))) * 
            cos(radians(ST_X(flv.coordinates::geometry)) - radians(p_longitude)) + 
            sin(radians(p_latitude)) * 
            sin(radians(ST_Y(flv.coordinates::geometry)))
        )) <= p_radius_km
    ORDER BY distance_km ASC, flv.ranking_score DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON MATERIALIZED VIEW feed_posts_view IS 'Optimized view for posts feed with pre-calculated engagement scores';
COMMENT ON MATERIALIZED VIEW feed_listings_view IS 'Optimized view for listings feed with pre-calculated ranking scores';
COMMENT ON MATERIALIZED VIEW user_feed_preferences_view IS 'User content preferences based on interaction history';
COMMENT ON MATERIALIZED VIEW trending_content_view IS 'Trending posts and listings based on engagement velocity';
