import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, getToken } from '../services/api';

const THEME = {
  background: '#F8F9FA',      // Light clean grey
  card: '#FFFFFF',            // Pure white card background
  border: '#E2E8F0',          // Soft light slate border
  text: '#1E1E1E',            // Charcoal text
  textSecondary: '#64748B',   // Slate gray subtext
  accent: '#FFA500',          // Vibrant Orange
  success: '#4CAF50',
  info: '#2196F3',
  system: '#9C27B0'
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isLoggedIn = getToken() !== null;

  const loadNotifications = async () => {
    if (!getToken()) return;
    try {
      setLoading(true);
      const res = await api.listNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadNotifications();
    }
  }, [isLoggedIn]);

  // Polling check to dynamically pull updates if user changes tabs
  useEffect(() => {
    const interval = setInterval(() => {
      if (getToken()) {
        api.listNotifications()
          .then(res => setNotifications(res.notifications || []))
          .catch(() => {});
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      // Reload lists
      await loadNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'appointment': return '📅';
      case 'roadside': return '🚨';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts & Notifications</Text>
      </View>

      {!getToken() ? (
        <View style={styles.centerMessage}>
          <Text style={styles.messageText}>Please login first on the Home tab to view notifications.</Text>
        </View>
      ) : loading && notifications.length === 0 ? (
        <View style={styles.centerMessage}>
          <ActivityIndicator size="large" color={THEME.accent} />
        </View>
      ) : notifications.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.centerMessage}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={THEME.accent} />}
        >
          <Text style={styles.messageIcon}>📭</Text>
          <Text style={styles.messageText}>No notifications yet.</Text>
          <Text style={styles.subMessageText}>We will alert you when your service center gets approved or when documents expire.</Text>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={THEME.accent} />}
        >
          {notifications.map(n => (
            <View key={n._id} style={[styles.card, n.read && styles.cardRead]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardIcon}>{getAlertIcon(n.type)}</Text>
                  <Text style={[styles.cardTitle, n.read && styles.textRead]}>
                    {n.title}
                  </Text>
                </View>
                {!n.read && (
                  <TouchableOpacity
                    style={styles.markReadBtn}
                    onPress={() => handleMarkAsRead(n._id)}
                  >
                    <Text style={styles.markReadText}>Mark read</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[styles.cardMessage, n.read && styles.textRead]}>
                {n.message}
              </Text>
              <Text style={styles.cardTime}>
                {new Date(n.createdAt).toLocaleString()}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    alignItems: 'center'
  },
  headerTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: 'bold'
  },
  centerMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  messageIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  messageText: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8
  },
  subMessageText: {
    color: THEME.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18
  },
  scrollContent: {
    padding: 16
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: THEME.accent
  },
  cardRead: {
    opacity: 0.6,
    borderLeftColor: THEME.border
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  cardIcon: {
    fontSize: 18
  },
  cardTitle: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1
  },
  textRead: {
    color: THEME.textSecondary
  },
  markReadBtn: {
    backgroundColor: '#333333',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4
  },
  markReadText: {
    color: THEME.accent,
    fontSize: 10,
    fontWeight: 'bold'
  },
  cardMessage: {
    color: THEME.text,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8
  },
  cardTime: {
    color: THEME.textSecondary,
    fontSize: 10
  }
});
