import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, CheckCircle2, XCircle, Clock, Database, Gauge, Layers } from 'lucide-react';
import { mockTestCases, computeSummary } from '@/data/mockTestData';
import StatCard from '@/components/StatCard';
import TestCaseTable from '@/components/TestCaseTable';
import DataPreview from '@/components/DataPreview';

const Index = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed' | 'pending'>('all');

  const summary = useMemo(() => computeSummary(mockTestCases), []);
  const filteredCases = useMemo(
    () => (filter === 'all' ? mockTestCases : mockTestCases.filter(c => c.status === filter)),
    [filter]
  );
  const selectedCase = mockTestCases.find(c => c.id === selectedId) ?? null;

  const filters: { key: typeof filter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'passed', label: '通过' },
    { key: 'failed', label: '失败' },
    { key: 'pending', label: '等待' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FlaskConical className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">单元测试数据生成器</h1>
            <p className="text-xs text-muted-foreground">自动生成测试用例的模拟数据 · 实时预览</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="总用例" value={summary.total} icon={Layers} color="primary" delay={0} />
          <StatCard label="通过" value={summary.passed} icon={CheckCircle2} color="success" delay={0.05} />
          <StatCard label="失败" value={summary.failed} icon={XCircle} color="destructive" delay={0.1} />
          <StatCard label="等待中" value={summary.pending} icon={Clock} color="warning" delay={0.15} />
          <StatCard label="通过率" value={`${summary.passRate}%`} icon={Gauge} color="info" delay={0.2} />
          <StatCard label="数据字段" value={summary.totalDataFields} icon={Database} color="primary" delay={0.25} />
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2"
        >
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        {/* Main content */}
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <TestCaseTable cases={filteredCases} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          <div className="lg:col-span-2">
            <DataPreview testCase={selectedCase} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
