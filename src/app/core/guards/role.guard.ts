import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Rol } from '../models/enums';

/**
 * Guard genérico que valida que el usuario tenga uno de los roles permitidos.
 * Uso: { path: '...', canActivate: [roleGuard], data: { roles: ['ADMIN', 'FUNCIONARIO'] } }
 *
 * Si no está autenticado → redirige a /login.
 * Si está autenticado pero sin el rol permitido → redirige a /dashboard.
 */
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  const rolesPermitidos = (route.data?.['roles'] as Rol[] | undefined) ?? [];
  if (rolesPermitidos.length === 0) return true;

  if (rolesPermitidos.includes(user.rol)) return true;

  router.navigate(['/dashboard']);
  return false;
};
