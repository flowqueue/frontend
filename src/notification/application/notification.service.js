import { ref } from 'vue'
import { getNotifications, markNotificationAsRead } from '@/notification/infrastructure/notification.api.js'

const notifications = ref([])

export function useNotificationService() {
  async function load(userId) {
    notifications.value = await getNotifications(userId)
  }

  async function read(id) {
    const updated = await markNotificationAsRead(id)
    notifications.value = notifications.value.map(n => String(n.id) === String(id) ? updated : n)
  }

  return { notifications, load, read }
}
