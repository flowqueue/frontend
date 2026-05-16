import { Turno } from '@/queue/domain/models/Turno.js'

export class TicketAssembler {
  static toEntity(resource) {
    return new Turno(resource)
  }

  static toEntities(resources = []) {
    return resources.map(resource => TicketAssembler.toEntity(resource))
  }

  static toResource(entity) {
    return { ...entity }
  }
}
