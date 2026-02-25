import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { ArrowLeft, Star, Heart, Share2, Bookmark, MapPin } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../lib/supabase";
import { fetchListings } from "../services/listingsService";
import { hp, wp } from "../utilities/dimensions";

const UserProfileScreen = () => {
  const { userId } = useLocalSearchParams();

  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const onBack = () => router.back();

  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // 1️⃣ Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // 2️⃣ Fetch user listings
        const userListings = await fetchListings({
          mode: "myListings",
          userId,
        });

        setListings(
         userListings.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          location: item.location,
          image: item.media_url?.[0],
          category: item.category,
          status: item.status,
        }))
      );

      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const handleViewListing = (listingId) => {
    router.push({
      pathname: "/ListingDetailsScreen",
      params: { listingId },
    });
  };

  const formatMemberSince = date =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

 const ListingCard = ({ listing, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={() => onPress(listing.id)}
    style={customStyles.card}
  >
    <View style={customStyles.imageContainer}>
      {listing.image ? (
        <Image
          source={{ uri: listing.image }}
          style={customStyles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={customStyles.imagePlaceholder}>
          <Text>No image</Text>
        </View>
      )}

      {/* Status badge */}
      <View
        style={[
          customStyles.statusBadge,
          listing.status === "active" && customStyles.activeStatus,
          listing.status === "sold" && customStyles.soldStatus,
          listing.status === "pending" && customStyles.pendingStatus,
        ]}
      >
        <Text style={customStyles.statusText}>{listing.status}</Text>
      </View>
    </View>

    <View style={customStyles.infoContainer}>
      <Text style={customStyles.title} numberOfLines={1}>
        {listing.title}
      </Text>

      <Text style={customStyles.price}>${listing.price}</Text>

      <View style={customStyles.locationRow}>
        <MapPin size={wp(3)} color="#6B7280" />
        <Text style={customStyles.location} numberOfLines={1}>
          {listing.location}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);


  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loader}>
        <Text>User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <StatusBar style="light" />

      {/* Banner */}
     
        <View style={styles.bannerSection}>
          {profile?.banner_url ? (
        <Image
            source={{ uri: profile.banner_url }}
            style={styles.banner}
          />
        ) : (
          <View style={styles.banner} />
        )}
      

        <TouchableOpacity style={styles.floatingBackButton} onPress={onBack}>
          <ArrowLeft size={wp(5)} color="white" />
        </TouchableOpacity>

        <View style={styles.avatarContainerInline}>
            <View style={styles.avatar}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {profile?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
                </Text>
              )}
            </View>

            </View>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{profile.full_name}</Text>
        {/* Rating and Member Since */} 
        <View style={styles.ratingContainer}>
           <Star size={wp(3.5)} color="#3F51B5" fill="#3F51B5" />
            <Text style={styles.ratingText}>5.0</Text> 
            <Text style={styles.separator}>•</Text> 
            <Text style={styles.memberSince}>
              Member Since • {formatMemberSince(profile?.created_at)}
            </Text>

        </View>

        <View style={styles.locationContainer}>
          <MapPin size={wp(3.5)} color="#6B7280" />
          <Text style={styles.locationText}>{profile.location}</Text>
        </View>

        <Text
          style={styles.description}
          numberOfLines={3}
          ellipsizeMode="tail">
            {profile?.description || "No description yet"}
        </Text>
      </View>

      {/* Stats */} 
      {/* <View style={styles.statsContainer}> 
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
      </View> */}

      {/* Listings */}
      <View style={styles.listingsContainer}>
        <Text style={styles.listingsTitle}>All Listings</Text>

      <FlatList
        data={listings}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <ListingCard
              listing={item}
              onPress={handleViewListing}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
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

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  bannerSection: {
    position: 'relative',
  },

  gridItem: {
    flex: 1,
    margin: wp(1),
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
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: wp(50),
  },
  userInfo: {
    paddingTop: hp(2),
    paddingBottom: hp(2),
    alignItems: 'center',
  },
  userName: {
    fontSize: wp(5.5),
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

  listingItem: {
    flex: 1,
    margin: wp(0.5),
  },
});

export default UserProfileScreen;