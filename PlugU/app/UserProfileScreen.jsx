// UserProfileScreen.js
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet
} from 'react-native';
import { ArrowLeft, Star, Heart, Share2, Bookmark, MapPin } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper from '../components/ScreenWrapper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const UserProfileScreen = ({ userId }) => {
  
  const onBack = () => {
    router.back();
  };

  const userData = {
    name: 'Sarah Johnson',
    avatar: 'SJ',
    rating: '4.9',
    totalListings: '15',
    soldItems: '23',
    memberSince: 'Jan 2024',
    bio: 'Interior design enthusiast and vintage furniture collector. Love finding unique pieces and giving them new life!',
    location: 'San Francisco, CA'
  };

  const userListings = [
    {
      id: '7',
      title: 'Vintage Armchair',
      price: 180,
      location: 'San Francisco, CA',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
      category: 'Furniture',
    },
    {
      id: '8',
      title: 'Modern Lamp',
      price: 65,
      location: 'San Francisco, CA',
      image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=300&fit=crop',
      category: 'Home',
    },
    {
      id: '9',
      title: 'Coffee Table',
      price: 220,
      location: 'San Francisco, CA',
      image: 'https://images.unsplash.com/photo-1533090368676-1fd25485db88?w=400&h=300&fit=crop',
      category: 'Furniture',
    },
    {
      id: '10',
      title: 'Dining Chairs Set',
      price: 340,
      location: 'San Francisco, CA',
      image: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=400&h=300&fit=crop',
      category: 'Furniture',
    },
  ];

  const handleViewListing = (listingId) => {
    router.push({
      pathname: "/ListingDetailsScreen",
      params: { listingId }
    });
  };

  const handleLikeListing = (listingId) => {
    console.log('Liked listing:', listingId);
  };

  const handleShareListing = (listingId) => {
    console.log('Share listing:', listingId);
  };

  const handleSaveListing = (listingId) => {
    console.log('Saved listing:', listingId);
  };

  // Custom ListingCard with action buttons inline with price
  const CustomListingCard = ({ listing }) => (
    <View style={customStyles.card}>
      <TouchableOpacity onPress={() => handleViewListing(listing.id)}>
        <View style={customStyles.imageContainer}>
          <Image 
            source={{ uri: listing.image }} 
            style={customStyles.image}
            resizeMode="cover"
          />
        </View>
        
        <View style={customStyles.infoContainer}>
          <Text style={customStyles.title} numberOfLines={1}>{listing.title}</Text>
          
          {/* Price and Action Buttons Row */}
          <View style={customStyles.priceActionsRow}>
            <Text style={customStyles.price}>${listing.price}</Text>
            <View style={customStyles.actionButtons}>
              <TouchableOpacity 
                style={customStyles.actionButton}
                onPress={() => handleLikeListing(listing.id)}
              >
                <Heart size={wp(5)} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={customStyles.actionButton}
                onPress={() => handleShareListing(listing.id)}
              >
                <Share2 size={wp(5)} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={customStyles.actionButton}
                onPress={() => handleSaveListing(listing.id)}
              >
                <Bookmark size={wp(5)} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={customStyles.locationRow}>
            <MapPin size={wp(3)} color="#6B7280" />
            <Text style={customStyles.location} numberOfLines={1}>{listing.location}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderListingItem = ({ item }) => (
    <View style={styles.listingItem}>
      <CustomListingCard listing={item} />
    </View>
  );

  return (
  <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
    <StatusBar style="light" />
    {/* Banner Section with Floating Back Button */}
    <View style={styles.bannerSection}>
      <View style={styles.banner} />
      {/* Floating Back Button */}
      <TouchableOpacity style={styles.floatingBackButton} onPress={onBack}>
        <ArrowLeft size={wp(5)} color="white" />
      </TouchableOpacity>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <View style={styles.avatarContent}>
            <Text style={styles.avatarText}>{userData.avatar}</Text>
          </View>
        </View>
      </View>
    </View>

    {/* User Info */}
    <View style={styles.userInfo}>
      <Text style={styles.userName}>{userData.name}</Text>
      
      {/* Rating and Member Since */}
      <View style={styles.ratingContainer}>
        <Star size={wp(3.5)} color="#3F51B5" fill="#3F51B5" />
        <Text style={styles.ratingText}>{userData.rating}</Text>
        <Text style={styles.separator}>•</Text>
        <Text style={styles.memberSince}>Member since {userData.memberSince}</Text>
      </View>

      {/* Location */}
      <View style={styles.locationContainer}>
        <MapPin size={wp(3.5)} color="#6B7280" />
        <Text style={styles.locationText}>{userData.location}</Text>
      </View>

      {/* User Bio */}
      <Text style={styles.userBio}>{userData.bio}</Text>
    </View>

    {/* Stats */}
    <View style={styles.statsContainer}>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userData.totalListings}</Text>
          <Text style={styles.statLabel}>Listings</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userData.soldItems}</Text>
          <Text style={styles.statLabel}>Sold</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userData.rating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>
    </View>

    {/* Listings */}
    <View style={styles.listingsContainer}>
      <Text style={styles.listingsTitle}>All Listings</Text>
      <FlatList
        data={userListings}
        renderItem={renderListingItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
        contentContainerStyle={styles.listingsGrid}
      />
    </View>
  </ScrollView>
  );
};


const customStyles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: wp(4),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: wp(2.5),
  },
  title: {
    color: '#111827',
    fontSize: wp(3.5),
    fontWeight: '500',
    marginBottom: hp(0.8),
  },
  priceActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(0.8),
  },
  price: {
    color: '#3F51B5',
    fontSize: wp(4),
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: wp(1),
  },
  actionButton: {
    width: wp(6),
    height: wp(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  location: {
    color: '#6B7280',
    fontSize: wp(3),
    flex: 1,
  },
});

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  bannerSection: {
    position: 'relative',
  },
  banner: {
    height: hp(20),
    backgroundColor: '#3F51B5',
    borderBottomLeftRadius: wp(8),
    borderBottomRightRadius: wp(8),
  },
  floatingBackButton: {
    position: 'absolute',
    top: hp(4),
    left: wp(4),
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'absolute',
    left: '50%',
    bottom: -hp(6),
    transform: [{ translateX: -wp(12) }],
  },
  avatar: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    backgroundColor: 'white',
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  avatarContent: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3F51B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: wp(6),
    color: 'white',
    fontWeight: 'bold',
  },
  userInfo: {
    paddingTop: hp(8),
    paddingBottom: hp(2),
    paddingHorizontal: wp(4),
    alignItems: 'center',
  },
  userName: {
    fontSize: wp(5.5),
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: hp(0.5),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    marginBottom: hp(1),
  },
  ratingText: {
    fontSize: wp(3.5),
    color: '#6B7280',
  },
  separator: {
    fontSize: wp(3.5),
    color: '#6B7280',
  },
  memberSince: {
    fontSize: wp(3.5),
    color: '#6B7280',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    marginBottom: hp(1.5),
  },
  locationText: {
    fontSize: wp(3.5),
    color: '#6B7280',
  },
  userBio: {
    fontSize: wp(3.8),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: hp(2.5),
    paddingHorizontal: wp(2),
  },
  statsContainer: {
    paddingHorizontal: wp(4),
    marginBottom: hp(2),
  },
  statsGrid: {
    flexDirection: 'row',
    gap: wp(2),
  },
  statItem: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: wp(4),
    padding: wp(3),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: hp(0.3),
  },
  statLabel: {
    fontSize: wp(3),
    color: '#6B7280',
  },
  listingsContainer: {
    paddingHorizontal: wp(3),
    paddingBottom: hp(4),
  },
  listingsTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#111827',
    marginBottom: hp(1.5),
    paddingHorizontal: wp(1),
  },
  listingsGrid: {
    gap: hp(1),
  },
  listingItem: {
    flex: 1,
    margin: wp(0.5),
  },
});

export default UserProfileScreen;