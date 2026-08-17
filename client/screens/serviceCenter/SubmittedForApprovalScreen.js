import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import BackButton from '../../src/components/ui/BackButton';

const THEME = {
  background: '#F7F8FA',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  accent: '#F5A524',
  success: '#10B981'
};

export default function SubmittedForApprovalScreen({ onFinish }) {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
      <View style={{ width: '100%', maxWidth: 440, marginBottom: 16, alignItems: 'flex-start' }}>
        <BackButton variant="card" label="Back to Login" onPress={onFinish} />
      </View>
      {/* Centered Success Checkmark Icon */}
      <View style={styles.iconCircle}>
        <Text style={styles.checkmarkIcon}>✓</Text>
      </View>

      <Text style={styles.heading}>Submitted for approval</Text>

      <View style={styles.card}>
        <Text style={styles.messageText}>
          Your business verification is under review. This usually takes 24-48 hours. We'll notify you once approved.
        </Text>

        {/* Checklist */}
        <View style={styles.checklist}>
          {/* Item 1 */}
          <View style={styles.checklistItem}>
            <View style={[styles.checkCircle, styles.checkCircleDone]}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
            <Text style={styles.checklistText}>Business details submitted</Text>
          </View>

          {/* Item 2 */}
          <View style={styles.checklistItem}>
            <View style={[styles.checkCircle, styles.checkCircleDone]}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
            <Text style={styles.checklistText}>Documents uploaded</Text>
          </View>

          {/* Item 3 */}
          <View style={styles.checklistItem}>
            <View style={[styles.checkCircle, styles.checkCirclePending]}>
              <Text style={styles.hourglass}>⏳</Text>
            </View>
            <Text style={[styles.checklistText, styles.checklistTextPending]}>
              Awaiting admin review
            </Text>
          </View>
        </View>
      </View>

      {/* Got it Button */}
      <TouchableOpacity style={styles.finishButton} onPress={onFinish}>
        <Text style={styles.finishButtonText}>Got it</Text>
      </TouchableOpacity>

      {/* Support Link */}
      <TouchableOpacity style={styles.supportLink} onPress={() => alert('Support contact details: support@autodoc.com / +1 (800) 123-4567')}>
        <Text style={styles.supportLinkText}>Have a query? Contact support</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: THEME.background,
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7', // Light green tint
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: THEME.success
  },
  checkmarkIcon: {
    fontSize: 40,
    color: THEME.success,
    fontWeight: 'bold'
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 20,
    textAlign: 'center'
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 32
  },
  messageText: {
    fontSize: 14,
    color: THEME.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24
  },
  checklist: {
    gap: 16
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  checkCircleDone: {
    backgroundColor: THEME.success
  },
  checkCirclePending: {
    backgroundColor: THEME.accent,
    opacity: 0.8
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  hourglass: {
    fontSize: 12
  },
  checklistText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.text
  },
  checklistTextPending: {
    color: THEME.accent
  },
  finishButton: {
    backgroundColor: THEME.accent,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold'
  },
  supportLink: {
    padding: 8
  },
  supportLinkText: {
    fontSize: 12,
    color: THEME.textSecondary,
    textDecorationLine: 'underline'
  }
});
