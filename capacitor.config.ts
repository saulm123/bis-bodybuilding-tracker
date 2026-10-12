import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.bis.bodybuildingtracker',
  appName: 'BIS Tracker',
  webDir: 'dist',
  backgroundColor: '#111111',
  plugins: {
    // Native networking for Open Food Facts requests (its search service has no CORS).
    CapacitorHttp: {
      enabled: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_bis',
      iconColor: '#EF9F27',
    },
  },
}

export default config
