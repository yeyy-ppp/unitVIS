import { motion } from 'framer-motion';
import { History, Sparkles, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { FixRecord } from '@/data/mockTestData';

interface Props {
  records: FixRecord[];
}

const fmt = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export default function FixHistoryPanel({ records }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-12 text-center">
        <div className="inline-flex rounded-full bg-muted p-4 mb-3">
          <History className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">暂无修复历史</p>
        <p className="text-xs text-muted-foreground mt-1">在「生成结果」中对失败用例点击「一键修复」并确认后，记录会出现在这里。</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">修复历史</h2>
        <span className="text-xs text-muted-foreground font-mono">{records.length} 条记录</span>
      </div>

      {records.map((r, i) => {
        const open = openId === r.id;
        const dl = +(r.afterMetrics.lineCoverage - r.beforeMetrics.lineCoverage).toFixed(1);
        const db = +(r.afterMetrics.branchCoverage - r.beforeMetrics.branchCoverage).toFixed(1);
        const dm = +(r.afterMetrics.mutationScore - r.beforeMetrics.mutationScore).toFixed(1);
        return (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i }}
            className="bg-card rounded-xl border border-border overflow-hidden shadow-sm"
          >
            <button
              onClick={() => setOpenId(open ? null : r.id)}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/40 transition-colors"
            >
              <div className="rounded-lg bg-primary/10 text-primary p-2">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono truncate">
                  {r.className}.{r.methodName}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  → {r.targetMethod} · {fmt(r.appliedAt)}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
                <DeltaBadge label="行" v={dl} />
                <DeltaBadge label="分支" v={db} />
                <DeltaBadge label="变异" v={dm} />
              </div>
              {open
                ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>

            {open && (
              <div className="border-t border-border p-5 space-y-4 bg-muted/20">
                {r.changeNote && (
                  <p className="text-xs text-foreground">
                    <span className="text-primary font-semibold mr-2">变更摘要</span>{r.changeNote}
                  </p>
                )}

                <MetricsDiff before={r.beforeMetrics} after={r.afterMetrics} />

                <div className="grid md:grid-cols-2 gap-3">
                  <CodeBlock title="修复前" tone="destructive" body={r.beforeBody} />
                  <CodeBlock title="修复后" tone="success" body={r.afterBody} />
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function DeltaBadge({ label, v }: { label: string; v: number }) {
  const positive = v >= 0;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
      positive ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'
    }`}>
      {label} {positive ? '+' : ''}{v}
    </span>
  );
}

export function MetricsDiff({
  before, after,
}: {
  before: { lineCoverage: number; branchCoverage: number; mutationScore: number };
  after:  { lineCoverage: number; branchCoverage: number; mutationScore: number };
}) {
  const rows = [
    { label: '行覆盖率',   b: before.lineCoverage,   a: after.lineCoverage,   suf: '%' },
    { label: '分支覆盖率', b: before.branchCoverage, a: after.branchCoverage, suf: '%' },
    { label: '变异得分',   b: before.mutationScore,  a: after.mutationScore,  suf: '%' },
  ];
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-4 text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 px-3 py-1.5">
        <span>指标</span><span>修复前</span><span>修复后</span><span>变化</span>
      </div>
      {rows.map(r => {
        const d = +(r.a - r.b).toFixed(1);
        const positive = d >= 0;
        return (
          <div key={r.label} className="grid grid-cols-4 px-3 py-2 text-xs font-mono border-t border-border">
            <span className="text-foreground">{r.label}</span>
            <span className="text-muted-foreground">{r.b}{r.suf}</span>
            <span className="text-foreground">{r.a}{r.suf}</span>
            <span className={positive ? 'text-success' : 'text-destructive'}>
              {positive ? '+' : ''}{d}{r.suf}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function CodeBlock({ title, tone, body }: { title: string; tone: 'success' | 'destructive'; body: string }) {
  const toneCls = tone === 'success'
    ? 'border-success/30 text-success'
    : 'border-destructive/30 text-destructive';
  return (
    <div className={`rounded-lg border ${toneCls} overflow-hidden`}>
      <div className={`px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold ${
        tone === 'success' ? 'bg-success/10' : 'bg-destructive/10'
      }`}>
        {title}
      </div>
      <pre className="text-[11px] font-mono bg-code-bg p-3 overflow-auto max-h-[40vh] text-foreground whitespace-pre">
{body}
      </pre>
    </div>
  );
}
