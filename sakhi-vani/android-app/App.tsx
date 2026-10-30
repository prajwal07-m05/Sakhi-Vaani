import { StatusBar } from 'expo-status-bar'
import { SafeAreaView, Text, View, StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'

// URL of the SAKHI VANI mobile client: your PC's LAN address while developing
// (e.g. http://192.168.1.20:5173) or the hosted build. Never hardcode secrets here.
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL

export default function App() {
  if (!WEB_URL) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>SAKHI VANI</Text>
        <Text style={styles.body}>Set EXPO_PUBLIC_WEB_URL in android-app/.env to the address of the SAKHI VANI mobile client, then restart Expo.</Text>
      </View>
    )
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#13294B' }}>
      <StatusBar style="light" />
      <WebView
        source={{ uri: WEB_URL }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F6F3EC' },
  title: { fontSize: 24, fontWeight: '800', color: '#13294B', marginBottom: 12 },
  body: { fontSize: 15, color: '#1B2433', textAlign: 'center' },
})
