import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react';
import { TestCase } from '@/data/mockTestData';

const statusConfig = {
  passed: { icon: CheckCircle2, label: '通过', className: 'text-success bg-success/10' },
  failed: { icon: XCircle, label: '失败', className: 'text-destructive bg-destructive/10' },
  pending: { icon: Clock, label: '等待', className: 'text-warning bg-warning/10' },
};

interface Props {
  cases: TestCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function TestCaseTable({ cases, selectedId, onSelect }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-card rounded-xl border border-border overflow-hidden shadow-sm"
    >
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-card-foreground">测试用例列表</h2>
      </div>
      <div className="divide-y divide-border">
        {cases.map((tc, i) => {
          const cfg = statusConfig[tc.status];
          const StatusIcon = cfg.icon;
          const isSelected = selectedId === tc.id;
          return (
            <motion.button
              key={tc.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              onClick={() => onSelect(tc.id)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-muted/50 ${
                isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : ''
              }`}
            >
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {cfg.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">{tc.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{tc.module}</p>
              </div>
              {tc.duration > 0 && (
                <span className="text-xs text-muted-foreground font-mono">{tc.duration}ms</span>
              )}
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
