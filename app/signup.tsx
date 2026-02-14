import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function SignupPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, []);
  return null;
}
