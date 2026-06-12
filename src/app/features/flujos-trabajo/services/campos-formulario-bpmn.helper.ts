import { CampoFormulario } from '../../formularios/models/formulario.model';

/**
 * Nombre de la camunda:Property donde serializamos los campos inline del formulario
 * dentro del XML BPMN. Debe coincidir con lo que el backend lee al parsear el XML del flujo.
 * Mismo patrón que `configuracionDocumental`.
 */
export const CAMPOS_FORMULARIO_PROPERTY_NAME = 'camposFormulario';

/**
 * Lee los campos inline (camposFormulario) desde el extensionElements de un elemento BPMN.
 * Devuelve [] si el elemento no tiene la propiedad declarada o el JSON es inválido.
 */
export function leerCamposFormulario(element: any): CampoFormulario[] {
  const bo = element?.businessObject;
  if (!bo) return [];

  const extensionElements = bo.get('extensionElements');
  if (!extensionElements?.values) return [];

  const properties = extensionElements.values.find((v: any) => v.$type === 'camunda:Properties');
  if (!properties?.values) return [];

  const prop = properties.values.find((p: any) => p.name === CAMPOS_FORMULARIO_PROPERTY_NAME);
  if (!prop?.value) return [];

  try {
    const parsed = JSON.parse(prop.value);
    return Array.isArray(parsed) ? parsed.map(normalizarCampo).filter((c): c is CampoFormulario => c !== null) : [];
  } catch {
    return [];
  }
}

/**
 * Escribe los campos inline como camunda:Property en el extensionElements del elemento.
 * Crea las estructuras intermedias si no existen y preserva otras propiedades
 * (p. ej. `configuracionDocumental`).
 *
 * Si `campos` está vacío, elimina la propiedad (el nodo vuelve a "solo plantilla").
 */
export function escribirCamposFormulario(
  modeler: any,
  element: any,
  campos: CampoFormulario[]
): void {
  if (!modeler || !element) return;

  const moddle = modeler.get('moddle');
  const modeling = modeler.get('modeling');
  const bo = element.businessObject;
  if (!bo) return;

  let extensionElements = bo.get('extensionElements');
  if (!extensionElements) {
    extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] });
  }

  const otherValues = (extensionElements.values || []).filter(
    (v: any) => v.$type !== 'camunda:Properties'
  );

  let properties = (extensionElements.values || []).find(
    (v: any) => v.$type === 'camunda:Properties'
  );

  if (!properties) {
    properties = moddle.create('camunda:Properties', { values: [] });
  }

  // Conservar todas las otras propiedades (configuracionDocumental, etc.).
  const otherProps = (properties.values || []).filter(
    (p: any) => p.name !== CAMPOS_FORMULARIO_PROPERTY_NAME
  );

  if (campos.length > 0) {
    const nuevaProp = moddle.create('camunda:Property', {
      name: CAMPOS_FORMULARIO_PROPERTY_NAME,
      value: JSON.stringify(campos)
    });
    properties.values = [...otherProps, nuevaProp];
  } else {
    // Sin campos inline → quitamos la propiedad.
    properties.values = otherProps;
  }

  extensionElements.values = [...otherValues, properties];
  modeling.updateProperties(element, { extensionElements });
}

/** Garantiza que un campo del JSON tenga los campos mínimos; descarta basura. */
function normalizarCampo(c: any): CampoFormulario | null {
  if (!c || typeof c.nombre !== 'string' || typeof c.tipo !== 'string') return null;
  return {
    nombre: c.nombre,
    etiqueta: typeof c.etiqueta === 'string' ? c.etiqueta : c.nombre,
    tipo: c.tipo,
    requerido: c.requerido === true,
    opciones: Array.isArray(c.opciones) ? c.opciones : undefined,
    columnas: Array.isArray(c.columnas) ? c.columnas : undefined,
    filas: Array.isArray(c.filas) ? c.filas : undefined
  };
}
