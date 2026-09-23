import { useLocalSearchParams } from 'expo-router';
import { AuthForm } from '@/components/AuthForm';

export default function SignupScreen() {
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  return <AuthForm mode="signup" initialReferral={ref} />;
}
