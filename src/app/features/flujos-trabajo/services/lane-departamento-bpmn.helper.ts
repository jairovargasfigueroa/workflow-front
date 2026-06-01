/**
 * Lectura/escritura del departamentoId en un bpmn:Lane,
 * y utilidades para encontrar el lane que contiene un flowNode.
 *
 * El departamentoId se persiste como:
 *   <bpmn:lane>
 *     <bpmn:extensionElements>
 *       <camunda:properties>
 *         <camunda:property name="departamentoId" value="<id>"/>
 *       </camunda:properties>
 *     </bpmn:extensionElements>
 *     ...
 *   </bpmn:lane>
 *
 * El nombre de la property debe coincidir con lo que el backend lee.
 */
export const LANE_DEPARTAMENTO_PROPERTY_NAME = 'departamentoId';

export function leerDepartamentoIdDeLane(element: any): string | null {
  const bo = element?.businessObject;
  if (!bo) return null;
  const extensionElements = bo.get('extensionElements');
  if (!extensionElements?.values) return null;

  const properties = extensionElements.values.find((v: any) => v.$type === 'camunda:Properties');
  if (!properties?.values) return null;

  const prop = properties.values.find((p: any) => p.name === LANE_DEPARTAMENTO_PROPERTY_NAME);
  return prop?.value ?? null;
}

export function escribirDepartamentoIdEnLane(
  modeler: any,
  element: any,
  departamentoId: string | null
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
    (p: any) => p.name !== LANE_DEPARTAMENTO_PROPERTY_NAME
  );

  if (departamentoId) {
    const nuevaProp = moddle.create('camunda:Property', {
      name: LANE_DEPARTAMENTO_PROPERTY_NAME,
      value: departamentoId
    });
    properties.values = [...otherProps, nuevaProp];
  } else {
    properties.values = otherProps;
  }

  // Si no quedó ninguna property y no había otros valores, limpiamos el extensionElements.
  if ((properties.values?.length ?? 0) === 0 && otherValues.length === 0) {
    modeling.updateProperties(element, { extensionElements: undefined });
    return;
  }

  extensionElements.values = [...otherValues, properties];
  modeling.updateProperties(element, { extensionElements });
}

/**
 * Devuelve el bpmn:Lane que contiene al flowNode dado, o null si no está en ningún lane.
 * Recorre todos los procesos del modelo y revisa sus laneSets.
 */
export function encontrarLaneDeFlowNode(modeler: any, flowNodeElement: any): any | null {
  if (!modeler || !flowNodeElement) return null;
  const elementRegistry = modeler.get('elementRegistry');
  const flowNodeId = flowNodeElement.id;

  const lanes: any[] = elementRegistry.filter((el: any) => el.businessObject?.$type === 'bpmn:Lane');
  for (const lane of lanes) {
    const refs = lane.businessObject?.flowNodeRef || [];
    for (const ref of refs) {
      if (ref?.id === flowNodeId) return lane;
    }
  }
  return null;
}

/**
 * Lee el camunda:candidateGroups directo de un userTask (formato antiguo, sin lanes).
 */
export function leerCandidateGroupsDirecto(element: any): string | null {
  const bo = element?.businessObject;
  if (!bo) return null;
  const v = bo.get('camunda:candidateGroups');
  return v ? String(v) : null;
}
