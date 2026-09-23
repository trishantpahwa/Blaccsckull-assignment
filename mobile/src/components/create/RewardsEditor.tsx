import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { FormField } from '@/components/ui/FormField';
import { useLanguage } from '@/context/LanguageContext';
import { format } from '@/i18n';
import { formatRupees } from '@/lib/format';
import { colors, radius } from '@/theme';

const MAX_REWARDS = 20;

interface Props {
  rewards: string[];
  onChange: (rewards: string[]) => void;
  errors: (string | null)[];
}

export function RewardsEditor({ rewards, onChange, errors }: Props) {
  const { t } = useLanguage();
  const total = rewards.reduce((sum, value) => sum + (Number(value) > 0 ? Math.round(Number(value) * 100) : 0), 0);

  const update = (index: number, value: string) => onChange(rewards.map((r, i) => (i === index ? value : r)));
  const remove = (index: number) => onChange(rewards.filter((_, i) => i !== index));

  return (
    <View style={styles.wrap}>
      {rewards.map((value, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.field}>
            <FormField
              label={format(t.create.rewardAmount, { position: t.ordinal(i + 1) })}
              value={value}
              onChangeText={(text) => update(i, text)}
              keyboardType="decimal-pad"
              error={errors[i]}
            />
          </View>
          {rewards.length > 1 && (
            <Pressable
              onPress={() => remove(i)}
              style={styles.remove}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t.create.removeReward}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          )}
        </View>
      ))}

      <View style={styles.footer}>
        {rewards.length < MAX_REWARDS && (
          <Pressable onPress={() => onChange([...rewards, ''])} style={styles.add} accessibilityRole="button">
            <Ionicons name="add" size={18} color={colors.primary} />
            <AppText weight="medium" color={colors.primary}>
              {t.create.addReward}
            </AppText>
          </Pressable>
        )}
        <AppText weight="semibold" color={colors.primary} style={styles.total}>
          {format(t.create.prizePoolTotal, { amount: formatRupees(total) })}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  field: { flex: 1 },
  remove: { height: 46, width: 36, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  total: { marginLeft: 'auto' },
});
