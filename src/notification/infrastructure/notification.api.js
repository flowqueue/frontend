import { http } from '@/shared/services/http.js'
import { Notification } from '@/notification/domain/Notification.js'

export async function getNotifications(userId) {
  try {
    const data = await http.get(`/notificaciones?userId=${userId}`)
    return data.map(n => new Notification(n))
  } catch (_) {
    return []
  }
}

export async function createNotification(payload) {
  return new Notification(await http.post('/notificaciones', payload))
}

export async function markNotificationAsRead(id) {
  return new Notification(await http.patch(`/notificaciones/${id}`, { read: true }))
}
