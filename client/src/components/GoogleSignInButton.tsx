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
  label = 'Continue with Google'
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
          <Ionicons name="logo-google" size={17} color="#4285F4" />
          <Text style={styles.buttonText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    width: '100%',
    height: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
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
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: -0.1
  }
});
