import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.strideos.hybrid',
  appName: 'STRIDE OS',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    backgroundColor: '#090B0E',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
