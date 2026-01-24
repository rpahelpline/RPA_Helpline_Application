import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FileText, GraduationCap, Award, Zap, DollarSign, Briefcase, Calendar, Download, Edit } from 'lucide-react';

const getProficiencyLabel = (level) => {
  switch (level?.toLowerCase()) {
    case 'expert': return 'Expert';
    case 'advanced': return 'Advanced';
    case 'intermediate': return 'Intermediate';
    case 'beginner': return 'Beginner';
    default: return 'Basic';
  }
};

export const JobSeekerProfile = memo(({ profile, specializedProfile, onEditSkills, onRefresh }) => {
  const navigate = useNavigate();
  
  // Ensure callbacks are defined (no-op if not provided)
  const handleEditSkills = onEditSkills || (() => {});

  return (
    <>
      {/* Resume Section */}
      {profile.resume_url && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Resume
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditSkills}
                className="h-7 px-2"
              >
                <Edit className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-foreground text-sm mb-1">
                  Resume Available
                </p>
                <p className="text-xs text-muted-foreground">
                  Click to view or download
                </p>
              </div>
              <a
                href={profile.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-sm font-mono"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Experience */}
      {specializedProfile?.work_experience && specializedProfile.work_experience.length > 0 && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Work Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {specializedProfile.work_experience.map((exp, index) => (
                <div key={index} className="p-4 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-display font-semibold text-foreground">{exp.job_title}</h4>
                      <p className="text-sm text-muted-foreground">{exp.company_name}</p>
                    </div>
                    {exp.start_date && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(exp.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - {exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Present'}
                      </span>
                    )}
                  </div>
                  {exp.description && (
                    <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {specializedProfile?.education && specializedProfile.education.length > 0 && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {specializedProfile.education.map((edu, index) => (
                <div key={index} className="p-4 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-display font-semibold text-foreground">{edu.degree}</h4>
                      <p className="text-sm text-muted-foreground">{edu.institution}</p>
                    </div>
                    {edu.graduation_year && (
                      <span className="text-xs text-muted-foreground font-mono">{edu.graduation_year}</span>
                    )}
                  </div>
                  {edu.field_of_study && (
                    <p className="text-sm text-muted-foreground mt-2">{edu.field_of_study}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Skills
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditSkills}
                className="h-7 px-2"
              >
                <Edit className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((item, index) => {
                const skillName = item.skill?.name || 'Unknown';
                const proficiency = item.proficiency_level || 'intermediate';
                const proficiencyColors = {
                  expert: 'bg-green-500/20 text-green-500 border-green-500/30',
                  advanced: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
                  intermediate: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
                  beginner: 'bg-gray-500/20 text-gray-500 border-gray-500/30'
                };
                
                return (
                  <div
                    key={item.skill?.id || index}
                    className={`px-3 py-1.5 rounded-lg border ${proficiencyColors[proficiency] || proficiencyColors.intermediate}`}
                  >
                    <span className="text-sm font-display font-semibold">{skillName}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {profile.certifications && profile.certifications.length > 0 && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.certifications.map((cert, index) => (
                <div key={cert.id || index} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <Award className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-display font-semibold text-foreground text-sm">
                      {cert.certification?.name || cert.custom_certification_name}
                    </p>
                    {cert.issued_date && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        Issued {new Date(cert.issued_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      </p>
                    )}
                  </div>
                  {cert.is_verified && (
                    <Badge variant="success" className="text-xs">Verified</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expected Salary */}
      {specializedProfile?.expected_salary && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Salary Expectations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-lg bg-muted/30">
              <span className="text-lg font-display font-bold text-foreground">
                ₹{specializedProfile.expected_salary.toLocaleString()}/year
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Career Objectives */}
      {specializedProfile?.career_objectives && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Career Objectives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{specializedProfile.career_objectives}</p>
          </CardContent>
        </Card>
      )}
    </>
  );
});

JobSeekerProfile.displayName = 'JobSeekerProfile';

