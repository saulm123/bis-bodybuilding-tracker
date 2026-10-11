import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.bis.bodybuildingtracker',
  appName: 'BIS Tracker',
  webDir: 'dist',
  backgroundColor: '#111111',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_bis',
      iconColor: '#EF9F27',
    },
  },
}

export default config
