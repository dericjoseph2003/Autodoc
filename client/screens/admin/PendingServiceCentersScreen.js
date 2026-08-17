import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { adminApi } from '../../src/api/adminApi';
import BackButton from '../../src/components/ui/BackButton';

const THEME = {
  background: '#F4F6F9',      // Premium light grey/blue from Autodoc
  card: '#FFFFFF',            // Pure white card background
  border: '#E2E8F0',          // Soft light slate border
  text: '#0F172A',            // Charcoal/Navy text from Autodoc
  textSecondary: '#64748B',   // Slate grey subtext
  primary: '#0046AD',         // Deep Royal Blue from Autodoc
  accent: '#F5A524',          // Amber accent
  accentLight: '#FEF3C7',     // Light amber for badge
  badgeText: '#B45309',
  buttonBg: '#EEF2F6',
  error: '#EF4444'
};

export default function PendingServiceCentersScreen({ onSelectCenter, onBack }) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [serviceCenters, setServiceCenters] = useState([]);

  const fetchPendingCenters = async () => {
    setError('');
    try {
      const res = await adminApi.getPendingServiceCenters();
      if (res.success) {
        setServiceCenters(res.serviceCenters || []);
      } else {
        setError(res.message || 'Failed to fetch pending service centers');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching data');
    }
  };

  const handleLoad = async () => {
    setLoading(true);
    await fetchPendingCenters();
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPendingCenters();
    setRefreshing(false);
  };

  useEffect(() => {
    handleLoad();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <BackButton variant="card" label="Back" onPress={onBack} />
        )}
        <Text style={styles.headerTitle}>Pending Registrations</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[THEME.accent]}
              tintColor={THEME.accent}
            />
          }
        >
          <Text style={styles.subtitle}>
            Review and approve registration requests from new auto workshops and service partners.
          </Text>

          {serviceCenters.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>⏳</Text>
              <Text style={styles.emptyText}>All Caught Up!</Text>
              <Text style={styles.emptySubtext}>
                There are no pending service center registration requests at this time.
              </Text>
            </View>
          ) : (
            serviceCenters.map((center) => (
              <TouchableOpacity
                key={center._id}
                style={styles.card}
                onPress={() => onSelectCenter && onSelectCenter(center._id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.businessName} numberOfLines={1}>
                    🛠️ {center.businessName}
                  </Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Pending</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Contact Person</Text>
                    <Text style={styles.detailValue}>
                      👤 {center.contactPersonName || center.contactPerson || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>
                      📍 {center.city || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={styles.footerRow}>
                  <Text style={styles.viewDetailsLink}>View details and review →</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    position: 'relative'
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 10,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border
  },
  backBtnText: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: 'bold'
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.text
  },
  subtitle: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginBottom: 20,
    lineHeight: 18
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80
  },
  errorText: {
    color: THEME.error,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    fontSize: 13,
    fontWeight: '500'
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 13,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 18
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  businessName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.text,
    flex: 1,
    marginRight: 8
  },
  badge: {
    backgroundColor: THEME.accentLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: THEME.badgeText
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  detailItem: {
    flex: 1
  },
  detailLabel: {
    fontSize: 11,
    color: THEME.textSecondary,
    marginBottom: 4
  },
  detailValue: {
    fontSize: 13,
    color: THEME.text,
    fontWeight: '500'
  },
  footerRow: {
    marginTop: 4,
    alignItems: 'flex-end'
  },
  viewDetailsLink: {
    fontSize: 12,
    color: THEME.accent,
    fontWeight: 'bold'
  }
});
