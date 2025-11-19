import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { MapPin, Heart, Bookmark, Share2 } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';

export default function ListingCard({ 
  listing, 
  showStatus, 
  status, 
  onMessageClick, 
  onViewListing, 
  liked = false, 
  onLikeClick 
}) {
  // Add safety check - return null or placeholder if listing is undefined
  if (!listing) {
    return (
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <View style={styles.placeholderImage} />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.placeholderText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onViewListing?.(listing.id)}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: listing.image }} 
          style={styles.image}
          resizeMode="cover"
        />
        {showStatus && status && (
          <View style={[
            styles.statusBadge,
            status === 'Active' ? styles.activeStatus :
            status === 'Sold' ? styles.soldStatus :
            styles.pendingStatus
          ]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        )}
        {!showStatus && (
          <View style={styles.imageActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
              }}
            >
              <Bookmark size={wp(3.5)} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
              }}
            >
              <Share2 size={wp(3.5)} color="#374151" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>R{listing.price?.toLocaleString()}</Text>
          {!showStatus && (
            <TouchableOpacity
              style={[
                styles.likeButton,
                liked ? styles.likedButton : styles.unlikedButton
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onLikeClick?.();
              }}
            >
              <Heart 
                size={wp(3.5)} 
                color={liked ? "white" : "#6B7280"}
                fill={liked ? "white" : "none"}
              />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.locationRow}>
          <MapPin size={wp(3)} color="#6B7280" />
          <Text style={styles.location} numberOfLines={1}>{listing.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  statusBadge: {
    position: 'absolute',
    top: wp(1.5),
    right: wp(1.5),
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: wp(50),
  },
  activeStatus: {
    backgroundColor: '#10B981',
  },
  soldStatus: {
    backgroundColor: '#6B7280',
  },
  pendingStatus: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    color: 'white',
    fontSize: wp(2.5),
    fontWeight: '500',
  },
  imageActions: {
    position: 'absolute',
    top: wp(1.5),
    right: wp(1.5),
    flexDirection: 'row',
    gap: wp(1),
  },
  actionButton: {
    width: wp(7),
    height: wp(7),
    backgroundColor: 'white',
    borderRadius: wp(3.5),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  infoContainer: {
    padding: wp(2.5),
  },
  title: {
    color: '#111827',
    fontSize: wp(3.5),
    fontWeight: '500',
    marginBottom: hp(0.5),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  price: {
    color: '#3F51B5',
    fontSize: wp(4),
    fontWeight: '600',
  },
  likeButton: {
    width: wp(7),
    height: wp(7),
    borderRadius: wp(3.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  likedButton: {
    backgroundColor: '#3F51B5',
  },
  unlikedButton: {
    backgroundColor: '#F3F4F6',
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
  placeholderText: {
    color: '#6B7280',
    fontSize: wp(3.5),
    textAlign: 'center',
  },
});