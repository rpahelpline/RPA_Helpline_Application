import { Card } from '../ui/Card';
import { useCounter } from '../../hooks/useCounter';
import { motion } from 'framer-motion';

export const TelemetryCard = ({ label, value, suffix = '', delay = 0 }) => {
  const { count } = useCounter(value, 2000, true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <Card variant="elevated" className="text-center p-6 bg-transparent border-0">
        <div className="text-5xl lg:text-6xl font-bold text-primary-blue mb-2 font-mono">
          {count.toLocaleString()}{suffix}
        </div>
        <div className="text-white text-xs font-mono uppercase tracking-wide">{label}</div>
      </Card>
    </motion.div>
  );
};

