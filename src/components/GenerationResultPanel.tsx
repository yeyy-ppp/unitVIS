import { motion } from 'framer-motion';
import { 
  FlaskConical, CheckCircle2, XCircle, AlertTriangle, Clock, 
  Percent, ArrowLeft, ChevronRight, Target, Shield, GitBranch 
} from 'lucide-react';
import { GenerationSummary, TestClassResult, TestMethodResult } from '@/data/mockTestData';
import StatCard from './StatCard';
import { useState } from 'react';

const statusConfig = {
  passed: { icon: CheckCircle2, label: '通过', className: 'text-success bg-success/10' },
  failed: { icon: XCircle, label: '失败', className: 'text-destructive bg-destructive/10' },
  error: { icon: AlertTriangle, label: '错误', className: 'text-warning bg-warning/10' },
};

interface Props {
  summary: GenerationSummary;
}

export default function GenerationResultPanel({ summary }: Props) {
  const [selectedClass, setSelectedClass] = useState<TestClassResult | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<TestMethodResult | null>(null);

  // Method detail view
  if (selectedMethod && selectedClass) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        <button
          onClick={() => setSelectedMethod(null)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回 {selectedClass.name}
        </button>
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-base font-semibold text-card-foreground font-mono">{selectedMethod.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              测试目标: <span className="font-mono text-foreground">{selectedMethod.targetMethod}</span>
            </p>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              {(() => {
                const cfg = statusConfig[selectedMethod.status];
                const Icon = cfg.icon;
                return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${cfg.className}`}>
                    <Icon className="w-4 h-4" />
                    {cfg.label}
                  </span>
                );
              })()}
              <span className="text-sm text-muted-foreground font-mono">{selectedMethod.duration}ms</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">断言表达式</p>
              <pre className="text-sm font-mono bg-code-bg border border-code-border rounded-lg px-4 py-3 text-foreground">
                {selectedMethod.assertion}
              </pre>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Test class detail view
  if (selectedClass) {
    return (
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
              { label: '测试方法', value: selectedClass.testMethodCount },
              { label: '通过', value: selectedClass.passedCount, color: 'text-success' },
              { label: '失败', value: selectedClass.failedCount, color: 'text-destructive' },
              { label: '错误', value: selectedClass.errorCount, color: 'text-warning' },
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
    );
  }

  // Overview
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="测试类" value={summary.totalTestClasses} icon={FlaskConical} color="primary" delay={0} />
        <StatCard label="测试方法" value={summary.totalTestMethods} icon={Target} color="info" delay={0.05} />
        <StatCard label="通过率" value={`${summary.overallPassRate}%`} icon={CheckCircle2} color="success" delay={0.1} />
        <StatCard label="失败率" value={`${summary.overallFailRate}%`} icon={XCircle} color="destructive" delay={0.15} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="行覆盖率" value={`${summary.overallLineCoverage}%`} icon={Percent} color="info" delay={0.2} />
        <StatCard label="分支覆盖率" value={`${summary.overallBranchCoverage}%`} icon={GitBranch} color="warning" delay={0.25} />
        <StatCard label="变异得分" value={`${summary.overallMutationScore}%`} icon={Shield} color="primary" delay={0.3} />
        <StatCard label="总耗时" value={`${(summary.totalDuration / 1000).toFixed(1)}s`} icon={Clock} color="success" delay={0.35} />
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
            const passRate = Math.round((tc.passedCount / tc.testMethodCount) * 100);
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
                  <span className="text-success">{tc.passedCount}✓</span>
                  {tc.failedCount > 0 && <span className="text-destructive">{tc.failedCount}✗</span>}
                  {tc.errorCount > 0 && <span className="text-warning">{tc.errorCount}!</span>}
                  <span>行覆盖 {tc.lineCoverage}%</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
