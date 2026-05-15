export class Notification {
  constructor({ id, userId, user_id, title, message, type = 'info', createdAt, created_at, read = false }) {
    this.id = id
    this.userId = userId ?? user_id ?? null
    this.user_id = this.userId
    this.title = title
    this.message = message
    this.type = type
    this.createdAt = createdAt ?? created_at ?? new Date().toISOString()
    this.created_at = this.createdAt
    this.read = read
  }
}
