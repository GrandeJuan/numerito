import { RecursoNoEncontradoError, OperacionInvalidaError } from '../../../shared/domain/exceptions';
import type { UsuarioMembershipView } from '../../../iam/application/views/usuario-membership.view';
import type { CumplimientoSocioView } from '../../../obligaciones/application/views/cumplimiento-socio.view';
import type { CumplimientoSocioDto } from '../../../obligaciones/application/public-views';

export { CumplimientoSocioDto };

export interface CumplimientoSocioQuery {
  estudioId: string;
  usuarioId: string;
  periodo?: string;
  tipoObligacionId?: number;
  clienteId?: string;
  responsableId?: string;
  diasRiesgo?: number;
}

export class ObtenerCumplimientoSocioHandler {
  constructor(
    private readonly cumplimientoView: CumplimientoSocioView,
    private readonly membershipView: UsuarioMembershipView,
  ) {}

  async execute(query: CumplimientoSocioQuery): Promise<CumplimientoSocioDto> {
    const membership = await this.membershipView.execute({
      usuarioId: query.usuarioId,
      estudioId: query.estudioId,
    });

    if (!membership || !membership.isActive) {
      throw new RecursoNoEncontradoError('Membresía en estudio');
    }

    if (membership.rol !== 'SOCIO' && membership.rol !== 'RESPONSABLE') {
      throw new OperacionInvalidaError('Solo socios y responsables pueden ver el dashboard de cumplimiento');
    }

    return this.cumplimientoView.execute({
      estudioId: query.estudioId,
      periodo: query.periodo,
      tipoObligacionId: query.tipoObligacionId,
      clienteId: query.clienteId,
      responsableId: query.responsableId,
      diasRiesgo: query.diasRiesgo,
    });
  }
}
