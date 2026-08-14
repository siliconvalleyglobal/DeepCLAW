export interface ExpressionContext {
  [key: string]: unknown;
}

export interface ExpressionResult {
  success: boolean;
  value?: unknown;
  error?: string;
}

export class ExpressionEngine {
  evaluate(expression: string, context: ExpressionContext): ExpressionResult {
    if (!expression || typeof expression !== 'string') {
      return { success: false, error: 'Expression must be a non-empty string' };
    }

    const matches = expression.match(/\{\{\s*([^}]+)\s*\}\}/g);
    if (!matches) {
      return { success: true, value: expression };
    }

    let result = expression;
    for (const match of matches) {
      const path = match.slice(2, -2).trim();
      const value = this._resolvePath(path, context);
      if (value instanceof Error) {
        return { success: false, error: value.message };
      }
      result = result.replace(match, this._stringify(value));
    }

    return { success: true, value: result };
  }

  evaluateBoolean(expression: string, context: ExpressionContext): ExpressionResult {
    const result = this.evaluate(expression, context);
    if (!result.success) return result;
    const value = result.value;
    if (typeof value === 'boolean') return { success: true, value };
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim();
      if (normalized === 'true') return { success: true, value: true };
      if (normalized === 'false') return { success: true, value: false };
    }
    return { success: false, error: `Expression does not evaluate to boolean: ${value}` };
  }

  private _resolvePath(path: string, context: ExpressionContext): unknown | Error {
    const parts = path.split('.');
    let current: unknown = context;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return new Error(`Cannot resolve property '${part}' on ${String(current)}`);
      }

      if (part === 'length' && Array.isArray(current)) {
        current = current.length;
        continue;
      }

      if (typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return new Error(`Property '${part}' not found`);
      }
    }

    return current;
  }

  private _stringify(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
}
