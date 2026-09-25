import React, { useMemo, useState } from 'react';
import { View, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ShieldCheck } from 'lucide-react-native';
import { Text, COLORS } from './ui';
import { useT } from '../i18n';

/** Sent by the backend when an order is created with paymentMethod ONLINE */
export interface RazorpayPaymentDetails {
  provider: 'razorpay';
  keyId: string;
  testMode: boolean;
  razorpayOrderId: string;
  amount: number; // paise
  currency: string;
  description: string;
}

export interface RazorpaySuccess {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

/**
 * Razorpay Standard Checkout (checkout.js) inside a WebView, so it works in Expo Go
 * without a native module. UPI / card / net banking are all handled by Razorpay's page.
 */
export function RazorpayCheckout({
  payment,
  prefill,
  onSuccess,
  onDismiss,
  onFailure,
}: {
  payment: RazorpayPaymentDetails;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (result: RazorpaySuccess) => void;
  onDismiss: () => void;
  onFailure: (reason?: string) => void;
}) {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  const html = useMemo(() => {
    const options = {
      key: payment.keyId,
      order_id: payment.razorpayOrderId,
      amount: payment.amount,
      currency: payment.currency,
      name: 'Kala Vaani',
      description: payment.description,
      prefill: prefill ?? {},
      theme: { color: COLORS.primary },
      retry: { enabled: true, max_count: 3 },
    };
    // JSON is embedded in a <script>; escape "<" so data can never close the tag
    const json = JSON.stringify(options).replace(/</g, '\\u003c');
    return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>html,body{margin:0;height:100%;background:#FAF6F0;font-family:sans-serif}</style>
</head><body>
<script>
  function send(msg) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
  function start() {
    try {
      var options = ${json};
      options.handler = function (r) {
        send({ type: 'success', razorpayOrderId: r.razorpay_order_id, razorpayPaymentId: r.razorpay_payment_id, razorpaySignature: r.razorpay_signature });
      };
      options.modal = { ondismiss: function () { send({ type: 'dismiss' }); }, confirm_close: true };
      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function (r) {
        send({ type: 'failed', reason: r && r.error ? r.error.description : '' });
      });
      rzp.open();
      send({ type: 'opened' });
    } catch (e) {
      send({ type: 'error', reason: String(e && e.message || e) });
    }
  }
</script>
<script src="https://checkout.razorpay.com/v1/checkout.js" onload="start()" onerror="send({ type: 'error', reason: 'checkout.js failed to load' })"></script>
</body></html>`;
  }, [payment, prefill]);

  const handleMessage = (event: WebViewMessageEvent) => {
    let msg: any;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    switch (msg.type) {
      case 'opened':
        setLoading(false);
        break;
      case 'success':
        onSuccess({
          razorpayOrderId: msg.razorpayOrderId,
          razorpayPaymentId: msg.razorpayPaymentId,
          razorpaySignature: msg.razorpaySignature,
        });
        break;
      case 'dismiss':
        onDismiss();
        break;
      case 'failed':
        // Razorpay shows its own retry screen; only a final dismiss closes it
        console.warn('Razorpay payment failed:', msg.reason);
        break;
      case 'error':
        onFailure(msg.reason);
        break;
    }
  };

  return (
    <View className="flex-1 bg-artisan-canvas" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center border-b border-artisan-border bg-white px-4 py-2">
        <ShieldCheck color={COLORS.success} size={20} />
        <Text className="ml-2 flex-1 text-base font-bold text-artisan-slate" numberOfLines={1}>
          {t('buyer.securedBy')}
          {payment.testMode ? '  ·  TEST' : ''}
        </Text>
        <TouchableOpacity
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={t('profile.cancel')}
          className="h-11 w-11 items-center justify-center rounded-xl bg-artisan-light"
        >
          <X color={COLORS.ink} size={22} />
        </TouchableOpacity>
      </View>

      <WebView
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://checkout.razorpay.com' }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        // UPI apps (upi://, intent://, tez://, phonepe://, paytmmp://) must open outside the WebView
        onShouldStartLoadWithRequest={(req) => {
          const url = req.url || '';
          if (/^(https?|about|data|blob|javascript):/i.test(url)) return true;
          Linking.openURL(url).catch(() => {});
          return false;
        }}
        style={{ flex: 1, backgroundColor: '#FAF6F0' }}
      />

      {loading ? (
        <View
          key="rzp-loading"
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: insets.top + 60,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-3 text-base text-artisan-muted">{t('common.loading')}</Text>
        </View>
      ) : null}
    </View>
  );
}
