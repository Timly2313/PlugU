import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { ArrowLeft, TrendingUp, Eye, Heart, MessageCircle } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper from '../components/ScreenWrapper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Mock data
const viewsData = [
  { date: 'Mon', views: 45 },
  { date: 'Tue', views: 62 },
  { date: 'Wed', views: 38 },
  { date: 'Thu', views: 71 },
  { date: 'Fri', views: 89 },
  { date: 'Sat', views: 103 },
  { date: 'Sun', views: 78 },
];

const listingPerformance = [
  { name: 'Modern Sofa Set', views: 142, messages: 28, likes: 45 },
  { name: 'iPhone 14 Pro', views: 98, messages: 19, likes: 32 },
  { name: 'Gaming Laptop', views: 87, messages: 15, likes: 28 },
  { name: 'Vintage Bicycle', views: 56, messages: 12, likes: 18 },
  { name: 'Designer Handbag', views: 43, messages: 8, likes: 15 },
];

const engagementData = [
  { name: 'Views', value: 486, color: '#3F51B5' },
  { name: 'Messages', value: 82, color: '#5C6BC0' },
  { name: 'Likes', value: 138, color: '#7986CB' },
];

const hourlyTraffic = [
  { hour: '12am', traffic: 5 },
  { hour: '4am', traffic: 2 },
  { hour: '8am', traffic: 15 },
  { hour: '12pm', traffic: 32 },
  { hour: '4pm', traffic: 45 },
  { hour: '8pm', traffic: 38 },
];

export default function AnalyticsScreen() {
  const onBack = () => {
    router.back();
  };

  // Since we can't use recharts in React Native, we'll create simplified visualizations
  const renderBarChart = (data, dataKey, color, height = 120) => {
    const maxValue = Math.max(...data.map(item => item[dataKey]));
    
    return (
      <View style={[styles.barChartContainer, { height: hp(height / 4) }]}>
        <View style={styles.barChart}>
          {data.map((item, index) => (
            <View key={index} style={styles.barChartItem}>
              <View style={styles.barWrapper}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: `${(item[dataKey] / maxValue) * 80}%`,
                      backgroundColor: color
                    }
                  ]} 
                />
              </View>
              <Text style={styles.barLabel}>{item.date || item.hour}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderHorizontalBarChart = (data, dataKey, color) => {
    const maxValue = Math.max(...data.map(item => item[dataKey]));
    
    return (
      <View style={styles.horizontalBarChart}>
        {data.map((item, index) => (
          <View key={index} style={styles.horizontalBarItem}>
            <Text style={styles.horizontalBarLabel} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.horizontalBarWrapper}>
              <View 
                style={[
                  styles.horizontalBar, 
                  { 
                    width: `${(item[dataKey] / maxValue) * 100}%`,
                    backgroundColor: color
                  }
                ]} 
              />
              <Text style={styles.horizontalBarValue}>{item[dataKey]}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderPieChart = () => {
    const total = engagementData.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChart}>
          {engagementData.map((item, index) => {
            const percentage = (item.value / total) * 100;
            return (
              <View key={index} style={styles.pieLegendItem}>
                <View style={styles.pieLegendColor}>
                  <View 
                    style={[
                      styles.pieColor, 
                      { backgroundColor: item.color }
                    ]} 
                  />
                </View>
                <Text style={styles.pieLegendText}>
                  {item.name}: {item.value} ({percentage.toFixed(1)}%)
                </Text>
              </View>
            );
          })}
        </View>
        <View style={styles.pieStats}>
          <Text style={styles.pieTotal}>Total Engagement: {total}</Text>
        </View>
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
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Overview Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Eye size={wp(5)} color="#3F51B5" style={styles.statIcon} />
            <Text style={styles.statNumber}>486</Text>
            <Text style={styles.statLabel}>Total Views</Text>
          </View>
          <View style={styles.statCard}>
            <MessageCircle size={wp(5)} color="#3F51B5" style={styles.statIcon} />
            <Text style={styles.statNumber}>82</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
          <View style={styles.statCard}>
            <Heart size={wp(5)} color="#3F51B5" style={styles.statIcon} />
            <Text style={styles.statNumber}>138</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>

        {/* Weekly Views */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <TrendingUp size={wp(5)} color="#3F51B5" />
            <Text style={styles.chartTitle}>Weekly Views</Text>
          </View>
          {renderBarChart(viewsData, 'views', '#3F51B5', 150)}
        </View>

        {/* Engagement Distribution */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Engagement Distribution</Text>
          {renderPieChart()}
        </View>

        {/* Listing Performance */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Top Listings Performance</Text>
          {renderHorizontalBarChart(listingPerformance, 'views', '#3F51B5')}
        </View>

        {/* Hourly Traffic */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Peak Activity Hours</Text>
          {renderBarChart(hourlyTraffic, 'traffic', '#5C6BC0', 120)}
        </View>

        {/* Detailed Listing Stats */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Listing Details</Text>
          <View style={styles.detailsList}>
            {listingPerformance.map((listing, index) => (
              <View key={index} style={styles.detailItem}>
                <Text style={styles.detailItemTitle}>{listing.name}</Text>
                <View style={styles.detailStats}>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatLabel}>Views</Text>
                    <Text style={styles.detailStatValue}>{listing.views}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatLabel}>Messages</Text>
                    <Text style={styles.detailStatValue}>{listing.messages}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatLabel}>Likes</Text>
                    <Text style={styles.detailStatValue}>{listing.likes}</Text>
                  </View>
                </View>
              </View>
            ))}
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
  scrollContent: {
    padding: wp(4),
    gap: hp(3),
    paddingBottom: hp(4),
  },
  statsGrid: {
    flexDirection: 'row',
    gap: wp(2),
  },
  statCard: {
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
  statIcon: {
    marginBottom: hp(0.5),
  },
  statNumber: {
    fontSize: wp(4),
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: hp(0.25),
  },
  statLabel: {
    fontSize: wp(2.5),
    color: '#6B7280',
  },
  chartCard: {
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
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: hp(2),
  },
  chartTitle: {
    fontSize: wp(4),
    fontWeight: '600',
    color: '#111827',
    marginBottom: hp(2),
  },
  barChartContainer: {
    marginTop: hp(1),
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
  barChartItem: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: '80%',
    justifyContent: 'flex-end',
    marginBottom: hp(0.5),
  },
  bar: {
    width: wp(6),
    borderRadius: wp(1),
    minHeight: wp(1),
  },
  barLabel: {
    fontSize: wp(2.5),
    color: '#6B7280',
    textAlign: 'center',
  },
  horizontalBarChart: {
    gap: hp(1.5),
  },
  horizontalBarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  horizontalBarLabel: {
    fontSize: wp(3),
    color: '#111827',
    width: wp(25),
  },
  horizontalBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  horizontalBar: {
    height: wp(3),
    borderRadius: wp(1.5),
    minWidth: wp(1),
  },
  horizontalBarValue: {
    fontSize: wp(3),
    color: '#6B7280',
    minWidth: wp(8),
    textAlign: 'right',
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  pieChart: {
    gap: hp(1),
    marginBottom: hp(2),
  },
  pieLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  pieLegendColor: {
    width: wp(4),
    alignItems: 'center',
  },
  pieColor: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(1.5),
  },
  pieLegendText: {
    fontSize: wp(3.5),
    color: '#6B7280',
  },
  pieStats: {
    marginTop: hp(1),
  },
  pieTotal: {
    fontSize: wp(3.5),
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  detailsCard: {
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
  detailsTitle: {
    fontSize: wp(4),
    fontWeight: '600',
    color: '#111827',
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailsList: {
    gap: 0,
  },
  detailItem: {
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailItemTitle: {
    fontSize: wp(3.8),
    fontWeight: '600',
    color: '#111827',
    marginBottom: hp(1),
  },
  detailStats: {
    flexDirection: 'row',
    gap: wp(3),
  },
  detailStat: {
    flex: 1,
  },
  detailStatLabel: {
    fontSize: wp(2.8),
    color: '#6B7280',
    marginBottom: hp(0.3),
  },
  detailStatValue: {
    fontSize: wp(3.5),
    fontWeight: '600',
    color: '#3F51B5',
  },
});