import { useState, memo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Code, Building2, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { Container } from '../../components/layout/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';

export const RegisterProject = memo(() => {
  const navigate = useNavigate();
  const { addProject } = useProjectStore();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    automationType: '',
    industry: '',
    timeline: '',
    budget: '',
    urgency: '',
  });

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const projectData = {
      ...formData,
      clientId: user?.id || '1',
      status: 'open',
    };
    
    addProject(projectData);
    navigate('/dashboard');
  }, [formData, user, addProject, navigate]);

  return (
    <div className="min-h-[calc(100vh-4rem)] mt-16 flex items-center justify-center py-12">
      <Container className="w-full max-w-2xl">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-foreground font-mono uppercase tracking-wider text-sm mb-8 hover:text-secondary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          RETURN TO BASE
        </Link>

        <Card className="tech-panel-strong border-glow-red">
          <CardHeader>
            <CardTitle className="text-4xl sm:text-5xl font-display uppercase tracking-tight mb-2">
              PROJECT REGISTRATION
            </CardTitle>
            <CardDescription className="text-muted-foreground font-mono uppercase tracking-[0.2em] text-sm">
              POST NEW MISSION
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    PROJECT TITLE
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Invoice Processing Automation"
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground font-mono tracking-wide focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2">
                    PROJECT DESCRIPTION
                  </label>
                  <Textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your automation requirements in detail..."
                    rows={5}
                    className="bg-background border-input text-foreground placeholder-muted-foreground font-mono"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                    <Code className="h-3 w-3" />
                    AUTOMATION TYPE
                  </label>
                  <Select
                    required
                    value={formData.automationType}
                    onChange={(e) => setFormData({ ...formData, automationType: e.target.value })}
                  >
                    <option value="">Select automation type</option>
                    <option value="UiPath">UiPath</option>
                    <option value="Automation Anywhere">Automation Anywhere</option>
                    <option value="Blue Prism">Blue Prism</option>
                    <option value="Power Automate">Power Automate</option>
                    <option value="Custom">Custom Solution</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                    <Building2 className="h-3 w-3" />
                    INDUSTRY
                  </label>
                  <Select
                    required
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  >
                    <option value="">Select industry</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Telecommunications">Telecommunications</option>
                    <option value="Government">Government</option>
                    <option value="Other">Other</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    TIMELINE
                  </label>
                  <Select
                    required
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  >
                    <option value="">Select timeline</option>
                    <option value="1 week">1 week</option>
                    <option value="2 weeks">2 weeks</option>
                    <option value="1 month">1 month</option>
                    <option value="2-3 months">2-3 months</option>
                    <option value="3+ months">3+ months</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    BUDGET
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="e.g., $5000 or $50/hour"
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground font-mono tracking-wide focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" />
                    URGENCY LEVEL
                  </label>
                  <Select
                    required
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  >
                    <option value="">Select urgency</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" variant="primary" className="flex-1 font-display uppercase tracking-wider glow-red">
                  POST PROJECT
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="font-display uppercase tracking-wider"
                >
                  CANCEL
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
});

RegisterProject.displayName = 'RegisterProject';
