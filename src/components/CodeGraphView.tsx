import { useMemo, useState } from 'react';
import { GitBranch, Boxes, Info } from 'lucide-react';
import { parseMethodBodyToCFG, CFGNode, CFGNodeType } from '@/lib/codeGraph';

interface Props {
  body: string;
  /** optional coverage overlay (line → status) */
  coverage?: { line: number; status: 'covered' | 'partial' | 'uncovered' }[];
  title?: string;
}

const nodeStyle: Record<CFGNodeType, { fill: string; stroke: string; text: string; label: string }> = {
  entry:    { fill: 'hsl(var(--primary) / 0.15)',    stroke: 'hsl(var(--primary))',    text: 'hsl(var(--primary))',    label: 'ENTRY' },
  exit:     { fill: 'hsl(var(--muted))',             stroke: 'hsl(var(--muted-foreground))', text: 'hsl(var(--foreground))', label: 'EXIT'  },
  if:       { fill: 'hsl(var(--warning) / 0.15)',    stroke: 'hsl(var(--warning))',    text: 'hsl(var(--warning))',    label: 'IF'    },
  elseif:   { fill: 'hsl(var(--warning) / 0.15)',    stroke: 'hsl(var(--warning))',    text: 'hsl(var(--warning))',    label: 'ELIF'  },
  else:     { fill: 'hsl(var(--warning) / 0.10)',    stroke: 'hsl(var(--warning))',    text: 'hsl(var(--warning))',    label: 'ELSE'  },
  loop:     { fill: 'hsl(var(--info) / 0.15)',       stroke: 'hsl(var(--info))',       text: 'hsl(var(--info))',       label: 'LOOP'  },
  switch:   { fill: 'hsl(var(--info) / 0.15)',       stroke: 'hsl(var(--info))',       text: 'hsl(var(--info))',       label: 'SWCH'  },
  case:     { fill: 'hsl(var(--info) / 0.10)',       stroke: 'hsl(var(--info))',       text: 'hsl(var(--info))',       label: 'CASE'  },
  try:      { fill: 'hsl(var(--accent) / 0.15)',     stroke: 'hsl(var(--accent))',     text: 'hsl(var(--accent))',     label: 'TRY'   },
  catch:    { fill: 'hsl(var(--destructive) / 0.15)',stroke: 'hsl(var(--destructive))',text: 'hsl(var(--destructive))',label: 'CATCH' },
  finally:  { fill: 'hsl(var(--accent) / 0.10)',     stroke: 'hsl(var(--accent))',     text: 'hsl(var(--accent))',     label: 'FINL'  },
  return:   { fill: 'hsl(var(--success) / 0.15)',    stroke: 'hsl(var(--success))',    text: 'hsl(var(--success))',    label: 'RET'   },
  throw:    { fill: 'hsl(var(--destructive) / 0.15)',stroke: 'hsl(var(--destructive))',text: 'hsl(var(--destructive))',label: 'THROW' },
  call:     { fill: 'hsl(var(--card))',              stroke: 'hsl(var(--border))',     text: 'hsl(var(--foreground))', label: 'CALL'  },
  assign:   { fill: 'hsl(var(--card))',              stroke: 'hsl(var(--border))',     text: 'hsl(var(--foreground))', label: 'ASGN'  },
  stmt:     { fill: 'hsl(var(--card))',              stroke: 'hsl(var(--border))',     text: 'hsl(var(--muted-foreground))', label: 'STMT' },
};

const covLineBg: Record<string, string> = {
  covered:   'bg-success/15 border-l-2 border-success',
  partial:   'bg-warning/15 border-l-2 border-warning',
  uncovered: 'bg-destructive/15 border-l-2 border-destructive',
};

export default function CodeGraphView({ body, coverage, title }: Props) {
  const cfg = useMemo(() => parseMethodBodyToCFG(body), [body]);
  const [hovered, setHovered] = useState<string | null>(null);
  const covMap = useMemo(() => {
    const m = new Map<number, string>();
    coverage?.forEach(c => m.set(c.line, c.status));
    return m;
  }, [coverage]);

  // Layout
  const ROW_H = 44;
  const INDENT_X = 22;
  const NODE_W = 210;
  const NODE_H = 30;
  const LEFT_PAD = 30;
  const TOP_PAD = 20;
  const positions = new Map<string, { x: number; y: number }>();
  cfg.nodes.forEach((n, i) => {
    positions.set(n.id, { x: LEFT_PAD + n.indent * INDENT_X, y: TOP_PAD + i * ROW_H });
  });
  const svgH = TOP_PAD * 2 + cfg.nodes.length * ROW_H;
  const svgW = LEFT_PAD + Math.max(...cfg.nodes.map(n => n.indent)) * INDENT_X + NODE_W + 80;

  const bodyLines = body.split('\n');
  const activeNode = hovered ? cfg.nodes.find(n => n.id === hovered) : null;

  return (
    <div className="rounded-lg border border-code-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-code-border bg-muted/30">
        <div className="flex items-center gap-2 text-xs font-mono">
          <Boxes className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-foreground">源代码 ↔ 代码状态图</span>
          {title && <span className="text-muted-foreground">· {title}</span>}
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
          <span className="inline-flex items-center gap-1"><GitBranch className="w-3 h-3" />{cfg.nodes.length} 节点 · {cfg.edges.length} 边</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 divide-x divide-code-border">
        {/* Left: source */}
        <div className="max-h-[60vh] overflow-auto font-mono text-[11px] bg-code-bg">
          {bodyLines.map((code, i) => {
            const lineNo = i + 1;
            const cov = covMap.get(lineNo);
            const isActive = activeNode && activeNode.line === lineNo;
            return (
              <div
                key={lineNo}
                className={`flex ${cov ? covLineBg[cov] : ''} ${isActive ? 'ring-1 ring-primary/60 bg-primary/10' : ''}`}
              >
                <span className="select-none w-10 shrink-0 text-right pr-2 py-0.5 text-muted-foreground/70 border-r border-code-border bg-card/50">
                  {lineNo}
                </span>
                <pre className="flex-1 px-3 py-0.5 whitespace-pre overflow-x-auto text-foreground">{code || ' '}</pre>
              </div>
            );
          })}
        </div>

        {/* Right: SVG graph */}
        <div className="max-h-[60vh] overflow-auto bg-gradient-to-br from-muted/20 to-card">
          <svg width={svgW} height={svgH} className="block">
            <defs>
              <marker id="cfg-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                      markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground))" />
              </marker>
              <marker id="cfg-arrow-branch" viewBox="0 0 10 10" refX="9" refY="5"
                      markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--warning))" />
              </marker>
              <marker id="cfg-arrow-loop" viewBox="0 0 10 10" refX="9" refY="5"
                      markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--info))" />
              </marker>
              <marker id="cfg-arrow-exc" viewBox="0 0 10 10" refX="9" refY="5"
                      markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--destructive))" />
              </marker>
            </defs>

            {/* Edges */}
            {cfg.edges.map((e, i) => {
              const a = positions.get(e.from); const b = positions.get(e.to);
              if (!a || !b) return null;
              const isBack = b.y < a.y;
              const isSide = e.kind !== 'seq';
              const color =
                e.kind === 'seq' ? 'hsl(var(--muted-foreground))' :
                e.kind === 'loop' ? 'hsl(var(--info))' :
                e.kind === 'exception' ? 'hsl(var(--destructive))' :
                'hsl(var(--warning))';
              const marker =
                e.kind === 'seq' ? 'url(#cfg-arrow)' :
                e.kind === 'loop' ? 'url(#cfg-arrow-loop)' :
                e.kind === 'exception' ? 'url(#cfg-arrow-exc)' :
                'url(#cfg-arrow-branch)';

              const startX = a.x + (isSide ? NODE_W : NODE_W / 2);
              const startY = a.y + NODE_H / 2 + (isSide ? -4 : NODE_H / 2);
              const endX = b.x + (isSide ? NODE_W + 20 : NODE_W / 2);
              const endY = b.y + NODE_H / 2 + (isSide ? 4 : -NODE_H / 2);

              let d: string;
              if (!isSide) {
                d = `M ${startX} ${startY} L ${endX} ${endY}`;
              } else {
                // routed to the right of nodes, curved
                const laneX = Math.max(a.x, b.x) + NODE_W + 20 + (isBack ? 30 : 10);
                d = `M ${a.x + NODE_W} ${a.y + NODE_H / 2}
                     C ${laneX} ${a.y + NODE_H / 2}, ${laneX} ${b.y + NODE_H / 2}, ${b.x + NODE_W + 4} ${b.y + NODE_H / 2}`;
              }
              const dim = hovered && hovered !== e.from && hovered !== e.to;
              return (
                <g key={i} opacity={dim ? 0.15 : 1}>
                  <path d={d} stroke={color} strokeWidth={1.4} fill="none" markerEnd={marker}
                        strokeDasharray={e.kind === 'exception' ? '4 3' : undefined} />
                  {e.label && isSide && (
                    <text
                      x={Math.max(a.x, b.x) + NODE_W + 34}
                      y={(a.y + b.y) / 2 + NODE_H / 2 + 3}
                      fontSize={9} fontFamily="JetBrains Mono" fill={color}
                    >
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {cfg.nodes.map((n) => {
              const p = positions.get(n.id)!;
              const style = nodeStyle[n.type];
              const isActive = hovered === n.id;
              const cov = covMap.get(n.line);
              const covRing =
                cov === 'covered' ? 'hsl(var(--success))' :
                cov === 'partial' ? 'hsl(var(--warning))' :
                cov === 'uncovered' ? 'hsl(var(--destructive))' :
                null;
              return (
                <g key={n.id}
                   onMouseEnter={() => setHovered(n.id)}
                   onMouseLeave={() => setHovered(null)}
                   style={{ cursor: 'pointer' }}>
                  {covRing && (
                    <rect x={p.x - 3} y={p.y - 3} width={NODE_W + 6} height={NODE_H + 6}
                          rx={8} fill="none" stroke={covRing} strokeWidth={1.2} opacity={0.55} />
                  )}
                  <rect x={p.x} y={p.y} width={NODE_W} height={NODE_H} rx={6}
                        fill={style.fill} stroke={style.stroke}
                        strokeWidth={isActive ? 2 : 1} />
                  <rect x={p.x} y={p.y} width={40} height={NODE_H} rx={6}
                        fill={style.stroke} opacity={0.15} />
                  <text x={p.x + 20} y={p.y + NODE_H / 2 + 3} textAnchor="middle"
                        fontSize={9} fontFamily="JetBrains Mono" fontWeight={600}
                        fill={style.text}>{style.label}</text>
                  <text x={p.x + 46} y={p.y + NODE_H / 2 + 3}
                        fontSize={10} fontFamily="JetBrains Mono"
                        fill="hsl(var(--foreground))">
                    {n.label.length > 22 ? n.label.slice(0, 21) + '…' : n.label}
                  </text>
                  <text x={p.x + NODE_W - 6} y={p.y + NODE_H / 2 + 3} textAnchor="end"
                        fontSize={8} fontFamily="JetBrains Mono"
                        fill="hsl(var(--muted-foreground))">L{n.line}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="px-3 py-2 border-t border-code-border bg-muted/20 flex items-center gap-3 flex-wrap text-[10px] font-mono text-muted-foreground">
        <Info className="w-3 h-3" />
        <LegendChip color="hsl(var(--primary))" label="entry" />
        <LegendChip color="hsl(var(--warning))" label="if/else 分支" />
        <LegendChip color="hsl(var(--info))" label="loop/switch" />
        <LegendChip color="hsl(var(--accent))" label="try/finally" />
        <LegendChip color="hsl(var(--destructive))" label="catch/throw" />
        <LegendChip color="hsl(var(--success))" label="return" />
        {coverage && (
          <>
            <span className="mx-1">·</span>
            <span>覆盖描边：</span>
            <LegendChip color="hsl(var(--success))" label="已覆盖" />
            <LegendChip color="hsl(var(--warning))" label="部分" />
            <LegendChip color="hsl(var(--destructive))" label="未覆盖" />
          </>
        )}
      </div>
    </div>
  );
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-block w-2.5 h-2.5 rounded-sm border" style={{ background: color + '33', borderColor: color }} />
      {label}
    </span>
  );
}
