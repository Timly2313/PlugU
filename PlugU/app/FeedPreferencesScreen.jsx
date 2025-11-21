import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet
} from 'react-native';
import { 
  ArrowLeft, 
  Smartphone, 
  Sofa, 
  Shirt, 
  Home, 
  Dumbbell, 
  BookOpen, 
  Gamepad2, 
  Car,
  Building, 
  Settings, 
  Wrench
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper from '../components/ScreenWrapper';
import { router } from 'expo-router';

const FeedPreferencesScreen = () => {
const [categories, setCategories] = useState([
  {
    id: 'electronics',
    icon: Smartphone,
    label: 'Electronics',
    description: 'Smartphones, laptops, gadgets and tech accessories',
    enabled: true,
  },
  {
    id: 'furniture',
    icon: Sofa,
    label: 'Furniture',
    description: 'Home furniture, office chairs, tables and decor',
    enabled: true,
  },
  {
    id: 'clothing',
    icon: Shirt,
    label: 'Clothing & Fashion',
    description: 'Apparel, shoes, accessories and fashion items',
    enabled: true,
  },

   {
    id: 'services',
    icon: Wrench,
    label: 'Services',
    description: 'Nails, hair, photography, and phone repair services',
    enabled: false,
  },
  {
    id: 'property-rentals',
    icon: Building,
    label: 'Property Rentals',
    description: 'Student Accommodations, Studios, and vacation rentals',
    enabled: false,
  },
  {
    id: 'equipment-rentals',
    icon: Settings,
    label: 'Equipment Rentals',
    description: 'Tools, party equipment, electronics, and specialty gear',
    enabled: false,
  },
  {
    id: 'home',
    icon: Home,
    label: 'Home & Garden',
    description: 'Kitchenware, garden tools, home improvement',
    enabled: true,
  },
  {
    id: 'sports',
    icon: Dumbbell,
    label: 'Sports & Outdoors',
    description: 'Fitness equipment, outdoor gear, sports accessories',
    enabled: false,
  },
  {
    id: 'books',
    icon: BookOpen,
    label: 'Books & Media',
    description: 'Books, magazines, movies, music and games',
    enabled: false,
  },
  {
    id: 'toys',
    icon: Gamepad2,
    label: 'Toys & Games',
    description: 'Video games, board games, toys and collectibles',
    enabled: false,
  },
  {
    id: 'vehicles',
    icon: Car,
    label: 'Vehicles',
    description: 'Cars, motorcycles, bicycles and automotive parts',
    enabled: false,
  },
 
]);

  const toggleCategory = (id) => {
    setCategories(categories.map(cat =>
      cat.id === id ? { ...cat, enabled: !cat.enabled } : cat
    ));
  };

  const onBack = () => {
    router.back();
  };

  const handleSave = () => {
    // Save preferences logic here
    onBack();
  };

  const CategoryItem = ({ item }) => {
    const Icon = item.icon;
    
    return (
      <View style={styles.categoryItem}>
        <View style={styles.categoryContent}>
          <View style={styles.iconContainer}>
            <Icon size={wp(4)} color="#3F51B5" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.categoryLabel}>{item.label}</Text>
            <Text style={styles.categoryDescription}>{item.description}</Text>
          </View>
        </View>
        <Switch
          value={item.enabled}
          onValueChange={() => toggleCategory(item.id)}
          trackColor={{ false: '#E5E7EB', true: '#3F51B5' }}
          thumbColor={item.enabled ? '#FFFFFF' : '#F3F4F6'}
        />
      </View>
    );
  };

  return (
    <ScreenWrapper bg="#F9FAFB">
      <StatusBar style="dark" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={wp(5)} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feed Preferences</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Customize what appears in your feed. Select the categories you're interested in to see more relevant content.
            </Text>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Text style={styles.sectionSubtitle}>Choose categories to personalize your feed</Text>
            <View style={styles.sectionContent}>
              {categories.map((category) => (
                <CategoryItem key={category.id} item={category} />
              ))}
            </View>
          </View>

          {/* Spacer for fixed button */}
          <View style={styles.spacer} />
        </View>
      </ScrollView>

      {/* Fixed Save Button */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
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
    gap: hp(3),
  },
  infoCard: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: hp(1.5),
    padding: hp(2),
  },
  infoText: {
    fontSize: hp(1.8),
    color: '#1e3a8a',
    lineHeight: hp(2.2),
  },
  section: {
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
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(0.5),
  },
  sectionSubtitle: {
    fontSize: wp(3.5),
    color: '#6B7280',
    paddingHorizontal: wp(4),
    paddingBottom: hp(1),
  },
  sectionContent: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(3),
    flex: 1,
  },
  iconContainer: {
    padding: wp(2),
    borderRadius: wp(2),
    backgroundColor: '#EEF2FF',
    marginTop: hp(0.2),
  },
  textContainer: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: wp(3.8),
    fontWeight: '500',
    color: '#111827',
    marginBottom: hp(0.3),
  },
  categoryDescription: {
    fontSize: wp(3.2),
    color: '#6B7280',
    lineHeight: hp(2),
  },
  spacer: {
    height: hp(10),
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
    backgroundColor: '#F9FAFB',
    paddingTop: hp(2),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#3F51B5',
    borderRadius: hp(1.5),
    paddingVertical: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: wp(4),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FeedPreferencesScreen;