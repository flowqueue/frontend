export function formatTime(isoString) {
  if (!isoString) return '--:--'
  return new Date(isoString).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

export function minutesSince(isoString) {
  if (!isoString) return 0
  return Math.floor((Date.now() - new Date(isoString).getTime()) / 60000)
}

export function formatMinutes(minutes) {
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

export function timeAgo(isoString) {
  if (!isoString) return ''
  const minutes = minutesSince(isoString)
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `Hace ${days} d`
}

export function formatDuration(startIso, endIso) {
  const start = new Date(startIso)
  const end = endIso ? new Date(endIso) : new Date()
  const mins = Math.floor((end - start) / 60000)
  const secs = Math.floor(((end - start) % 60000) / 1000)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
