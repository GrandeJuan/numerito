import { SetMetadata } from '@nestjs/common';
import type { Rol } from '@numerito/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);
