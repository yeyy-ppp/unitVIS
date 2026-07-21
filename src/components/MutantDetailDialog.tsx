import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bug, Skull, ShieldAlert, GitCompare, CheckCircle2, XCircle, MapPin, Zap } from 'lucide-react';
import { GenerationSummary } from '@/data/mockTestData';

export interface Mutant {
  id: string;
  operator: string;
  status: 'Killed' | 'Survived' | 'No Coverage' | 'Timed Out';
  targetClass: string;
  method: string;
  line: number;
  original: string;
  mutated: string;
  description: string;
  killedByTest?: string;
  killReason?: string;
  assertionBefore?: { code: string; result: string };
  assertionAfter?: { code: string; result: string };
}

const OPERATOR_TEMPLATES: Record<string, { desc: string; mutate: () => { orig: string; mut: string; assertVal: [string, string] } }> = {
  CONDITIONALS: {
    desc: '条件边界变异：将 >= 替换为 >，改变边界条件',
    mutate: () => ({ orig: 'if (total >= threshold) {', mut: 'if (total > threshold) {', assertVal: ['true', 'false'] }),
  },
  NEGATE_JUMPS: {
    desc: '跳转条件反转：将 if 条件取反',
    mutate: () => ({ orig: 'if (isValid) return result;', mut: 'if (!isValid) return result;', assertVal: ['OK', 'ERROR'] }),
  },
  MATH: {
    desc: '算术运算符替换：将 + 替换为 -',
    mutate: () => ({ orig: 'return base + tax;', mut: 'return base - tax;', assertVal: ['120.0', '80.0'] }),
  },
  INCREMENTS: {
    desc: '自增自减变异：将 ++ 替换为 --',
    mutate: () => ({ orig: 'count++;', mut: 'count--;', assertVal: ['5', '3'] }),
  },
  VOID_METHOD: {
    desc: '空方法调用移除：删除 void 方法调用',
    mutate: () => ({ orig: 'logger.info(msg);', mut: '/* removed call */', assertVal: ['called', 'not called'] }),
  },
  RETURN_VALS: {
    desc: '返回值变异：将返回对象替换为 null',
    mutate: () => ({ orig: 'return result;', mut: 'return null;', assertVal: ['non-null', 'null'] }),
  },
  EMPTY_RETURN: {
    desc: '空返回变异：将返回值替换为默认值',
    mutate: () => ({ orig: 'return computeValue();', mut: 'return 0;', assertVal: ['42', '0'] }),
  },
};

// Deterministic pseudo-random for stable mocks
function h(s: string): number {
  let x = 0;
  for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(x);
}

export function buildMutants(summary: GenerationSummary, opFilter?: string, classFilter?: string): Mutant[] {
  const ops = Object.keys(OPERATOR_TEMPLATES);
  const list: Mutant[] = [];

  summary.testClasses.forEach((tc) => {
    if (classFilter && tc.targetClass !== classFilter) return;
    const perClass = 6;
    const killRatio = tc.mutationScore / 100;
    for (let i = 0; i < perClass; i++) {
      const op = ops[(h(tc.targetClass + i) + (opFilter ? ops.indexOf(opFilter) : 0)) % ops.length];
      const chosenOp = opFilter ?? op;
      const t = OPERATOR_TEMPLATES[chosenOp];
      const { orig, mut, assertVal } = t.mutate();
      const method = tc.methods[i % Math.max(1, tc.methods.length)];
      const killed = (h(tc.targetClass + chosenOp + i) % 100) / 100 < killRatio;
      const status: Mutant['status'] = killed ? 'Killed' : (i % 5 === 0 ? 'No Coverage' : 'Survived');
      const line = 20 + (h(chosenOp + i) % 60);
      const testName = method?.name ?? `test_${chosenOp.toLowerCase()}_${i}`;
      const assertionCode = `assertEquals(expected, actual); // ${testName}`;

      list.push({
        id: `${tc.targetClass}-${chosenOp}-${i}`,
        operator: chosenOp,
        status,
        targetClass: tc.targetClass,
        method: method?.name ?? 'unknown',
        line,
        original: orig,
        mutated: mut,
        description: t.desc,
        killedByTest: killed ? testName : undefined,
        killReason: killed
          ? `断言 assertEquals 失败：期望 ${assertVal[0]}，变异后实际得到 ${assertVal[1]}，测试用例检测到行为差异。`
          : (status === 'No Coverage'
            ? '该行代码未被任何测试覆盖，变异未被执行。'
            : '现有断言集合无法区分原始行为与变异行为，需要更强的断言（如状态验证 / 边界值断言）。'),
        assertionBefore: { code: assertionCode, result: `PASS · actual = ${assertVal[0]}` },
        assertionAfter: killed
          ? { code: assertionCode, result: `FAIL · expected ${assertVal[0]} but was ${assertVal[1]}` }
          : { code: assertionCode, result: `PASS · actual = ${assertVal[0]} (未检测到变异)` },
      });
    }
  });

  return list;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: GenerationSummary;
  filter: { operator?: string; targetClass?: string } | null;
}

export default function MutantDetailDialog({ open, onOpenChange, summary, filter }: Props) {
  const mutants = useMemo(
    () => (filter ? buildMutants(summary, filter.operator, filter.targetClass) : []),
    [summary, filter]
  );

  const title = filter?.operator
    ? `变异算子 · ${filter.operator}`
    : filter?.targetClass
      ? `待测类变异明细 · ${filter.targetClass}`
      : '变异明细';

  const killed = mutants.filter(m => m.status === 'Killed').length;
  const survived = mutants.filter(m => m.status === 'Survived').length;
  const noCov = mutants.filter(m => m.status === 'No Coverage').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Bug className="w-4 h-4 text-primary" /> {title}
          </DialogTitle>
          <DialogDescription className="flex gap-2 mt-2">
            <Badge variant="outline" className="border-success/40 text-success font-mono">Killed {killed}</Badge>
            <Badge variant="outline" className="border-destructive/40 text-destructive font-mono">Survived {survived}</Badge>
            {noCov > 0 && <Badge variant="outline" className="border-warning/40 text-warning font-mono">No Cov {noCov}</Badge>}
            <span className="text-xs text-muted-foreground ml-1">共 {mutants.length} 个变异体</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[68vh] px-6 py-4">
          <div className="space-y-4">
            {mutants.map(m => <MutantCard key={m.id} m={m} />)}
            {mutants.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">无匹配变异体</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function MutantCard({ m }: { m: Mutant }) {
  const isKilled = m.status === 'Killed';
  const statusIcon = isKilled ? Skull : m.status === 'No Coverage' ? ShieldAlert : XCircle;
  const StatusIcon = statusIcon;
  const tone =
    isKilled ? 'text-success border-success/40 bg-success/5'
    : m.status === 'No Coverage' ? 'text-warning border-warning/40 bg-warning/5'
    : 'text-destructive border-destructive/40 bg-destructive/5';

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/30">
        <div className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-mono ${tone}`}>
          <StatusIcon className="w-3 h-3" /> {m.status}
        </div>
        <span className="text-xs font-mono text-primary flex items-center gap-1"><Zap className="w-3 h-3" />{m.operator}</span>
        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto font-mono">
          <MapPin className="w-3 h-3" /> {m.targetClass}#{m.method}:L{m.line}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground">{m.description}</p>

        {/* Diff */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
            <GitCompare className="w-3 h-3" /> 变异差异
          </div>
          <div className="rounded-md border border-border overflow-hidden font-mono text-xs">
            <div className="flex items-start gap-2 px-3 py-1.5 bg-destructive/10 border-l-2 border-destructive">
              <span className="text-destructive select-none">-</span>
              <span className="text-card-foreground whitespace-pre-wrap flex-1">{m.original}</span>
            </div>
            <div className="flex items-start gap-2 px-3 py-1.5 bg-success/10 border-l-2 border-success">
              <span className="text-success select-none">+</span>
              <span className="text-card-foreground whitespace-pre-wrap flex-1">{m.mutated}</span>
            </div>
          </div>
        </div>

        {/* Assertion before/after */}
        <div className="grid md:grid-cols-2 gap-3">
          <AssertionBox
            label="原始代码 · 断言执行"
            code={m.assertionBefore!.code}
            result={m.assertionBefore!.result}
            pass
          />
          <AssertionBox
            label="变异后 · 断言执行"
            code={m.assertionAfter!.code}
            result={m.assertionAfter!.result}
            pass={!isKilled}
          />
        </div>

        {/* Kill reason */}
        <div className={`rounded-md border p-3 text-xs ${isKilled ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'}`}>
          <div className="flex items-center gap-1.5 mb-1 font-semibold">
            {isKilled
              ? <><Skull className="w-3.5 h-3.5 text-success" /><span className="text-success">击杀原因</span></>
              : <><ShieldAlert className="w-3.5 h-3.5 text-warning" /><span className="text-warning">存活原因 · 断言弱点</span></>}
            {m.killedByTest && (
              <span className="ml-auto font-mono text-muted-foreground">by {m.killedByTest}</span>
            )}
          </div>
          <p className="text-card-foreground leading-relaxed">{m.killReason}</p>
        </div>
      </div>
    </div>
  );
}

function AssertionBox({ label, code, result, pass }: { label: string; code: string; result: string; pass: boolean }) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="px-3 py-1.5 bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="p-3 space-y-1.5">
        <code className="block text-xs font-mono text-card-foreground bg-muted/30 rounded px-2 py-1">{code}</code>
        <div className={`flex items-center gap-1.5 text-xs font-mono ${pass ? 'text-success' : 'text-destructive'}`}>
          {pass ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          {result}
        </div>
      </div>
    </div>
  );
}
