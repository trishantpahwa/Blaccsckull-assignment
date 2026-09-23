import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card style={styles.card}>
      <AppText weight="semibold" size={15}>
        {title}
      </AppText>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
});
