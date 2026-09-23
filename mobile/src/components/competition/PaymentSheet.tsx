import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { PaymentOrder } from '@/api/types';
import { colors } from '@/theme';
import { checkoutUrl, parseCheckoutMessage, type CheckoutResult } from './checkout';

interface Props {
  order: PaymentOrder | null;
  prefill: { name?: string; email?: string };
  description: string;
  onResult: (result: CheckoutResult) => void;
}

// Razorpay's checkout runs inside a WebView page served by our backend, so this works in Expo Go
// without the native Razorpay SDK.
export function PaymentSheet({ order, prefill, description, onResult }: Props) {
  const handleMessage = (event: WebViewMessageEvent) => {
    const result = parseCheckoutMessage(event.nativeEvent.data);
    if (result) onResult(result);
  };

  return (
    <Modal visible={Boolean(order)} animationType="slide" onRequestClose={() => onResult({ type: 'dismissed' })}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => onResult({ type: 'dismissed' })} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close payment">
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>
        {order && (
          <WebView
            source={{ uri: checkoutUrl(order, prefill, description) }}
            onMessage={handleMessage}
            onError={() => onResult({ type: 'error', message: 'Could not load the payment page' })}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            style={styles.webview}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 8 },
  webview: { flex: 1 },
});
