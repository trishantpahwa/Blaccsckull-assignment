import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import type { CtaState } from '@/lib/cta';
import { colors, radius } from '@/theme';

interface Props {
  state: CtaState;
  busyLabel: string | null;
  onPress: () => void;
}

export function PrimaryCTA({ state, busyLabel, onPress }: Props) {
  const disabled = !state.action || Boolean(busyLabel);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [styles.button, !state.action && styles.inactive, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityState={{ disabled, busy: Boolean(busyLabel) }}
      >
        {busyLabel ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.white} />
            <AppText weight="semibold" size={16} color={colors.white}>
              {busyLabel}
            </AppText>
          </View>
        ) : (
          <>
            <AppText weight="semibold" size={16} color={state.action ? colors.white : colors.textMuted}>
              {state.title}
            </AppText>
            {state.subtitle && (
              <AppText size={12} color={state.action ? '#D5EEEC' : colors.textMuted} numberOfLines={1}>
                {state.subtitle}
              </AppText>
            )}
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: colors.background },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  inactive: { backgroundColor: colors.border },
  pressed: { opacity: 0.9 },
  busy: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
