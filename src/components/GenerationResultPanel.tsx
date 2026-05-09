import { motion } from 'framer-motion';
import {
  FlaskConical, CheckCircle2, XCircle, AlertTriangle, Clock,
  Percent, ArrowLeft, ChevronRight, Target, Shield, GitBranch,
} from 'lucide-react';
import {
  GenerationSummary, TestClassResult, TestMethodResult,
  computeTestClassMetrics, computeGenerationTotals,
} from '@/data/mockTestData';
import StatCard from './StatCard';
import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

const statusConfig = {
  passed: { icon: CheckCircle2, label: '通过', className: 'text-success bg-success/10' },
  failed: { icon: XCircle, label: '失败', className: 'text-destructive bg-destructive/10' },
  error:  { icon: AlertTriangle, label: '错误', className: 'text-warning bg-warning/10' },
};

interface Props { summary: GenerationSummary; }

type StatKey = 'classes' | 'methods' | 'pass' | 'fail' | 'line' | 'branch' | 'mutation' | 'duration';

export default function GenerationResultPanel({ summary }: Props) {
  const [selectedClass, setSelectedClass] = useState<TestClassResult | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<TestMethodResult | null>(null);
  const [statDrill, setStatDrill] = useState<StatKey | null>(null);

  const totals = useMemo(() => computeGenerationTotals(summary), [summary]);

  // Class detail
  if (selectedClass) {
    const cm = computeTestClassMetrics(selectedClass);
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
            返回测试类列表
          </button>
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-card-foreground font-mono">{selectedClass.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                测试目标: <span className="font-mono text-foreground">{selectedClass.targetClass}</span>
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-border">
              {[
                { label: '测试方法', value: cm.testMethodCount },
                { label: '通过', value: cm.passedCount, color: 'text-success' },
                { label: '失败', value: cm.failedCount, color: 'text-destructive' },
                { label: '错误', value: cm.errorCount, color: 'text-warning' },
                { label: '行覆盖', value: `${selectedClass.lineCoverage}%` },
                { label: '分支覆盖', value: `${selectedClass.branchCoverage}%` },
                { label: '变异得分', value: `${selectedClass.mutationScore}%` },
              ].map(item => (
                <div key={item.label} className="bg-card px-4 py-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`text-lg font-semibold font-mono ${(item as any).color || 'text-card-foreground'}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="divide-y divide-border">
              {selectedClass.methods.map((m, i) => {
                const cfg = statusConfig[m.status];
                const StatusIcon = cfg.icon;
                return (
                  <motion.button
                    key={m.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * i }}
                    onClick={() => setSelectedMethod(m)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/50 group"
                  >
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground font-mono truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">→ {m.targetMethod}</p>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono shrink-0">{m.duration}ms</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <TestMethodDialog method={selectedMethod} onClose={() => setSelectedMethod(null)} />
      </>
    );
  }

  // Overview
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="测试类" value={totals.totalTestClasses} icon={FlaskConical} color="primary" delay={0}
          clickable onClick={() => setStatDrill('classes')} />
        <StatCard label="测试方法" value={totals.totalTestMethods} icon={Target} color="info" delay={0.05}
          clickable onClick={() => setStatDrill('methods')} />
        <StatCard label="通过率" value={`${totals.overallPassRate}%`} icon={CheckCircle2} color="success" delay={0.1}
          clickable onClick={() => setStatDrill('pass')} />
        <StatCard label="失败率" value={`${totals.overallFailRate}%`} icon={XCircle} color="destructive" delay={0.15}
          clickable onClick={() => setStatDrill('fail')} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="行覆盖率" value={`${summary.overallLineCoverage}%`} icon={Percent} color="info" delay={0.2}
          clickable onClick={() => setStatDrill('line')} />
        <StatCard label="分支覆盖率" value={`${summary.overallBranchCoverage}%`} icon={GitBranch} color="warning" delay={0.25}
          clickable onClick={() => setStatDrill('branch')} />
        <StatCard label="变异得分" value={`${summary.overallMutationScore}%`} icon={Shield} color="primary" delay={0.3}
          clickable onClick={() => setStatDrill('mutation')} />
        <StatCard label="总耗时" value={`${(totals.totalDuration / 1000).toFixed(1)}s`} icon={Clock} color="success" delay={0.35}
          clickable onClick={() => setStatDrill('duration')} />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-xl border border-border overflow-hidden shadow-sm"
      >
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-card-foreground">生成的测试类</h2>
        </div>
        <div className="divide-y divide-border">
          {summary.testClasses.map((tc, i) => {
            const cm = computeTestClassMetrics(tc);
            const passRate = cm.testMethodCount ? Math.round((cm.passedCount / cm.testMethodCount) * 100) : 0;
            return (
              <motion.button
                key={tc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                onClick={() => setSelectedClass(tc)}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-muted/50 group"
              >
                <div className={`rounded-lg p-2 ${passRate === 100 ? 'bg-success/10 text-success' : passRate >= 70 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}`}>
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground font-mono">{tc.name}</p>
                  <p className="text-xs text-muted-foreground">→ {tc.targetClass}</p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground font-mono">
                  <span className="text-success">{cm.passedCount}✓</span>
                  {cm.failedCount > 0 && <span className="text-destructive">{cm.failedCount}✗</span>}
                  {cm.errorCount > 0 && <span className="text-warning">{cm.errorCount}!</span>}
                  <span>行覆盖 {tc.lineCoverage}%</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <StatDrilldown
        statKey={statDrill}
        summary={summary}
        onClose={() => setStatDrill(null)}
        onPickClass={(c) => { setStatDrill(null); setSelectedClass(c); }}
        onPickMethod={(c, m) => { setStatDrill(null); setSelectedClass(c); setSelectedMethod(m); }}
      />
    </div>
  );
}

function TestMethodDialog({ method, onClose }: { method: TestMethodResult | null; onClose: () => void }) {
  return (
    <Dialog open={!!method} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        {method && (() => {
          const cfg = statusConfig[method.status];
          const Icon = cfg.icon;
          return (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${cfg.className}`}>
                    <Icon className="w-3 h-3" />{cfg.label}
                  </span>
                  {method.name}
                </DialogTitle>
                <DialogDescription className="font-mono text-xs">
                  → {method.targetMethod} · {method.duration}ms
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">断言</p>
                  <pre className="text-xs font-mono bg-muted/50 border border-border rounded px-3 py-2 text-foreground whitespace-pre-wrap">
{method.assertion}
                  </pre>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">完整测试方法体</p>
                  <pre className="text-xs font-mono bg-code-bg border border-code-border rounded-lg p-4 overflow-auto max-h-[50vh] text-foreground whitespace-pre">
{method.body}
                  </pre>
                </div>
              </div>
            </>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}

function StatDrilldown({
  statKey, summary, onClose, onPickClass, onPickMethod,
}: {
  statKey: StatKey | null;
  summary: GenerationSummary;
  onClose: () => void;
  onPickClass: (c: TestClassResult) => void;
  onPickMethod: (c: TestClassResult, m: TestMethodResult) => void;
}) {
  const titleMap: Record<StatKey, string> = {
    classes: '测试类列表',
    methods: '测试方法列表',
    pass: '通过的测试方法',
    fail: '失败 / 错误的测试方法',
    line: '各测试类行覆盖率',
    branch: '各测试类分支覆盖率',
    mutation: '各测试类变异得分',
    duration: '各测试类耗时',
  };

  const isMethodView = statKey === 'methods' || statKey === 'pass' || statKey === 'fail';

  const methodRows = useMemo(() => {
    if (!isMethodView) return [];
    const all = summary.testClasses.flatMap(c => c.methods.map(m => ({ cls: c, method: m })));
    if (statKey === 'pass') return all.filter(r => r.method.status === 'passed');
    if (statKey === 'fail') return all.filter(r => r.method.status !== 'passed');
    return all;
  }, [statKey, summary, isMethodView]);

  const classRows = useMemo(() => {
    if (isMethodView || !statKey) return [];
    return summary.testClasses.map(c => {
      const cm = computeTestClassMetrics(c);
      const v = statKey === 'line' ? c.lineCoverage
        : statKey === 'branch' ? c.branchCoverage
        : statKey === 'mutation' ? c.mutationScore
        : statKey === 'duration' ? cm.duration
        : 0;
      return { cls: c, value: v };
    }).sort((a, b) => b.value - a.value);
  }, [statKey, summary, isMethodView]);

  return (
    <Dialog open={!!statKey} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{statKey ? titleMap[statKey] : ''}</DialogTitle>
          <DialogDescription>点击任意条目查看详情</DialogDescription>
        </DialogHeader>
        <div className="divide-y divide-border max-h-[60vh] overflow-auto">
          {isMethodView
            ? methodRows.map(({ cls, method }) => {
                const cfg = statusConfig[method.status];
                const Icon = cfg.icon;
                return (
                  <button
                    key={cls.id + method.name}
                    onClick={() => onPickMethod(cls, method)}
                    className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${cfg.className}`}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono truncate">{cls.name}.{method.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">→ {method.targetMethod}</p>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{method.duration}ms</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                );
              })
            : classRows.map(({ cls, value }) => (
                <button
                  key={cls.id}
                  onClick={() => onPickClass(cls)}
                  className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <FlaskConical className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate">{cls.name}</p>
                    <p className="text-xs text-muted-foreground">→ {cls.targetClass}</p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {statKey === 'duration' ? `${value}ms` : `${value}%`}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
