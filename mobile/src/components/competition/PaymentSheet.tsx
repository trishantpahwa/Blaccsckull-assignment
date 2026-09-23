import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { PaymentOrder } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { useLanguage } from '@/context/LanguageContext';
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
export function PaymentSheet({ order, onResult, ...rest }: Props) {
  return (
    <Modal
      visible={Boolean(order)}
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => onResult({ type: 'dismissed' })}
    >
      {/* A Modal is a separate native window, so it needs its own provider to get real insets. */}
      <SafeAreaProvider>{order && <Checkout order={order} onResult={onResult} {...rest} />}</SafeAreaProvider>
    </Modal>
  );
}

function Checkout({ order, prefill, description, onResult }: Props & { order: PaymentOrder }) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const handleMessage = (event: WebViewMessageEvent) => {
    const result = parseCheckoutMessage(event.nativeEvent.data);
    if (result) onResult(result);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => onResult({ type: 'dismissed' })}
          hitSlop={12}
          style={styles.close}
          accessibilityRole="button"
          accessibilityLabel={t.close}
        >
          <Ionicons name="close" size={24} color={colors.white} />
        </Pressable>
        <View style={styles.title}>
          <Ionicons name="lock-closed" size={14} color={colors.white} />
          <AppText weight="semibold" size={16} color={colors.white}>
            {t.payment.title}
          </AppText>
        </View>
        <View style={styles.close} />
      </View>
      <WebView
        source={{ uri: checkoutUrl(order, prefill, description) }}
        onMessage={handleMessage}
        onError={() => onResult({ type: 'error', message: 'Could not load the payment page' })}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: colors.primary,
  },
  close: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  webview: { flex: 1 },
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
});
