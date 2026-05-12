import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, LabelList,
} from 'recharts';
import { useState, useMemo } from 'react';
import { ArrowLeft, BarChart3, PieChart as PieIcon, Network, Activity } from 'lucide-react';
import {
  ProjectAnalysis, GenerationSummary,
  computeClassMetrics, computeTestClassMetrics,
} from '@/data/mockTestData';

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

function ChartCard({
  title, icon: Icon, children, right,
}: { title: string; icon: React.ElementType; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

/* ================== 项目分析图表区 ================== */
export function ProjectAnalysisCharts({ analysis }: { analysis: ProjectAnalysis }) {
  const classData = analysis.classes.map(c => {
    const cm = computeClassMetrics(c);
    return {
      name: c.name, methods: cm.methodCount, lines: cm.linesOfCode, complexity: cm.complexity,
    };
  });



  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="grid lg:grid-cols-2 gap-4"
    >
      <ChartCard title="各类代码量与方法数" icon={BarChart3}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={classData} margin={{ top: 5, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.muted, fontFamily: 'JetBrains Mono' }} />
            <YAxis tick={{ fontSize: 10, fill: C.muted }} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="lines" name="代码行" fill={C.primary} radius={[4, 4, 0, 0]} />
            <Bar dataKey="methods" name="方法数" fill={C.accent} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="各类圈复杂度雷达" icon={Activity}>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={classData}>
            <PolarGrid stroke={C.border} />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: C.muted, fontFamily: 'JetBrains Mono' }} />
            <PolarRadiusAxis tick={{ fontSize: 9, fill: C.muted }} />
            <Radar name="复杂度" dataKey="complexity" stroke={C.warning} fill={C.warning} fillOpacity={0.3} />
            <Tooltip {...tooltipStyle} />
          </RadarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="lg:col-span-2">
        <ChartCard title="类 → 方法 钻取视图（点击柱条查看该类下所有方法）" icon={Network}>
          <ClassMethodDrilldown analysis={analysis} />
        </ChartCard>
      </div>
    </motion.div>
  );
}

/** 可点击的钻取视图：类柱状图 -> 方法柱状图 */
function ClassMethodDrilldown({ analysis }: { analysis: ProjectAnalysis }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const classData = useMemo(() => analysis.classes.map(c => {
    const cm = computeClassMetrics(c);
    return { id: c.id, name: c.name, lines: cm.linesOfCode, methods: cm.methodCount, complexity: cm.complexity };
  }), [analysis]);

  const selectedClass = analysis.classes.find(c => c.id === selectedId);
  const methodData = selectedClass?.methods.map(m => ({
    name: m.name, lines: m.linesOfCode, complexity: m.complexity,
  })) ?? [];

  const complexityFill = (cx: number) =>
    cx > 8 ? C.destructive : cx > 5 ? C.warning : C.success;

  if (selectedClass) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setSelectedId(null)}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> 返回所有类
          </button>
          <span className="text-[11px] font-mono text-muted-foreground">
            {selectedClass.name} · {methodData.length} 方法
          </span>
        </div>
        <ResponsiveContainer width="100%" height={Math.max(220, methodData.length * 36)}>
          <BarChart data={methodData} layout="vertical" margin={{ top: 5, right: 32, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: C.muted }} />
            <YAxis type="category" dataKey="name" width={140}
                   tick={{ fontSize: 10, fill: C.muted, fontFamily: 'JetBrains Mono' }} />
            <Tooltip {...tooltipStyle}
              formatter={(v: any, _n, p: any) => [`${v} 行 · CC ${p.payload.complexity}`, p.payload.name]} />
            <Bar dataKey="lines" radius={[0, 4, 4, 0]}>
              {methodData.map((m, i) => (
                <Cell key={i} fill={complexityFill(m.complexity)} fillOpacity={0.85} />
              ))}
              <LabelList dataKey="complexity" position="right"
                formatter={(v: number) => `CC ${v}`}
                style={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: C.muted }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-muted-foreground">
          <LegendDot color={C.success} label="CC ≤ 5 低复杂度" />
          <LegendDot color={C.warning} label="CC 6 – 8 中等" />
          <LegendDot color={C.destructive} label="CC > 8 高复杂度" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-mono text-muted-foreground mb-2">
        柱条颜色 = 平均圈复杂度，点击任意柱条进入方法层级。
      </p>
      <ResponsiveContainer width="100%" height={Math.max(220, classData.length * 42)}>
        <BarChart data={classData} layout="vertical" margin={{ top: 5, right: 40, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: C.muted }} />
          <YAxis type="category" dataKey="name" width={140}
                 tick={{ fontSize: 10, fill: C.muted, fontFamily: 'JetBrains Mono' }} />
          <Tooltip {...tooltipStyle}
            formatter={(v: any, _n, p: any) =>
              [`${v} 行 · ${p.payload.methods} 方法 · CC ${p.payload.complexity}`, p.payload.name]} />
          <Bar dataKey="lines" radius={[0, 4, 4, 0]} cursor="pointer"
               onClick={(d: any) => setSelectedId(d.id)}>
            {classData.map((c, i) => (
              <Cell key={i} fill={complexityFill(c.complexity)} fillOpacity={0.85} />
            ))}
            <LabelList dataKey="methods" position="right"
              formatter={(v: number) => `${v} 方法`}
              style={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: C.muted }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-muted-foreground">
        <LegendDot color={C.success} label="低复杂度" />
        <LegendDot color={C.warning} label="中等" />
        <LegendDot color={C.destructive} label="高复杂度" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      <span>{label}</span>
    </span>
  );
}

/* ================== 生成结果图表区 ================== */
export function GenerationCharts({ summary }: { summary: GenerationSummary }) {
  let totalPassed = 0, totalFailed = 0, totalErrored = 0;
  summary.testClasses.forEach(tc => {
    const m = computeTestClassMetrics(tc);
    totalPassed += m.passedCount; totalFailed += m.failedCount; totalErrored += m.errorCount;
  });
  const pieData = [
    { name: '通过', value: totalPassed, color: C.success },
    { name: '失败', value: totalFailed, color: C.destructive },
    { name: '错误', value: totalErrored, color: C.warning },
  ].filter(d => d.value > 0);



  const overallRadar = [
    { metric: '行覆盖', value: summary.overallLineCoverage },
    { metric: '分支覆盖', value: summary.overallBranchCoverage },
    { metric: '指令覆盖', value: summary.overallInstructionCoverage },
    { metric: '方法覆盖', value: summary.overallMethodCoverage },
    { metric: '类覆盖', value: summary.overallClassCoverage },
    { metric: '变异得分', value: summary.overallMutationScore },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="grid lg:grid-cols-2 gap-4"
    >
      <ChartCard title="测试结果分布" icon={PieIcon}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70}
                 paddingAngle={2}>
              {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="hsl(var(--card))" />)}
            </Pie>
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="整体覆盖维度雷达" icon={Activity}>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={overallRadar}>
            <PolarGrid stroke={C.border} />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: C.muted }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: C.muted }} />
            <Radar name="覆盖率" dataKey="value" stroke={C.primary} fill={C.primary} fillOpacity={0.3} />
            <Tooltip {...tooltipStyle} />
          </RadarChart>
        </ResponsiveContainer>
      </ChartCard>
    </motion.div>
  );
}

/* ================== 源方法逐行覆盖视图 ================== */
export function SourceCoverageView({
  source, coverage,
}: {
  source: { line: number; code: string; status: 'covered' | 'partial' | 'uncovered' }[];
  coverage?: { covered: number; partial: number; uncovered: number; total: number };
}) {
  if (!source || source.length === 0) {
    return <p className="text-xs text-muted-foreground">未关联到对应的源方法。</p>;
  }
  const statusBg: Record<string, string> = {
    covered:   'bg-success/15 border-l-2 border-success',
    partial:   'bg-warning/15 border-l-2 border-warning',
    uncovered: 'bg-destructive/15 border-l-2 border-destructive',
  };
  const pct = coverage && coverage.total
    ? +((coverage.covered / coverage.total) * 100).toFixed(1)
    : 0;
  return (
    <div className="rounded-lg border border-code-border overflow-hidden bg-code-bg">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-code-border bg-card text-[11px] font-mono">
        <span className="text-muted-foreground">源方法逐行覆盖</span>
        {coverage && (
          <span className="flex items-center gap-2">
            <Legend2 color="success" label={`已覆盖 ${coverage.covered}`} />
            <Legend2 color="warning" label={`部分 ${coverage.partial}`} />
            <Legend2 color="destructive" label={`未覆盖 ${coverage.uncovered}`} />
            <span className="text-foreground">行覆盖 {pct}%</span>
          </span>
        )}
      </div>
      <div className="max-h-[40vh] overflow-auto font-mono text-[11px]">
        {source.map(l => (
          <div key={l.line} className={`flex ${statusBg[l.status]}`}>
            <span className="select-none w-10 shrink-0 text-right pr-2 py-0.5 text-muted-foreground/70 border-r border-code-border bg-card/50">
              {l.line}
            </span>
            <pre className="flex-1 px-3 py-0.5 whitespace-pre overflow-x-auto text-foreground">{l.code || ' '}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend2({ color, label }: { color: 'success' | 'warning' | 'destructive'; label: string }) {
  const cls = color === 'success' ? 'bg-success' : color === 'warning' ? 'bg-warning' : 'bg-destructive';
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`w-2 h-2 rounded-sm ${cls}`} />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
