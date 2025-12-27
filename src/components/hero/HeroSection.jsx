import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPaperPlane } from 'react-icons/fa';
import { Container } from '../layout/Container';
import { Button } from '../ui/Button';
import { useMockChat } from '../../hooks/useMockChat';

export const HeroSection = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const { messages, sendMessage, isTyping, displayedText } = useMockChat();
  const inputRef = useRef(null);

  // Check if we have any user or bot messages
  const hasMessages = messages.filter(m => m.type === 'user' || m.type === 'bot').length > 0;
  
  // Chat is considered "open" when there are messages
  const chatOpen = hasMessages;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    sendMessage(input);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <section className="h-[calc(100vh-4rem)] mt-16 flex flex-col relative overflow-hidden">
      {/* Futuristic fade gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-transparent pointer-events-none z-10"></div>
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-primary-blue/10 via-transparent to-transparent pointer-events-none z-10"></div>
      
      <Container className="relative z-20 h-full flex flex-col">
        <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
          {/* Top Content - Centered, Smoothly animates smaller when chat opens */}
          <div className={`text-center transition-all duration-500 ease-in-out ${chatOpen ? 'flex-shrink-0 mb-3' : 'flex-1 flex flex-col justify-center mb-6'}`}>
            {/* System Status */}
            <div className={`inline-flex items-center justify-center gap-2.5 border border-primary-blue/50 backdrop-blur-sm bg-dark-surface/60 px-4 py-2 shadow-[0_0_20px_rgba(77,166,255,0.2)] transition-all duration-500 ease-in-out ${chatOpen ? 'px-2.5 py-1 mb-1.5 scale-75' : 'mb-6 scale-100 mx-auto'}`}>
              <div className="relative flex items-center justify-center">
                <span className="text-status-green text-lg font-bold animate-pulse">●</span>
                <span className="absolute text-status-green text-lg font-bold opacity-75 animate-ping">●</span>
              </div>
              <span className={`text-white font-mono uppercase font-medium tracking-[0.15em] transition-all duration-500 ease-in-out ${chatOpen ? 'text-[10px] leading-tight' : 'text-xs sm:text-sm leading-normal'}`}>
                SYSTEM STATUS: <span className="text-status-green font-semibold">OPERATIONAL</span>
              </span>
            </div>

            {/* Main Title - Stacked */}
            <div className={`transition-all duration-500 ease-in-out ${chatOpen ? 'mb-1' : 'mb-6 sm:mb-8'}`}>
              <h1 className={`font-black text-white leading-none tracking-tight font-display transition-all duration-500 ease-in-out drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] ${chatOpen ? 'text-xl sm:text-2xl mb-0' : 'text-6xl sm:text-7xl lg:text-8xl xl:text-9xl mb-2'}`}>
                RPA
              </h1>
              <h1 className={`font-black text-primary-red leading-none tracking-tight font-display transition-all duration-500 ease-in-out drop-shadow-[0_0_30px_rgba(255,51,51,0.6)] ${chatOpen ? 'text-xl sm:text-2xl' : 'text-6xl sm:text-7xl lg:text-8xl xl:text-9xl'}`}>
                HELPLINE
              </h1>
            </div>

            {/* Hero Headline */}
            <h2 className={`font-bold text-white font-mono uppercase tracking-[0.15em] transition-all duration-500 ease-in-out ${chatOpen ? 'text-sm sm:text-base mb-1' : 'text-xl sm:text-2xl lg:text-3xl mb-6 sm:mb-8'}`}>
              Hire RPA Developers in{' '}
              <span className="text-primary-blue drop-shadow-[0_0_15px_rgba(77,166,255,0.6)] font-black">30 Minutes</span>
            </h2>
            
            {/* Description */}
            <p className={`text-gray-300 leading-relaxed max-w-2xl mx-auto font-mono tracking-wide transition-all duration-500 ease-in-out overflow-hidden ${chatOpen ? 'text-[0px] mb-0 max-h-0 opacity-0' : 'text-sm sm:text-base lg:text-lg mb-10 sm:mb-12 opacity-100'}`}>
              On-demand Robotic Process Automation experts for UiPath, Automation Anywhere, Blue Prism, and custom AI workflows.
            </p>

            {/* CTA Buttons - Smoothly fade out when chat opens */}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${chatOpen ? 'max-h-0 opacity-0 mb-0' : 'max-h-20 sm:max-h-24 opacity-100'}`}>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/register/project')}
                  className="text-sm sm:text-base font-mono uppercase tracking-wider px-6 sm:px-8 py-2 sm:py-3"
                >
                  INITIATE PROJECT →
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate('/projects')}
                  className="text-sm sm:text-base font-mono uppercase tracking-wider px-6 sm:px-8 py-2 sm:py-3"
                >
                  LOCATE EXPERTS
                </Button>
              </div>
            </div>
          </div>

          {/* Chat Input Area - ChatGPT style, always visible at bottom */}
          <div className={`flex-shrink-0 transition-all duration-500 ease-in-out mb-6 sm:mb-8 ${chatOpen ? 'flex-1 flex flex-col min-h-0' : ''}`}>
            {/* Chat Container - Only shows border/background when open */}
            {chatOpen && (
              <div className="bg-dark-surface/80 backdrop-blur-sm border border-primary-blue/30 rounded-lg overflow-hidden flex-1 flex flex-col min-h-0 animate-[fadeIn_0.3s_ease-in]">
                {/* Messages Area - No scrolling, fits in available space */}
                <div className="flex-1 overflow-hidden min-h-0 flex flex-col justify-end p-3 sm:p-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    {messages
                      .filter(msg => msg.type !== 'system')
                      .slice(-5)
                      .map((msg, index) => (
                        <div
                          key={index}
                          className={`flex animate-[fadeIn_0.3s_ease-in] ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] sm:max-w-[75%] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 ${
                              msg.type === 'user'
                                ? 'bg-primary-blue text-white'
                                : 'bg-dark-bg border border-primary-blue/20 text-gray-200'
                            }`}
                          >
                            <div className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed font-mono tracking-wide">{msg.text}</div>
                          </div>
                        </div>
                      ))}
                    
                    {isTyping && displayedText && (
                      <div className="flex justify-start animate-[fadeIn_0.3s_ease-in]">
                        <div className="max-w-[80%] sm:max-w-[75%] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 bg-dark-bg border border-primary-blue/20 text-gray-200">
                          <div className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed font-mono tracking-wide">
                            {displayedText}
                            <span className="animate-pulse text-primary-blue">▊</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input Area - Inside chat container when open */}
                <div className="border-t border-primary-blue/30 p-2.5 sm:p-3 bg-dark-surface flex-shrink-0">
                  <form onSubmit={handleSubmit} className="flex items-end gap-2 sm:gap-3">
                    <div className="flex-1">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => {
                          setInput(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                          }
                        }}
                      placeholder="Ask about RPA services, developers, or projects..."
                      className="w-full px-3 py-2 bg-dark-bg border border-primary-blue/30 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue font-mono text-sm tracking-wide"
                        rows={1}
                        disabled={isTyping}
                        style={{ minHeight: '36px', maxHeight: '100px' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!input.trim() || isTyping}
                      className="bg-primary-red text-white p-2 sm:p-2.5 rounded-lg hover:bg-primary-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                      aria-label="Send message"
                    >
                      <FaPaperPlane className="text-xs sm:text-sm" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Input Area - Standalone ChatGPT style when closed */}
            {!chatOpen && (
              <div className="max-w-2xl sm:max-w-3xl mx-auto w-full px-4 -mt-8 sm:-mt-12">
                <form onSubmit={handleSubmit} className="flex items-end gap-2 sm:gap-3 bg-dark-surface/50 backdrop-blur-sm border border-primary-blue/30 rounded-full px-3 sm:px-4 py-2">
                  <div className="flex-1">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                      placeholder="Ask about RPA services, developers, or projects..."
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-transparent border-0 text-white placeholder-gray-400 resize-none focus:outline-none font-mono text-sm tracking-wide"
                      rows={1}
                      disabled={isTyping}
                      style={{ minHeight: '24px', maxHeight: '100px' }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="bg-primary-red text-white p-1.5 sm:p-2 rounded-full hover:bg-primary-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    aria-label="Send message"
                  >
                    <FaPaperPlane className="text-xs" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
};
