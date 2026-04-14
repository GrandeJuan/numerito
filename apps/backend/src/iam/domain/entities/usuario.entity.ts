import { BaseEntity } from '../../../shared/domain';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { UsuarioRegistrado } from '../events/usuario-registrado.event';
import type { Rol } from '@numerito/shared';

export type AuthProvider = 'google' | 'microsoft' | null;

interface CreateUsuarioProps {
  email: Email;
  password: Password;
  nombre: string;
  apellido: string;
  rol: Rol;
  provider?: AuthProvider;
  providerId?: string | null;
  themePreference?: 'light' | 'dark';
}

export class Usuario extends BaseEntity {
  private _email: Email;
  private _password: Password;
  private _nombre: string;
  private _apellido: string;
  private _rol: Rol;
  private _isActive: boolean;
  private _emailVerified: boolean;
  private _provider: AuthProvider;
  private _providerId: string | null;
  private _themePreference: 'light' | 'dark';

  private constructor(props: CreateUsuarioProps, id?: string) {
    super(id);
    this._email = props.email;
    this._password = props.password;
    this._nombre = props.nombre;
    this._apellido = props.apellido;
    this._rol = props.rol;
    this._isActive = true;
    this._emailVerified = false;
    this._provider = props.provider ?? null;
    this._providerId = props.providerId ?? null;
    this._themePreference = props.themePreference ?? 'light';
  }

  static create(props: CreateUsuarioProps, id?: string): Usuario {
    const usuario = new Usuario(props, id);
    usuario.addDomainEvent(new UsuarioRegistrado(usuario.id, props.email.value));
    return usuario;
  }

  get email(): Email {
    return this._email;
  }

  get password(): Password {
    return this._password;
  }

  get nombre(): string {
    return this._nombre;
  }

  get apellido(): string {
    return this._apellido;
  }

  get rol(): Rol {
    return this._rol;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  get provider(): AuthProvider {
    return this._provider;
  }

  get providerId(): string | null {
    return this._providerId;
  }

  get themePreference(): 'light' | 'dark' {
    return this._themePreference;
  }

  changeThemePreference(theme: 'light' | 'dark'): void {
    this._themePreference = theme;
    this.updatedAt = new Date();
  }

  linkSsoProvider(provider: AuthProvider, providerId: string): void {
    this._provider = provider;
    this._providerId = providerId;
    this._emailVerified = true;
    this.updatedAt = new Date();
  }

  changeRol(newRol: Rol): void {
    this._rol = newRol;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this._isActive = true;
    this.updatedAt = new Date();
  }

  verifyEmail(): void {
    this._emailVerified = true;
    this.updatedAt = new Date();
  }

  async changePassword(newPassword: Password): Promise<void> {
    this._password = newPassword;
    this.updatedAt = new Date();
  }
}
