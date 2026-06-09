/**
 * Forma paginada del backend para el repositorio:
 *   { contenido, pagina, tamano, total, totalPaginas }
 * Nota: difiere del PaginatedResponse<T> usado en auditoría (campos distintos).
 */
export interface PaginaResponse<T> {
  contenido: T[];
  pagina: number;
  tamano: number;
  total: number;
  totalPaginas: number;
}

export interface RepositorioFiltros {
  tramiteId?: string | null;
  clienteId?: string | null;
  formato?: string | null;
  fechaDesde?: string | null;   // ISO datetime
  fechaHasta?: string | null;   // ISO datetime
  page?: number;
  size?: number;
}

/** Formatos comunes para el dropdown de filtro. */
export const FORMATOS_REPOSITORIO: string[] = [
  'pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png', 'gif', 'mp4', 'mov', 'txt', 'csv', 'zip'
];

export function iconoFormato(formato: string | null | undefined): string {
  const f = formato?.toLowerCase();
  if (!f) return 'insert_drive_file';
  if (['pdf'].includes(f)) return 'picture_as_pdf';
  if (['doc', 'docx'].includes(f)) return 'description';
  if (['xls', 'xlsx', 'csv'].includes(f)) return 'table_chart';
  if (['ppt', 'pptx'].includes(f)) return 'slideshow';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(f)) return 'image';
  if (['mp4', 'mov', 'avi', 'webm'].includes(f)) return 'movie';
  if (['mp3', 'wav', 'ogg'].includes(f)) return 'audiotrack';
  if (['zip', 'rar', '7z'].includes(f)) return 'folder_zip';
  return 'insert_drive_file';
}

export function colorFormato(formato: string | null | undefined): string {
  const f = formato?.toLowerCase();
  if (!f) return '#9ca3af';
  if (['pdf'].includes(f)) return '#c62828';
  if (['doc', 'docx'].includes(f)) return '#1565c0';
  if (['xls', 'xlsx', 'csv'].includes(f)) return '#1d6f42';
  if (['ppt', 'pptx'].includes(f)) return '#d84315';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(f)) return '#6a1b9a';
  if (['mp4', 'mov', 'avi', 'webm'].includes(f)) return '#0277bd';
  return '#9ca3af';
}
