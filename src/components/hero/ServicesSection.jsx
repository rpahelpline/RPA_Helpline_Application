import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCode, FaUserTie, FaChalkboardTeacher, FaProjectDiagram } from 'react-icons/fa';
import { Container } from '../layout/Container';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LazyComponent } from '../../components/common/LazyComponent';

export const ServicesSection = memo(() => {
  const navigate = useNavigate();

  const handleServiceClick = useCallback((route) => {
    navigate(route);
  }, [navigate]);

  const services = [
    {
      icon: FaCode,
      title: 'Hire Developers',
      description: 'Connect with certified RPA developers for your automation projects.',
      route: '/register',
      color: 'primary-blue',
    },
    {
      icon: FaUserTie,
      title: 'Find Freelancers',
      description: 'Access a pool of skilled freelance RPA experts on-demand.',
      route: '/register',
      color: 'primary-blue',
    },
    {
      icon: FaChalkboardTeacher,
      title: 'Training Programs',
      description: 'Comprehensive RPA training from certified instructors.',
      route: '/register',
      color: 'primary-blue',
    },
    {
      icon: FaProjectDiagram,
      title: 'Post Projects',
      description: 'Post your automation projects and get matched with experts.',
      route: '/register/project',
      color: 'primary-blue',
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-dark-surface/30 w-full overflow-x-hidden">
      <Container>
        <div className="text-center mb-8 sm:mb-10 md:mb-12 px-4">
          <p className="text-primary-blue font-mono uppercase tracking-wider text-xs sm:text-sm mb-2">
            // SERVICE PROTOCOLS
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 sm:mb-4 font-display uppercase tracking-tight">
            <span className="text-white">OUR</span>{' '}
            <span className="text-primary-red">SERVICES</span>
          </h2>
          <p className="text-gray-300 font-mono text-sm sm:text-base md:text-lg mt-3 sm:mt-4">Everything you need for RPA success</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-0">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <LazyComponent
                key={index}
                threshold={0.1}
                className="will-change-transform"
              >
                <Card
                  variant="elevated"
                  className="hover:border-primary-blue/50 transition-all duration-300 cursor-pointer group bg-dark-surface/80 backdrop-blur-sm transform hover:scale-[1.02] animate-fade-in-up"
                  onClick={() => handleServiceClick(service.route)}
                >
                  <div className="text-primary-blue mb-4 text-3xl group-hover:scale-110 transition-transform flex justify-center will-change-transform">
                    <Icon />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2 font-display uppercase text-center">{service.title}</h3>
                  <p className="text-gray-300 font-mono text-sm mb-4 text-center">{service.description}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full font-mono uppercase tracking-wider"
                  >
                    GET STARTED
                  </Button>
                </Card>
              </LazyComponent>
            );
          })}
        </div>
      </Container>
    </section>
  );
});

ServicesSection.displayName = 'ServicesSection';

