import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  MapPin,
  Bookmark,
  Share2,
  MessageCircle,
  Send,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper from '../components/ScreenWrapper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { fetchListingById } from '../services/listingsService';

export default function ListingDetailScreen() {
  const { listingId } = useLocalSearchParams();
  const router = useRouter();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadListing = async () => {
      try {
        const data = await fetchListingById(listingId);
        setListing(data);
      } catch (err) {
        console.error('Failed to load listing', err);
      } finally {
        setLoading(false);
      }
    };

    if (listingId) loadListing();
  }, [listingId]);

  if (loading) {
    return (
      <ScreenWrapper bg="#F9FAFB">
        <ActivityIndicator style={{ marginTop: hp(30) }} size="large" />
      </ScreenWrapper>
    );
  }

  if (!listing) return null;

  const images = listing.images ?? [];

  const nextImage = () => {
    setCurrentImageIndex(i => (i + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(i => (i - 1 + images.length) % images.length);
  };

  const renderImageIndicator = () => (
    <View style={styles.imageIndicators}>
      {images.map((_, index) => (
        <View
          key={index}
          style={[
            styles.imageIndicator,
            index === currentImageIndex && styles.activeImageIndicator,
          ]}
        />
      ))}
    </View>
  );

  return (
    <ScreenWrapper bg="#F9FAFB">
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={wp(5)} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton}>
            <Share2 size={wp(4)} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton}>
            <Bookmark size={wp(4)} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          {images.length > 0 && (
            <Image
              source={{ uri: images[currentImageIndex] }}
              style={styles.mainImage}
            />
          )}

          {images.length > 1 && (
            <>
              <TouchableOpacity style={styles.navButtonLeft} onPress={prevImage}>
                <ChevronLeft size={wp(5)} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButtonRight} onPress={nextImage}>
                <ChevronRight size={wp(5)} color="#374151" />
              </TouchableOpacity>
              {renderImageIndicator()}
            </>
          )}
        </View>

        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{listing.title}</Text>
            <Text style={styles.price}>${listing.price}</Text>

            <View style={styles.locationRow}>
              <MapPin size={wp(3.5)} color="#6B7280" />
              <Text style={styles.location}>{listing.location}</Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.postedDate}>{listing.postedDate}</Text>
            </View>
          </View>

          {/* Message */}
          <View style={styles.messageCard}>
            <View style={styles.messageHeader}>
              <MessageCircle size={wp(5)} color="#3F51B5" />
              <Text style={styles.messageTitle}>Send seller a message</Text>
            </View>

            <View style={styles.messageInputRow}>
              <TextInput
                style={styles.messageInput}
                placeholder="Type your message..."
                value={message}
                onChangeText={setMessage}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity style={styles.sendButton}>
                <Send size={wp(4)} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{listing.description}</Text>
          </View>

          {/* Seller */}
          <TouchableOpacity
           style={styles.sellerCard}
           activeOpacity={0.85}
           onPress={() =>
             router.push({
             pathname: "/UserProfileScreen",
             params: { userId: listing.seller?.id },
            })
           }>

            <Text style={styles.sectionTitle}>Seller Information</Text>

            <View style={styles.sellerInfo}>
              <View style={styles.sellerAvatar}>
                <Image
                    source={{ uri: listing.seller?.avatar }}
                    style={styles.avatar}
                />
              </View>

              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>
                  {listing.seller?.name ?? 'Unknown'}
                </Text>

                <View style={styles.sellerStats}>
                  <Star size={wp(3.5)} color="#3F51B5" fill="#3F51B5" />
                  <Text style={styles.sellerRating}>
                    {listing.seller?.rating ?? '5.0'}
                  </Text>
                </View>
              </View>
            </View>
  
          </TouchableOpacity>
         
            
         
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}


const styles = StyleSheet.create({
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
  backButton: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerActions: {
    flexDirection: 'row',
    gap: wp(2),
  },
  headerActionButton: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  imageGallery: {
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  mainImage: {
    width: '100%',
    height: hp(40),
  },
  navButtonLeft: {
    position: 'absolute',
    left: wp(2),
    top: '50%',
    transform: [{ translateY: -wp(4.5) }],
    width: wp(9),
    height: wp(9),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: wp(4.5),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonRight: {
    position: 'absolute',
    right: wp(2),
    top: '50%',
    transform: [{ translateY: -wp(4.5) }],
    width: wp(9),
    height: wp(9),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: wp(4.5),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: hp(2),
    left: '50%',
    transform: [{ translateX: -wp(6) }],
    flexDirection: 'row',
    gap: wp(1),
  },
  imageIndicator: {
    width: wp(1.5),
    height: wp(1.5),
    borderRadius: wp(0.75),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeImageIndicator: {
    width: wp(4),
    backgroundColor: 'white',
  },
  content: {
    padding: wp(4),
    gap: hp(2),
  },
  titleSection: {
    gap: hp(1),
  },
  title: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: '#111827',
  },
  price: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: '#3F51B5',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  location: {
    fontSize: wp(3.5),
    color: '#6B7280',
  },
  separator: {
    fontSize: wp(3.5),
    color: '#D1D5DB',
  },
  postedDate: {
    fontSize: wp(3.5),
    color: '#6B7280',
  },
  messageCard: {
    backgroundColor: 'white',
    borderRadius: wp(4),
    padding: wp(4),
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  messageTitle: {
    fontSize: wp(4),
    fontWeight: '600',
    color: '#111827',
  },
  messageInputRow: {
    flexDirection: 'row',
    gap: wp(2),
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp(50),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    fontSize: wp(3.5),
    color: '#111827',
  },
  sendButton: {
    width: wp(10),
    height: wp(10),
    backgroundColor: '#3F51B5',
    borderRadius: wp(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionCard: {
    backgroundColor: 'white',
    borderRadius: wp(4),
    padding: wp(4),
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  sellerCard: {
    backgroundColor: 'white',
    borderRadius: wp(4),
    padding: wp(4),
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: wp(4),
    fontWeight: '600',
    color: '#111827',
    marginBottom: hp(1.5),
  },
  descriptionText: {
    fontSize: wp(3.5),
    color: '#6B7280',
    lineHeight: hp(2.5),
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  sellerAvatar: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: '#3F51B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarText: {
    color: 'white',
    fontSize: wp(4),
    fontWeight: 'bold',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: wp(4),
    fontWeight: '600',
    color: '#111827',
    marginBottom: hp(0.5),
  },
  sellerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  sellerRating: {
    fontSize: wp(3.5),
    color: '#6B7280',
  },
  sellerListings: {
    fontSize: wp(3.5),
    color: '#6B7280',
  },
  relatedSection: {
    marginBottom: hp(2),
  },
  relatedListings: {
    gap: wp(3),
  },
  relatedListingItem: {
    width: wp(44),
  },
});