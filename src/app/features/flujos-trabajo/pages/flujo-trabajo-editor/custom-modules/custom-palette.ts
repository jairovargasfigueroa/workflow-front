class CustomPaletteProvider {
  static $inject = [
    'palette', 'create', 'elementFactory',
    'spaceTool', 'lassoTool', 'handTool',
    'globalConnect', 'translate'
  ];

  private create: any;
  private elementFactory: any;
  private spaceTool: any;
  private lassoTool: any;
  private handTool: any;
  private globalConnect: any;
  private translate: any;

  constructor(
    palette: any, create: any, elementFactory: any,
    spaceTool: any, lassoTool: any, handTool: any,
    globalConnect: any, translate: any
  ) {
    this.create = create;
    this.elementFactory = elementFactory;
    this.spaceTool = spaceTool;
    this.lassoTool = lassoTool;
    this.handTool = handTool;
    this.globalConnect = globalConnect;
    this.translate = translate;

    palette.registerProvider(this);
  }

  getPaletteEntries(): Record<string, any> {
    const { create, elementFactory, translate, spaceTool, lassoTool, handTool, globalConnect } = this;

    function createAction(type: string, group: string, className: string, title: string) {
      return {
        group,
        className,
        title: translate(title),
        action: {
          dragstart: (event: any) => {
            const shape = elementFactory.createShape({ type });
            create.start(event, shape);
          },
          click: (event: any) => {
            const shape = elementFactory.createShape({ type });
            create.start(event, shape);
          }
        }
      };
    }

    return {
      'hand-tool': {
        group: 'tools',
        className: 'bpmn-icon-hand-tool',
        title: translate('Mover lienzo'),
        action: { click: (event: any) => handTool.activateHand(event) }
      },
      'lasso-tool': {
        group: 'tools',
        className: 'bpmn-icon-lasso-tool',
        title: translate('Selección por área'),
        action: { click: (event: any) => lassoTool.activateSelection(event) }
      },
      'space-tool': {
        group: 'tools',
        className: 'bpmn-icon-space-tool',
        title: translate('Crear/eliminar espacio'),
        action: { click: (event: any) => spaceTool.activateSelection(event) }
      },
      'global-connect-tool': {
        group: 'tools',
        className: 'bpmn-icon-connection-multi',
        title: translate('Conectar elementos'),
        action: { click: (event: any) => globalConnect.start(event) }
      },
      'tool-separator': {
        group: 'tools',
        separator: true
      },
      'create.start-event': createAction(
        'bpmn:StartEvent', 'event', 'bpmn-icon-start-event-none', 'Evento de Inicio'
      ),
      'create.end-event': createAction(
        'bpmn:EndEvent', 'event', 'bpmn-icon-end-event-none', 'Evento de Fin'
      ),
      'create.user-task': createAction(
        'bpmn:UserTask', 'activity', 'bpmn-icon-user-task', 'Tarea de Usuario'
      ),
      'create.exclusive-gateway': createAction(
        'bpmn:ExclusiveGateway', 'gateway', 'bpmn-icon-gateway-xor', 'Compuerta Exclusiva'
      ),
      'create.parallel-gateway': createAction(
        'bpmn:ParallelGateway', 'gateway', 'bpmn-icon-gateway-parallel', 'Compuerta Paralela'
      )
    };
  }
}

export default {
  __init__: ['paletteProvider'],
  paletteProvider: ['type', CustomPaletteProvider]
};
