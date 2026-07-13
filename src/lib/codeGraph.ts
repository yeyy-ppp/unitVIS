// Parse a Java-style method body into a lightweight control-flow graph.
// Each visible source line becomes a typed node; edges connect sequential
// nodes plus branch / loop back-edges when applicable.

export type CFGNodeType =
  | 'entry' | 'exit'
  | 'if' | 'elseif' | 'else'
  | 'loop' | 'switch' | 'case'
  | 'try' | 'catch' | 'finally'
  | 'return' | 'throw'
  | 'call' | 'assign' | 'stmt';

export interface CFGNode {
  id: string;
  type: CFGNodeType;
  label: string;
  line: number;       // 1-indexed source line
  indent: number;     // visual indent depth
}

export interface CFGEdge {
  from: string;
  to: string;
  kind: 'seq' | 'branch' | 'loop' | 'exception';
  label?: string;
}

export interface CFG {
  nodes: CFGNode[];
  edges: CFGEdge[];
}

const shorten = (s: string, n = 42) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

function classify(trimmed: string): CFGNodeType {
  if (/^if\s*\(/.test(trimmed)) return 'if';
  if (/^}\s*else\s+if\s*\(/.test(trimmed) || /^else\s+if\s*\(/.test(trimmed)) return 'elseif';
  if (/^}?\s*else\b/.test(trimmed) || /^else\b/.test(trimmed)) return 'else';
  if (/^(for|while|do)\b/.test(trimmed)) return 'loop';
  if (/^switch\s*\(/.test(trimmed)) return 'switch';
  if (/^case\b|^default\s*:/.test(trimmed)) return 'case';
  if (/^try\b/.test(trimmed)) return 'try';
  if (/^}?\s*catch\s*\(/.test(trimmed)) return 'catch';
  if (/^}?\s*finally\b/.test(trimmed)) return 'finally';
  if (/^return\b/.test(trimmed)) return 'return';
  if (/^throw\b/.test(trimmed)) return 'throw';
  if (/^[A-Za-z_][\w.<>,\s\[\]]*\s+\w+\s*=|^\w+\s*=[^=]/.test(trimmed)) return 'assign';
  if (/\w+\s*\(/.test(trimmed)) return 'call';
  return 'stmt';
}

export function parseMethodBodyToCFG(body: string): CFG {
  const lines = body.split('\n');
  const nodes: CFGNode[] = [];
  const edges: CFGEdge[] = [];

  // Entry node from the signature line if present
  const sigIdx = lines.findIndex(l => /\b(public|private|protected|static|void|@Test)/.test(l));
  const sigLine = sigIdx >= 0 ? lines[sigIdx].trim() : 'method entry';
  nodes.push({ id: 'n_entry', type: 'entry', label: shorten(sigLine.replace(/\{$/, '').trim() || 'entry'), line: sigIdx + 1, indent: 0 });

  let seq = 0;
  lines.forEach((raw, idx) => {
    if (idx === sigIdx) return;
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (trimmed === '{' || trimmed === '}' || trimmed === '};') return;
    const leading = raw.length - raw.trimStart().length;
    const indent = Math.min(6, Math.floor(leading / 4));
    const type = classify(trimmed);
    const label = shorten(trimmed.replace(/\{$/, '').trim());
    nodes.push({ id: `n_${++seq}`, type, label, line: idx + 1, indent });
  });

  const hasTerminal = nodes.some(n => n.type === 'return' || n.type === 'throw');
  nodes.push({ id: 'n_exit', type: 'exit', label: hasTerminal ? 'method exit' : 'implicit return', line: lines.length, indent: 0 });

  // Sequential edges
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({ from: nodes[i].id, to: nodes[i + 1].id, kind: 'seq' });
  }

  // Branch edges: from each if/elseif/loop/switch node to the next node at
  // the same-or-lower indent (the "skip" path).
  const branchable: CFGNodeType[] = ['if', 'elseif', 'loop', 'switch', 'try'];
  nodes.forEach((n, i) => {
    if (!branchable.includes(n.type)) return;
    for (let j = i + 2; j < nodes.length; j++) {
      if (nodes[j].indent <= n.indent) {
        edges.push({
          from: n.id, to: nodes[j].id,
          kind: n.type === 'loop' ? 'loop' : n.type === 'try' ? 'exception' : 'branch',
          label: n.type === 'loop' ? 'exit' : n.type === 'try' ? 'catch' : 'false',
        });
        break;
      }
    }
  });

  // catch nodes get an inbound exception edge from the previous try (nearest above)
  nodes.forEach((n, i) => {
    if (n.type !== 'catch') return;
    for (let j = i - 1; j >= 0; j--) {
      if (nodes[j].type === 'try') {
        edges.push({ from: nodes[j].id, to: n.id, kind: 'exception', label: 'throws' });
        break;
      }
    }
  });

  return { nodes, edges };
}
