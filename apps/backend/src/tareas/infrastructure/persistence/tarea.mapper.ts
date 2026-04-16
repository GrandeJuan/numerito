import { z } from 'zod';
import {
  ESTADO_TAREA,
  PRIORIDAD,
  type EstadoTarea,
  type Prioridad,
} from '@numerito/shared';
import type { Mapper } from '../../../shared/domain';
import { Tarea } from '../../domain/entities/tarea.entity';
import type { TareaEntity } from './tarea.schema';

const estadoTareaValues = Object.values(ESTADO_TAREA) as [
  EstadoTarea,
  ...EstadoTarea[],
];
const prioridadValues = Object.values(PRIORIDAD) as [Prioridad, ...Prioridad[]];

const comentarioPersistenceSchema = z.object({
  usuarioId: z.string().min(1),
  texto: z.string(),
  fecha: z.string().min(1),
});

export const tareaPersistenceSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string().min(1),
  descripcion: z.string().optional(),
  clienteId: z.string().min(1).optional(),
  estudioId: z.string().min(1),
  estado: z.enum(estadoTareaValues),
  prioridad: z.enum(prioridadValues),
  responsableId: z.string().min(1).optional(),
  horasRegistradas: z.number(),
  comentarios: z.array(comentarioPersistenceSchema),
});

export type TareaPersistence = z.infer<typeof tareaPersistenceSchema>;

export class TareaMapper implements Mapper<Tarea, TareaPersistence> {
  toDomain(persistence: TareaPersistence): Tarea {
    const data = tareaPersistenceSchema.parse(persistence);
    return Tarea.reconstitute(
      {
        titulo: data.titulo,
        descripcion: data.descripcion,
        clienteId: data.clienteId,
        estudioId: data.estudioId,
        estado: data.estado,
        prioridad: data.prioridad,
        responsableId: data.responsableId,
        horasRegistradas: data.horasRegistradas,
        comentarios: data.comentarios.map((c) => ({
          usuarioId: c.usuarioId,
          texto: c.texto,
          fecha: new Date(c.fecha),
        })),
      },
      data.id,
    );
  }

  toPersistence(domain: Tarea): TareaPersistence {
    return {
      id: domain.id,
      titulo: domain.titulo,
      descripcion: domain.descripcion,
      clienteId: domain.clienteId,
      estudioId: domain.estudioId,
      estado: domain.estado,
      prioridad: domain.prioridad,
      responsableId: domain.responsableId,
      horasRegistradas: domain.horasRegistradas,
      comentarios: domain.comentarios.map((c) => ({
        usuarioId: c.usuarioId,
        texto: c.texto,
        fecha: c.fecha.toISOString(),
      })),
    };
  }

  fromSchema(entity: TareaEntity): TareaPersistence {
    return {
      id: entity.id,
      titulo: entity.titulo,
      descripcion: entity.descripcion,
      clienteId: entity.cliente?.id,
      estudioId: entity.estudio.id,
      estado: entity.estado.codigo as EstadoTarea,
      prioridad: entity.prioridad.codigo as Prioridad,
      responsableId: entity.responsable?.id,
      horasRegistradas: entity.horasRegistradas,
      comentarios: (entity.comentarios ?? []).map((c) => ({
        usuarioId: c.usuarioId,
        texto: c.texto,
        fecha: c.fecha,
      })),
    };
  }
}
