// bitmap-matte-evaluator.ts — Expression-based matte generator
// ARC Engine
// Safe expression parser (no eval()): supports r, g, b, a, l variables
// and operators: >, <, >=, <=, ==, !=, &&, ||, !, +, -, *, /

import type { NodeRenderContext } from '../recipe';

type ExprNode =
  | { type: 'num'; val: number }
  | { type: 'var'; name: string }
  | { type: 'binop'; op: string; left: ExprNode; right: ExprNode }
  | { type: 'unary'; op: string; child: ExprNode };

let _parserCacheKey = '';
let _cachedAst: ExprNode | null = null;

/** @internal exported for testing */
export function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    if (expr[i] === ' ') { i++; continue; }
    if ('()'.includes(expr[i])) { tokens.push(expr[i]); i++; continue; }
    if ('><=!&|'.includes(expr[i])) {
      const two = expr.substring(i, i + 2);
      if (['>=', '<=', '==', '!=', '&&', '||'].includes(two)) { tokens.push(two); i += 2; continue; }
      tokens.push(expr[i]); i++; continue;
    }
    if ('+-*/'.includes(expr[i])) { tokens.push(expr[i]); i++; continue; }
    if (expr[i] === '!') { tokens.push('!'); i++; continue; }
    if (/[0-9.]/.test(expr[i])) {
      let num = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) { num += expr[i]; i++; }
      tokens.push(num);
      continue;
    }
    if (/[a-zA-Z]/.test(expr[i])) {
      let name = '';
      while (i < expr.length && /[a-zA-Z]/.test(expr[i])) { name += expr[i]; i++; }
      tokens.push(name);
      continue;
    }
    i++; // skip unknown
  }
  return tokens;
}

let _tokIdx = 0;
let _tokens: string[] = [];

function peek(): string { return _tokens[_tokIdx] || ''; }
function consume(): string { return _tokens[_tokIdx++] || ''; }

function parseExpr(): ExprNode {
  let left = parsePrimary();
  while (['>', '<', '>=', '<=', '==', '!=', '&&', '||', '+', '-', '*', '/'].includes(peek())) {
    const op = consume();
    const right = parsePrimary();
    left = { type: 'binop', op, left, right };
  }
  return left;
}

function parsePrimary(): ExprNode {
  if (peek() === '(') {
    consume(); // '('
    const node = parseExpr();
    consume(); // ')'
    return node;
  }
  if (peek() === '!') {
    consume();
    return { type: 'unary', op: '!', child: parsePrimary() };
  }
  if (peek() === '-') {
    consume();
    return { type: 'unary', op: '-', child: parsePrimary() };
  }
  const tok = consume();
  if (/^[0-9.]+$/.test(tok)) return { type: 'num', val: parseFloat(tok) };
  return { type: 'var', name: tok };
}

/** @internal exported for testing */
export function compile(expr: string): ExprNode | null {
  if (expr === _parserCacheKey) return _cachedAst;
  try {
    _tokens = tokenize(expr);
    _tokIdx = 0;
    const ast = parseExpr();
    _parserCacheKey = expr;
    _cachedAst = ast;
    return ast;
  } catch {
    _parserCacheKey = '';
    _cachedAst = null;
    return null;
  }
}

/** @internal exported for testing */
export function evaluate(node: ExprNode, vars: Record<string, number>): number {
  switch (node.type) {
    case 'num': return node.val;
    case 'var': return vars[node.name] ?? 0;
    case 'unary':
      if (node.op === '!') return evaluate(node.child, vars) === 0 ? 1 : 0;
      if (node.op === '-') return -evaluate(node.child, vars);
      return 0;
    case 'binop': {
      const l = evaluate(node.left, vars);
      const r = evaluate(node.right, vars);
      switch (node.op) {
        case '>':  return l > r ? 1 : 0;
        case '<':  return l < r ? 1 : 0;
        case '>=': return l >= r ? 1 : 0;
        case '<=': return l <= r ? 1 : 0;
        case '==': return l === r ? 1 : 0;
        case '!=': return l !== r ? 1 : 0;
        case '&&': return l && r ? 1 : 0;
        case '||': return l || r ? 1 : 0;
        case '+':  return l + r;
        case '-':  return l - r;
        case '*':  return l * r;
        case '/':  return r !== 0 ? l / r : 0;
        default: return 0;
      }
    }
  }
}

export function renderBitmapMatte(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs } = ctx;
  const source = inputs[0];
  if (!source) return;

  const expression = (props.expression as string) || 'l > 0.5';
  const mode = (props.mode as string) || 'alpha';
  const invert = !!(props.invert as boolean);

  c.drawImage(source, 0, 0);
  const imgData = c.getImageData(0, 0, W, H);
  const d = imgData.data;

  const ast = compile(expression);
  if (!ast) {
    // Parse error: passthrough
    return;
  }

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
    const l = r * 0.299 + g * 0.587 + b * 0.114;
    const vars = { r, g, b, a, l };
    let result = evaluate(ast, vars);
    if (invert) result = 1 - result;
    const byteVal = Math.round(Math.max(0, Math.min(1, result)) * 255);

    if (mode === 'alpha') {
      d[i + 3] = byteVal;
    } else {
      d[i] = byteVal;
      d[i + 1] = byteVal;
      d[i + 2] = byteVal;
    }
  }

  c.putImageData(imgData, 0, 0);
}
