import { motion } from 'framer-motion';
import {
  Bot, ScanSearch, FlaskConical, Play, Shield, Wrench, ClipboardCheck,
  ArrowRight, MessageSquare, Activity, CheckCircle2, Loader2, Cpu,
} from 'lucide-react';
import { GenerationSummary, FixRecord, computeGenerationTotals } from '@/data/mockTestData';

interface Props {
  summary: GenerationSummary;
  fixHistory: FixRecord[];
}

type AgentStatus = 'idle' | 'running' | 'done';

interface AgentDef {
  id: string;
  name: string;
  role: string;
  icon: React.ElementType;
  tone: 'primary' | 'info' | 'success' | 'warning' | 'destructive' | 'accent';
  status: AgentStatus;
  metric: string;
  lastMessage: string;
}

const toneClass: Record<AgentDef['tone'], string> = {
  primary:     'text-primary bg-primary/10 border-primary/30',
  info:        'text-info bg-info/10 border-info/30',
  success:     'text-success bg-success/10 border-success/30',
  warning:     'text-warning bg-warning/10 border-warning/30',
  destructive: 'text-destructive bg-destructive/10 border-destructive/30',
  accent:      'text-accent bg-accent/10 border-accent/30',
};

export default function AgentPipelinePanel({ summary, fixHistory }: Props) {
  const totals = computeGenerationTotals(summary);
  const failing = totals.failed + totals.errored;
  const fixed = fixHistory.length;
  const pendingFixes = Math.max(0, failing - fixed);

  const agents: AgentDef[] = [
    {
      id: 'analyzer', name: 'Analyzer Agent', role: '源码静态分析 · AST · 控制流',
      icon: ScanSearch, tone: 'primary', status: 'done',
      metric: `${summary.testClasses.length} 类 · ${totals.totalTestMethods} 方法`,
      lastMessage: '已抽取类/方法结构、圈复杂度与调用图，生成状态图供下游使用。',
    },
    {
      id: 'planner', name: 'Planner Agent', role: '测试意图规划 · 用例分层',
      icon: Cpu, tone: 'info', status: 'done',
      metric: `${totals.totalTestMethods} 计划用例`,
      lastMessage: '按 CFG 分支与失败风险生成分层用例计划，交付给 Generator。',
    },
    {
      id: 'generator', name: 'Generator Agent', role: 'LLM 测试代码合成',
      icon: FlaskConical, tone: 'accent', status: 'done',
      metric: `${totals.totalTestMethods} 方法`,
      lastMessage: '已生成测试代码，使用 JUnit5 + Mockito，覆盖参数化与边界。',
    },
    {
      id: 'executor', name: 'Executor Agent', role: '编译 · 沙箱执行 · JaCoCo 采集',
      icon: Play, tone: 'success', status: 'done',
      metric: `${totals.passed}/${totals.totalTestMethods} 通过 · ${(totals.totalDuration / 1000).toFixed(1)}s`,
      lastMessage: `覆盖率 line=${summary.overallLineCoverage}% branch=${summary.overallBranchCoverage}% inst=${summary.overallInstructionCoverage}%`,
    },
    {
      id: 'mutator', name: 'Mutator Agent', role: 'PIT 变异测试 · 幸存者定位',
      icon: Shield, tone: 'warning', status: 'done',
      metric: `mutation=${summary.overallMutationScore}%`,
      lastMessage: '已跑完变异测试，检出边界与断言不足的幸存变异体，标记给 Fixer。',
    },
    {
      id: 'fixer', name: 'Fixer Agent', role: 'AI 修复建议 · 一键补丁',
      icon: Wrench, tone: 'destructive', status: pendingFixes > 0 ? 'running' : (fixed > 0 ? 'done' : 'idle'),
      metric: `${fixed}/${failing} 已修复 · ${pendingFixes} 待处理`,
      lastMessage: pendingFixes > 0
        ? `识别出 ${pendingFixes} 个失败/错误用例，已生成候选补丁待用户确认。`
        : (fixed > 0 ? '所有失败用例的修复提案已被采纳并写入历史。' : '暂无失败用例需要修复。'),
    },
    {
      id: 'reviewer', name: 'Reviewer Agent', role: '质量门禁 · 覆盖/变异/断言评审',
      icon: ClipboardCheck, tone: 'primary', status: 'done',
      metric: `pass=${totals.overallPassRate}% · mut=${summary.overallMutationScore}%`,
      lastMessage: '综合指标已达发布门槛的 82%，仍建议提升 PaymentService 的分支覆盖。',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 via-card to-accent/5 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg p-2 bg-primary/15 text-primary">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">多智能体协作流水线</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              7 个专用 Agent 顺序 + 反馈闭环，从源码分析到修复评审全自动交付高质量测试代码。
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs font-mono">
            <span className="text-muted-foreground">总耗时</span>
            <span className="text-foreground">{(totals.totalDuration / 1000).toFixed(1)}s</span>
            <span className="text-muted-foreground">通过率</span>
            <span className="text-success">{totals.overallPassRate}%</span>
            <span className="text-muted-foreground">变异得分</span>
            <span className="text-primary">{summary.overallMutationScore}%</span>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm overflow-x-auto">
        <div className="flex items-stretch gap-2 min-w-max">
          {agents.map((a, i) => {
            const Icon = a.icon;
            return (
              <div key={a.id} className="flex items-stretch gap-2">
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className={`w-56 rounded-lg border p-3 flex flex-col gap-2 ${toneClass[a.tone]}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-semibold font-mono">{a.name}</span>
                    <span className="ml-auto">
                      {a.status === 'running' && <Loader2 className="w-3 h-3 animate-spin" />}
                      {a.status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                      {a.status === 'idle' && <span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" />}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground/80 font-mono leading-relaxed">{a.role}</p>
                  <p className="text-[11px] font-mono text-foreground/90 border-t border-foreground/10 pt-1.5">{a.metric}</p>
                </motion.div>
                {i < agents.length - 1 && (
                  <div className="flex items-center text-muted-foreground shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Message stream */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Agent 消息流</h3>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground inline-flex items-center gap-1">
            <Activity className="w-3 h-3" />实时
          </span>
        </div>
        <div className="divide-y divide-border">
          {agents.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i }}
                className="px-5 py-3 flex items-start gap-3"
              >
                <div className={`shrink-0 rounded-md border p-1.5 ${toneClass[a.tone]}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-foreground">
                    <span className="font-semibold">{a.name}</span>
                    <span className="text-muted-foreground"> · {a.role}</span>
                  </p>
                  <p className="text-sm text-card-foreground mt-0.5">{a.lastMessage}</p>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0 mt-1">
                  T+{(i * 1.4 + 0.2).toFixed(1)}s
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
