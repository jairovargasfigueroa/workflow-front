export type TipoArchivoGenerado = 'xlsx' | 'pdf' | 'docx';

// Eventos SSE que vienen del backend — union discriminated por `tipo`.
// Nota: el evento `archivo_listo` del backend trae:
//   { tipo, archivo_id, nombre, url }
// El `tipoArchivo` lo derivamos en el cliente desde la extensión del `nombre`.
export type EventoSSE =
  | { tipo: 'tool_call'; nombre: string; params: unknown }
  | { tipo: 'tool_result'; nombre: string; resumen: string }
  | { tipo: 'texto'; contenido: string }
  | {
      tipo: 'archivo_listo';
      url: string;
      nombre: string;
      archivo_id?: string;
      tipoArchivo?: TipoArchivoGenerado;
    }
  | { tipo: 'fin' }
  | { tipo: 'error'; mensaje: string };

/**
 * Infiere el tipo de archivo desde la extensión del nombre.
 * Si no la reconoce, retorna 'xlsx' como fallback razonable.
 */
export function inferirTipoArchivo(nombre: string): TipoArchivoGenerado {
  const ext = nombre.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'pdf' || ext === 'docx') return ext;
  return 'xlsx';
}

// ----------------------- Modelo interno de la UI -----------------------

export type RolMensaje = 'usuario' | 'agente';

// Estado de cada herramienta que el agente está llamando.
export interface HerramientaEjecutada {
  nombre: string;
  estado: 'ejecutando' | 'completada';
  resumen: string | null;
}

// Archivo descargable adjunto a un mensaje del agente.
export interface ArchivoAdjunto {
  url: string;
  nombre: string;
  tipoArchivo: TipoArchivoGenerado;
}

// Una burbuja del chat. Puede ser del usuario (texto plano) o del agente
// (texto markdown + tools en curso + archivos adjuntos).
export interface ChatMensaje {
  id: string;
  rol: RolMensaje;
  texto: string;
  herramientas: HerramientaEjecutada[];
  archivos: ArchivoAdjunto[];
  estado: 'streaming' | 'completo' | 'error';
  errorMensaje?: string;
  timestamp: number;
}

export interface EnviarMensajeRequest {
  sesionId: string;
  mensaje: string;
}

// Sugerencias hardcoded mostradas como chips arriba del input.
export const SUGERENCIAS_RAPIDAS: string[] = [
  'Dame el top 10 trámites más lentos del mes',
  'Productividad por departamento esta semana',
  '¿Qué nodos del flujo tienen cuellos de botella?',
  'Listado de solicitudes rechazadas en mayo',
  'Generá un Excel con las tareas pendientes por funcionario'
];
