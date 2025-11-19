import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet
} from 'react-native';
import { MessageCircle, Clock } from 'lucide-react-native';
import { hp, wp } from '../../utilities/dimensions';
import ScreenWrapper from '../../components/ScreenWrapper';

const messages = [
  {
    id: '1',
    name: 'Sarah Johnson',
    lastMessage: 'Is this still available?',
    time: '5m ago',
    unread: true,
    listingTitle: 'Modern Sofa Set',
    avatar: 'SJ',
  },
  {
    id: '2',
    name: 'Mike Chen',
    lastMessage: 'Can we meet tomorrow?',
    time: '1h ago',
    unread: true,
    listingTitle: 'iPhone 14 Pro',
    avatar: 'MC',
  },
  {
    id: '3',
    name: 'Alex Rodriguez',
    lastMessage: 'Great, thanks!',
    time: '2h ago',
    unread: false,
    listingTitle: 'Vintage Bicycle',
    avatar: 'AR',
  },
  {
    id: '4',
    name: 'Emma Davis',
    lastMessage: 'What\'s your best price?',
    time: '5h ago',
    unread: false,
    listingTitle: 'Gaming Laptop',
    avatar: 'ED',
  },
  {
    id: '5',
    name: 'James Wilson',
    lastMessage: 'I\'m interested in this item',
    time: '1d ago',
    unread: false,
    listingTitle: 'Designer Handbag',
    avatar: 'JW',
  },
  {
    id: '6',
    name: 'Olivia Brown',
    lastMessage: 'Where are you located?',
    time: '2d ago',
    unread: false,
    listingTitle: 'Wooden Dining Table',
    avatar: 'OB',
  },
];

export default function MessagesScreen({ onOpenConversation }) {
  const renderMessageItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.messageItem,
        item.unread ? styles.unreadMessage : styles.readMessage
      ]}
      onPress={() => onOpenConversation(item.id)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.avatar}</Text>
      </View>
      
      {/* Message Content */}
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.timeContainer}>
            <Clock size={wp(3)} color="#6B7280" />
            <Text style={styles.time}>{item.time}</Text>
          </View>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
        <Text style={styles.listingTitle}>
          Re: {item.listingTitle}
        </Text>
      </View>
      
      {/* Unread Indicator */}
      {item.unread && (
        <View style={styles.unreadIndicator} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper bg="white">
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Messages List */}
      {messages.length > 0 ? (
        <FlatList
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesList}
        />
      ) : (
        /* Empty State */
        <View style={styles.emptyState}>
          <MessageCircle size={wp(16)} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyDescription}>
            When someone contacts you about a listing, you'll see it here
          </Text>
        </View>
      )}
    </View>
  </ScreenWrapper>
);

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
  },
  headerTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: '#111827',
  },
  messagesList: {
    flexGrow: 1,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    gap: wp(3),
    borderBottomWidth: 0.5,
    borderColor: '#E5E7EB',
    borderRadius: wp(2),
    
  },
  unreadMessage: {
    backgroundColor: 'rgba(79, 70, 229, 0.03)',
  },
  readMessage: {
    backgroundColor: 'white',
  },
  avatar: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: '#3F51B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: wp(3),
    fontWeight: '600',
  },
  messageContent: {
    flex: 1,
    minWidth: 0,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: hp(0.5),
  },
  name: {
    fontSize: wp(4),
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  time: {
    fontSize: wp(2.5),
    color: '#6B7280',
  },
  lastMessage: {
    fontSize: wp(3.5),
    color: '#6B7280',
    marginBottom: hp(0.5),
  },
  listingTitle: {
    fontSize: wp(2.5),
    color: '#3F51B5',
  },
  unreadIndicator: {
    width: wp(2),
    height: wp(2),
    backgroundColor: '#3F51B5',
    borderRadius: wp(1),
    marginTop: hp(1),
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(16),
  },
  emptyTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#111827',
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  emptyDescription: {
    fontSize: wp(3.5),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: hp(2.5),
  },
});