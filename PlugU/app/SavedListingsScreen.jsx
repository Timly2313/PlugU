import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet
} from 'react-native';
import { ArrowLeft, Heart, MapPin, Clock, Trash2 } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper from '../components/ScreenWrapper';
import { router } from 'expo-router';

const mockSavedListings = [
  {
    id: '1',
    title: 'Modern Sofa Set',
    price: '$450',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
    location: 'Downtown',
    savedDate: '2 days ago',
    seller: 'Sarah Johnson',
    status: 'available', // available, sold, pending
  },
  {
    id: '2',
    title: 'Gaming Laptop',
    price: '$899',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=300&fit=crop',
    location: 'Tech District',
    savedDate: '5 days ago',
    seller: 'Mike Chen',
    status: 'sold',
  },
  {
    id: '3',
    title: 'Vintage Bike',
    price: '$250',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=300&fit=crop',
    location: 'West Side',
    savedDate: '1 week ago',
    seller: 'Alex Rodriguez',
    status: 'pending',
  },
  {
    id: '4',
    title: 'Designer Watch',
    price: '$650',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
    location: 'Shopping Mall',
    savedDate: '1 week ago',
    seller: 'Emma Davis',
    status: 'available',
  },
  {
    id: '5',
    title: 'Dining Table Set',
    price: '$380',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&h=300&fit=crop',
    location: 'Suburb Area',
    savedDate: '2 weeks ago',
    seller: 'John Smith',
    status: 'sold',
  },
];

export default function SavedListingsScreen() {
  const [savedListings, setSavedListings] = useState(mockSavedListings);

  // Navigation functions
  const onBack = () => {
    router.back();
  };

  const onViewListing = (listingId) => {
    router.push(`/listing/${listingId}`);
  };

  const handleRemove = (id) => {
    setSavedListings(savedListings.filter(listing => listing.id !== id));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sold':
        return '#EF4444'; // red
      case 'pending':
        return '#F59E0B'; // amber
      case 'available':
        return '#10B981'; // green
      default:
        return '#6B7280'; // gray
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'sold':
        return 'Sold';
      case 'pending':
        return 'Pending';
      case 'available':
        return 'Available';
      default:
        return 'Unknown';
    }
  };

  const renderListing = (listing) => (
    <View key={listing.id} style={styles.listingCard}>
      <View style={styles.listingContent}>
        {/* Image with Status Tag */}
        <View style={styles.imageContainer}>
          <TouchableOpacity 
            onPress={() => onViewListing(listing.id)}
            activeOpacity={0.7}
          >
            <Image source={{ uri: listing.image }} style={styles.image} />
            <View style={[styles.statusTag, { backgroundColor: getStatusColor(listing.status) }]}>
              <Text style={styles.statusText}>{getStatusText(listing.status)}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <TouchableOpacity 
          style={styles.textContent}
          onPress={() => onViewListing(listing.id)}
          activeOpacity={0.7}
        >
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
          </View>
          <Text style={[
            styles.price,
            listing.status === 'sold' && styles.soldPrice
          ]}>
            {listing.price}
          </Text>
          <View style={styles.locationRow}>
            <MapPin size={wp(3)} color="#6B7280" />
            <Text style={styles.location} numberOfLines={1}>{listing.location}</Text>
          </View>
          <View style={styles.dateRow}>
            <Clock size={wp(3)} color="#9CA3AF" />
            <Text style={styles.savedDate}>Saved {listing.savedDate}</Text>
          </View>
          <Text style={styles.seller}>Seller: {listing.seller}</Text>
        </TouchableOpacity>

        {/* Remove Button */}
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemove(listing.id)}
          activeOpacity={0.7}
        >
          <Trash2 size={wp(4)} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenWrapper bg="#F9FAFB">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <ArrowLeft size={wp(5)} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Saved Listings</Text>
          </View>
          <View style={styles.headerRight}>
            <Heart size={wp(4)} color="#3F51B5" fill="#3F51B5" />
            <Text style={styles.savedCount}>{savedListings.length}</Text>
          </View>
        </View>

        {savedListings.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Heart size={wp(10)} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No Saved Listings</Text>
            <Text style={styles.emptyDescription}>
              Start saving items you're interested in by tapping the heart icon on any listing.
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={onBack}
            >
              <Text style={styles.browseButtonText}>Browse Listings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.listingsContainer}>
              {savedListings.map(renderListing)}
            </View>
          </ScrollView>
        )}
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
    justifyContent: 'space-between',
  },
  headerLeft: {
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  savedCount: {
    fontSize: wp(3.5),
    color: '#374151',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  listingsContainer: {
    padding: wp(4),
    gap: hp(1.5),
    paddingBottom: hp(2),
  },
  listingCard: {
    backgroundColor: 'white',
    borderRadius: wp(4),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  listingContent: {
    flexDirection: 'row',
    padding: wp(3),
    gap: wp(3),
  },
  imageContainer: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(2),
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusTag: {
    position: 'absolute',
    top: wp(1),
    left: wp(1),
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: wp(1),
  },
  statusText: {
    color: 'white',
    fontSize: wp(2.2),
    fontWeight: '600',
  },
  textContent: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  title: {
    fontSize: wp(4),
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  price: {
    fontSize: wp(3.5),
    color: '#3F51B5',
    fontWeight: '600',
    marginBottom: hp(0.5),
  },
  soldPrice: {
    color: '#EF4444',
    textDecorationLine: 'line-through',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    marginBottom: hp(0.25),
  },
  location: {
    fontSize: wp(3),
    color: '#6B7280',
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    marginBottom: hp(0.25),
  },
  savedDate: {
    fontSize: wp(2.5),
    color: '#9CA3AF',
  },
  seller: {
    fontSize: wp(2.8),
    color: '#6B7280',
    fontStyle: 'italic',
  },
  removeButton: {
    padding: wp(2),
    borderRadius: wp(2),
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(16),
  },
  emptyIcon: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  emptyTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#111827',
    marginBottom: hp(1),
  },
  emptyDescription: {
    fontSize: wp(3.5),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: hp(2.2),
    marginBottom: hp(3),
    maxWidth: wp(80),
  },
  browseButton: {
    backgroundColor: '#3F51B5',
    borderRadius: wp(4),
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.2),
  },
  browseButtonText: {
    color: 'white',
    fontSize: wp(3.5),
    fontWeight: '600',
  },
});