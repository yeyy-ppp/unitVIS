import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileCode, FileJson, X, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  parseSource, parseCoverageJson, buildProjectAnalysis, buildGenerationSummary,
  ParsedSource, CoverageReport,
} from '@/lib/codeParser';
import { ProjectAnalysis, GenerationSummary } from '@/data/mockTestData';
import { toast } from 'sonner';

interface Props {
  onApply: (analysis: ProjectAnalysis, summary: GenerationSummary) => void;
}

interface FileEntry {
  name: string;
  size: number;
  kind: 'source' | 'test' | 'coverage';
  parsed?: ParsedSource;
  coverage?: CoverageReport;
}

export default function UploadPanel({ onApply }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [testIntent, setTestIntent] = useState('');

  const handleFiles = async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    const next: FileEntry[] = [];
    for (const f of arr) {
      const text = await f.text();
      if (/\.(json|xml)$/i.test(f.name) || /coverage/i.test(f.name)) {
        const cov = parseCoverageJson(text);
        if (cov) {
          next.push({ name: f.name, size: f.size, kind: 'coverage', coverage: cov });
        } else {
          toast.error(`${f.name} 不是有效的 JSON 覆盖率报告`);
        }
        continue;
      }
      try {
        const p = parseSource(f.name, text);
        next.push({
          name: f.name,
          size: f.size,
          kind: p.isTest ? 'test' : 'source',
          parsed: p,
        });
      } catch (e: any) {
        toast.error(`${f.name} 解析失败: ${e.message}`);
      }
    }
    setFiles(prev => [...prev, ...next]);
    toast.success(`已添加 ${next.length} 个文件`);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const remove = (i: number) => setFiles(files.filter((_, idx) => idx !== i));

  const apply = () => {
    const sources = files.filter(f => f.parsed).map(f => f.parsed!);
    const coverage = files.find(f => f.coverage)?.coverage || null;
    if (!sources.length) {
      toast.error('请至少上传一个源代码文件');
      return;
    }
    const analysis = buildProjectAnalysis(sources);
    const summary = buildGenerationSummary(sources, coverage);
    onApply(analysis, summary);
    toast.success(`已应用：${analysis.classes.length} 个待测类，${summary.testClasses.length} 个测试类`);
  };

  const sourceCount = files.filter(f => f.kind === 'source').length;
  const testCount = files.filter(f => f.kind === 'test').length;
  const coverageCount = files.filter(f => f.kind === 'coverage').length;

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`bg-card rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      >
        <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
        <p className="text-sm font-medium text-card-foreground">
          点击或拖拽文件到此处上传
        </p>
        <p className="text-xs text-muted-foreground mt-1.5">
          支持 <span className="font-mono">.java / .kt / .ts / .js</span> 源代码与测试代码，
          及 <span className="font-mono">.json</span> 覆盖率报告
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".java,.kt,.ts,.js,.json,.xml"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </motion.div>

      <div className="bg-card rounded-xl border border-border p-4 space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="testIntent" className="text-sm font-medium text-card-foreground">
            测试目标 / 测试意图
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              （可选，将注入到测试生成提示词中，引导模型生成更贴合意图的测试代码）
            </span>
          </label>
          <span className="text-[11px] font-mono text-muted-foreground">{testIntent.length}/500</span>
        </div>
        <textarea
          id="testIntent"
          value={testIntent}
          onChange={(e) => setTestIntent(e.target.value.slice(0, 500))}
          placeholder="例如：重点覆盖支付失败回滚分支、卡号 Luhn 校验所有边界、库存并发预占的负值保护，并优先生成异常路径用例。"
          rows={3}
          className="w-full text-sm font-mono rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">待测源代码</p>
          <p className="text-xl font-semibold font-mono text-card-foreground">{sourceCount}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">测试代码</p>
          <p className="text-xl font-semibold font-mono text-card-foreground">{testCount}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">覆盖率报告</p>
          <p className="text-xl font-semibold font-mono text-card-foreground">{coverageCount}</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-card-foreground">已上传文件 ({files.length})</h3>
            <button
              onClick={apply}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              应用到看板
            </button>
          </div>
          <div className="divide-y divide-border">
            {files.map((f, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                {f.kind === 'coverage'
                  ? <FileJson className="w-4 h-4 text-warning shrink-0" />
                  : <FileCode className={`w-4 h-4 shrink-0 ${f.kind === 'test' ? 'text-info' : 'text-primary'}`} />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono truncate text-card-foreground">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.kind === 'coverage'
                      ? `覆盖率报告 · ${Object.keys(f.coverage || {}).length} 项条目`
                      : `${f.kind === 'test' ? '测试类' : '待测类'} · ${f.parsed?.className} · ${f.parsed?.methods.length} 个方法`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{(f.size / 1024).toFixed(1)} KB</span>
                <button onClick={() => remove(i)} className="p-1 rounded hover:bg-muted">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-muted/30 rounded-lg border border-border p-4 flex gap-3">
        <AlertCircle className="w-4 h-4 text-info shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p>· 自动识别测试代码：文件名以 <span className="font-mono">Test</span> 结尾或包含 <span className="font-mono">@Test</span> 注解</p>
          <p>· 自动从代码中提取方法签名、方法体并计算圈复杂度（CC）与代码行数</p>
          <p>· 覆盖率 JSON 格式示例：</p>
          <pre className="font-mono bg-card border border-border rounded p-2 mt-1 text-[11px] overflow-auto">{`{
  "__overall__": { "lineCoverage": 78.5, "branchCoverage": 65.2, "mutationScore": 58.3 },
  "UserService": {
    "lineCoverage": 92.3, "branchCoverage": 78.6, "mutationScore": 72,
    "methods": {
      "testCreateUser_success": { "status": "passed", "duration": 45, "assertion": "..." }
    }
  }
}`}</pre>
        </div>
      </div>
    </div>
  );
}
