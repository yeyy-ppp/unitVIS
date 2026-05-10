import { useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, ScanSearch, Code2, Upload } from 'lucide-react';
import {
  mockProjectAnalysis, mockGenerationResult,
  ProjectAnalysis, GenerationSummary,
} from '@/data/mockTestData';
import ProjectAnalysisPanel from '@/components/ProjectAnalysisPanel';
import GenerationResultPanel from '@/components/GenerationResultPanel';
import UploadPanel from '@/components/UploadPanel';

type Tab = 'analysis' | 'generation' | 'upload';

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('analysis');
  const [analysis, setAnalysis] = useState<ProjectAnalysis>(mockProjectAnalysis);
  const [summary, setSummary] = useState<GenerationSummary>(mockGenerationResult);
  const [testIntent, setTestIntent] = useState('');

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'analysis', label: '项目分析', icon: ScanSearch },
    { key: 'generation', label: '生成结果', icon: Code2 },
    { key: 'upload', label: '上传代码', icon: Upload },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FlaskConical className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">单元测试代码生成器</h1>
            <p className="text-xs text-muted-foreground">
              自动为 <span className="font-mono text-foreground">{analysis.projectName}</span> 生成单元测试代码 · {analysis.language}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 flex-wrap"
        >
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === t.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </motion.div>

        {activeTab === 'analysis' && (
          <>
            {testIntent && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 mb-2">
                <p className="text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">当前测试意图（已注入提示词）</p>
                <p className="text-sm text-card-foreground">{testIntent}</p>
              </div>
            )}
            <ProjectAnalysisPanel analysis={analysis} />
          </>
        )}
        {activeTab === 'generation' && <GenerationResultPanel summary={summary} />}
        {activeTab === 'upload' && (
          <UploadPanel
            onApply={(a, s, intent) => {
              setAnalysis(a);
              setSummary(s);
              setTestIntent(intent);
              setActiveTab('analysis');
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
