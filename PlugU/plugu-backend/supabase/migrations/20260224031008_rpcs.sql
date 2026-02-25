-- PlugU Social Content Platform - RPC Functions
-- Migration: 003_rpcs.sql
-- Description: Stored procedures and RPC functions for common operations
-- Purpose: Secure, performant database operations via RPC

-- =============================================================================
-- POST OPERATIONS
-- =============================================================================

-- Create a new post with validation
CREATE OR REPLACE FUNCTION create_post(
    p_user_id UUID,
    p_content TEXT,
    p_media_urls JSONB DEFAULT '[]',
    p_media_metadata JSONB DEFAULT '{}',
    p_location VARCHAR DEFAULT NULL,
    p_coordinates POINT DEFAULT NULL,
    p_tag_ids UUID[] DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
    v_post_id UUID;
    v_tag_id UUID;
    v_result JSONB;
BEGIN
    -- Validate content
    IF LENGTH(TRIM(p_content)) < 1 THEN
        RAISE EXCEPTION 'Post content cannot be empty';
    END IF;
    
    IF LENGTH(p_content) > 5000 THEN
        RAISE EXCEPTION 'Post content exceeds maximum length of 5000 characters';
    END IF;
    
    -- Insert post
    INSERT INTO posts (
        user_id,
        content,
        media_urls,
        media_metadata,
        location,
        coordinates
    ) VALUES (
        p_user_id,
        p_content,
        p_media_urls,
        p_media_metadata,
        p_location,
        p_coordinates
    )
    RETURNING id INTO v_post_id;
    
    -- Add tags if provided
    IF array_length(p_tag_ids, 1) > 0 THEN
        FOREACH v_tag_id IN ARRAY p_tag_ids
        LOOP
            INSERT INTO post_tags (post_id, tag_id)
            VALUES (v_post_id, v_tag_id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
    
    -- Return created post
    SELECT jsonb_build_object(
        'id', p.id,
        'user_id', p.user_id,
        'content', p.content,
        'media_urls', p.media_urls,
        'location', p.location,
        'like_count', p.like_count,
        'comment_count', p.comment_count,
        'created_at', p.created_at,
        'username', prof.username,
        'display_name', prof.display_name,
        'avatar_url', prof.avatar_url
    ) INTO v_result
    FROM posts p
    JOIN profiles prof ON p.user_id = prof.id
    WHERE p.id = v_post_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Like a post
CREATE OR REPLACE FUNCTION like_post(
    p_user_id UUID,
    p_post_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Check if already liked
    IF EXISTS (
        SELECT 1 FROM post_likes 
        WHERE user_id = p_user_id AND post_id = p_post_id
    ) THEN
        -- Unlike (delete)
        DELETE FROM post_likes 
        WHERE user_id = p_user_id AND post_id = p_post_id;
        
        RETURN jsonb_build_object(
            'liked', false,
            'post_id', p_post_id
        );
    ELSE
        -- Like (insert)
        INSERT INTO post_likes (user_id, post_id)
        VALUES (p_user_id, p_post_id);
        
        -- Create notification for post owner
        INSERT INTO notifications (
            user_id,
            type,
            title,
            body,
            actor_id,
            target_type,
            target_id,
            data
        )
        SELECT 
            p.user_id,
            'post_like',
            'New Like',
            prof.display_name || ' liked your post',
            p_user_id,
            'post',
            p_post_id,
            jsonb_build_object('post_id', p_post_id)
        FROM posts p
        JOIN profiles prof ON prof.id = p_user_id
        WHERE p.id = p_post_id AND p.user_id != p_user_id;
        
        RETURN jsonb_build_object(
            'liked', true,
            'post_id', p_post_id
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to post
CREATE OR REPLACE FUNCTION comment_on_post(
    p_user_id UUID,
    p_post_id UUID,
    p_content TEXT,
    p_parent_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_comment_id UUID;
    v_result JSONB;
BEGIN
    -- Validate content
    IF LENGTH(TRIM(p_content)) < 1 THEN
        RAISE EXCEPTION 'Comment content cannot be empty';
    END IF;
    
    IF LENGTH(p_content) > 2000 THEN
        RAISE EXCEPTION 'Comment content exceeds maximum length of 2000 characters';
    END IF;
    
    -- Insert comment
    INSERT INTO comments (
        post_id,
        user_id,
        parent_id,
        content
    ) VALUES (
        p_post_id,
        p_user_id,
        p_parent_id,
        p_content
    )
    RETURNING id INTO v_comment_id;
    
    -- Create notification for post owner
    INSERT INTO notifications (
        user_id,
        type,
        title,
        body,
        actor_id,
        target_type,
        target_id,
        data
    )
    SELECT 
        p.user_id,
        CASE WHEN p_parent_id IS NULL THEN 'post_comment' ELSE 'comment_reply' END,
        CASE WHEN p_parent_id IS NULL THEN 'New Comment' ELSE 'New Reply' END,
        prof.display_name || CASE WHEN p_parent_id IS NULL THEN ' commented on your post' ELSE ' replied to your comment' END,
        p_user_id,
        'post',
        p_post_id,
        jsonb_build_object('post_id', p_post_id, 'comment_id', v_comment_id)
    FROM posts p
    JOIN profiles prof ON prof.id = p_user_id
    WHERE p.id = p_post_id AND p.user_id != p_user_id;
    
    -- Return created comment
    SELECT jsonb_build_object(
        'id', c.id,
        'post_id', c.post_id,
        'user_id', c.user_id,
        'parent_id', c.parent_id,
        'content', c.content,
        'like_count', c.like_count,
        'created_at', c.created_at,
        'username', prof.username,
        'display_name', prof.display_name,
        'avatar_url', prof.avatar_url
    ) INTO v_result
    FROM comments c
    JOIN profiles prof ON c.user_id = prof.id
    WHERE c.id = v_comment_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get post comments with nested replies
CREATE OR REPLACE FUNCTION get_post_comments(
    p_post_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', c.id,
            'user_id', c.user_id,
            'content', c.content,
            'like_count', c.like_count,
            'created_at', c.created_at,
            'username', prof.username,
            'display_name', prof.display_name,
            'avatar_url', prof.avatar_url,
            'replies', COALESCE(
                (SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', r.id,
                        'user_id', r.user_id,
                        'content', r.content,
                        'like_count', r.like_count,
                        'created_at', r.created_at,
                        'username', rprof.username,
                        'display_name', rprof.display_name,
                        'avatar_url', rprof.avatar_url
                    )
                )
                FROM comments r
                JOIN profiles rprof ON r.user_id = rprof.id
                WHERE r.parent_id = c.id AND r.status = 'active'
                ORDER BY r.created_at ASC
                LIMIT 5),
                '[]'::jsonb
            )
        )
        ORDER BY c.created_at DESC
    ) INTO v_result
    FROM comments c
    JOIN profiles prof ON c.user_id = prof.id
    WHERE c.post_id = p_post_id 
        AND c.parent_id IS NULL 
        AND c.status = 'active'
    LIMIT p_limit OFFSET p_offset;
    
    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- LISTING OPERATIONS
-- =============================================================================

-- Create a new listing
CREATE OR REPLACE FUNCTION create_listing(
    p_user_id UUID,
    p_title VARCHAR,
    p_description TEXT,
    p_price DECIMAL DEFAULT NULL,
    p_currency VARCHAR DEFAULT 'USD',
    p_price_type VARCHAR DEFAULT 'fixed',
    p_category VARCHAR DEFAULT NULL,
    p_subcategory VARCHAR DEFAULT NULL,
    p_condition VARCHAR DEFAULT NULL,
    p_images JSONB DEFAULT '[]',
    p_image_metadata JSONB DEFAULT '{}',
    p_location VARCHAR DEFAULT NULL,
    p_coordinates POINT DEFAULT NULL,
    p_is_negotiable BOOLEAN DEFAULT false,
    p_is_shipping_available BOOLEAN DEFAULT false,
    p_is_pickup_available BOOLEAN DEFAULT true,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_tag_ids UUID[] DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
    v_listing_id UUID;
    v_tag_id UUID;
    v_result JSONB;
BEGIN
    -- Validate title
    IF LENGTH(TRIM(p_title)) < 3 THEN
        RAISE EXCEPTION 'Listing title must be at least 3 characters';
    END IF;
    
    IF LENGTH(p_title) > 255 THEN
        RAISE EXCEPTION 'Listing title exceeds maximum length of 255 characters';
    END IF;
    
    -- Validate description
    IF LENGTH(TRIM(p_description)) < 10 THEN
        RAISE EXCEPTION 'Listing description must be at least 10 characters';
    END IF;
    
    -- Insert listing
    INSERT INTO listings (
        user_id,
        title,
        description,
        price,
        currency,
        price_type,
        category,
        subcategory,
        condition,
        images,
        image_metadata,
        location,
        coordinates,
        is_negotiable,
        is_shipping_available,
        is_pickup_available,
        expires_at
    ) VALUES (
        p_user_id,
        p_title,
        p_description,
        p_price,
        p_currency,
        p_price_type,
        p_category,
        p_subcategory,
        p_condition,
        p_images,
        p_image_metadata,
        p_location,
        p_coordinates,
        p_is_negotiable,
        p_is_shipping_available,
        p_is_pickup_available,
        COALESCE(p_expires_at, now() + INTERVAL '30 days')
    )
    RETURNING id INTO v_listing_id;
    
    -- Add tags if provided
    IF array_length(p_tag_ids, 1) > 0 THEN
        FOREACH v_tag_id IN ARRAY p_tag_ids
        LOOP
            INSERT INTO listing_tags (listing_id, tag_id)
            VALUES (v_listing_id, v_tag_id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
    
    -- Return created listing
    SELECT jsonb_build_object(
        'id', l.id,
        'user_id', l.user_id,
        'title', l.title,
        'description', l.description,
        'price', l.price,
        'currency', l.currency,
        'category', l.category,
        'images', l.images,
        'location', l.location,
        'status', l.status,
        'created_at', l.created_at,
        'username', prof.username,
        'display_name', prof.display_name,
        'avatar_url', prof.avatar_url
    ) INTO v_result
    FROM listings l
    JOIN profiles prof ON l.user_id = prof.id
    WHERE l.id = v_listing_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's listings
CREATE OR REPLACE FUNCTION get_user_listings(
    p_user_id UUID,
    p_status VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', l.id,
            'title', l.title,
            'description', l.description,
            'price', l.price,
            'currency', l.currency,
            'category', l.category,
            'images', l.images,
            'location', l.location,
            'view_count', l.view_count,
            'like_count', l.like_count,
            'inquiry_count', l.inquiry_count,
            'status', l.status,
            'created_at', l.created_at,
            'expires_at', l.expires_at
        )
        ORDER BY l.created_at DESC
    ) INTO v_result
    FROM listings l
    WHERE l.user_id = p_user_id
        AND (p_status IS NULL OR l.status = p_status)
    LIMIT p_limit OFFSET p_offset;
    
    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search listings
CREATE OR REPLACE FUNCTION search_listings(
    p_query VARCHAR DEFAULT NULL,
    p_category VARCHAR DEFAULT NULL,
    p_min_price DECIMAL DEFAULT NULL,
    p_max_price DECIMAL DEFAULT NULL,
    p_location VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', l.id,
            'title', l.title,
            'description', l.description,
            'price', l.price,
            'currency', l.currency,
            'category', l.category,
            'images', l.images,
            'location', l.location,
            'status', l.status,
            'created_at', l.created_at,
            'username', prof.username,
            'display_name', prof.display_name,
            'avatar_url', prof.avatar_url
        )
        ORDER BY l.created_at DESC
    ) INTO v_result
    FROM listings l
    JOIN profiles prof ON l.user_id = prof.id
    WHERE l.status = 'active'
        AND l.is_flagged = false
        AND (p_query IS NULL OR 
            l.title ILIKE '%' || p_query || '%' OR 
            l.description ILIKE '%' || p_query || '%')
        AND (p_category IS NULL OR l.category = p_category)
        AND (p_min_price IS NULL OR l.price >= p_min_price)
        AND (p_max_price IS NULL OR l.price <= p_max_price)
        AND (p_location IS NULL OR l.location ILIKE '%' || p_location || '%')
    LIMIT p_limit OFFSET p_offset;
    
    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- MESSAGING OPERATIONS
-- =============================================================================

-- Create or get conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_user_id UUID,
    p_other_user_id UUID,
    p_listing_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Check if conversation already exists between these users
    SELECT c.id INTO v_conversation_id
    FROM conversations c
    JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE cp1.user_id = p_user_id 
        AND cp2.user_id = p_other_user_id
        AND c.type = 'direct'
        AND (p_listing_id IS NULL OR c.listing_id = p_listing_id);
    
    -- If not found, create new conversation
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (type, listing_id)
        VALUES (
            CASE WHEN p_listing_id IS NOT NULL THEN 'listing' ELSE 'direct' END,
            p_listing_id
        )
        RETURNING id INTO v_conversation_id;
        
        -- Add participants
        INSERT INTO conversation_participants (conversation_id, user_id, role)
        VALUES 
            (v_conversation_id, p_user_id, 'admin'),
            (v_conversation_id, p_other_user_id, 'member');
    END IF;
    
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Send message
CREATE OR REPLACE FUNCTION send_message(
    p_sender_id UUID,
    p_conversation_id UUID,
    p_content TEXT,
    p_media_urls JSONB DEFAULT '[]',
    p_reply_to_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_message_id UUID;
    v_result JSONB;
    v_participant RECORD;
BEGIN
    -- Validate content
    IF LENGTH(TRIM(p_content)) < 1 AND jsonb_array_length(p_media_urls) = 0 THEN
        RAISE EXCEPTION 'Message must have content or media';
    END IF;
    
    IF LENGTH(p_content) > 4000 THEN
        RAISE EXCEPTION 'Message content exceeds maximum length of 4000 characters';
    END IF;
    
    -- Verify sender is participant
    IF NOT EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = p_conversation_id AND user_id = p_sender_id
    ) THEN
        RAISE EXCEPTION 'User is not a participant in this conversation';
    END IF;
    
    -- Insert message
    INSERT INTO messages (
        conversation_id,
        sender_id,
        content,
        media_urls,
        reply_to_id
    ) VALUES (
        p_conversation_id,
        p_sender_id,
        p_content,
        p_media_urls,
        p_reply_to_id
    )
    RETURNING id INTO v_message_id;
    
    -- Update unread counts for other participants
    UPDATE conversation_participants
    SET unread_count = unread_count + 1
    WHERE conversation_id = p_conversation_id 
        AND user_id != p_sender_id;
    
    -- Create notifications for other participants
    FOR v_participant IN 
        SELECT user_id 
        FROM conversation_participants 
        WHERE conversation_id = p_conversation_id AND user_id != p_sender_id
    LOOP
        INSERT INTO notifications (
            user_id,
            type,
            title,
            body,
            actor_id,
            target_type,
            target_id,
            data
        )
        SELECT 
            v_participant.user_id,
            'new_message',
            'New Message',
            prof.display_name || ' sent you a message',
            p_sender_id,
            'conversation',
            p_conversation_id,
            jsonb_build_object('conversation_id', p_conversation_id, 'message_id', v_message_id)
        FROM profiles prof
        WHERE prof.id = p_sender_id;
    END LOOP;
    
    -- Return created message
    SELECT jsonb_build_object(
        'id', m.id,
        'conversation_id', m.conversation_id,
        'sender_id', m.sender_id,
        'content', m.content,
        'media_urls', m.media_urls,
        'reply_to_id', m.reply_to_id,
        'status', m.status,
        'created_at', m.created_at,
        'username', prof.username,
        'display_name', prof.display_name,
        'avatar_url', prof.avatar_url
    ) INTO v_result
    FROM messages m
    JOIN profiles prof ON m.sender_id = prof.id
    WHERE m.id = v_message_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get conversation messages
CREATE OR REPLACE FUNCTION get_conversation_messages(
    p_conversation_id UUID,
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_before_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Verify user is participant
    IF NOT EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = p_conversation_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'User is not a participant in this conversation';
    END IF;
    
    -- Reset unread count
    UPDATE conversation_participants
    SET unread_count = 0,
        last_read_at = now()
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id;
    
    -- Get messages
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', m.id,
            'sender_id', m.sender_id,
            'content', m.content,
            'media_urls', m.media_urls,
            'reply_to_id', m.reply_to_id,
            'is_edited', m.is_edited,
            'status', m.status,
            'created_at', m.created_at,
            'username', prof.username,
            'display_name', prof.display_name,
            'avatar_url', prof.avatar_url
        )
        ORDER BY m.created_at DESC
    ) INTO v_result
    FROM messages m
    JOIN profiles prof ON m.sender_id = prof.id
    WHERE m.conversation_id = p_conversation_id
        AND (p_before_id IS NULL OR m.created_at < (
            SELECT created_at FROM messages WHERE id = p_before_id
        ))
    LIMIT p_limit;
    
    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- NOTIFICATION OPERATIONS
-- =============================================================================

-- Get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(
    p_user_id UUID,
    p_unread_only BOOLEAN DEFAULT false,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', n.id,
            'type', n.type,
            'title', n.title,
            'body', n.body,
            'data', n.data,
            'actor', CASE 
                WHEN n.actor_id IS NOT NULL THEN jsonb_build_object(
                    'id', actor.id,
                    'username', actor.username,
                    'display_name', actor.display_name,
                    'avatar_url', actor.avatar_url
                )
                ELSE NULL
            END,
            'is_read', n.is_read,
            'created_at', n.created_at
        )
        ORDER BY n.created_at DESC
    ) INTO v_result
    FROM notifications n
    LEFT JOIN profiles actor ON n.actor_id = actor.id
    WHERE n.user_id = p_user_id
        AND (NOT p_unread_only OR n.is_read = false)
    LIMIT p_limit OFFSET p_offset;
    
    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
    p_user_id UUID,
    p_notification_ids UUID[] DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    IF p_notification_ids IS NOT NULL AND array_length(p_notification_ids, 1) > 0 THEN
        UPDATE notifications
        SET is_read = true,
            read_at = now()
        WHERE user_id = p_user_id
            AND id = ANY(p_notification_ids)
            AND is_read = false;
    ELSE
        UPDATE notifications
        SET is_read = true,
            read_at = now()
        WHERE user_id = p_user_id
            AND is_read = false;
    END IF;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'marked_read', v_updated_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(
    p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM notifications
    WHERE user_id = p_user_id AND is_read = false;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- USER INTERACTION OPERATIONS
-- =============================================================================

-- Follow/unfollow user
CREATE OR REPLACE FUNCTION toggle_follow_user(
    p_follower_id UUID,
    p_followed_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_is_following BOOLEAN;
BEGIN
    -- Prevent self-follow
    IF p_follower_id = p_followed_id THEN
        RAISE EXCEPTION 'Cannot follow yourself';
    END IF;
    
    -- Check if already following
    IF EXISTS (
        SELECT 1 FROM user_likes
        WHERE liker_id = p_follower_id AND liked_id = p_followed_id
    ) THEN
        -- Unfollow
        DELETE FROM user_likes
        WHERE liker_id = p_follower_id AND liked_id = p_followed_id;
        
        UPDATE profiles SET follower_count = follower_count - 1
        WHERE id = p_followed_id;
        
        UPDATE profiles SET following_count = following_count - 1
        WHERE id = p_follower_id;
        
        v_is_following := false;
    ELSE
        -- Follow
        INSERT INTO user_likes (liker_id, liked_id)
        VALUES (p_follower_id, p_followed_id);
        
        UPDATE profiles SET follower_count = follower_count + 1
        WHERE id = p_followed_id;
        
        UPDATE profiles SET following_count = following_count + 1
        WHERE id = p_follower_id;
        
        -- Create notification
        INSERT INTO notifications (
            user_id,
            type,
            title,
            body,
            actor_id,
            target_type,
            data
        )
        SELECT 
            p_followed_id,
            'new_follower',
            'New Follower',
            prof.display_name || ' started following you',
            p_follower_id,
            'user',
            jsonb_build_object('follower_id', p_follower_id)
        FROM profiles prof
        WHERE prof.id = p_follower_id;
        
        v_is_following := true;
    END IF;
    
    RETURN jsonb_build_object(
        'following', v_is_following,
        'user_id', p_followed_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record profile view
CREATE OR REPLACE FUNCTION record_profile_view(
    p_viewer_id UUID,
    p_viewed_id UUID,
    p_source VARCHAR DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    -- Don't record self-views
    IF p_viewer_id = p_viewed_id THEN
        RETURN;
    END IF;
    
    INSERT INTO user_views (viewer_id, viewed_id, source)
    VALUES (p_viewer_id, p_viewed_id, p_source);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- MODERATION OPERATIONS
-- =============================================================================

-- Flag content
CREATE OR REPLACE FUNCTION flag_content(
    p_content_type VARCHAR,
    p_content_id UUID,
    p_reason VARCHAR,
    p_moderation_score DECIMAL DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    CASE p_content_type
        WHEN 'post' THEN
            UPDATE posts SET 
                is_flagged = true,
                flag_reason = p_reason,
                moderation_score = COALESCE(p_moderation_score, moderation_score),
                status = 'under_review'
            WHERE id = p_content_id;
        WHEN 'listing' THEN
            UPDATE listings SET 
                is_flagged = true,
                flag_reason = p_reason,
                moderation_score = COALESCE(p_moderation_score, moderation_score),
                status = 'under_review'
            WHERE id = p_content_id;
        WHEN 'comment' THEN
            UPDATE comments SET 
                is_flagged = true,
                moderation_score = COALESCE(p_moderation_score, moderation_score),
                status = 'hidden'
            WHERE id = p_content_id;
        WHEN 'message' THEN
            UPDATE messages SET 
                is_flagged = true,
                moderation_score = COALESCE(p_moderation_score, moderation_score)
            WHERE id = p_content_id;
        WHEN 'profile' THEN
            UPDATE profiles SET 
                is_email_valid = false
            WHERE id = p_content_id;
        ELSE
            RAISE EXCEPTION 'Invalid content type: %', p_content_type;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Approve flagged content
CREATE OR REPLACE FUNCTION approve_flagged_content(
    p_content_type VARCHAR,
    p_content_id UUID
)
RETURNS void AS $$
BEGIN
    CASE p_content_type
        WHEN 'post' THEN
            UPDATE posts SET 
                is_flagged = false,
                flag_reason = NULL,
                status = 'active'
            WHERE id = p_content_id;
        WHEN 'listing' THEN
            UPDATE listings SET 
                is_flagged = false,
                flag_reason = NULL,
                status = 'active'
            WHERE id = p_content_id;
        WHEN 'comment' THEN
            UPDATE comments SET 
                is_flagged = false,
                status = 'active'
            WHERE id = p_content_id;
        ELSE
            RAISE EXCEPTION 'Invalid content type: %', p_content_type;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ANALYTICS OPERATIONS
-- =============================================================================

-- Get user stats
CREATE OR REPLACE FUNCTION get_user_stats(
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'post_count', post_count,
        'listing_count', listing_count,
        'follower_count', follower_count,
        'following_count', following_count,
        'reputation_score', reputation_score,
        'profile_views', (
            SELECT COUNT(*) FROM user_views WHERE viewed_id = p_user_id
        ),
        'total_post_likes', (
            SELECT COALESCE(SUM(like_count), 0) FROM posts WHERE user_id = p_user_id
        ),
        'total_listing_views', (
            SELECT COALESCE(SUM(view_count), 0) FROM listings WHERE user_id = p_user_id
        )
    ) INTO v_result
    FROM profiles
    WHERE id = p_user_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record search keyword
CREATE OR REPLACE FUNCTION record_search_keyword(
    p_user_id UUID,
    p_keyword VARCHAR,
    p_filters JSONB DEFAULT '{}',
    p_result_count INTEGER DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO user_search_keywords (user_id, keyword, filters, result_count)
    VALUES (p_user_id, p_keyword, p_filters, p_result_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION create_post IS 'Creates a new post with optional tags';
COMMENT ON FUNCTION like_post IS 'Toggles like status on a post';
COMMENT ON FUNCTION comment_on_post IS 'Adds a comment to a post';
COMMENT ON FUNCTION create_listing IS 'Creates a new marketplace listing';
COMMENT ON FUNCTION send_message IS 'Sends a message in a conversation';
COMMENT ON FUNCTION get_user_notifications IS 'Retrieves user notifications';
COMMENT ON FUNCTION toggle_follow_user IS 'Follows or unfollows a user';
COMMENT ON FUNCTION flag_content IS 'Flags content for moderation review';
