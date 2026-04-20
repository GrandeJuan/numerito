import type { ActividadRecienteTareasView } from '../../../tareas/application/views/actividad-reciente-tareas.view';
import type { ActividadRecienteVencimientosView } from '../../../obligaciones/application/views/actividad-reciente-vencimientos.view';
import type { UsuarioMembershipView } from '../../../iam/application/views/usuario-membership.view';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface ActividadQuery {
  estudioId: string;
  usuarioId: string;
  limit?: number;
  tipo?: 'todos' | 'tarea' | 'vencimiento';
}

export interface ActividadItem {
  tipo: 'tarea' | 'vencimiento';
  descripcion: string;
  fecha: string;
  usuario?: string;
}

export class ObtenerActividadHandler {
  constructor(
    private readonly actividadTareas: ActividadRecienteTareasView,
    private readonly actividadVencimientos: ActividadRecienteVencimientosView,
    private readonly membershipView: UsuarioMembershipView,
  ) {}

  async execute(query: ActividadQuery): Promise<ActividadItem[]> {
    const membership = await this.membershipView.execute({
      usuarioId: query.usuarioId,
      estudioId: query.estudioId,
    });

    if (!membership || !membership.isActive) {
      throw new RecursoNoEncontradoError('Membresía en estudio');
    }

    const limit = Math.min(query.limit ?? 50, 200);
    const tipo = query.tipo ?? 'todos';
    const esEmpleado = membership.rol === 'EMPLEADO';

    const fetchTareas = tipo === 'todos' || tipo === 'tarea';
    const fetchVencimientos = tipo === 'todos' || tipo === 'vencimiento';

    const [tareas, vencimientos] = await Promise.all([
      fetchTareas
        ? this.actividadTareas.execute({
            estudioId: query.estudioId,
            ...(esEmpleado ? { responsableId: query.usuarioId } : {}),
            limite: limit,
          })
        : Promise.resolve([]),
      fetchVencimientos
        ? this.actividadVencimientos.execute({
            estudioId: query.estudioId,
            limite: limit,
          })
        : Promise.resolve([]),
    ]);

    return [...tareas, ...vencimientos]
      .sort((a, b) => (b.fecha > a.fecha ? 1 : b.fecha < a.fecha ? -1 : 0))
      .slice(0, limit);
  }
}
