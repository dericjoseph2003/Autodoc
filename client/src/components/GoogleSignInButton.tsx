import React, { useEffect, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '1050681123836-7ngn8pohp4rjh15f60f8bj3c974eessn.apps.googleusercontent.com';

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  label?: string;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
  label = 'Sign in with Google'
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const redirectUri = Platform.OS === 'web' && typeof window !== 'undefined' 
    ? window.location.origin 
    : makeRedirectUri({ preferLocalhost: true });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
    redirectUri
  });

  useEffect(() => {
    if (response?.type === 'success') {
      setLoading(true);
      const idToken = response.params?.id_token || response.authentication?.idToken;
      if (idToken) {
        onSuccess(idToken);
      } else if (onError) {
        onError('Google ID token was not received.');
      }
      setLoading(false);
    } else if (response?.type === 'error') {
      if (onError) {
        onError(response.error?.message || 'Google Authentication failed.');
      }
    }
  }, [response, onSuccess, onError]);

  const handlePress = async () => {
    if (disabled || loading) return;
    try {
      setLoading(true);
      if (request) {
        await promptAsync();
      } else if (onError) {
        onError('Google auth request is initializing. Please try again.');
      }
    } catch (err: any) {
      if (onError) onError(err.message || 'Google Auth prompt error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.googleButton, (disabled || loading || !request) && styles.disabledBtn]}
      disabled={disabled || loading || !request}
      onPress={handlePress}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#4285F4" />
      ) : (
        <View style={styles.contentRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="logo-google" size={18} color="#4285F4" />
          </View>
          <Text style={styles.buttonText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    cursor: Platform.OS === 'web' ? 'pointer' : 'auto'
  },
  disabledBtn: {
    opacity: 0.6
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EEF2F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2
  }
});
