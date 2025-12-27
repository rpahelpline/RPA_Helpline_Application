import { create } from 'zustand';
import Toast from './Toast';
import { AnimatePresence, motion } from 'framer-motion';

// eslint-disable-next-line react-refresh/only-export-components
const useToastStore = create((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now() + Math.random();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  clearToasts: () => set({ toasts: [] }),
}));

export const useToast = () => {
  const { addToast } = useToastStore();

  return {
    toast: (message, type = 'info', duration = 5000) => {
      return addToast({ message, type, duration });
    },
    success: (message, duration) => addToast({ message, type: 'success', duration }),
    error: (message, duration) => addToast({ message, type: 'error', duration }),
    warning: (message, duration) => addToast({ message, type: 'warning', duration }),
    info: (message, duration) => addToast({ message, type: 'info', duration }),
  };
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto"
          >
            <Toast {...toast} onClose={removeToast} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

