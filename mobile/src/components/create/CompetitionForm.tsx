import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { ApiError } from '@/api/client';
import { api } from '@/api/endpoints';
import type { NewCompetition } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { DateField } from '@/components/ui/DateField';
import { FormField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/context/LanguageContext';
import { colors, radius } from '@/theme';
import { FormSection } from './FormSection';
import { RewardsEditor } from './RewardsEditor';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

type ScheduleKey = keyof NewCompetition['schedule'];

// Opens straight away, with later deadlines on the hour, so a quick post only needs the basics.
function defaultSchedule(): Record<ScheduleKey, Date> {
  const now = new Date(Math.floor(Date.now() / 60_000) * 60_000);
  const hour = Math.ceil(Date.now() / HOUR) * HOUR;
  return {
    registrationOpensAt: now,
    registrationClosesAt: new Date(hour + 7 * DAY),
    submissionStartsAt: now,
    submissionEndsAt: new Date(hour + 14 * DAY),
    resultAt: new Date(hour + 16 * DAY),
  };
}

const emptyForm = () => ({
  title: '',
  category: '',
  about: '',
  entryFee: '0',
  capacity: '50',
  rewards: [''],
  givesCertificate: true,
  judgeName: '',
  judgeTitle: '',
  judgeYears: '',
  judgingParameters: '',
  rules: '',
  schedule: defaultSchedule(),
});

type Form = ReturnType<typeof emptyForm>;
type TextKey = Exclude<keyof Form, 'rewards' | 'givesCertificate' | 'schedule'>;

const toPaise = (value: string) => Math.round(Number(value) * 100);
const toLines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export function CompetitionForm() {
  const { t } = useLanguage();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Form>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<TextKey, string>>>({});
  const [rewardErrors, setRewardErrors] = useState<(string | null)[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const setDate = (key: ScheduleKey, date: Date) => set('schedule', { ...form.schedule, [key]: date });

  const validate = () => {
    const next: Partial<Record<TextKey, string>> = {};
    if (form.title.trim().length < 3) next.title = t.create.shortTitle;
    if (!form.category.trim()) next.category = t.create.required;
    if (!form.about.trim()) next.about = t.create.required;
    if (form.entryFee.trim() === '' || !(Number(form.entryFee) >= 0)) next.entryFee = t.create.invalidNumber;
    if (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) < 1) next.capacity = t.create.invalidCapacity;
    if (!form.judgeName.trim()) next.judgeName = t.create.required;
    if (!form.judgeTitle.trim()) next.judgeTitle = t.create.required;
    if (form.judgeYears.trim() && !Number.isInteger(Number(form.judgeYears))) next.judgeYears = t.create.invalidNumber;

    const nextRewards = form.rewards.map((r) => (Number(r) >= 1 ? null : t.create.invalidReward));
    setErrors(next);
    setRewardErrors(nextRewards);
    return Object.keys(next).length === 0 && nextRewards.every((e) => !e);
  };

  const submit = async () => {
    setServerError(null);
    if (!validate()) return;

    const body: NewCompetition = {
      title: form.title.trim(),
      category: form.category.trim(),
      about: form.about.trim(),
      entryFee: toPaise(form.entryFee),
      capacity: Number(form.capacity),
      rewards: form.rewards.map(toPaise),
      givesCertificate: form.givesCertificate,
      judge: {
        name: form.judgeName.trim(),
        title: form.judgeTitle.trim(),
        experienceYears: form.judgeYears.trim() ? Number(form.judgeYears) : undefined,
      },
      schedule: {
        registrationOpensAt: form.schedule.registrationOpensAt.toISOString(),
        registrationClosesAt: form.schedule.registrationClosesAt.toISOString(),
        submissionStartsAt: form.schedule.submissionStartsAt.toISOString(),
        submissionEndsAt: form.schedule.submissionEndsAt.toISOString(),
        resultAt: form.schedule.resultAt.toISOString(),
      },
      judgingParameters: toLines(form.judgingParameters),
      rules: toLines(form.rules),
    };

    setSubmitting(true);
    try {
      const { competition } = await api.createCompetition(body);
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      toast(t.create.success, 'success');
      setForm(emptyForm());
      router.push(`/competitions/${competition.slug}`);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const text = (key: TextKey, label: string, props: Partial<ComponentProps<typeof FormField>> = {}) => (
    <FormField label={label} value={form[key]} onChangeText={(v) => set(key, v)} error={errors[key]} {...props} />
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText color={colors.textMuted}>{t.create.subtitle}</AppText>

        <FormSection title={t.create.basics}>
          {text('title', t.create.compTitle, { maxLength: 80 })}
          {text('category', t.create.category, { maxLength: 30, placeholder: t.create.categoryPlaceholder })}
          {text('about', t.create.about, { multiline: true, maxLength: 2000, style: styles.multiline })}
        </FormSection>

        <FormSection title={t.create.entry}>
          <View style={styles.row}>
            <View style={styles.flex}>{text('entryFee', t.create.entryFee, { keyboardType: 'decimal-pad', selectTextOnFocus: true })}</View>
            <View style={styles.flex}>{text('capacity', t.create.capacity, { keyboardType: 'number-pad', selectTextOnFocus: true })}</View>
          </View>
          <AppText size={12} color={colors.textMuted}>
            {t.create.entryFeeHint}
          </AppText>
          <View style={styles.switchRow}>
            <AppText style={styles.flex}>{t.create.certificate}</AppText>
            <Switch
              value={form.givesCertificate}
              onValueChange={(v) => set('givesCertificate', v)}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.white}
            />
          </View>
        </FormSection>

        <FormSection title={t.create.rewards}>
          <RewardsEditor rewards={form.rewards} onChange={(r) => set('rewards', r)} errors={rewardErrors} />
        </FormSection>

        <FormSection title={t.create.schedule}>
          <DateField label={t.create.registrationOpens} value={form.schedule.registrationOpensAt} onChange={(d) => setDate('registrationOpensAt', d)} />
          <DateField label={t.create.registrationCloses} value={form.schedule.registrationClosesAt} onChange={(d) => setDate('registrationClosesAt', d)} />
          <DateField label={t.submissionStarts} value={form.schedule.submissionStartsAt} onChange={(d) => setDate('submissionStartsAt', d)} />
          <DateField label={t.submissionEnds} value={form.schedule.submissionEndsAt} onChange={(d) => setDate('submissionEndsAt', d)} />
          <DateField label={t.resultDate} value={form.schedule.resultAt} onChange={(d) => setDate('resultAt', d)} />
        </FormSection>

        <FormSection title={t.create.judge}>
          {text('judgeName', t.create.judgeName, { maxLength: 60 })}
          {text('judgeTitle', t.create.judgeTitle, { maxLength: 80 })}
          {text('judgeYears', t.create.judgeYears, { keyboardType: 'number-pad', maxLength: 2 })}
        </FormSection>

        <FormSection title={t.create.details}>
          {text('judgingParameters', t.create.judgingParameters, { multiline: true, style: styles.multiline })}
          {text('rules', t.create.rules, { multiline: true, style: styles.multiline })}
        </FormSection>

        {serverError && (
          <View style={styles.serverError}>
            <AppText size={13} color={colors.danger}>
              {serverError}
            </AppText>
          </View>
        )}

        <Pressable
          onPress={submit}
          disabled={submitting}
          style={[styles.submit, submitting && styles.disabled]}
          accessibilityRole="button"
          accessibilityState={{ busy: submitting }}
        >
          {submitting ? (
            <View style={styles.busy}>
              <ActivityIndicator color={colors.white} />
              <AppText weight="semibold" size={16} color={colors.white}>
                {t.create.posting}
              </AppText>
            </View>
          ) : (
            <AppText weight="semibold" size={16} color={colors.white}>
              {t.create.submit}
            </AppText>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  serverError: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: 12 },
  submit: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center' },
  disabled: { opacity: 0.7 },
  busy: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
