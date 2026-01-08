import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { GraduationCap, Award, Users, Star, BookOpen, Edit } from 'lucide-react';

export const TrainerProfile = memo(({ profile, specializedProfile }) => {
  const navigate = useNavigate();

  return (
    <>
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
                    {cert.certification?.level && (
                      <p className="text-xs text-muted-foreground mt-1">{cert.certification.level}</p>
                    )}
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

      {/* Courses Taught */}
      {specializedProfile?.courses_taught && specializedProfile.courses_taught.length > 0 && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Courses Taught
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {specializedProfile.courses_taught.map((course, index) => (
                <div key={index} className="p-3 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-display font-semibold text-foreground text-sm">{course.title}</h4>
                      {course.platform && (
                        <p className="text-xs text-muted-foreground mt-1">{course.platform}</p>
                      )}
                    </div>
                    {course.students_count && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {course.students_count}
                      </div>
                    )}
                  </div>
                  {course.description && (
                    <p className="text-xs text-muted-foreground mt-2">{course.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Count & Stats */}
      {specializedProfile && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Teaching Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {specializedProfile.total_students !== undefined && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Total Students</span>
                  <span className="text-lg font-display font-bold text-foreground">
                    {specializedProfile.total_students || 0}
                  </span>
                </div>
              )}
              {specializedProfile.courses_count !== undefined && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Courses Created</span>
                  <span className="text-lg font-display font-bold text-foreground">
                    {specializedProfile.courses_count || 0}
                  </span>
                </div>
              )}
              {specializedProfile.average_rating && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Average Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-lg font-display font-bold text-foreground">
                      {specializedProfile.average_rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Methodologies */}
      {specializedProfile?.training_methodologies && specializedProfile.training_methodologies.length > 0 && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              Training Methodologies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {specializedProfile.training_methodologies.map((method, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {method}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews/Testimonials */}
      {specializedProfile?.reviews && specializedProfile.reviews.length > 0 && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Student Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {specializedProfile.reviews.slice(0, 5).map((review, index) => (
                <div key={index} className="p-3 rounded-lg border border-border">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-xs">
                        {review.student_name?.charAt(0) || 'S'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-display font-semibold text-foreground">{review.student_name}</p>
                        {review.rating && (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teaching Experience */}
      {specializedProfile?.teaching_experience && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              Teaching Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{specializedProfile.teaching_experience}</p>
          </CardContent>
        </Card>
      )}
    </>
  );
});

TrainerProfile.displayName = 'TrainerProfile';





