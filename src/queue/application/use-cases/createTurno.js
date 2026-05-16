import { createTurno } from '@/queue/infrastructure/queue.api.js'

export async function createTurnoUseCase(payload) {
  return createTurno(payload)
}
