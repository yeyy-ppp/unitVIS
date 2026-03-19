import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, FileJson } from 'lucide-react';
import { useState } from 'react';
import { TestCase } from '@/data/mockTestData';

interface Props {
  testCase: TestCase | null;
}

export default function DataPreview({ testCase }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!testCase) return;
    navigator.clipboard.writeText(JSON.stringify(testCase.generatedData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-card rounded-xl border border-border shadow-sm flex flex-col h-full"
    >
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-base font-semibold text-card-foreground flex items-center gap-2">
          <FileJson className="w-4 h-4 text-primary" />
          生成数据预览
        </h2>
        {testCase && (
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '已复制' : '复制'}
          </button>
        )}
      </div>

      <div className="flex-1 p-5 overflow-auto">
        <AnimatePresence mode="wait">
          {testCase ? (
            <motion.div
              key={testCase.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-1">输入 Schema</p>
                <code className="block text-xs font-mono bg-code-bg border border-code-border rounded-lg px-3 py-2 text-foreground">
                  {testCase.inputSchema}
                </code>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">生成的测试数据</p>
                <pre className="text-sm font-mono bg-code-bg border border-code-border rounded-lg px-4 py-3 overflow-auto text-foreground leading-relaxed">
                  {JSON.stringify(testCase.generatedData, null, 2)}
                </pre>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-muted-foreground py-16"
            >
              <FileJson className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">选择一个测试用例查看生成数据</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
