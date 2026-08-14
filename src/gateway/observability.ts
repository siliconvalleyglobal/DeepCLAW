export interface OtelSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: string;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes: Array<{ key: string; value: { stringValue: string } }>;
  status: { code: string; message: string };
}

export interface OtelResourceSpans {
  resource: {
    attributes: Array<{ key: string; value: { stringValue: string } }>;
  };
  scopeSpans: Array<{
    scope: { name: string };
    spans: OtelSpan[];
  }>;
}

export class ObservabilityBridge {
  private spans: OtelSpan[] = [];
  private serviceName: string;

  constructor(serviceName = 'deepclaw-gateway') {
    this.serviceName = serviceName;
  }

  startSpan(name: string, attributes: Record<string, string> = {}): OtelSpan {
    const span: OtelSpan = {
      traceId: this.randomId(),
      spanId: this.randomId(16),
      name,
      kind: 'INTERNAL',
      startTimeUnixNano: String(Date.now() * 1e6),
      endTimeUnixNano: String(Date.now() * 1e6),
      attributes: Object.entries(attributes).map(([key, value]) => ({
        key,
        value: { stringValue: String(value) },
      })),
      status: { code: 'OK', message: '' },
    };
    this.spans.push(span);
    return span;
  }

  endSpan(span: OtelSpan, statusCode = 'OK', statusMessage = ''): OtelSpan {
    span.endTimeUnixNano = String(Date.now() * 1e6);
    span.status = { code: statusCode, message: statusMessage };
    return span;
  }

  recordPolicyDecision(
    span: OtelSpan,
    action: string,
    permitted: boolean,
    reasoningTrace: string,
    agentId = '',
    tenantId = ''
  ): void {
    span.attributes.push(
      { key: 'deepclaw.policy.action', value: { stringValue: action } },
      { key: 'deepclaw.policy.decision', value: { stringValue: permitted ? 'PERMIT' : 'DENY' } },
      { key: 'deepclaw.policy.reasoning', value: { stringValue: reasoningTrace } },
      { key: 'deepclaw.agent.id', value: { stringValue: agentId } },
      { key: 'deepclaw.tenant.id', value: { stringValue: tenantId } }
    );
  }

  exportOtlpJson(): OtelResourceSpans {
    return {
      resource: {
        attributes: [{ key: 'service.name', value: { stringValue: this.serviceName } }],
      },
      scopeSpans: [
        {
          scope: { name: 'deepclaw.observability' },
          spans: this.spans,
        },
      ],
    };
  }

  clear(): void {
    this.spans = [];
  }

  private randomId(length = 32): string {
    return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}
