import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { ApiError } from '@/api/client';
import { api } from '@/api/endpoints';
import type { PaymentOrder } from '@/api/types';
import type { CheckoutResult } from '@/components/competition/checkout';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/context/LanguageContext';
import { useInvalidateCompetition } from './useCompetition';

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

type Busy = 'registering' | 'confirming' | 'uploading' | null;

export function useRegistrationFlow(slug: string, registrationId: string | null) {
  const { t } = useLanguage();
  const toast = useToast();
  const refresh = useInvalidateCompetition(slug);
  const [busy, setBusy] = useState<Busy>(null);
  const [pending, setPending] = useState<{ order: PaymentOrder; registrationId: string } | null>(null);

  const fail = useCallback(
    (err: unknown) => {
      toast(err instanceof ApiError ? err.message : t.payment.unavailable, 'error');
      // Most failures (sold out, window closed) mean our copy of the page is stale.
      refresh();
    },
    [toast, t, refresh],
  );

  const register = useCallback(async () => {
    setBusy('registering');
    try {
      const { registration, payment } = await api.register(slug);
      if (payment) {
        setPending({ order: payment, registrationId: registration.id });
      } else {
        toast(t.payment.success, 'success');
      }
      refresh();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(null);
    }
  }, [slug, toast, t, refresh, fail]);

  const handleCheckout = useCallback(
    async (result: CheckoutResult) => {
      const current = pending;
      setPending(null);
      if (!current) return;

      if (result.type === 'success') {
        setBusy('confirming');
        try {
          await api.verifyPayment(current.registrationId, result.payload);
          toast(t.payment.success, 'success');
        } catch (err) {
          fail(err);
        } finally {
          setBusy(null);
          refresh();
        }
        return;
      }

      if (result.type === 'failed') toast(t.payment.failed, 'error');
      else if (result.type === 'dismissed') toast(t.payment.cancelled);
      else toast(t.payment.unavailable, 'error');
    },
    [pending, toast, t, fail, refresh],
  );

  const upload = useCallback(async () => {
    if (!registrationId) return;
    const picked = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets[0]) return;

    const asset = picked.assets[0];
    if (asset.size && asset.size > MAX_UPLOAD_BYTES) {
      toast(t.fileTooLarge, 'error');
      return;
    }

    const form = new FormData();
    if (Platform.OS === 'web' && asset.file) {
      form.append('file', asset.file, asset.name);
    } else {
      // React Native's FormData accepts a file descriptor object instead of a Blob.
      form.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'video/mp4' } as unknown as Blob);
    }

    setBusy('uploading');
    try {
      await api.uploadSubmission(registrationId, form);
      toast(t.submissionSuccess, 'success');
    } catch (err) {
      fail(err);
    } finally {
      setBusy(null);
      refresh();
    }
  }, [registrationId, toast, t, fail, refresh]);

  const busyLabel =
    busy === 'uploading' ? t.cta.uploading : busy === 'confirming' ? t.payment.confirming : busy ? t.cta.processing : null;

  return { register, upload, handleCheckout, pendingOrder: pending?.order ?? null, busyLabel };
}
