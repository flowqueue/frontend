import { getQueue } from '@/queue/infrastructure/queue.api.js'

export async function getQueueUseCase(sedeId, servicioId) {
    return getQueue(sedeId, servicioId)
}
