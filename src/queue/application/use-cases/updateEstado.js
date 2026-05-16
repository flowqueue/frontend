import { updateTurnoEstado } from '@/queue/infrastructure/queue.api.js'

export async function updateEstado(id, estado, extra = {}) {
  return updateTurnoEstado(id, estado, extra)
}
