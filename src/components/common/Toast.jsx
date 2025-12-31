import { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import clsx from 'clsx';

const Toast = ({ id, type = 'info', message, duration = 5000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const icons = {
    success: FaCheckCircle,
    error: FaExclamationCircle,
    warning: FaExclamationCircle,
    info: FaInfoCircle,
  };

  const styles = {
    success: 'bg-status-green/20 border-status-green text-status-green',
    error: 'bg-primary-red/20 border-primary-red text-primary-red',
    warning: 'bg-accent-yellow/20 border-accent-yellow text-accent-yellow',
    info: 'bg-primary-blue/20 border-primary-blue text-primary-blue',
  };

  const Icon = icons[type];

  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-lg min-w-[300px] max-w-md animate-fadeIn',
        styles[type]
      )}
      role="alert"
    >
      <Icon className="flex-shrink-0 text-xl" />
      <p className="flex-1 font-mono text-sm">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <FaTimes className="text-sm" />
      </button>
    </div>
  );
};

export default Toast;


