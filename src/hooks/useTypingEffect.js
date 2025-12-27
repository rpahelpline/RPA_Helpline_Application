import { useState, useEffect, useRef } from 'react';

export const useTypingEffect = (text, speed = 50) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!text) {
      // Use setTimeout to avoid synchronous setState
      const timeout = setTimeout(() => {
        setDisplayedText('');
        setIsTyping(false);
      }, 0);
      return () => clearTimeout(timeout);
    }

    // Initialize state in a timeout to avoid synchronous setState
    const initTimeout = setTimeout(() => {
      setIsTyping(true);
      setDisplayedText('');
      indexRef.current = 0;

      const timer = setInterval(() => {
        if (indexRef.current < text.length) {
          setDisplayedText(text.slice(0, indexRef.current + 1));
          indexRef.current += 1;
        } else {
          setIsTyping(false);
          clearInterval(timer);
        }
      }, speed);

      // Store timer in ref for cleanup
      indexRef.timer = timer;
    }, 0);

    return () => {
      clearTimeout(initTimeout);
      if (indexRef.timer) {
        clearInterval(indexRef.timer);
      }
    };
  }, [text, speed]);

  return { displayedText, isTyping };
};

