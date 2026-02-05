import { Platform } from 'react-native';
import WebLanding from './Landing.web';
import MobileLanding from './Landing.mobile';

export default function Landing() {
  if (Platform.OS === 'web') {
    return <WebLanding />;
  }
  return <MobileLanding />;
}