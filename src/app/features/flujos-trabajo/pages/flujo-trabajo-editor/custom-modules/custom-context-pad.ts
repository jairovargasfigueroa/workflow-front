class CustomContextPadProvider {
  static $inject = [
    'injector', 'contextPad', 'modeling', 'elementFactory',
    'connect', 'create', 'translate'
  ];

  private modeling: any;
  private elementFactory: any;
  private connect: any;
  private create: any;
  private autoPlace: any;
  private translate: any;

  constructor(
    injector: any, contextPad: any, modeling: any, elementFactory: any,
    connect: any, create: any, translate: any
  ) {
    this.modeling = modeling;
    this.elementFactory = elementFactory;
    this.connect = connect;
    this.create = create;
    this.translate = translate;
    this.autoPlace = injector.get('autoPlace', false);

    contextPad.registerProvider(this);
  }

  getContextPadEntries(element: any): Record<string, any> {
    const { modeling, elementFactory, connect, create, autoPlace, translate } = this;
    const type = element.businessObject?.$type || element.type;

    if (type === 'label') return {};

    const actions: Record<string, any> = {};

    function appendAction(bpmnType: string, className: string, title: string) {
      return {
        group: 'model',
        className,
        title: translate(title),
        action: {
          click: (_event: any, el: any) => {
            const shape = elementFactory.createShape({ type: bpmnType });
            if (autoPlace) {
              autoPlace.append(el, shape);
            } else {
              create.start(_event, shape, { source: el });
            }
          },
          dragstart: (_event: any, el: any) => {
            const shape = elementFactory.createShape({ type: bpmnType });
            create.start(_event, shape, { source: el });
          }
        }
      };
    }

    // Eliminar — para todos los elementos
    actions['delete'] = {
      group: 'edit',
      className: 'bpmn-icon-trash',
      title: translate('Eliminar'),
      action: {
        click: (_event: any, el: any) => modeling.removeElements([el])
      }
    };

    // End Events y Sequence Flows solo tienen delete
    if (type === 'bpmn:EndEvent' || type === 'bpmn:SequenceFlow') {
      return actions;
    }

    // Conectar — para elementos que pueden tener flujos salientes
    actions['connect'] = {
      group: 'connect',
      className: 'bpmn-icon-connection-multi',
      title: translate('Conectar'),
      action: {
        click: (_event: any, el: any) => connect.start(_event, el),
        dragstart: (_event: any, el: any) => connect.start(_event, el)
      }
    };

    // Start Event y User Task: pueden ir a cualquier tipo permitido
    if (type === 'bpmn:StartEvent' || type === 'bpmn:UserTask') {
      actions['append.user-task'] = appendAction(
        'bpmn:UserTask', 'bpmn-icon-user-task', 'Agregar Tarea de Usuario'
      );
      actions['append.exclusive-gateway'] = appendAction(
        'bpmn:ExclusiveGateway', 'bpmn-icon-gateway-xor', 'Agregar Compuerta Exclusiva'
      );
      actions['append.parallel-gateway'] = appendAction(
        'bpmn:ParallelGateway', 'bpmn-icon-gateway-parallel', 'Agregar Compuerta Paralela'
      );
      actions['append.end-event'] = appendAction(
        'bpmn:EndEvent', 'bpmn-icon-end-event-none', 'Agregar Evento de Fin'
      );
    }

    // Gateways: solo van a User Task o End Event
    if (type === 'bpmn:ExclusiveGateway' || type === 'bpmn:ParallelGateway') {
      actions['append.user-task'] = appendAction(
        'bpmn:UserTask', 'bpmn-icon-user-task', 'Agregar Tarea de Usuario'
      );
      actions['append.end-event'] = appendAction(
        'bpmn:EndEvent', 'bpmn-icon-end-event-none', 'Agregar Evento de Fin'
      );
    }

    return actions;
  }
}

export default {
  __init__: ['contextPadProvider'],
  contextPadProvider: ['type', CustomContextPadProvider]
};
