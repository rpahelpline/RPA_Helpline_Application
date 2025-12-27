import { useNavigate } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { FaBullseye, FaCog, FaRocket } from 'react-icons/fa';

export const ProjectLifecycle = () => {
  const navigate = useNavigate();

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
    <section className="py-20">
      <Container>
        {/* Header */}
        <div className="mb-12">
          <p className="text-primary-blue font-mono uppercase tracking-wider text-sm mb-2 text-center">
            // MISSION PROTOCOL
          </p>
          <h2 className="text-5xl font-black text-center mb-4 font-display uppercase tracking-tight">
            <span className="text-white">PROJECT</span>{' '}
            <span className="text-primary-red">LIFECYCLE</span>
          </h2>
        </div>

        {/* Phase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            return (
              <div
                key={index}
                className="relative border-2 border-primary-red bg-dark-surface/80 backdrop-blur-sm p-6 corner-brackets"
              >
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
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="relative border-2 border-primary-red bg-dark-surface/80 backdrop-blur-sm p-8 corner-brackets max-w-4xl mx-auto">
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary-red"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary-blue"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="text-primary-red">
              <FaRocket className="text-5xl" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="text-3xl font-black mb-2 font-display uppercase">
                <span className="text-white">READY FOR</span>{' '}
                <span className="text-primary-red">LAUNCH?</span>
              </h3>
              <p className="text-gray-300 font-mono text-sm mb-4">
                Initiate your automation mission today. Our specialists are standing by.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/register/project')}
              className="font-mono uppercase tracking-wider whitespace-nowrap"
            >
              START MISSION
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};

