import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { LogOut, TrendingUp, DollarSign, Eye, Package, Settings, Edit, Heart, MoreVertical, Trash2, Pencil } from 'lucide-react-native';
import { hp, wp } from '../../utilities/dimensions';
import ListingCard from '../../components/ListingCard';
import ScreenWrapper from '../../components/ScreenWrapper';
import { router } from 'expo-router';
import {StatusBar} from 'expo-status-bar';

const userStats = [
  { label: 'Active Listings', value: '8', icon: Package },
  { label: 'Sold', value: '12', icon: DollarSign },
  { label: 'Views', value: '342', icon: Eye },
  { label: 'Rating', value: '4.8', icon: TrendingUp },
];

// Initial listings data
const initialUserListings = [
  {
    id: '1',
    title: 'Modern Sofa Set',
    price: 450,
    location: 'San Francisco, CA',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
    category: 'Furniture',
    status: 'Active',
  },
  {
    id: '2',
    title: 'iPhone 14 Pro',
    price: 899,
    location: 'Oakland, CA',
    image: 'https://images.unsplash.com/photo-1592286927505-c1f03fdedc1b?w=400&h=300&fit=crop',
    category: 'Electronics',
    status: 'Active',
  },
  {
    id: '3',
    title: 'Vintage Bicycle',
    price: 250,
    location: 'Berkeley, CA',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=300&fit=crop',
    category: 'Sports',
    status: 'Sold',
  },
  {
    id: '4',
    title: 'Gaming Laptop',
    price: 1200,
    location: 'San Jose, CA',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=300&fit=crop',
    category: 'Electronics',
    status: 'Active',
  },
  {
    id: '5',
    title: 'Designer Handbag',
    price: 320,
    location: 'San Francisco, CA',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=300&fit=crop',
    category: 'Fashion',
    status: 'Pending',
  },
  {
    id: '6',
    title: 'Wooden Dining Table',
    price: 380,
    location: 'Palo Alto, CA',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&h=300&fit=crop',
    category: 'Furniture',
    status: 'Active',
  },
];

export default function ProfileScreen({  onMarkAsSold }) {
  const [userListings, setUserListings] = useState(initialUserListings);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  const onSettings = () => {
    router.push("/SettingsScreen");
  };
  
  const onEditProfile = () => {
    router.push("/EditProfileScreen");
  };

  const onViewReviews = () => {
    router.push("/ReviewsScreen");
  };
  
  const onSavedListings = () => {
    router.push("/SavedListingsScreen");
  };
  
  const onViewAnalytics = () => {
    router.push("/AnalyticsScreen");
  };


  const onLogout = () => {
    router.push("/LoginScreen");
  };
  
  // Handle dots click (show action menu)
  const handleDotsClick = (listing) => {
    setSelectedListing(listing);
    setActionModalVisible(true);
  };

  // Handle edit listing
  const handleEditListing = () => {
    setActionModalVisible(false);
    Alert.alert('Edit Listing', `Edit functionality for "${selectedListing?.title}"`);
   router.push({ pathname: "/CreateListingScreen", params: { listingId: selectedListing?.id } });
  };

  // Handle delete listing
  const handleDeleteListing = () => {
    setActionModalVisible(false);
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to delete "${selectedListing?.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setUserListings(prevListings => 
              prevListings.filter(listing => listing.id !== selectedListing.id)
            );
            Alert.alert('Deleted', 'Listing has been deleted successfully');
          },
        },
      ]
    );
  };

  // Handle status change
  const handleStatusChange = () => {
    setActionModalVisible(false);
    setStatusModalVisible(true);
  };

  // Update listing status
  const updateListingStatus = (newStatus) => {
    if (selectedListing) {
      setUserListings(prevListings => 
        prevListings.map(listing => 
          listing.id === selectedListing.id 
            ? { ...listing, status: newStatus }
            : listing
        )
      );
      setStatusModalVisible(false);
      setSelectedListing(null);
      
      Alert.alert('Status Updated', `Listing status changed to ${newStatus}`);
    }
  };

  // Status options for the modal
  const statusOptions = [
    { label: 'Active', value: 'Active', color: '#10B981' },
    { label: 'Sold', value: 'Sold', color: '#6B7280' },
    { label: 'Pending', value: 'Pending', color: '#F59E0B' },
    { label: 'Draft', value: 'Draft', color: '#6B7280' },
  ];

  // Custom ListingCard with left-side status badge
  const CustomListingCard = ({ listing, onPress }) => (
    <View style={customStyles.card}>
      <View style={customStyles.imageContainer}>
        <Image 
          source={{ uri: listing.image }} 
          style={customStyles.image}
          resizeMode="cover"
        />
        {/* Status Badge on Left */}
        <View style={[
          customStyles.statusBadge,
          listing.status === 'Active' ? customStyles.activeStatus :
          listing.status === 'Sold' ? customStyles.soldStatus :
          listing.status === 'Pending' ? customStyles.pendingStatus :
          customStyles.draftStatus
        ]}>
          <Text style={customStyles.statusText}>{listing.status}</Text>
        </View>
      </View>
      
      <View style={customStyles.infoContainer}>
        <Text style={customStyles.title} numberOfLines={1}>{listing.title}</Text>
        <View style={customStyles.priceRow}>
          <Text style={customStyles.price}>${listing.price}</Text>
        </View>
        <View style={customStyles.locationRow}>
          <Text style={customStyles.location} numberOfLines={1}>{listing.location}</Text>
        </View>
      </View>
    </View>
  );

  const renderListingItem = ({ item }) => (
    <View style={styles.listingItem}>
      <CustomListingCard listing={item} />
      {/* Dots button overlay */}
      <TouchableOpacity
        style={styles.dotsButton}
        onPress={() => handleDotsClick(item)}
      >
        <MoreVertical size={wp(4)} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenWrapper bg={"#3F51B5"}>
      <StatusBar style="light" />
      <View style={styles.container}>

        {/* NOTE: banner & avatar moved INSIDE the ScrollView so they scroll out of view */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: hp(4) }}
        >
          {/* Banner Section (now scrollable) */}
          <View style={styles.bannerSection}>
            <View style={styles.banner} />
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.headerButton} onPress={onSettings}>
                <Settings size={wp(5)} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={onLogout}>
                <LogOut size={wp(5)} color="white" />
              </TouchableOpacity>
            </View>

            {/* Avatar now part of scroll content so it will scroll away */}
            <View style={styles.avatarContainerInline}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>JD</Text>
              </View>
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>John Doe</Text>
            <Text style={styles.description}>
              Hello! I am John, a passionate buyer and seller on PlugU. I love finding great deals and connecting with fellow community members.
            </Text>
            <View style={styles.editButtonsContainer}>
              <TouchableOpacity style={styles.editButton} onPress={onEditProfile}>
                <Edit size={wp(3.5)} color="#3F51B5" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.editButton} onPress={onSavedListings}>
                <Heart size={wp(3.5)} color="#3F51B5" />
                <Text style={styles.editButtonText}>Saved Listings</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              {userStats.map((stat, index) => {
                const Icon = stat.icon;
                const isViews = stat.label === 'Views';
                const isRating = stat.label === 'Rating';
                
                return (
                  <TouchableOpacity
                    key={stat.label}
                    style={styles.statCard}
                    onPress={isViews ? onViewAnalytics : isRating ? onViewReviews : undefined}
                    disabled={!isViews && !isRating}
                  >
                    <Icon size={wp(4)} color="#3F51B5" />
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* My Listings */}
          <View style={styles.listingsContainer}>
            <View style={styles.listingsHeader}>
              <Text style={styles.listingsTitle}>My Listings</Text>
            </View>
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

        {/* Action Menu Modal */}
        <Modal
          visible={actionModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setActionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {selectedListing?.title}
              </Text>
              
              <TouchableOpacity
                style={styles.menuOption}
                onPress={handleEditListing}
              >
                <Pencil size={wp(4)} color="#3F51B5" />
                <Text style={styles.menuOptionText}>Edit Listing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuOption}
                onPress={handleStatusChange}
              >
                <Settings size={wp(4)} color="#3F51B5" />
                <Text style={styles.menuOptionText}>Change Status</Text>
                <View style={[
                  styles.currentStatusBadge,
                  selectedListing?.status === 'Active' && styles.activeStatusBadge,
                  selectedListing?.status === 'Sold' && styles.soldStatusBadge,
                  selectedListing?.status === 'Pending' && styles.pendingStatusBadge,
                ]}>
                  <Text style={styles.currentStatusBadgeText}>{selectedListing?.status}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuOption, styles.deleteOption]}
                onPress={handleDeleteListing}
              >
                <Trash2 size={wp(4)} color="#EF4444" />
                <Text style={[styles.menuOptionText, styles.deleteText]}>Delete Listing</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setActionModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Status Change Modal */}
        <Modal
          visible={statusModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setStatusModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Change Status for{'\n'}"{selectedListing?.title}"
              </Text>
              
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusOption,
                    selectedListing?.status === option.value && styles.selectedStatusOption
                  ]}
                  onPress={() => updateListingStatus(option.value)}
                >
                  <View style={[styles.statusDot, { backgroundColor: option.color }]} />
                  <Text style={styles.statusOptionText}>{option.label}</Text>
                  {selectedListing?.status === option.value && (
                    <Text style={styles.currentStatusText}>Current</Text>
                  )}
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setStatusModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}

// Custom styles for the modified ListingCard with left-side status
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
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: wp(2),
    left: wp(2),
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
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
  draftStatus: {
    backgroundColor: '#6B7280',
  },
  statusText: {
    color: 'white',
    fontSize: wp(2.2),
    fontWeight: '500',
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
    marginBottom: hp(1),
  },
  price: {
    color: '#3F51B5',
    fontSize: wp(4),
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    color: '#6B7280',
    fontSize: wp(3),
    flex: 1,
  },
});

// Rest of the styles remain the same as previous...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  bannerSection: {
    position: 'relative',
  },
  banner: {
    height: hp(16),
    backgroundColor: '#3F51B5',
    borderBottomLeftRadius: hp(5),
    borderBottomRightRadius: hp(5), 
  },
  headerButtons: {
    position: 'absolute',
    top: hp(1),
    right: wp(3),
    flexDirection: 'row',
    gap: wp(2),
  },
  headerButton: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarContainer: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -wp(15) }],
    bottom: -hp(5),
  },
  avatarContainerInline: {
    position: 'relative',
    alignSelf: 'center',
    marginTop: hp(-10),
  },
  avatar: {
    width: wp(30),
    height: wp(30),
    borderRadius: wp(50),
    backgroundColor: 'white',
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3F51B5',
  },
  avatarText: {
    color: 'white',
    fontSize: wp(5),
    fontWeight: '600',
  },
  userInfo: {
    paddingTop: hp(1.2),
    paddingBottom: hp(2),
    alignItems: 'center',
    paddingHorizontal: wp(4),
  },
  userName: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: hp(0.5),
  },
  description: {
    fontSize: wp(3.5),
    color: '#6B7280',
    marginBottom: hp(1.5),
    textAlign: 'center',
    lineHeight: hp(2.2),
  },
  editButtonsContainer: {
    flexDirection: 'row',
    gap: wp(2),
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3F51B5',
    borderRadius: wp(50),
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
  },
  editButtonText: {
    color: '#3F51B5',
    fontSize: wp(3.5),
    fontWeight: '500',
    marginLeft: wp(1.5),
  },
  statsContainer: {
    paddingHorizontal: wp(3),
    marginBottom: hp(2),
  },
  statsGrid: {
    flexDirection: 'row',
    gap: wp(2),
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: wp(4),
    padding: wp(2.5),
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
  statValue: {
    fontSize: wp(3.5),
    fontWeight: 'bold',
    color: '#111827',
    marginTop: hp(0.5),
    marginBottom: hp(0.25),
  },
  statLabel: {
    fontSize: wp(2.5),
    color: '#6B7280',
  },
  listingsContainer: {
    paddingHorizontal: wp(3),
    paddingBottom: hp(4),
  },
  listingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  listingsTitle: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: '#111827',
  },
  dotsHint: {
    fontSize: wp(2.8),
    color: '#6B7280',
    fontStyle: 'italic',
  },
  listingsGrid: {
    gap: hp(1),
  },
  listingItem: {
    flex: 1,
    margin: wp(0.5),
    position: 'relative',
  },
  dotsButton: {
    position: 'absolute',
    top: wp(2),
    right: wp(2),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
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
    zIndex: 2,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(4),
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: wp(4),
    padding: wp(5),
    width: '100%',
    maxWidth: wp(80),
  },
  modalTitle: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: hp(2),
    lineHeight: hp(2.8),
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    borderRadius: wp(3),
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuOptionText: {
    fontSize: wp(4),
    color: '#111827',
    marginLeft: wp(3),
    flex: 1,
  },
  deleteOption: {
    borderColor: '#FECACA',
  },
  deleteText: {
    color: '#EF4444',
  },
  currentStatusBadge: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: wp(50),
    marginLeft: wp(2),
  },
  activeStatusBadge: {
    backgroundColor: '#10B981',
  },
  soldStatusBadge: {
    backgroundColor: '#6B7280',
  },
  pendingStatusBadge: {
    backgroundColor: '#F59E0B',
  },
  currentStatusBadgeText: {
    color: 'white',
    fontSize: wp(2.5),
    fontWeight: '500',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    borderRadius: wp(3),
    marginBottom: hp(0.5),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedStatusOption: {
    backgroundColor: '#F3F4F6',
    borderColor: '#3F51B5',
  },
  statusDot: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(1.5),
    marginRight: wp(3),
  },
  statusOptionText: {
    fontSize: wp(4),
    color: '#111827',
    flex: 1,
  },
  currentStatusText: {
    fontSize: wp(3),
    color: '#3F51B5',
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: hp(2),
    paddingVertical: hp(1.5),
    alignItems: 'center',
    borderRadius: wp(3),
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: wp(4),
    color: '#6B7280',
    fontWeight: '500',
  },
});