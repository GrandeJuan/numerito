import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { ClienteRepository } from '../../domain/repositories/cliente.repository';
import type { VencimientoRepository } from '../../../obligaciones/domain/repositories/vencimiento.repository';
import { Cuit } from '../../domain/value-objects/cuit.vo';
import { RazonSocial } from '../../domain/value-objects/razon-social.vo';
import { Cliente } from '../../domain/entities/cliente.entity';
import { ESTADO_VENCIMIENTO } from '@numerito/shared';
import { CONDICION_IVA, TIPO_CLIENTE, REGIMEN } from '@numerito/shared';
import type { TipoObligacion } from '@numerito/shared';
import type { ImportRow } from '../services/excel-parser.service';

export interface ImportarExcelCommand {
  rows: ImportRow[];
  dryRun: boolean;
  estadoHistoricos: 'PRESENTADO' | 'PENDIENTE';
}

export interface ClienteDiff {
  razonSocial: string;
  responsable: string | null;
  accion: 'CREAR' | 'EXISTENTE';
  clienteId?: string;
  vencimientosNuevos: number;
  vencimientosDuplicados: number;
}

export interface ImportResult {
  dryRun: boolean;
  totalFilas: number;
  clientesNuevos: number;
  clientesExistentes: number;
  vencimientosCreados: number;
  vencimientosDuplicados: number;
  errores: string[];
  detalle: ClienteDiff[];
}

function derivePeriodo(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function buildDescripcion(tipo: TipoObligacion, headerOriginal: string): string {
  return `${tipo} (importado desde "${headerOriginal}")`;
}

export class ImportarExcelHandler {
  constructor(
    private readonly clienteRepo: ClienteRepository,
    private readonly vencimientoRepo: VencimientoRepository,
  ) {}

  async execute(principal: EstudioPrincipal, command: ImportarExcelCommand): Promise<ImportResult> {
    const { rows, dryRun, estadoHistoricos } = command;
    const estado =
      estadoHistoricos === 'PRESENTADO'
        ? ESTADO_VENCIMIENTO.PRESENTADO
        : ESTADO_VENCIMIENTO.PENDIENTE;

    const existingClientes = await this.clienteRepo.findAll(principal);
    const clientesByName = new Map<string, Cliente>();
    for (const c of existingClientes) {
      clientesByName.set(c.razonSocial.value.toUpperCase(), c);
    }

    const errores: string[] = [];
    const detalle: ClienteDiff[] = [];
    let totalVencimientosCreados = 0;
    let totalVencimientosDuplicados = 0;
    let clientesNuevos = 0;
    let clientesExistentes = 0;
    let placeholderSeq = existingClientes.length + 1; // avoid collisions with existing placeholders

    for (const row of rows) {
      const normalizedName = row.razonSocial.toUpperCase();
      let cliente = clientesByName.get(normalizedName);
      let accion: 'CREAR' | 'EXISTENTE' = 'EXISTENTE';

      if (!cliente) {
        accion = 'CREAR';
        clientesNuevos++;

        if (!dryRun) {
          cliente = Cliente.create({
            cuit: Cuit.placeholder(placeholderSeq++),
            razonSocial: RazonSocial.create(row.razonSocial),
            condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
            tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
            regimen: REGIMEN.GENERAL,
            estudioId: principal.estudioId,
          });
          await this.clienteRepo.save(principal, cliente);
          clientesByName.set(normalizedName, cliente);
        }
      } else {
        clientesExistentes++;
      }

      // Count vencimientos for this row
      let nuevos = 0;
      let duplicados = 0;

      if (cliente) {
        const existingKeys = new Set(
          (await this.vencimientoRepo.findClienteIdAndPeriodoKeys(principal, cliente.id)).map(
            (v) => `${v.tipoObligacion}|${v.periodo}`,
          ),
        );

        for (const obl of row.obligaciones) {
          const periodo = derivePeriodo(obl.fecha);
          const key = `${obl.tipoObligacion}|${periodo}`;

          if (existingKeys.has(key)) {
            duplicados++;
            totalVencimientosDuplicados++;
            continue;
          }

          nuevos++;
          totalVencimientosCreados++;
          existingKeys.add(key); // prevent duplicates within same import

          if (!dryRun) {
            await this.vencimientoRepo.importar(principal, {
              clienteId: cliente.id,
              estudioId: principal.estudioId,
              tipoObligacion: obl.tipoObligacion,
              periodo,
              fechaVencimiento: obl.fecha,
              descripcion: buildDescripcion(obl.tipoObligacion, obl.headerOriginal),
              estado,
            });
          }
        }
      } else {
        // dryRun + new client: count all obligations as new
        nuevos = row.obligaciones.length;
        totalVencimientosCreados += nuevos;
      }

      detalle.push({
        razonSocial: row.razonSocial,
        responsable: row.responsable,
        accion,
        clienteId: cliente?.id,
        vencimientosNuevos: nuevos,
        vencimientosDuplicados: duplicados,
      });
    }

    return {
      dryRun,
      totalFilas: rows.length,
      clientesNuevos,
      clientesExistentes,
      vencimientosCreados: totalVencimientosCreados,
      vencimientosDuplicados: totalVencimientosDuplicados,
      errores,
      detalle,
    };
  }
}
