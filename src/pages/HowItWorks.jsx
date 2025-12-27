import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { FaRocket, FaSearch, FaHandshake, FaCheckCircle } from 'react-icons/fa';

export const HowItWorks = () => {
  const steps = [
    {
      icon: FaRocket,
      title: 'Launch Your Mission',
      description: 'Post your project or search for RPA talent. Our AI matches you with the perfect candidates.',
      color: 'primary-blue',
    },
    {
      icon: FaSearch,
      title: 'Browse & Filter',
      description: 'Explore profiles, portfolios, and reviews. Filter by skills, experience, and availability.',
      color: 'primary-blue',
    },
    {
      icon: FaHandshake,
      title: 'Connect & Collaborate',
      description: 'Communicate directly with developers, freelancers, or trainers. Discuss requirements and timelines.',
      color: 'primary-blue',
    },
    {
      icon: FaCheckCircle,
      title: 'Complete & Review',
      description: 'Work together to deliver results. Rate and review your experience to help others.',
      color: 'primary-blue',
    },
  ];

  return (
    <Container className="py-20">
      <div className="text-center mb-16">
        <p className="text-primary-blue font-mono uppercase tracking-wider text-sm mb-2">
          // OPERATIONAL PROTOCOL
        </p>
        <h1 className="text-5xl font-black text-white mb-4 font-display uppercase tracking-tight">
          <span className="text-white">HOW IT</span>{' '}
          <span className="text-primary-red">WORKS</span>
        </h1>
        <p className="text-gray-300 font-mono text-lg max-w-2xl mx-auto mt-4">
          Simple, fast, and efficient. Get your RPA projects off the ground in minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card key={index} variant="elevated" className="text-center bg-dark-surface/80 backdrop-blur-sm">
              <div className="text-primary-blue mb-4 text-4xl flex justify-center">
                <Icon />
              </div>
              <div className="text-2xl font-black text-white mb-2 font-display">{index + 1}</div>
              <h3 className="text-xl font-black text-white mb-3 font-display uppercase">{step.title}</h3>
              <p className="text-gray-300 font-mono text-sm">{step.description}</p>
            </Card>
          );
        })}
      </div>

      <Card variant="elevated" className="max-w-4xl mx-auto bg-dark-surface/80 backdrop-blur-sm">
        <h2 className="text-3xl font-black text-white mb-6 font-display uppercase">WHY CHOOSE RPA HELPLINE?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-black text-primary-blue mb-2 font-display uppercase">EXPERT TALENT POOL</h3>
            <p className="text-gray-300 font-mono text-sm">
              Access to certified RPA developers, freelancers, and trainers with proven track records.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-black text-primary-blue mb-2 font-display uppercase">FAST MATCHING</h3>
            <p className="text-gray-300 font-mono text-sm">
              Our AI-powered system connects you with the right talent in minutes, not days.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-black text-primary-blue mb-2 font-display uppercase">24/7 SUPPORT</h3>
            <p className="text-gray-300 font-mono text-sm">
              Round-the-clock assistance to ensure your projects run smoothly from start to finish.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-black text-primary-blue mb-2 font-display uppercase">TRANSPARENT PROCESS</h3>
            <p className="text-gray-300 font-mono text-sm">
              Clear communication, detailed profiles, and honest reviews help you make informed decisions.
            </p>
          </div>
        </div>
      </Card>
    </Container>
  );
};

