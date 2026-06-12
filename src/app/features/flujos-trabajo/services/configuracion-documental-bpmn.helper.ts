import { ConfiguracionDocumental, emptyConfiguracionDocumental } from '../models/configuracion-documental.model';

/**
 * Nombre de la camunda:Property donde serializamos la ConfiguracionDocumental dentro del XML BPMN.
 * Debe coincidir con lo que el backend lee al parsear el XML del flujo.
 */
export const CONFIG_DOCUMENTAL_PROPERTY_NAME = 'configuracionDocumental';

/**
 * Lee la ConfiguracionDocumental desde el extensionElements de un elemento BPMN.
 * Devuelve null si el elemento no tiene la propiedad declarada.
 */
export function leerConfiguracionDocumental(element: any): ConfiguracionDocumental | null {
  const bo = element?.businessObject;
  if (!bo) return null;

  const extensionElements = bo.get('extensionElements');
  if (!extensionElements?.values) return null;

  const properties = extensionElements.values.find((v: any) => v.$type === 'camunda:Properties');
  if (!properties?.values) return null;

  const prop = properties.values.find((p: any) => p.name === CONFIG_DOCUMENTAL_PROPERTY_NAME);
  if (!prop?.value) return null;

  try {
    const parsed = JSON.parse(prop.value);
    return normalizar(parsed);
  } catch {
    return null;
  }
}

/**
 * Escribe la ConfiguracionDocumental como camunda:Property en el extensionElements del elemento.
 * Crea las estructuras intermedias si no existen.
 */
export function escribirConfiguracionDocumental(
  modeler: any,
  element: any,
  config: ConfiguracionDocumental
): void {
  if (!modeler || !element) return;

  const moddle = modeler.get('moddle');
  const modeling = modeler.get('modeling');
  const bo = element.businessObject;
  if (!bo) return;

  const jsonValue = JSON.stringify(config);

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

  const otherProps = (properties.values || []).filter(
    (p: any) => p.name !== CONFIG_DOCUMENTAL_PROPERTY_NAME
  );

  const nuevaProp = moddle.create('camunda:Property', {
    name: CONFIG_DOCUMENTAL_PROPERTY_NAME,
    value: jsonValue
  });

  properties.values = [...otherProps, nuevaProp];
  extensionElements.values = [...otherValues, properties];

  modeling.updateProperties(element, { extensionElements });
}

/**
 * Garantiza que la estructura tenga todos los campos esperados aunque el JSON antiguo
 * o malformado tenga algunos faltantes.
 */
function normalizar(parsed: any): ConfiguracionDocumental {
  const base = emptyConfiguracionDocumental();
  return {
    documentosProducidos: Array.isArray(parsed?.documentosProducidos) ? parsed.documentosProducidos : base.documentosProducidos,
    permisosDefaultAdHoc: {
      subidores: Array.isArray(parsed?.permisosDefaultAdHoc?.subidores) ? parsed.permisosDefaultAdHoc.subidores : [],
      lectores: Array.isArray(parsed?.permisosDefaultAdHoc?.lectores) ? parsed.permisosDefaultAdHoc.lectores : [],
      editores: Array.isArray(parsed?.permisosDefaultAdHoc?.editores) ? parsed.permisosDefaultAdHoc.editores : [],
      eliminadores: Array.isArray(parsed?.permisosDefaultAdHoc?.eliminadores) ? parsed.permisosDefaultAdHoc.eliminadores : []
    }
  };
}
