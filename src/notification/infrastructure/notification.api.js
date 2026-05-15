import { http } from '@/shared/services/http.js'
import { Notification } from '@/notification/domain/Notification.js'

export async function getNotifications(userId) {
  try {
    const data = await http.get(`/notificaciones?user_id=eq.${userId}`)
    return data.map(n => new Notification(n))
  } catch (_) {
    return []
  }
}

export async function createNotification(payload) {
  const resource = {
    user_id: payload.user_id ?? payload.userId,
    title: payload.title,
    message: payload.message,
    type: payload.type ?? 'info',
    created_at: payload.created_at ?? payload.createdAt ?? new Date().toISOString(),
    read: payload.read ?? false,
  }
  return new Notification(await http.post('/notificaciones', resource))
}

export async function markNotificationAsRead(id) {
  return new Notification(await http.patch(`/notificaciones/${id}`, { read: true }))
}
