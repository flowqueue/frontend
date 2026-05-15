export const EstadoTurno = Object.freeze({
    EN_ESPERA: 'en_espera',
    EN_ATENCION: 'en_atencion',
    ATENDIDO: 'atendido',
    AUSENTE: 'ausente',
    CANCELADO: 'cancelado',
})

export const EstadoTurnoLabel = Object.freeze({
    [EstadoTurno.EN_ESPERA]: 'En espera',
    [EstadoTurno.EN_ATENCION]: 'En atención',
    [EstadoTurno.ATENDIDO]: 'Completado',
    [EstadoTurno.AUSENTE]: 'Ausente',
    [EstadoTurno.CANCELADO]: 'Cancelado',
})

export function getEstadoLabel(estado) {
    return EstadoTurnoLabel[estado] ?? estado
}

export function getEstadoBadge(estado) {
    return {
        [EstadoTurno.EN_ESPERA]: 'badge-orange',
        [EstadoTurno.EN_ATENCION]: 'badge-blue',
        [EstadoTurno.ATENDIDO]: 'badge-green',
        [EstadoTurno.AUSENTE]: 'badge-red',
        [EstadoTurno.CANCELADO]: 'badge-red',
    }[estado] ?? 'badge-gray'
}
