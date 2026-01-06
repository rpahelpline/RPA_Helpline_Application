import { useState, useRef, useEffect, memo } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Mail, Phone, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { sendEmailOTP, verifyEmailOTP, sendPhoneOTP, verifyPhoneOTP, resendOTP, syncVerificationStatus } from '../../services/supabaseAuth';

export const OTPVerification = memo(({ 
  type, // 'email' or 'phone'
  identifier, // email address or phone number
  countryCode = '+91',
  onVerified,
  onCancel,
  label
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']); // 8 digits for Supabase
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  const toast = useToast();

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus first input
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOTPChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 8 digits are entered
    if (value && index === 7 && newOtp.every(digit => digit !== '')) {
      handleVerify();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 8).split('');
        if (digits.length === 8) {
          const newOtp = [...otp];
          digits.forEach((digit, i) => {
            newOtp[i] = digit;
          });
          setOtp(newOtp);
          inputRefs.current[7]?.focus();
          // Auto-verify after paste
          setTimeout(() => handleVerify(), 100);
        }
      });
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 8) {
      setError('Please enter all 8 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (type === 'email') {
        await verifyEmailOTP(identifier, otpCode);
      } else {
        await verifyPhoneOTP(identifier, otpCode);
      }

      toast.success(`${type === 'email' ? 'Email' : 'Phone'} verified successfully!`);
      onVerified?.();
    } catch (error) {
      const errorMessage = error.message || 'Verification failed';
      setError(errorMessage);
      toast.error(errorMessage);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    setError('');

    try {
      await resendOTP(type, identifier);
      setCountdown(60); // 60 second cooldown
      toast.success(`OTP resent! Check your ${type} for the 8-digit code`);
      setOtp(['', '', '', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      const errorMessage = error.message || 'Failed to resend OTP';
      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const Icon = type === 'email' ? Mail : Phone;
  const displayIdentifier = type === 'phone' 
    ? `${countryCode} ${identifier}` 
    : identifier;

  return (
    <Card className="tech-panel border-border bg-card/50">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-display tracking-wider">
              Verify {type === 'email' ? 'Email' : 'Phone Number'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {label || `Enter the 8-digit code sent to ${displayIdentifier}`}
              {type === 'email' && (
                <span className="block mt-2 text-xs text-muted-foreground">
                  Can't find the code? Check your spam folder or wait a few moments for the email to arrive.
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* OTP Input */}
        <div className="space-y-2">
          <Label className="text-sm font-mono">ENTER VERIFICATION CODE</Label>
          <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOTPChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-2xl font-mono font-bold ${
                  error ? 'border-red-500' : 'border-border'
                } focus:border-primary focus:ring-2 focus:ring-primary/20`}
              />
            ))}
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <XCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleVerify}
            disabled={loading || otp.some(d => !d)}
            className="w-full bg-primary hover:bg-primary/90 font-mono text-sm tracking-wider"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                VERIFYING...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                VERIFY CODE
              </>
            )}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Didn't receive the code?</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={resendLoading || countdown > 0}
              className="text-primary hover:text-primary/80 font-mono text-xs"
            >
              {countdown > 0 ? (
                <>
                  <Clock className="w-3 h-3 mr-1" />
                  Resend in {countdown}s
                </>
              ) : resendLoading ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Resend OTP
                </>
              )}
            </Button>
          </div>

          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full font-mono text-xs"
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

OTPVerification.displayName = 'OTPVerification';

