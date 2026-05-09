import {
  ProjectAnalysis, ClassInfo, MethodInfo,
  GenerationSummary, TestClassResult, TestMethodResult,
} from '@/data/mockTestData';

// Extract package
function extractPackage(src: string): string {
  const m = src.match(/package\s+([\w.]+)\s*;/);
  return m ? m[1] : '';
}

// Extract top-level public class/interface name
function extractClassName(src: string, fallback: string): string {
  const m = src.match(/(?:public\s+)?(?:abstract\s+|final\s+)?(?:class|interface|enum)\s+(\w+)/);
  return m ? m[1] : fallback;
}

// Compute cyclomatic complexity of a snippet
function complexityOf(body: string): number {
  let c = 1;
  const patterns = [
    /\bif\b/g, /\belse if\b/g, /\bfor\b/g, /\bwhile\b/g,
    /\bcase\b/g, /\bcatch\b/g, /\?/g, /&&/g, /\|\|/g,
  ];
  for (const p of patterns) c += (body.match(p) || []).length;
  return c;
}

function linesOf(body: string): number {
  return body.split('\n').filter(l => l.trim().length > 0).length;
}

// Find matching closing brace from openIdx (which points to '{')
function matchBrace(src: string, openIdx: number): number {
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

// Extract methods within the body of the class (between class { ... })
function extractMethods(src: string): Array<{ signature: string; body: string; isTest: boolean }> {
  // Match method signatures: modifiers, return type, name, params, then '{'
  const re = /(?:^|\n)\s*((?:@[\w.()\s,"=]+\s+)*)((?:public|private|protected|static|final|synchronized|abstract|default|native|\s)+)?([\w<>\[\],?\s.]+?)\s+(\w+)\s*\(([^)]*)\)\s*(?:throws[^{;]+)?\{/g;
  const out: Array<{ signature: string; body: string; isTest: boolean }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const annotations = (m[1] || '').trim();
    const returnType = (m[3] || '').trim();
    const name = m[4];
    const params = m[5].trim();
    // skip control flow
    if (['if', 'for', 'while', 'switch', 'catch', 'try', 'else', 'do', 'synchronized', 'return'].includes(name)) continue;
    if (!returnType) continue;
    const openIdx = src.indexOf('{', m.index + m[0].lastIndexOf('('));
    if (openIdx === -1) continue;
    const closeIdx = matchBrace(src, openIdx);
    if (closeIdx === -1) continue;
    const fullBody = src.slice(m.index, closeIdx + 1).trim();
    const isTest = /@Test\b/.test(annotations) || /@Test\b/.test(src.slice(Math.max(0, m.index - 80), m.index));
    out.push({
      signature: `${returnType} ${name}(${params})`,
      body: fullBody,
      isTest,
    });
  }
  return out;
}

function parseMethodSignature(sig: string): { returnType: string; name: string; params: string } {
  const m = sig.match(/^(.+?)\s+(\w+)\s*\((.*)\)$/s);
  if (!m) return { returnType: 'void', name: sig, params: '' };
  return { returnType: m[1].trim(), name: m[2], params: m[3].trim() };
}

export function isLikelyTestSource(filename: string, src: string): boolean {
  return /Test\.(java|kt|ts|js)$/i.test(filename) || /@Test\b/.test(src);
}

export interface ParsedSource {
  filename: string;
  className: string;
  packageName: string;
  isTest: boolean;
  raw: string;
  methods: Array<{ name: string; returnType: string; params: string; body: string; complexity: number; linesOfCode: number; isTest: boolean }>;
  targetClass?: string; // for test files: e.g. UserServiceTest -> UserService
}

export function parseSource(filename: string, src: string): ParsedSource {
  const className = extractClassName(src, filename.replace(/\.\w+$/, ''));
  const packageName = extractPackage(src);
  const isTest = isLikelyTestSource(filename, src);
  const targetClass = isTest ? className.replace(/Tests?$/i, '') : undefined;
  const methods = extractMethods(src).map(m => {
    const sig = parseMethodSignature(m.signature);
    return {
      ...sig,
      body: m.body,
      complexity: complexityOf(m.body),
      linesOfCode: linesOf(m.body),
      isTest: m.isTest,
    };
  });
  return { filename, className, packageName, isTest, raw: src, methods, targetClass };
}

export interface CoverageEntry {
  lineCoverage?: number;
  branchCoverage?: number;
  mutationScore?: number;
  methods?: Record<string, { status?: 'passed' | 'failed' | 'error'; duration?: number; assertion?: string }>;
}
export type CoverageReport = Record<string, CoverageEntry>;

export function parseCoverageJson(text: string): CoverageReport | null {
  try {
    const obj = JSON.parse(text);
    if (obj && typeof obj === 'object') return obj as CoverageReport;
  } catch {}
  return null;
}

export function buildProjectAnalysis(sources: ParsedSource[]): ProjectAnalysis {
  const classes: ClassInfo[] = sources.filter(s => !s.isTest).map((s, i) => ({
    id: `cls-${i + 1}`,
    name: s.className,
    packageName: s.packageName || '(default)',
    fieldCount: 0,
    methods: s.methods.map<MethodInfo>(m => ({
      name: m.name,
      returnType: m.returnType,
      params: m.params,
      complexity: m.complexity,
      linesOfCode: m.linesOfCode,
      body: m.body,
    })),
  }));
  return {
    projectName: 'uploaded-project',
    language: 'Java',
    classes,
  };
}

export function buildGenerationSummary(sources: ParsedSource[], coverage: CoverageReport | null): GenerationSummary {
  const testClasses: TestClassResult[] = sources.filter(s => s.isTest).map((s, i) => {
    const cov = coverage?.[s.className] || coverage?.[s.targetClass || ''] || {};
    const methods: TestMethodResult[] = s.methods.filter(m => m.isTest || /^test/i.test(m.name)).map(m => {
      const mc = cov.methods?.[m.name] || {};
      return {
        name: m.name,
        targetMethod: m.name.replace(/^test_?/i, '').split('_')[0],
        status: (mc.status as any) || 'passed',
        duration: mc.duration ?? 0,
        assertion: mc.assertion ?? '(从代码内提取)',
        body: m.body,
      };
    });
    return {
      id: `tc-${i + 1}`,
      name: s.className,
      targetClass: s.targetClass || s.className,
      lineCoverage: cov.lineCoverage ?? 0,
      branchCoverage: cov.branchCoverage ?? 0,
      mutationScore: cov.mutationScore ?? 0,
      methods,
    };
  });

  const overall = (key: 'lineCoverage' | 'branchCoverage' | 'mutationScore') => {
    if (!testClasses.length) return 0;
    return +(testClasses.reduce((s, c) => s + (c[key] || 0), 0) / testClasses.length).toFixed(1);
  };

  return {
    overallLineCoverage: coverage?.['__overall__']?.lineCoverage ?? overall('lineCoverage'),
    overallBranchCoverage: coverage?.['__overall__']?.branchCoverage ?? overall('branchCoverage'),
    overallMutationScore: coverage?.['__overall__']?.mutationScore ?? overall('mutationScore'),
    testClasses,
  };
}
