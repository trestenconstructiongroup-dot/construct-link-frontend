import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TextStyle,
  useWindowDimensions,
  View,
  ViewStyle,
  Text as RNText,
} from 'react-native';
import { Colors, Fonts } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  useConversations,
  useConversationMessages,
  useUnreadCount,
  useSendMessage,
  useMarkConversationRead,
} from '../../../hooks/useMessaging';
import type { ConversationSummary, MessageItem } from '../../../services/api';
import WebLayout from '../layout';

const BRAND_BLUE = Colors.light.accentMuted;

export default function MessagesPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ conv?: string }>();
  const { isDark } = useTheme();
  const { token, user, isLoading: authLoading } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const isSmall = width < 768;
  const isLoggedIn = !!token && !!user;

  const [activeConvId, setActiveConvId] = useState<number | null>(
    params.conv ? Number(params.conv) : null,
  );
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<ScrollView>(null);

  // Queries
  const { data: convsData, isLoading: convsLoading } = useConversations(token, 1);
  const { data: msgsData, isLoading: msgsLoading } = useConversationMessages(
    token,
    activeConvId,
  );
  const sendMutation = useSendMessage();
  const markReadMutation = useMarkConversationRead();

  // When conv param changes (from button click navigation)
  useEffect(() => {
    if (params.conv) {
      setActiveConvId(Number(params.conv));
    }
  }, [params.conv]);

  // Mark conversation as read when opened
  useEffect(() => {
    if (!token || !activeConvId) return;
    markReadMutation.mutate({ token, conversationId: activeConvId });
  }, [activeConvId, token]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (msgsData?.results?.length) {
      setTimeout(() => {
        messagesEndRef.current?.scrollToEnd?.({ animated: false });
      }, 100);
    }
  }, [msgsData?.results?.length]);

  const handleSend = useCallback(() => {
    if (!token || !activeConvId || !messageText.trim()) return;
    sendMutation.mutate(
      { token, conversationId: activeConvId, content: messageText.trim() },
      {
        onSuccess: () => {
          setMessageText('');
          setTimeout(() => {
            messagesEndRef.current?.scrollToEnd?.({ animated: true });
          }, 200);
        },
      },
    );
  }, [token, activeConvId, messageText, sendMutation]);

  const handleSelectConv = useCallback((convId: number) => {
    setActiveConvId(convId);
  }, []);

  const handleBack = useCallback(() => {
    setActiveConvId(null);
  }, []);

  const activeConv = convsData?.results?.find((c) => c.id === activeConvId);

  // Auth guard
  if (authLoading) {
    return (
      <WebLayout>
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </WebLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <WebLayout>
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
          <RNText
            style={[styles.emptyTitle, { color: colors.text, fontFamily: Fonts.display }]}
          >
            Sign in to view messages
          </RNText>
          <Pressable
            style={[styles.signInBtn, { backgroundColor: BRAND_BLUE }]}
            onPress={() => router.push('/login')}
          >
            <RNText style={styles.signInBtnText}>Sign In</RNText>
          </Pressable>
        </View>
      </WebLayout>
    );
  }

  // Mobile: show either list or conversation
  if (isSmall && activeConvId) {
    return (
      <WebLayout>
        <View style={[styles.fullContainer, { backgroundColor: colors.background }]}>
          <ConversationView
            conv={activeConv}
            messages={msgsData?.results ?? []}
            loading={msgsLoading}
            currentUserId={user!.id}
            messageText={messageText}
            setMessageText={setMessageText}
            onSend={handleSend}
            sending={sendMutation.isPending}
            onBack={handleBack}
            colors={colors}
            isDark={isDark}
            messagesEndRef={messagesEndRef}
          />
        </View>
      </WebLayout>
    );
  }

  return (
    <WebLayout>
      <View style={[styles.pageContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.inner, isSmall && styles.innerSmall]}>
          <RNText
            style={[styles.pageTitle, { color: colors.text, fontFamily: Fonts.display }]}
          >
            Messages
          </RNText>

          <View style={[styles.splitPanel, isSmall && styles.splitPanelSmall]}>
            {/* Conversation list */}
            <View
              style={[
                styles.listPanel,
                isSmall && styles.listPanelSmall,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  borderColor: colors.border,
                },
              ]}
            >
              {convsLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator size="small" color={colors.tint} />
                </View>
              ) : !convsData?.results?.length ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={40}
                    color={colors.textSecondary}
                  />
                  <RNText
                    style={[
                      styles.emptyText,
                      { color: colors.textSecondary, fontFamily: Fonts.body },
                    ]}
                  >
                    No conversations yet
                  </RNText>
                  <RNText
                    style={[
                      styles.emptySubtext,
                      { color: colors.textTertiary, fontFamily: Fonts.body },
                    ]}
                  >
                    Contact a worker or company to start messaging
                  </RNText>
                </View>
              ) : (
                <ScrollView style={styles.listScroll}>
                  {convsData.results.map((conv) => (
                    <ConversationListItem
                      key={conv.id}
                      conv={conv}
                      isActive={conv.id === activeConvId}
                      colors={colors}
                      isDark={isDark}
                      onPress={() => handleSelectConv(conv.id)}
                    />
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Conversation detail (desktop only) */}
            {!isSmall && (
              <View style={[styles.chatPanel, { borderColor: colors.border }]}>
                {activeConvId ? (
                  <ConversationView
                    conv={activeConv}
                    messages={msgsData?.results ?? []}
                    loading={msgsLoading}
                    currentUserId={user!.id}
                    messageText={messageText}
                    setMessageText={setMessageText}
                    onSend={handleSend}
                    sending={sendMutation.isPending}
                    colors={colors}
                    isDark={isDark}
                    messagesEndRef={messagesEndRef}
                  />
                ) : (
                  <View style={styles.noConvSelected}>
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={48}
                      color={colors.textSecondary}
                    />
                    <RNText
                      style={[
                        styles.noConvText,
                        { color: colors.textSecondary, fontFamily: Fonts.body },
                      ]}
                    >
                      Select a conversation to start messaging
                    </RNText>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </WebLayout>
  );
}

/* ------------------------------------------------------------------ */
/*  Conversation list item                                             */
/* ------------------------------------------------------------------ */

function ConversationListItem({
  conv,
  isActive,
  colors,
  isDark,
  onPress,
}: {
  conv: ConversationSummary;
  isActive: boolean;
  colors: typeof Colors.light;
  isDark: boolean;
  onPress: () => void;
}) {
  const hasUnread = conv.unread_count > 0;
  const timeStr = conv.last_message_at
    ? formatRelativeTime(conv.last_message_at)
    : '';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.convItem,
        isActive && {
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
      ]}
    >
      {/* Avatar */}
      <View style={[styles.convAvatar, { backgroundColor: colors.tint + '30' }]}>
        {conv.other_user_photo ? (
          <Image
            source={{ uri: conv.other_user_photo }}
            style={styles.convAvatarImg}
          />
        ) : (
          <Ionicons
            name={conv.other_user_type === 'company' ? 'business' : 'person'}
            size={20}
            color={colors.tint}
          />
        )}
      </View>

      {/* Info */}
      <View style={styles.convInfo}>
        <View style={styles.convTopRow}>
          <RNText
            style={[
              styles.convName,
              { color: colors.text, fontFamily: Fonts.heading },
              hasUnread && { fontWeight: '700' },
            ]}
            numberOfLines={1}
          >
            {conv.other_user_name}
          </RNText>
          {timeStr ? (
            <RNText
              style={[
                styles.convTime,
                { color: colors.textSecondary, fontFamily: Fonts.body },
              ]}
            >
              {timeStr}
            </RNText>
          ) : null}
        </View>
        <View style={styles.convBottomRow}>
          <RNText
            style={[
              styles.convPreview,
              { color: colors.textSecondary, fontFamily: Fonts.body },
              hasUnread && { color: colors.text, fontWeight: '600' },
            ]}
            numberOfLines={1}
          >
            {conv.last_message_content || 'No messages yet'}
          </RNText>
          {hasUnread && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.tint }]}>
              <RNText style={styles.unreadBadgeText}>
                {conv.unread_count > 99 ? '99+' : conv.unread_count}
              </RNText>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  Conversation view (messages + compose)                             */
/* ------------------------------------------------------------------ */

function ConversationView({
  conv,
  messages,
  loading,
  currentUserId,
  messageText,
  setMessageText,
  onSend,
  sending,
  onBack,
  colors,
  isDark,
  messagesEndRef,
}: {
  conv?: ConversationSummary;
  messages: MessageItem[];
  loading: boolean;
  currentUserId: number;
  messageText: string;
  setMessageText: (t: string) => void;
  onSend: () => void;
  sending: boolean;
  onBack?: () => void;
  colors: typeof Colors.light;
  isDark: boolean;
  messagesEndRef: React.RefObject<ScrollView>;
}) {
  return (
    <View style={styles.chatContainer}>
      {/* Header */}
      <View
        style={[
          styles.chatHeader,
          {
            borderBottomColor: colors.border,
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          },
        ]}
      >
        {onBack && (
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        )}
        {conv && (
          <View style={styles.chatHeaderInfo}>
            <View style={[styles.chatHeaderAvatar, { backgroundColor: colors.tint + '30' }]}>
              {conv.other_user_photo ? (
                <Image
                  source={{ uri: conv.other_user_photo }}
                  style={styles.chatHeaderAvatarImg}
                />
              ) : (
                <Ionicons
                  name={conv.other_user_type === 'company' ? 'business' : 'person'}
                  size={18}
                  color={colors.tint}
                />
              )}
            </View>
            <View>
              <RNText
                style={[
                  styles.chatHeaderName,
                  { color: colors.text, fontFamily: Fonts.heading },
                ]}
              >
                {conv.other_user_name}
              </RNText>
              <RNText
                style={[
                  styles.chatHeaderType,
                  { color: colors.textSecondary, fontFamily: Fonts.body },
                ]}
              >
                {conv.other_user_type === 'company' ? 'Company' : 'Worker'}
              </RNText>
            </View>
          </View>
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={messagesEndRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContent}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color={colors.tint} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.noMessages}>
            <Ionicons name="chatbubble-outline" size={32} color={colors.textSecondary} />
            <RNText
              style={[
                styles.noMessagesText,
                { color: colors.textSecondary, fontFamily: Fonts.body },
              ]}
            >
              No messages yet. Say hello!
            </RNText>
          </View>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMine={msg.sender === currentUserId}
              colors={colors}
              isDark={isDark}
            />
          ))
        )}
      </ScrollView>

      {/* Compose */}
      <View
        style={[
          styles.composeBar,
          {
            borderTopColor: colors.border,
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          },
        ]}
      >
        <TextInput
          style={[
            styles.composeInput,
            {
              color: colors.text,
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              fontFamily: Fonts.body,
            },
          ]}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={5000}
          onKeyPress={(e: any) => {
            if (
              Platform.OS === 'web' &&
              e.nativeEvent.key === 'Enter' &&
              !e.nativeEvent.shiftKey
            ) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <Pressable
          onPress={onSend}
          disabled={sending || !messageText.trim()}
          style={[
            styles.sendBtn,
            {
              backgroundColor:
                sending || !messageText.trim()
                  ? colors.textSecondary + '40'
                  : BRAND_BLUE,
            },
          ]}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Message bubble                                                     */
/* ------------------------------------------------------------------ */

function MessageBubble({
  msg,
  isMine,
  colors,
  isDark,
}: {
  msg: MessageItem;
  isMine: boolean;
  colors: typeof Colors.light;
  isDark: boolean;
}) {
  const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
      <View
        style={[
          styles.bubble,
          isMine
            ? [styles.bubbleMine, { backgroundColor: BRAND_BLUE }]
            : [
                styles.bubbleTheirs,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
                },
              ],
        ]}
      >
        {!isMine && (
          <RNText
            style={[
              styles.bubbleSender,
              { color: colors.tint, fontFamily: Fonts.heading },
            ]}
          >
            {msg.sender_name}
          </RNText>
        )}
        <RNText
          style={[
            styles.bubbleText,
            { color: isMine ? '#fff' : colors.text, fontFamily: Fonts.body },
          ]}
        >
          {msg.content}
        </RNText>
        <RNText
          style={[
            styles.bubbleTime,
            {
              color: isMine ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
              fontFamily: Fonts.body,
            },
          ]}
        >
          {timeStr}
        </RNText>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatRelativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(isoStr).toLocaleDateString();
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  } as ViewStyle,
  fullContainer: {
    flex: 1,
  } as ViewStyle,
  pageContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'web' ? 100 : 24,
  } as ViewStyle,
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  } as ViewStyle,
  innerSmall: {
    paddingHorizontal: 0,
  } as ViewStyle,
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
  } as TextStyle,
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 16,
  } as TextStyle,
  signInBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  } as ViewStyle,
  signInBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  } as TextStyle,

  /* Split panel */
  splitPanel: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
  } as ViewStyle,
  splitPanelSmall: {
    flexDirection: 'column',
  } as ViewStyle,

  /* Conversation list */
  listPanel: {
    width: 360,
    borderRightWidth: 1,
    borderWidth: 1,
    borderRadius: 12,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  } as ViewStyle,
  listPanelSmall: {
    width: '100%',
    borderRightWidth: 0,
    borderRadius: 12,
  } as ViewStyle,
  listScroll: {
    flex: 1,
  } as ViewStyle,
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  } as ViewStyle,
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  } as TextStyle,
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
  } as TextStyle,

  /* Conversation item */
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  } as ViewStyle,
  convAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  } as ViewStyle,
  convAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  } as any,
  convInfo: {
    flex: 1,
    minWidth: 0,
  } as ViewStyle,
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  } as ViewStyle,
  convName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  } as TextStyle,
  convTime: {
    fontSize: 12,
  } as TextStyle,
  convBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  convPreview: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  } as TextStyle,
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  } as ViewStyle,
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  } as TextStyle,

  /* Chat panel */
  chatPanel: {
    flex: 1,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  } as ViewStyle,
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  } as ViewStyle,
  noConvSelected: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  } as ViewStyle,
  noConvText: {
    fontSize: 15,
    textAlign: 'center',
  } as TextStyle,

  /* Chat header */
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  } as ViewStyle,
  backBtn: {
    padding: 4,
    marginRight: 4,
  } as ViewStyle,
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  } as ViewStyle,
  chatHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  } as ViewStyle,
  chatHeaderAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  } as any,
  chatHeaderName: {
    fontSize: 15,
    fontWeight: '600',
  } as TextStyle,
  chatHeaderType: {
    fontSize: 12,
  } as TextStyle,

  /* Messages */
  messagesScroll: {
    flex: 1,
  } as ViewStyle,
  messagesContent: {
    padding: 16,
    gap: 8,
    flexGrow: 1,
    justifyContent: 'flex-end',
  } as ViewStyle,
  noMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 48,
  } as ViewStyle,
  noMessagesText: {
    fontSize: 14,
    textAlign: 'center',
  } as TextStyle,

  /* Bubble */
  bubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  } as ViewStyle,
  bubbleRowMine: {
    justifyContent: 'flex-end',
  } as ViewStyle,
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  } as ViewStyle,
  bubbleMine: {
    borderBottomRightRadius: 4,
  } as ViewStyle,
  bubbleTheirs: {
    borderBottomLeftRadius: 4,
  } as ViewStyle,
  bubbleSender: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  } as TextStyle,
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  } as TextStyle,
  bubbleTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  } as TextStyle,

  /* Compose */
  composeBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  } as ViewStyle,
  composeInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  } as TextStyle,
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
});
