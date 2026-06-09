/**
 * Clasificación de formatos de archivo para decidir cómo se ve / edita / descarga.
 * Alineado con FORMATOS_VISUALIZABLES del backend.
 */

export const FORMATOS_OFFICE_ONLYOFFICE = [
  'docx', 'xlsx', 'pptx', 'doc', 'xls', 'ppt',
  'odt', 'ods', 'odp',
  'pdf', 'txt', 'csv', 'rtf'
] as const;

export const FORMATOS_EDITABLES_ONLINE = ['docx', 'xlsx', 'pptx'] as const;

export const FORMATOS_MEDIA = [
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg',
  'mp4', 'mov', 'webm', 'mp3', 'wav'
] as const;

export type CaminoVer = 'onlyoffice' | 'navegador' | 'descargar';

/** Devuelve cómo se debe "ver" el archivo según su formato. */
export function caminoVer(formato: string | null | undefined): CaminoVer {
  const f = (formato ?? '').toLowerCase();
  if ((FORMATOS_OFFICE_ONLYOFFICE as readonly string[]).includes(f)) return 'onlyoffice';
  if ((FORMATOS_MEDIA as readonly string[]).includes(f)) return 'navegador';
  return 'descargar';
}

/** True si el archivo puede mostrar el botón "Ver" (office o media). */
export function puedeVerse(formato: string | null | undefined): boolean {
  return caminoVer(formato) !== 'descargar';
}

/** True si el archivo puede editarse online vía OnlyOffice (sin contar permisos del backend). */
export function esEditableOnline(formato: string | null | undefined): boolean {
  const f = (formato ?? '').toLowerCase();
  return (FORMATOS_EDITABLES_ONLINE as readonly string[]).includes(f);
}
