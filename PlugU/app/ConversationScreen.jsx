import React, { useState } from 'react';
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
import { ArrowLeft, Send } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import { StatusBar } from 'expo-status-bar';
import ScreenWrapper from '../components/ScreenWrapper';
import { router } from 'expo-router';

const conversationData = {
  name: 'Sarah Johnson',
  avatar: 'SJ',
  listingTitle: 'Modern Sofa Set',
  messages: [
    {
      id: '1',
      text: 'Hi! Is this Modern Sofa Set still available?',
      sender: 'them',
      time: '10:30 AM',
    },
    {
      id: '2',
      text: 'Yes, it is! Are you interested?',
      sender: 'me',
      time: '10:32 AM',
    },
    {
      id: '3',
      text: 'Great! Can I come see it this weekend?',
      sender: 'them',
      time: '10:35 AM',
    },
    {
      id: '4',
      text: 'Sure, Saturday afternoon works for me.',
      sender: 'me',
      time: '10:40 AM',
    },
    {
      id: '5',
      text: 'Perfect! What time would be best?',
      sender: 'them',
      time: '10:42 AM',
    },
  ],
};

export default function ConversationScreen({ conversationId,  }) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      // Handle send message
      setMessage('');
    }
  };

  const onBack = () => {
    router.back();
  }

  const renderMessage = (msg) => (
    <View
      key={msg.id}
      style={[
        styles.messageContainer,
        msg.sender === 'me' ? styles.myMessageContainer : styles.theirMessageContainer
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          msg.sender === 'me' ? styles.myMessageBubble : styles.theirMessageBubble
        ]}
      >
        <Text style={[
          styles.messageText,
          msg.sender === 'me' ? styles.myMessageText : styles.theirMessageText
        ]}>
          {msg.text}
        </Text>
        <Text style={[
          styles.messageTime,
          msg.sender === 'me' ? styles.myMessageTime : styles.theirMessageTime
        ]}>
          {msg.time}
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenWrapper>
       <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
      <StatusBar style="dark" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={wp(5)} color="#374151" />
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{conversationData.avatar}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{conversationData.name}</Text>
          <Text style={styles.listingTitle} numberOfLines={1}>
            Re: {conversationData.listingTitle}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView 
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {conversationData.messages.map(renderMessage)}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={message}
            onChangeText={setMessage}
            placeholderTextColor="#9CA3AF"
            onSubmitEditing={handleSend}
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={handleSend}
            disabled={!message.trim()}
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
  avatar: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: '#3F51B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: wp(3),
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#111827',
  },
  listingTitle: {
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
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  theirMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: wp(8),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
  },
  myMessageBubble: {
    backgroundColor: '#3F51B5',
  },
  theirMessageBubble: {
    backgroundColor: 'white',
  },
  messageText: {
    fontSize: wp(3.5),
  },
  myMessageText: {
    color: 'white',
  },
  theirMessageText: {
    color: '#111827',
  },
  messageTime: {
    fontSize: wp(2.5),
    marginTop: hp(0.5),
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirMessageTime: {
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