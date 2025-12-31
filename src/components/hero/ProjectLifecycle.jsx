import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../layout/Container';
import { Button } from '../ui/Button';
import { FaBullseye, FaCog, FaRocket } from 'react-icons/fa';
import { LazyComponent } from '../../components/common/LazyComponent';

export const ProjectLifecycle = memo(() => {
  const navigate = useNavigate();

  const handleStartMission = useCallback(() => {
    navigate('/register/project');
  }, [navigate]);

  const phases = [
    {
      icon: FaBullseye,
      title: 'DISCOVERY',
      description: 'Process analysis and automation opportunity assessment to maximize mission success.',
      number: '01',
    },
    {
      icon: FaCog,
      title: 'DEVELOPMENT',
      description: 'Certified operators build robust automation systems with comprehensive testing protocols.',
      number: '02',
    },
    {
      icon: FaRocket,
      title: 'DEPLOYMENT',
      description: 'Seamless go-live execution with ongoing maintenance and optimization operations.',
      number: '03',
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 w-full overflow-x-hidden">
      <Container>
        {/* Header */}
        <div className="mb-8 sm:mb-10 md:mb-12 px-4">
          <p className="text-primary-blue font-mono uppercase tracking-wider text-xs sm:text-sm mb-2 text-center">
            // MISSION PROTOCOL
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-center mb-3 sm:mb-4 font-display uppercase tracking-tight">
            <span className="text-white">PROJECT</span>{' '}
            <span className="text-primary-red">LIFECYCLE</span>
          </h2>
        </div>

        {/* Phase Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10 md:mb-12 px-4 sm:px-0">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            return (
              <LazyComponent
                key={index}
                threshold={0.2}
                className="will-change-transform"
              >
                <div className="relative border-2 border-primary-red bg-dark-surface/80 backdrop-blur-sm p-6 corner-brackets animate-fade-in-up">
                  {/* Corner brackets effect */}
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary-red"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary-blue"></div>
                  
                  {/* Icon */}
                  <div className="text-primary-red mb-4 flex justify-center">
                    <Icon className="text-4xl" />
                  </div>
                  
                  {/* Phase Number */}
                  <div className="text-center mb-4">
                    <div className="text-3xl font-black text-white font-display">
                      PHASE {phase.number}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-2xl font-black text-white mb-4 text-center font-display uppercase">
                    {phase.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-300 text-center font-mono text-sm leading-relaxed">
                    {phase.description}
                  </p>
                </div>
              </LazyComponent>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="relative border-2 border-primary-red bg-dark-surface/80 backdrop-blur-sm p-4 sm:p-6 md:p-8 corner-brackets max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-8">
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary-red"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary-blue"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6">
            <div className="text-primary-red">
              <FaRocket className="text-3xl sm:text-4xl md:text-5xl" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black mb-2 font-display uppercase">
                <span className="text-white">READY FOR</span>{' '}
                <span className="text-primary-red">LAUNCH?</span>
              </h3>
              <p className="text-gray-300 font-mono text-xs sm:text-sm mb-3 sm:mb-4">
                Initiate your automation mission today. Our specialists are standing by.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartMission}
              className="font-mono uppercase tracking-wider whitespace-nowrap w-full sm:w-auto"
            >
              START MISSION
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
});

ProjectLifecycle.displayName = 'ProjectLifecycle';

