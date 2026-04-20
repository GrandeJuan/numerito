import type { Jurisdiccion } from '@numerito/shared';

export interface InscripcionJurisdiccionProps {
  readonly jurisdiccion: Jurisdiccion;
  readonly regimen: string;
  readonly activa: boolean;
  readonly desde: string;
}

export class InscripcionJurisdiccion {
  readonly jurisdiccion: Jurisdiccion;
  readonly regimen: string;
  readonly activa: boolean;
  readonly desde: string;

  private constructor(props: InscripcionJurisdiccionProps) {
    this.jurisdiccion = props.jurisdiccion;
    this.regimen = props.regimen;
    this.activa = props.activa;
    this.desde = props.desde;
  }

  static create(props: InscripcionJurisdiccionProps): InscripcionJurisdiccion {
    if (!props.jurisdiccion) throw new Error('Jurisdicción es requerida');
    if (!props.regimen) throw new Error('Régimen es requerido');
    if (!props.desde) throw new Error('Fecha desde es requerida');
    return new InscripcionJurisdiccion(props);
  }

  static reconstitute(props: InscripcionJurisdiccionProps): InscripcionJurisdiccion {
    return new InscripcionJurisdiccion(props);
  }

  conMismaJurisdiccion(other: InscripcionJurisdiccion): boolean {
    return this.jurisdiccion === other.jurisdiccion && this.regimen === other.regimen;
  }

  toPlain(): InscripcionJurisdiccionProps {
    return {
      jurisdiccion: this.jurisdiccion,
      regimen: this.regimen,
      activa: this.activa,
      desde: this.desde,
    };
  }
}
