import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  StyleSheet
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
  Star
} from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper from '../components/ScreenWrapper';
import ListingCard from '../components/ListingCard';
import { useRouter } from 'expo-router';

// Mock listing data
const listingData = {
  id: '1',
  title: 'Modern Sofa Set',
  price: 450,
  location: 'San Francisco, CA',
  images: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=600&fit=crop',
  ],
  category: 'Furniture',
  description: 'Beautiful modern sofa set in excellent condition. Includes a 3-seater sofa and matching loveseat. Gray fabric upholstery, very comfortable and clean. Perfect for contemporary living spaces. Selling because we\'re moving to a smaller apartment.',
  seller: {
    name: 'John Doe',
    avatar: 'JD',
    rating: '4.8',
    listings: '12',
  },
  postedDate: '2 days ago',
};

const relatedListings = [
  {
    id: '11',
    title: 'Leather Sofa',
    price: 520,
    location: 'Oakland, CA',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    category: 'Furniture',
  },
  {
    id: '12',
    title: 'Sectional Couch',
    price: 680,
    location: 'Berkeley, CA',
    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&h=300&fit=crop',
    category: 'Furniture',
  },
  {
    id: '13',
    title: 'Velvet Sofa',
    price: 595,
    location: 'San Jose, CA',
    image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400&h=300&fit=crop',
    category: 'Furniture',
  },
];

export default function ListingDetailScreen({ listingId, onMessage, onViewListing }) {
  const [message, setMessage] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const router = useRouter();

  const onBack = () => {
    router.back();
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle send message
      onMessage?.();
      setMessage('');
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % listingData.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + listingData.images.length) % listingData.images.length);
  };

  const handleViewListing = (listingId) => {
    router.push({
      pathname: "/ListingDetailsScreen",
      params: { listingId }
    });
  };

  const renderImageIndicator = () => (
    <View style={styles.imageIndicators}>
      {listingData.images.map((_, index) => (
        <View
          key={index}
          style={[
            styles.imageIndicator,
            index === currentImageIndex && styles.activeImageIndicator
          ]}
        />
      ))}
    </View>
  );

  const renderRelatedListing = ({ item }) => (
    <View style={styles.relatedListingItem}>
      <ListingCard
        listing={item}
        onViewListing={handleViewListing}
      />
    </View>
  );

  return (
    <ScreenWrapper bg="#F9FAFB">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          <Image 
            source={{ uri: listingData.images[currentImageIndex] }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          
          {/* Image Navigation */}
          {listingData.images.length > 1 && (
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

        {/* Content */}
        <View style={styles.content}>
          {/* Price & Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{listingData.title}</Text>
            <Text style={styles.price}>${listingData.price}</Text>
            <View style={styles.locationRow}>
              <MapPin size={wp(3.5)} color="#6B7280" />
              <Text style={styles.location}>{listingData.location}</Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.postedDate}>{listingData.postedDate}</Text>
            </View>
          </View>

          {/* Send Seller a Message */}
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
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={handleSendMessage}
              >
                <Send size={wp(4)} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {listingData.description}
            </Text>
          </View>

          {/* Seller Info */}
          <View style={styles.sellerCard}>
            <Text style={styles.sectionTitle}>Seller Information</Text>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerAvatarText}>{listingData.seller.avatar}</Text>
              </View>
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>{listingData.seller.name}</Text>
                <View style={styles.sellerStats}>
                  <Star size={wp(3.5)} color="#3F51B5" fill="#3F51B5" />
                  <Text style={styles.sellerRating}>{listingData.seller.rating}</Text>
                  <Text style={styles.separator}>•</Text>
                  <Text style={styles.sellerListings}>{listingData.seller.listings} listings</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Related Listings */}
          <View style={styles.relatedSection}>
            <Text style={styles.sectionTitle}>Related Listings</Text>
            <FlatList
              data={relatedListings}
              renderItem={renderRelatedListing}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedListings}
            />
          </View>
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
    gap: hp(3),
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: hp(2),
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sellerCard: {
    backgroundColor: 'white',
    borderRadius: wp(4),
    padding: wp(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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