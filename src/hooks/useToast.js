import { useToastStore } from '../store/toastStore';

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





