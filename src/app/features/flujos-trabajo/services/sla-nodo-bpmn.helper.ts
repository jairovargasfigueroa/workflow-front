/**
 * Lectura/escritura del slaNodoHoras en un bpmn:userTask como camunda:Property.
 * Conviven con otras properties (departamentoId en lane, configuracionDocumental en userTask)
 * porque preservamos las que no nombran 'slaNodoHoras'.
 *
 *   <bpmn:userTask>
 *     <bpmn:extensionElements>
 *       <camunda:properties>
 *         <camunda:property name="slaNodoHoras" value="24"/>
 *         <camunda:property name="configuracionDocumental" value="..."/>
 *       </camunda:properties>
 *     </bpmn:extensionElements>
 *   </bpmn:userTask>
 */
export const SLA_NODO_PROPERTY_NAME = 'slaNodoHoras';

export function leerSlaNodoHoras(element: any): number | null {
  const bo = element?.businessObject;
  if (!bo) return null;
  const extensionElements = bo.get('extensionElements');
  if (!extensionElements?.values) return null;

  const properties = extensionElements.values.find((v: any) => v.$type === 'camunda:Properties');
  if (!properties?.values) return null;

  const prop = properties.values.find((p: any) => p.name === SLA_NODO_PROPERTY_NAME);
  if (!prop?.value) return null;

  const num = parseInt(String(prop.value), 10);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export function escribirSlaNodoHoras(
  modeler: any,
  element: any,
  horas: number | null
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

  const otherProps = (properties.values || []).filter(
    (p: any) => p.name !== SLA_NODO_PROPERTY_NAME
  );

  if (horas != null && horas > 0) {
    const nuevaProp = moddle.create('camunda:Property', {
      name: SLA_NODO_PROPERTY_NAME,
      value: String(Math.floor(horas))
    });
    properties.values = [...otherProps, nuevaProp];
  } else {
    properties.values = otherProps;
  }

  // Si no quedó ninguna property ni otro extensionElement, limpiamos.
  if ((properties.values?.length ?? 0) === 0 && otherValues.length === 0) {
    modeling.updateProperties(element, { extensionElements: undefined });
    return;
  }

  extensionElements.values = [...otherValues, properties];
  modeling.updateProperties(element, { extensionElements });
}
