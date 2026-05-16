export class Notification {
  constructor({ id, userId, title, message, type = 'info', createdAt = new Date().toISOString(), read = false }) {
    this.id = id
    this.userId = userId
    this.title = title
    this.message = message
    this.type = type
    this.createdAt = createdAt
    this.read = read
  }
}
