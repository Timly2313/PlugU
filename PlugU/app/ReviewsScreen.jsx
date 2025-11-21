import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet
} from 'react-native';
import { ArrowLeft, Star, Heart, MessageCircle, Share2, Edit3 } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper from '../components/ScreenWrapper';
import { router } from 'expo-router';

const mockReviews = [
  {
    id: '1',
    author: { name: 'Imam Farrhouk', avatar: 'IF' },
    rating: 5,
    text: 'The dress is great! Very classy and comfortable. It fit perfectly. I\'m 5\'7" and 130 pounds. I am a 34B chest. This dress would be too long for those who are shorter but could be hemmed. I haven\'t recommend it for those big chested as I am smaller chested and it fit me perfectly.',
    timestamp: '2 weeks ago',
    likes: 27,
    comments: 10,
    shares: 2,
    photos: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop'],
  },
  {
    id: '2',
    author: { name: 'Sarah Johnson', avatar: 'SJ' },
    rating: 4,
    text: 'Great seller! Very responsive and item was exactly as described. Would definitely buy from again.',
    timestamp: '1 month ago',
    likes: 15,
    comments: 5,
    shares: 1,
  },
  {
    id: '3',
    author: { name: 'Mike Chen', avatar: 'MC' },
    rating: 5,
    text: 'Excellent transaction. Fast shipping and item in perfect condition. Highly recommended!',
    timestamp: '1 month ago',
    likes: 12,
    comments: 3,
    shares: 0,
  },
  {
    id: '4',
    author: { name: 'Emma Davis', avatar: 'ED' },
    rating: 5,
    text: 'Amazing quality! Better than expected. The seller was very helpful and answered all my questions.',
    timestamp: '2 months ago',
    likes: 20,
    comments: 8,
    shares: 3,
    photos: ['https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400&h=300&fit=crop'],
  },
  {
    id: '5',
    author: { name: 'Alex Rodriguez', avatar: 'AR' },
    rating: 4,
    text: 'Good experience overall. Item was as described. Delivery took a bit longer than expected but worth the wait.',
    timestamp: '2 months ago',
    likes: 8,
    comments: 2,
    shares: 0,
  },
  {
    id: '6',
    author: { name: 'Olivia Brown', avatar: 'OB' },
    rating: 5,
    text: 'Perfect! Exactly what I was looking for. Great communication from the seller.',
    timestamp: '3 months ago',
    likes: 18,
    comments: 6,
    shares: 2,
  },
];

const ratingDistribution = [
  { stars: 5, count: 23 },
  { stars: 4, count: 4 },
  { stars: 3, count: 6 },
  { stars: 2, count: 2 },
  { stars: 1, count: 0 },
];

export default function ReviewsScreen() {
  const [showWithPhoto, setShowWithPhoto] = useState(false);
  
  const totalReviews = ratingDistribution.reduce((sum, item) => sum + item.count, 0);
  const averageRating = (
    ratingDistribution.reduce((sum, item) => sum + item.stars * item.count, 0) / totalReviews
  ).toFixed(1);
  
  const maxCount = Math.max(...ratingDistribution.map(item => item.count));
  
  const filteredReviews = showWithPhoto 
    ? mockReviews.filter(review => review.photos && review.photos.length > 0)
    : mockReviews;


  const onBack = () => {
    router.back();
  };

  const onWriteReview = () => {
    router.push('/WriteReviewScreen');
  };

  const renderStars = (rating, size = wp(4)) => {
    return (
      <View style={styles.starsContainer}>
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={size}
            color={i < rating ? '#F59E0B' : '#D1D5DB'}
            fill={i < rating ? '#F59E0B' : 'none'}
          />
        ))}
      </View>
    );
  };

  const renderRatingBar = (item) => {
    const widthPercentage = (item.count / maxCount) * 100;
    
    return (
      <View key={item.stars} style={styles.ratingBarContainer}>
        <View style={styles.starsContainer}>
          {renderStars(item.stars, wp(3))}
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${widthPercentage}%` }
            ]} 
          />
        </View>
        
        <Text style={styles.ratingCount}>{item.count}</Text>
      </View>
    );
  };

  const renderReview = (review) => (
    <View key={review.id} style={styles.reviewCard}>
      {/* Review Header */}
      <View style={styles.reviewHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{review.author.avatar}</Text>
        </View>
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>{review.author.name}</Text>
          {renderStars(review.rating)}
        </View>
        <Text style={styles.timestamp}>{review.timestamp}</Text>
      </View>

      {/* Review Text */}
      <Text style={styles.reviewText}>{review.text}</Text>

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.photosContainer}
          contentContainerStyle={styles.photosContent}
        >
          {review.photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photo} />
            </View>
          ))}
        </ScrollView>
      )}

      {/* Interaction Stats */}
      <View style={styles.interactionStats}>
        <View style={styles.statItem}>
          <Heart size={wp(4)} color="#6B7280" />
          <Text style={styles.statText}>{review.likes} likes</Text>
        </View>
        <View style={styles.statItem}>
          <MessageCircle size={wp(4)} color="#6B7280" />
          <Text style={styles.statText}>{review.comments} comments</Text>
        </View>
        <View style={styles.statItem}>
          <Share2 size={wp(4)} color="#6B7280" />
          <Text style={styles.statText}>{review.shares} shared</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenWrapper bg="#F9FAFB">
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={wp(5)} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reviews</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Rating Summary */}
            <View style={styles.ratingSummary}>
              <View style={styles.ratingOverview}>
                {/* Average Rating */}
                <View style={styles.averageRating}>
                  <Text style={styles.averageRatingNumber}>{averageRating}</Text>
                  <Text style={styles.totalRatings}>{totalReviews} ratings</Text>
                </View>

                {/* Rating Bars */}
                <View style={styles.ratingBars}>
                  {ratingDistribution.map(renderRatingBar)}
                </View>
              </View>
            </View>

            {/* Filter */}
            <View style={styles.filterContainer}>
              <Text style={styles.reviewsCount}>{filteredReviews.length} reviews</Text>
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => setShowWithPhoto(!showWithPhoto)}
              >
                <View style={[
                  styles.checkbox,
                  showWithPhoto && styles.checkboxChecked
                ]}>
                  {showWithPhoto && <View style={styles.checkboxInner} />}
                </View>
                <Text style={styles.filterText}>With photo</Text>
              </TouchableOpacity>
            </View>

            {/* Reviews List */}
            <View style={styles.reviewsList}>
              {filteredReviews.map(renderReview)}
            </View>
          </View>
        </ScrollView>

        {/* Write Review Button */}
        <View style={styles.writeReviewButtonContainer}>
          <TouchableOpacity style={styles.writeReviewButton} onPress={onWriteReview}>
            <Edit3 size={wp(5)} color="white" />
            <Text style={styles.writeReviewText}>Write a review</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  backButton: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: wp(4),
    gap: hp(2),
    paddingBottom: hp(10),
  },
  ratingSummary: {
    backgroundColor: 'white',
    borderRadius: wp(4),
    padding: wp(4),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(6),
    marginBottom: hp(1),
  },
  averageRating: {
    alignItems: 'center',
  },
  averageRatingNumber: {
    fontSize: wp(6),
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: hp(0.5),
  },
  totalRatings: {
    fontSize: wp(3),
    color: '#6B7280',
  },
  ratingBars: {
    flex: 1,
    gap: hp(0.5),
  },
  ratingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  starsContainer: {
    flexDirection: 'row',
    gap: wp(0.5),
  },
  progressBar: {
    flex: 1,
    height: hp(0.8),
    backgroundColor: '#F3F4F6',
    borderRadius: wp(1),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3F51B5',
    borderRadius: wp(1),
  },
  ratingCount: {
    fontSize: wp(2.5),
    color: '#6B7280',
    width: wp(6),
    textAlign: 'right',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewsCount: {
    fontSize: wp(4),
    fontWeight: '600',
    color: '#111827',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  checkbox: {
    width: wp(4),
    height: wp(4),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: wp(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3F51B5',
    borderColor: '#3F51B5',
  },
  checkboxInner: {
    width: wp(2),
    height: wp(2),
    backgroundColor: 'white',
    borderRadius: wp(0.5),
  },
  filterText: {
    fontSize: wp(3),
    color: '#6B7280',
  },
  reviewsList: {
    gap: hp(1.5),
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: wp(4),
    padding: wp(4),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(3),
    marginBottom: hp(1.5),
  },
  avatar: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: '#3F51B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: wp(3),
    fontWeight: '600',
  },
  reviewerInfo: {
    flex: 1,
    minWidth: 0,
  },
  reviewerName: {
    fontSize: wp(4),
    fontWeight: '600',
    color: '#111827',
    marginBottom: hp(0.5),
  },
  timestamp: {
    fontSize: wp(2.5),
    color: '#6B7280',
  },
  reviewText: {
    fontSize: wp(3.5),
    color: '#374151',
    lineHeight: hp(2.2),
    marginBottom: hp(1.5),
  },
  photosContainer: {
    marginBottom: hp(1.5),
  },
  photosContent: {
    gap: wp(2),
  },
  photoContainer: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(2),
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  interactionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  statText: {
    fontSize: wp(3),
    color: '#6B7280',
  },
  writeReviewButtonContainer: {
    position: 'absolute',
    bottom: hp(2),
    right: wp(4),
  },
  writeReviewButton: {
    backgroundColor: '#3F51B5',
    borderRadius: wp(50),
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  writeReviewText: {
    color: 'white',
    fontSize: wp(3.5),
    fontWeight: '600',
  },
});