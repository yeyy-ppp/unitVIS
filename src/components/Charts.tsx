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
        <ChartCard title="类 → 方法 树状结构（节点大小 = 代码行数）" icon={Network}>
          <ClassMethodTree analysis={analysis} />
          <div className="mt-3 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treeData}
                dataKey="size"
                stroke="hsl(var(--card))"
                fill={C.primary}
                content={<TreeCell />}
              />
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </motion.div>
  );
}

function TreeCell(props: any) {
  const { x, y, width, height, name, complexity } = props;
  if (width < 28 || height < 18) {
    return <rect x={x} y={y} width={width} height={height} fill="hsl(var(--muted))" stroke="hsl(var(--card))" />;
  }
  const cx = complexity || 1;
  const fill =
    cx > 8 ? 'hsl(var(--destructive) / 0.7)' :
    cx > 5 ? 'hsl(var(--warning) / 0.7)' :
             'hsl(var(--success) / 0.55)';
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="hsl(var(--card))" strokeWidth={2} />
      {width > 60 && height > 30 && (
        <text x={x + 6} y={y + 16} fill="hsl(var(--foreground))"
              fontSize={10} fontFamily="JetBrains Mono">{name}</text>
      )}
    </g>
  );
}

/** 可点击的树状节点（类 -> 方法） */
function ClassMethodTree({ analysis }: { analysis: ProjectAnalysis }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div className="rounded-lg border border-border divide-y divide-border max-h-60 overflow-auto">
      {analysis.classes.map(c => {
        const cm = computeClassMetrics(c);
        const isOpen = open[c.id];
        return (
          <div key={c.id}>
            <button
              onClick={() => setOpen(o => ({ ...o, [c.id]: !o[c.id] }))}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/40"
            >
              {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
              <span className="text-sm font-mono text-card-foreground flex-1">{c.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {cm.methodCount} 方法 · {cm.linesOfCode} 行 · CC {cm.complexity}
              </span>
            </button>
            {isOpen && (
              <div className="bg-muted/20">
                {c.methods.map(m => (
                  <div key={m.name} className="pl-9 pr-3 py-1.5 flex items-center gap-2">
                    <span className="text-xs font-mono text-foreground flex-1 truncate">{m.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{m.linesOfCode} 行</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      m.complexity > 8 ? 'bg-destructive/10 text-destructive' :
                      m.complexity > 5 ? 'bg-warning/10 text-warning' :
                      'bg-success/10 text-success'
                    }`}>CC {m.complexity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
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

  const covData = summary.testClasses.map(tc => ({
    name: tc.name.replace(/Test$/, ''),
    line: tc.lineCoverage,
    branch: tc.branchCoverage,
    instruction: tc.instructionCoverage ?? tc.lineCoverage,
    mutation: tc.mutationScore,
  }));

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
      className="grid lg:grid-cols-3 gap-4"
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

      <ChartCard title="各测试类覆盖率对比" icon={BarChart3}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={covData} margin={{ top: 5, right: 6, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: C.muted, fontFamily: 'JetBrains Mono' }} />
            <YAxis tick={{ fontSize: 10, fill: C.muted }} domain={[0, 100]} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="line" name="行" fill={C.primary} radius={[3, 3, 0, 0]} />
            <Bar dataKey="branch" name="分支" fill={C.warning} radius={[3, 3, 0, 0]} />
            <Bar dataKey="instruction" name="指令" fill={C.info} radius={[3, 3, 0, 0]} />
            <Bar dataKey="mutation" name="变异" fill={C.accent} radius={[3, 3, 0, 0]} />
          </BarChart>
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
