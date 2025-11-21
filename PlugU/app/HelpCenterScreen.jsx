import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { ArrowLeft, Send, Bot } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper from '../components/ScreenWrapper';
import { router } from 'expo-router';

const botResponses = {
  'how to sell': 'To sell an item: 1) Tap the + button in the bottom navigation. 2) Upload photos of your item. 3) Add title, category, price, location, and description. 4) Tap "Post Listing". Your item will appear in the marketplace!',
  'sell': 'To sell an item: 1) Tap the + button in the bottom navigation. 2) Upload photos of your item. 3) Add title, category, price, location, and description. 4) Tap "Post Listing". Your item will appear in the marketplace!',
  'how to buy': 'To buy an item: 1) Browse the Market tab. 2) Tap on any listing to view details. 3) Use the message button to contact the seller. 4) Arrange pickup or delivery with the seller.',
  'buy': 'To buy an item: 1) Browse the Market tab. 2) Tap on any listing to view details. 3) Use the message button to contact the seller. 4) Arrange pickup or delivery with the seller.',
  'message': 'You can message sellers by tapping the "Message" button on any listing. All your conversations appear in the Messages tab. You can also send quick messages from the listing detail page.',
  'messages': 'You can message sellers by tapping the "Message" button on any listing. All your conversations appear in the Messages tab. You can also send quick messages from the listing detail page.',
  'community': 'The Community tab lets you connect with other users! Create posts, share tips, like and comment on posts. Tap on any username to view their profile and listings.',
  'post': 'To create a community post: 1) Go to the Community tab. 2) Tap "What\'s on your mind?" 3) Write your post. 4) Tap "Post". You can share tips, ask questions, or showcase your listings!',
  'profile': 'Your Profile shows your listings, stats, and ratings. Tap "Edit Profile" to update your info. You can view analytics by tapping on your stats like Views or Active Listings.',
  'edit profile': 'To edit your profile: 1) Go to Profile tab. 2) Tap "Edit Profile" button. 3) Update your name, email, phone, location, or profile picture. 4) Tap "Save Changes".',
  'settings': 'Access Settings from the Profile tab (gear icon in banner). You can manage notifications, privacy, language, and get help or support.',
  'review': 'After a sale, buyers can review sellers. This helps build trust in our community. Reviews include star ratings and optional written feedback.',
  'safety': 'Safety tips: 1) Always meet in public places. 2) Bring a friend. 3) Trust your instincts. 4) Don\'t share personal info upfront. 5) Use in-app messaging. 6) Report suspicious activity.',
  'payment': 'We recommend handling payments in person after inspecting the item. Always meet in safe, public locations. Never send money before seeing the item.',
  'report': 'To report a listing or user: 1) Go to the listing or profile. 2) Tap the three dots menu. 3) Select "Report". 4) Choose reason and submit. Our team will review it.',
  'default': 'I\'m here to help! I can answer questions about:\n\n• How to buy and sell items\n• Messaging sellers\n• Community features\n• Profile and settings\n• Safety tips\n• Reviews and ratings\n\nJust ask me anything!',
};

export default function HelpCenterScreen() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hi! I\'m your marketplace assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const scrollViewRef = useRef(null);

  const onBack = () => {
    router.back();
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    for (const key in botResponses) {
      if (lowerMessage.includes(key)) {
        return botResponses[key];
      }
    }
    
    return botResponses['default'];
  };

  const handleSend = () => {
    if (input.trim()) {
      const userMessage = {
        id: Date.now().toString(),
        text: input,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages([...messages, userMessage]);
      setInput('');

      // Simulate bot typing delay
      setTimeout(() => {
        const botMessage = {
          id: (Date.now() + 1).toString(),
          text: getBotResponse(input),
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMessage]);
      }, 1000);
    }
  };

  const renderMessage = (msg) => (
    <View
      key={msg.id}
      style={[
        styles.messageContainer,
        msg.sender === 'user' ? styles.userMessageContainer : styles.botMessageContainer
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          msg.sender === 'user' ? styles.userMessageBubble : styles.botMessageBubble
        ]}
      >
        <Text style={[
          styles.messageText,
          msg.sender === 'user' ? styles.userMessageText : styles.botMessageText
        ]}>
          {msg.text}
        </Text>
        <Text style={[
          styles.messageTime,
          msg.sender === 'user' ? styles.userMessageTime : styles.botMessageTime
        ]}>
          {msg.timestamp}
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenWrapper bg="#F9FAFB">
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={wp(5)} color="#374151" />
          </TouchableOpacity>
          <View style={styles.botAvatar}>
            <Bot size={wp(6)} color="white" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Help Center</Text>
            <Text style={styles.headerSubtitle}>AI Assistant • Always online</Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask me anything..."
              value={input}
              onChangeText={setInput}
              placeholderTextColor="#9CA3AF"
              onSubmitEditing={handleSend}
              multiline
            />
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Send size={wp(4)} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  botAvatar: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: '#3F51B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: wp(2.5),
    color: '#6B7280',
    marginTop: hp(0.25),
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    gap: hp(1),
  },
  messageContainer: {
    flexDirection: 'row',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: wp(8),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
  },
  userMessageBubble: {
    backgroundColor: '#3F51B5',
  },
  botMessageBubble: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  messageText: {
    fontSize: wp(3.5),
    lineHeight: hp(2.2),
  },
  userMessageText: {
    color: 'white',
  },
  botMessageText: {
    color: '#111827',
  },
  messageTime: {
    fontSize: wp(2.5),
    marginTop: hp(0.5),
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  botMessageTime: {
    color: '#6B7280',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.5),
  },
  inputRow: {
    flexDirection: 'row',
    gap: wp(2),
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp(50),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    fontSize: wp(3.5),
    color: '#111827',
    maxHeight: hp(12),
    textAlignVertical: 'center',
  },
  sendButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: '#3F51B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});