import { HeroSection } from '../components/hero/HeroSection';
import { ServicesSection } from '../components/hero/ServicesSection';
import { TelemetrySection } from '../components/telemetry/TelemetrySection';
import { ProjectLifecycle } from '../components/hero/ProjectLifecycle';

export const Home = () => {
  return (
    <>
      <HeroSection />
      <TelemetrySection />
      <ServicesSection />
      <ProjectLifecycle />
    </>
  );
};

