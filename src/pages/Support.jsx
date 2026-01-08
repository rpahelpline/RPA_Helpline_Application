import { useState, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../hooks/useToast';
import { MessageSquare, Send, CheckCircle } from 'lucide-react';
import { supportApi } from '../services/api';

export const Support = memo(() => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      await supportApi.submit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim() || 'General Inquiry',
        message: formData.message.trim()
      });

      setSubmitted(true);
      toast.success('Your message has been submitted successfully! We will get back to you soon.');
      
      // Reset form after a delay
      setTimeout(() => {
        setFormData({ name: '', email: '', subject: '', message: '' });
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Support submission error:', error);
      toast.error(error.message || 'Failed to submit your message. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, toast]);

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4 md:px-6">
      <Container>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 tech-panel rounded-full mb-6">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span className="text-xs font-mono text-primary tracking-wider">CUSTOMER SUPPORT</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground tracking-wider mb-4">
              GET IN <span className="text-primary">TOUCH</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
              Have a question, suggestion, or feedback? We'd love to hear from you. 
              Submit your inquiry below and our team will respond as soon as possible.
            </p>
          </div>

          {submitted ? (
            <Card className="tech-panel border-glow-green">
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-display font-bold text-foreground mb-2">
                  Message Submitted Successfully!
                </h2>
                <p className="text-muted-foreground">
                  We've received your message and will get back to you soon.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="tech-panel border-border">
              <CardHeader>
                <CardTitle className="text-xl font-display">Submit Your Inquiry</CardTitle>
                <CardDescription>
                  Fill out the form below with your details and message
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className={errors.name ? 'border-destructive' : ''}
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.email@example.com"
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject (Optional)</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Brief subject line"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us what's on your mind..."
                      rows={8}
                      className={errors.message ? 'border-destructive' : ''}
                    />
                    {errors.message && (
                      <p className="text-xs text-destructive mt-1">{errors.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Minimum 10 characters required
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary hover:bg-primary/90 font-display tracking-wider glow-red group"
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          SUBMITTING...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          SUBMIT MESSAGE
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                      className="flex-1 sm:flex-none"
                    >
                      CANCEL
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </Container>
    </div>
  );
});

Support.displayName = 'Support';

