import { motion } from 'framer-motion';
import { Layers, Code2, GitBranch, FileCode, ArrowLeft, ChevronRight } from 'lucide-react';
import {
  ProjectAnalysis, ClassInfo, MethodInfo,
  computeClassMetrics, computeProjectTotals,
} from '@/data/mockTestData';
import StatCard from './StatCard';
import { ProjectAnalysisCharts } from './Charts';
import CodeGraphView from './CodeGraphView';
import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

interface Props {
  analysis: ProjectAnalysis;
}

type StatKey = 'classes' | 'methods' | 'lines' | 'avg' | 'max';

export default function ProjectAnalysisPanel({ analysis }: Props) {
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<MethodInfo | null>(null);
  const [statDrill, setStatDrill] = useState<StatKey | null>(null);

  const totals = useMemo(() => computeProjectTotals(analysis), [analysis]);

  // Per-class detail
  if (selectedClass) {
    const cm = computeClassMetrics(selectedClass);
    return (
      <>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <button
            onClick={() => setSelectedClass(null)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回类列表
          </button>
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-card-foreground font-mono">{selectedClass.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedClass.packageName}</p>
            </div>
            {selectedClass.analysis && (
              <div className="px-5 py-3 border-b border-border bg-primary/5">
                <p className="text-[11px] uppercase tracking-wider text-primary font-semibold mb-1.5">AI 类分析</p>
                <p className="text-sm text-card-foreground leading-relaxed">{selectedClass.analysis}</p>
                <div className="mt-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">所有待测方法焦点</p>
                  <ul className="space-y-1">
                    {selectedClass.methods.filter(m => m.focus).map(m => (
                      <li key={m.name} className="text-xs text-muted-foreground">
                        <span className="font-mono text-foreground">{m.name}</span>
                        <span className="mx-1.5">·</span>
                        {m.focus}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border">
              {[
                { label: '方法数', value: cm.methodCount },
                { label: '字段数', value: selectedClass.fieldCount },
                { label: '最大复杂度', value: cm.complexity },
                { label: '代码行数', value: cm.linesOfCode },
              ].map(item => (
                <div key={item.label} className="bg-card px-4 py-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-lg font-semibold text-card-foreground font-mono">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="divide-y divide-border">
              {selectedClass.methods.map((m, i) => (
                <motion.button
                  key={m.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * i }}
                  onClick={() => setSelectedMethod(m)}
                  className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors group"
                >
                  <Code2 className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground font-mono truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      ({m.params}) → {m.returnType}
                    </p>
                    {m.focus && (
                      <p className="text-xs text-primary/80 mt-0.5 truncate">焦点：{m.focus}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                      m.complexity > 8 ? 'bg-destructive/10 text-destructive' :
                      m.complexity > 5 ? 'bg-warning/10 text-warning' :
                      'bg-success/10 text-success'
                    }`}>
                      CC={m.complexity}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{m.linesOfCode} 行</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        <MethodBodyDialog method={selectedMethod} onClose={() => setSelectedMethod(null)} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="总类数" value={totals.totalClasses} icon={Layers} color="primary" delay={0}
          clickable onClick={() => setStatDrill('classes')} />
        <StatCard label="总方法数" value={totals.totalMethods} icon={Code2} color="info" delay={0.05}
          clickable onClick={() => setStatDrill('methods')} />
        <StatCard label="总代码行数" value={totals.totalLines.toLocaleString()} icon={FileCode} color="success" delay={0.1}
          clickable onClick={() => setStatDrill('lines')} />
        <StatCard label="平均复杂度" value={totals.avgComplexity} icon={GitBranch} color="warning" delay={0.15}
          clickable onClick={() => setStatDrill('avg')} />
        <StatCard label="最大复杂度" value={totals.maxComplexity} icon={GitBranch} color="destructive" delay={0.2}
          clickable onClick={() => setStatDrill('max')} />
      </div>

      <ProjectAnalysisCharts analysis={analysis} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="bg-card rounded-xl border border-border overflow-hidden shadow-sm"
      >
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-card-foreground">待测类列表</h2>
        </div>
        <div className="divide-y divide-border">
          {analysis.classes.map((cls, i) => {
            const cm = computeClassMetrics(cls);
            return (
              <motion.button
                key={cls.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                onClick={() => setSelectedClass(cls)}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-muted/50 group"
              >
                <div className="rounded-lg p-2 bg-primary/10 text-primary">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground font-mono">{cls.name}</p>
                  <p className="text-xs text-muted-foreground">{cls.packageName}</p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground font-mono">
                  <span>{cm.methodCount} 方法</span>
                  <span>{cm.linesOfCode} 行</span>
                  <span className={`px-2 py-0.5 rounded-full ${
                    cm.complexity > 6 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                  }`}>
                    CC={cm.complexity}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <StatDrilldown
        statKey={statDrill}
        analysis={analysis}
        onClose={() => setStatDrill(null)}
        onPickClass={(c) => { setStatDrill(null); setSelectedClass(c); }}
      />
    </div>
  );
}

function MethodBodyDialog({ method, onClose }: { method: MethodInfo | null; onClose: () => void }) {
  return (
    <Dialog open={!!method} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        {method && (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono">{method.name}</DialogTitle>
              <DialogDescription className="font-mono text-xs">
                ({method.params}) → {method.returnType} · CC={method.complexity} · {method.linesOfCode} 行
              </DialogDescription>
            </DialogHeader>
            {method.focus && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">AI 方法焦点</p>
                <p className="text-sm text-card-foreground">{method.focus}</p>
              </div>
            )}
            <pre className="text-xs font-mono bg-code-bg border border-code-border rounded-lg p-4 overflow-auto max-h-[55vh] text-foreground whitespace-pre">
{method.body}
            </pre>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatDrilldown({
  statKey, analysis, onClose, onPickClass,
}: {
  statKey: StatKey | null;
  analysis: ProjectAnalysis;
  onClose: () => void;
  onPickClass: (c: ClassInfo) => void;
}) {
  const titleMap: Record<StatKey, string> = {
    classes: '总类数 · 各类详情',
    methods: '总方法数 · 各类方法分布',
    lines: '总代码行数 · 各类代码量',
    avg: '平均复杂度 · 按类排序',
    max: '最大复杂度 · 高风险方法',
  };

  const rows = useMemo(() => {
    if (!statKey) return [];
    if (statKey === 'max') {
      // flatten methods sorted by complexity desc
      return analysis.classes.flatMap(c =>
        c.methods.map(m => ({ cls: c, method: m }))
      ).sort((a, b) => b.method.complexity - a.method.complexity).slice(0, 15);
    }
    const arr = analysis.classes.map(c => {
      const cm = computeClassMetrics(c);
      return { cls: c, ...cm };
    });
    if (statKey === 'avg' || statKey === 'classes') return arr.sort((a, b) => b.complexity - a.complexity);
    if (statKey === 'methods') return arr.sort((a, b) => b.methodCount - a.methodCount);
    return arr.sort((a, b) => b.linesOfCode - a.linesOfCode);
  }, [statKey, analysis]);

  return (
    <Dialog open={!!statKey} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{statKey ? titleMap[statKey] : ''}</DialogTitle>
          <DialogDescription>点击任意条目查看详情</DialogDescription>
        </DialogHeader>
        <div className="divide-y divide-border max-h-[60vh] overflow-auto">
          {statKey === 'max'
            ? (rows as { cls: ClassInfo; method: MethodInfo }[]).map(({ cls, method }) => (
                <button
                  key={cls.id + method.name}
                  onClick={() => onPickClass(cls)}
                  className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                    CC={method.complexity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate">{cls.name}.{method.name}</p>
                    <p className="text-xs text-muted-foreground">{method.linesOfCode} 行</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))
            : (rows as Array<{ cls: ClassInfo; methodCount: number; linesOfCode: number; complexity: number }>).map(r => (
                <button
                  key={r.cls.id}
                  onClick={() => onPickClass(r.cls)}
                  className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <Layers className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate">{r.cls.name}</p>
                    <p className="text-xs text-muted-foreground">{r.cls.packageName}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                    <span>{r.methodCount} 方法</span>
                    <span>{r.linesOfCode} 行</span>
                    <span>CC={r.complexity}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
