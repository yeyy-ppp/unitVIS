import { motion } from 'framer-motion';
import { LucideIcon, ChevronRight } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: 'primary' | 'success' | 'destructive' | 'warning' | 'info';
  delay?: number;
  clickable?: boolean;
  onClick?: () => void;
}

const colorMap = {
  primary: 'text-primary bg-primary/10',
  success: 'text-success bg-success/10',
  destructive: 'text-destructive bg-destructive/10',
  warning: 'text-warning bg-warning/10',
  info: 'text-info bg-info/10',
};

export default function StatCard({ label, value, icon: Icon, color, delay = 0, clickable, onClick }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      className={`bg-card rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all ${
        clickable ? 'cursor-pointer hover:border-primary/30 group' : ''
      }`}
    >
      <div className={`rounded-lg p-3 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-card-foreground font-mono">{value}</p>
      </div>
      {clickable && (
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      )}
    </motion.div>
  );
}
