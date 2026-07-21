import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Shield, CheckCircle2, XCircle, Zap, ListChecks, Target, MousePointerClick } from 'lucide-react';
import {
  GenerationSummary, computeGenerationTotals, computeTestClassMetrics,
} from '@/data/mockTestData';
import MutantDetailDialog from './MutantDetailDialog';


const C = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  destructive: 'hsl(var(--destructive))',
  info: 'hsl(var(--info))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted-foreground))',
  border: 'hsl(var(--border))',
};

const tooltipStyle = {
  contentStyle: {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 8,
    fontSize: 12,
    fontFamily: 'JetBrains Mono, monospace',
  },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 600 },
  itemStyle: { color: 'hsl(var(--muted-foreground))' },
};

// Derive mutation + assertion breakdowns from summary (mock).
function deriveMutation(summary: GenerationSummary) {
  // Approximate operator distribution using overall mutation score & class count
  const totalMutants = summary.testClasses.length * 42;
  const killedRate = summary.overallMutationScore / 100;
  const killed = Math.round(totalMutants * killedRate);
  const survived = Math.round(totalMutants * (1 - killedRate) * 0.7);
  const noCoverage = Math.round(totalMutants * (1 - killedRate) * 0.22);
  const timedOut = Math.max(0, totalMutants - killed - survived - noCoverage);

  const operators = [
    { name: 'CONDITIONALS', killed: Math.round(killed * 0.28), survived: Math.round(survived * 0.35) },
    { name: 'NEGATE_JUMPS', killed: Math.round(killed * 0.18), survived: Math.round(survived * 0.20) },
    { name: 'MATH',         killed: Math.round(killed * 0.14), survived: Math.round(survived * 0.10) },
    { name: 'INCREMENTS',   killed: Math.round(killed * 0.10), survived: Math.round(survived * 0.08) },
    { name: 'VOID_METHOD',  killed: Math.round(killed * 0.12), survived: Math.round(survived * 0.11) },
    { name: 'RETURN_VALS',  killed: Math.round(killed * 0.11), survived: Math.round(survived * 0.09) },
    { name: 'EMPTY_RETURN', killed: Math.round(killed * 0.07), survived: Math.round(survived * 0.07) },
  ];

  return {
    totalMutants, killed, survived, noCoverage, timedOut,
    killRate: +(killedRate * 100).toFixed(1),
    operators,
    outcomes: [
      { name: 'Killed',      value: killed,     color: C.success },
      { name: 'Survived',    value: survived,   color: C.destructive },
      { name: 'No Coverage', value: noCoverage, color: C.warning },
      { name: 'Timed Out',   value: timedOut,   color: C.info },
    ].filter(d => d.value > 0),
  };
}

function deriveAssertions(summary: GenerationSummary) {
  // Rough per-test assertion counts by heuristic on assertion string
  let total = 0, equals = 0, truthy = 0, throwsA = 0, nullA = 0, verify = 0, other = 0;
  summary.testClasses.forEach(tc => {
    tc.methods.forEach(m => {
      const a = (m.assertion || '') + ' ' + (m.body || '');
      const count =
        (a.match(/assert[A-Za-z]+\s*\(/g)?.length ?? 0) +
        (a.match(/verify\s*\(/g)?.length ?? 0);
      const c = Math.max(1, count);
      total += c;
      if (/assertEquals/.test(a)) equals += Math.max(1, (a.match(/assertEquals/g) ?? []).length);
      if (/assertTrue|assertFalse/.test(a)) truthy += (a.match(/assert(True|False)/g) ?? []).length;
      if (/assertThrows/.test(a)) throwsA += (a.match(/assertThrows/g) ?? []).length;
      if (/assertNull|assertNotNull/.test(a)) nullA += (a.match(/assert(Null|NotNull)/g) ?? []).length;
      if (/verify\s*\(/.test(a)) verify += (a.match(/verify\s*\(/g) ?? []).length;
    });
  });
  other = Math.max(0, total - equals - truthy - throwsA - nullA - verify);
  const totalTests = computeGenerationTotals(summary).totalTestMethods;
  const density = totalTests ? +(total / totalTests).toFixed(2) : 0;

  return {
    total, density,
    types: [
      { name: 'assertEquals',   value: equals,  color: C.primary },
      { name: 'assertTrue/False', value: truthy, color: C.info },
      { name: 'assertThrows',   value: throwsA, color: C.warning },
      { name: 'assertNull/NotNull', value: nullA, color: C.accent },
      { name: 'verify (mock)',  value: verify,  color: C.success },
      { name: '其他',           value: other,   color: C.muted },
    ].filter(d => d.value > 0),
  };
}

interface Props {
  summary: GenerationSummary;
}

export default function MutationAssertionPanel({ summary }: Props) {
  const mut = deriveMutation(summary);
  const asr = deriveAssertions(summary);
  const [filter, setFilter] = useState<{ operator?: string; targetClass?: string } | null>(null);

  // Per-class mutation stacked bar
  const perClass = summary.testClasses.map(tc => {
    const cm = computeTestClassMetrics(tc);
    const total = cm.testMethodCount * 6;
    const killed = Math.round(total * (tc.mutationScore / 100));
    const survived = total - killed;
    return { name: tc.targetClass, killed, survived, mutation: tc.mutationScore };
  });

  const openOperator = (name?: string) => name && setFilter({ operator: name });
  const openClass = (name?: string) => name && setFilter({ targetClass: name });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Row 1: KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="变异体总数" value={mut.totalMutants} icon={Shield} tone="primary" />
        <Kpi label="Killed" value={mut.killed} extra={`${mut.killRate}%`} icon={CheckCircle2} tone="success" />
        <Kpi label="Survived" value={mut.survived} icon={XCircle} tone="destructive" />
        <Kpi label="断言总数 · 密度" value={asr.total} extra={`${asr.density} / test`} icon={ListChecks} tone="info" />
      </div>

      <div className="rounded-md border border-dashed border-primary/30 bg-primary/5 px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground">
        <MousePointerClick className="w-3.5 h-3.5 text-primary" />
        点击「变异算子」条形或「各待测类」条形，查看变异体触发的断言变化、击杀原因与差异对比。
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Mutation outcomes pie */}
        <Card title="变异测试结果分布" icon={Shield}>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={mut.outcomes} dataKey="value" nameKey="name"
                   innerRadius={46} outerRadius={78} paddingAngle={2}>
                {mut.outcomes.map((d, i) => <Cell key={i} fill={d.color} stroke="hsl(var(--card))" />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Mutation operators killed vs survived */}
        <Card title="变异算子 · Killed vs Survived · 可点击" icon={Zap}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={mut.operators} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}
                      onClick={(e: any) => openOperator(e?.activeLabel)}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: C.muted, fontFamily: 'JetBrains Mono' }} angle={-18} height={40} textAnchor="end" />
              <YAxis tick={{ fontSize: 10, fill: C.muted }} />
              <Tooltip {...tooltipStyle} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="killed"   name="Killed"   stackId="m" fill={C.success} radius={[4, 4, 0, 0]}
                   cursor="pointer" onClick={(d: any) => openOperator(d?.name)} />
              <Bar dataKey="survived" name="Survived" stackId="m" fill={C.destructive} radius={[4, 4, 0, 0]}
                   cursor="pointer" onClick={(d: any) => openOperator(d?.name)} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Per-class mutation */}
        <Card title="各待测类 · 变异得分 · 可点击" icon={Target}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={perClass} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}
                      onClick={(e: any) => openClass(e?.activeLabel)}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: C.muted, fontFamily: 'JetBrains Mono' }} angle={-15} height={40} textAnchor="end" />
              <YAxis tick={{ fontSize: 10, fill: C.muted }} />
              <Tooltip {...tooltipStyle} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="killed"   name="Killed"   stackId="c" fill={C.success} radius={[4, 4, 0, 0]}
                   cursor="pointer" onClick={(d: any) => openClass(d?.name)} />
              <Bar dataKey="survived" name="Survived" stackId="c" fill={C.destructive} radius={[4, 4, 0, 0]}
                   cursor="pointer" onClick={(d: any) => openClass(d?.name)} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Assertion types */}
        <Card title="断言类型分布" icon={ListChecks}>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={asr.types} dataKey="value" nameKey="name"
                   innerRadius={46} outerRadius={78} paddingAngle={2}>
                {asr.types.map((d, i) => <Cell key={i} fill={d.color} stroke="hsl(var(--card))" />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <MutantDetailDialog
        open={!!filter}
        onOpenChange={(o) => !o && setFilter(null)}
        summary={summary}
        filter={filter}
      />
    </motion.div>
  );
}

function Kpi({ label, value, extra, icon: Icon, tone }: {
  label: string; value: number | string; extra?: string; icon: React.ElementType;
  tone: 'primary' | 'success' | 'destructive' | 'info' | 'warning';
}) {
  const toneMap = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    destructive: 'text-destructive bg-destructive/10',
    info: 'text-info bg-info/10',
    warning: 'text-warning bg-warning/10',
  };
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 shadow-sm">
      <div className={`rounded-lg p-2 ${toneMap[tone]}`}><Icon className="w-4 h-4" /></div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-card-foreground font-mono">
          {value}{extra && <span className="text-xs text-muted-foreground ml-2">{extra}</span>}
        </p>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}
