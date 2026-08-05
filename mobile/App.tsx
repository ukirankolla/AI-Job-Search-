import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

const FALLBACK_WEB_URL = 'https://noventra.com';

function resolveWebUrl(): string {
  const extra = Constants.expoConfig?.extra as { webUrl?: string } | undefined;
  return extra?.webUrl?.trim() || FALLBACK_WEB_URL;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

function isSameAppOrigin(host: string | null, appHost: string | null): boolean {
  if (!host || !appHost) return false;
  return host === appHost || host.endsWith(`.${appHost}`);
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppShell />
    </SafeAreaProvider>
  );
}

function AppShell() {
  const insets = useSafeAreaInsets();
  const initialUrl = resolveWebUrl();
  const appHost = hostOf(initialUrl);

  const [uri, setUri] = useState(initialUrl);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const webViewRef = useRef<WebView>(null);

  const openExternal = (url: string) => {
    Linking.openURL(url).catch(() => {});
    return false;
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri }}
        originWhitelist={['https://*', 'http://*']}
        javaScriptEnabled
        domStorageEnabled
        allowsBackForwardNavigationGestures
        onShouldStartLoadWithRequest={(request) => {
          const { url } = request;
          const parsed = hostOf(url);
          if (parsed === null) return false;
          const scheme = url.toLowerCase().split(':')[0];
          if (scheme !== 'https' && scheme !== 'http') return openExternal(url);
          if (!isSameAppOrigin(parsed, appHost)) return openExternal(url);
          return true;
        }}
        onNavigationStateChange={(nav) => {
          setUri(nav.url);
          setCanGoBack(nav.canGoBack);
          setCanGoForward(nav.canGoForward);
        }}
        onLoadStart={() => {
          setLoading(true);
          setFailed(false);
        }}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
        style={styles.web}
      />

      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      )}

      {failed && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>Could not reach Noventra</Text>
          <Text style={styles.errorBody}>
            The web app is not reachable at {initialUrl}. Set the deployed URL via the webUrl
            setting in mobile/app.json (extra.webUrl) or redeploy, then reload.
          </Text>
          <Pressable style={styles.retryButton} onPress={() => webViewRef.current?.reload()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      <View style={[styles.toolbar, { paddingBottom: insets.bottom }]}>
        <Pressable
          style={[styles.toolButton, !canGoBack && styles.toolButtonDisabled]}
          disabled={!canGoBack}
          onPress={() => webViewRef.current?.goBack()}
        >
          <Text style={styles.toolIcon}>◀</Text>
          <Text style={styles.toolLabel}>Back</Text>
        </Pressable>
        <Pressable
          style={[styles.toolButton, !canGoForward && styles.toolButtonDisabled]}
          disabled={!canGoForward}
          onPress={() => webViewRef.current?.goForward()}
        >
          <Text style={styles.toolIcon}>▶</Text>
          <Text style={styles.toolLabel}>Forward</Text>
        </Pressable>
        <Pressable style={styles.toolButton} onPress={() => webViewRef.current?.reload()}>
          <Text style={styles.toolIcon}>⟳</Text>
          <Text style={styles.toolLabel}>Reload</Text>
        </Pressable>
        <Pressable
          style={styles.toolButton}
          onPress={() => (uri.startsWith('http') ? openExternal(uri) : undefined)}
        >
          <Text style={styles.toolIcon}>↗</Text>
          <Text style={styles.toolLabel}>Open</Text>
        </Pressable>
      </View>

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  web: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  errorBody: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#1e293b',
  },
  toolButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  toolButtonDisabled: {
    opacity: 0.35,
  },
  toolIcon: {
    color: '#e2e8f0',
    fontSize: 16,
    lineHeight: 20,
  },
  toolLabel: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 1,
  },
});
