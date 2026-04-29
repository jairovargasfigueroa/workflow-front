// @ts-ignore
import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';

const HIGH_PRIORITY = 1500;

class CustomBpmnRenderer extends (BaseRenderer as any) {
  static $inject = ['eventBus', 'bpmnRenderer'];

  private bpmnRenderer: any;

  constructor(eventBus: any, bpmnRenderer: any) {
    super(eventBus, HIGH_PRIORITY);
    this.bpmnRenderer = bpmnRenderer;
  }

  canRender(element: any): boolean {
    const handled = [
      'bpmn:StartEvent',
      'bpmn:EndEvent',
      'bpmn:ExclusiveGateway',
      'bpmn:ParallelGateway',
      'bpmn:UserTask'
    ];
    if (handled.includes(element.type)) return true;
    // Labels de SequenceFlow para mostrar [guard]
    if (element.labelTarget?.type === 'bpmn:SequenceFlow') return true;
    return false;
  }

  drawShape(parentNode: SVGElement, element: any): SVGElement {
    if (element.labelTarget?.type === 'bpmn:SequenceFlow') {
      return this.drawSequenceFlowLabel(parentNode, element);
    }

    const { type, width = 0, height = 0 } = element;

    switch (type) {
      case 'bpmn:StartEvent':      return this.drawStartEvent(parentNode, width, height);
      case 'bpmn:EndEvent':        return this.drawEndEvent(parentNode, width, height);
      case 'bpmn:ExclusiveGateway': return this.drawExclusiveGateway(parentNode, width, height);
      case 'bpmn:ParallelGateway': return this.drawParallelGateway(parentNode, width, height);
      case 'bpmn:UserTask':        return this.drawUserTask(parentNode, element, width, height);
      default:                     return this.bpmnRenderer.drawShape(parentNode, element);
    }
  }

  drawConnection(parentNode: SVGElement, element: any): SVGElement {
    return this.bpmnRenderer.drawConnection(parentNode, element);
  }

  getShapePath(shape: any): string {
    return this.bpmnRenderer.getShapePath(shape);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private svg(tag: string, attrs: Record<string, string | number>): SVGElement {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
    return el;
  }

  private append(parent: SVGElement, ...children: SVGElement[]): void {
    children.forEach(c => parent.appendChild(c));
  }

  // ── Shapes ─────────────────────────────────────────────────────────────────

  /** InitialNode — círculo negro sólido */
  private drawStartEvent(parent: SVGElement, w: number, h: number): SVGElement {
    const circle = this.svg('circle', {
      cx: w / 2, cy: h / 2,
      r: Math.min(w, h) / 2 - 1,
      fill: '#000000',
      stroke: 'none'
    });
    this.append(parent, circle);
    return circle;
  }

  /** ActivityFinalNode — círculo dentro de círculo */
  private drawEndEvent(parent: SVGElement, w: number, h: number): SVGElement {
    const cx = w / 2;
    const cy = h / 2;
    const outerR = Math.min(w, h) / 2 - 1;
    const innerR = outerR * 0.55;

    const outer = this.svg('circle', { cx, cy, r: outerR, fill: 'white', stroke: '#000000', 'stroke-width': '2.5' });
    const inner = this.svg('circle', { cx, cy, r: innerR, fill: '#000000', stroke: 'none' });

    this.append(parent, outer, inner);
    return outer;
  }

  /** DecisionNode — rombo vacío sin X */
  private drawExclusiveGateway(parent: SVGElement, w: number, h: number): SVGElement {
    const cx = w / 2;
    const cy = h / 2;
    const diamond = this.svg('polygon', {
      points: `${cx},2 ${w - 2},${cy} ${cx},${h - 2} 2,${cy}`,
      fill: 'white',
      stroke: '#000000',
      'stroke-width': '2'
    });
    this.append(parent, diamond);
    return diamond;
  }

  /** ForkNode/JoinNode — barra negra gruesa vertical */
  private drawParallelGateway(parent: SVGElement, w: number, h: number): SVGElement {
    const barW = 10;
    const bar = this.svg('rect', {
      x: (w - barW) / 2, y: 0,
      width: barW, height: h,
      rx: 2, fill: '#000000'
    });
    this.append(parent, bar);
    return bar;
  }

  /** Action — rectángulo redondeado con nombre de la tarea */
  private drawUserTask(parent: SVGElement, element: any, w: number, h: number): SVGElement {
    const rect = this.svg('rect', {
      x: 0, y: 0, width: w, height: h,
      rx: 10, ry: 10,
      fill: 'white',
      stroke: '#000000',
      'stroke-width': '2'
    });
    this.append(parent, rect);

    const name = element.businessObject?.name;
    if (name) {
      const text = this.svg('text', {
        x: w / 2, y: h / 2,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        'font-size': '12',
        'font-family': 'Arial, sans-serif',
        fill: '#000000'
      });
      text.textContent = name;
      this.append(parent, text);
    }

    return rect;
  }

  /** ActivityEdge guard — etiqueta entre corchetes [Aprobado] */
  private drawSequenceFlowLabel(parent: SVGElement, element: any): SVGElement {
    const name = element.labelTarget?.businessObject?.name;
    const { width = 60, height = 20 } = element;

    if (!name) return this.bpmnRenderer.drawShape(parent, element);

    const text = this.svg('text', {
      x: width / 2, y: height / 2,
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      'font-size': '11',
      'font-family': 'Arial, sans-serif',
      fill: '#000000'
    });
    text.textContent = `[${name}]`;
    this.append(parent, text);
    return text;
  }
}

export default {
  __init__: ['customBpmnRenderer'],
  customBpmnRenderer: ['type', CustomBpmnRenderer]
};
