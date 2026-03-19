import { motion } from 'framer-motion';
import { Layers, Code2, GitBranch, FileCode, ArrowLeft } from 'lucide-react';
import { ProjectAnalysis, ClassInfo } from '@/data/mockTestData';
import StatCard from './StatCard';
import { useState } from 'react';

interface Props {
  analysis: ProjectAnalysis;
}

export default function ProjectAnalysisPanel({ analysis }: Props) {
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);

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
          返回类列表
        </button>
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-base font-semibold text-card-foreground font-mono">{selectedClass.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{selectedClass.packageName}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border">
            {[
              { label: '方法数', value: selectedClass.methodCount },
              { label: '字段数', value: selectedClass.fieldCount },
              { label: '圈复杂度', value: selectedClass.complexity },
              { label: '代码行数', value: selectedClass.linesOfCode },
            ].map(item => (
              <div key={item.label} className="bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-semibold text-card-foreground font-mono">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="divide-y divide-border">
            {selectedClass.methods.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * i }}
                className="px-5 py-3 flex items-center gap-3"
              >
                <Code2 className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground font-mono truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    ({m.params}) → {m.returnType}
                  </p>
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
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="总类数" value={analysis.totalClasses} icon={Layers} color="primary" delay={0} />
        <StatCard label="总方法数" value={analysis.totalMethods} icon={Code2} color="info" delay={0.05} />
        <StatCard label="总代码行数" value={analysis.totalLines.toLocaleString()} icon={FileCode} color="success" delay={0.1} />
        <StatCard label="平均复杂度" value={analysis.avgComplexity} icon={GitBranch} color="warning" delay={0.15} />
        <StatCard label="最大复杂度" value={analysis.maxComplexity} icon={GitBranch} color="destructive" delay={0.2} />
      </div>

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
          {analysis.classes.map((cls, i) => (
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
                <span>{cls.methodCount} 方法</span>
                <span>{cls.linesOfCode} 行</span>
                <span className={`px-2 py-0.5 rounded-full ${
                  cls.complexity > 6 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                }`}>
                  CC={cls.complexity}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

