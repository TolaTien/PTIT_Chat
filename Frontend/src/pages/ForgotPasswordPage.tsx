import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Loader2, Mail, MessageSquare, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import AuthImagePattern from "../components/AuthImagePattern";

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { sendOTP, resendOTP, verifyOTP, resetPassword } = useAuthStore();
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    
    setIsLoading(true);
    const success = await sendOTP(email);
    setIsLoading(false);
    
    if (success) setStep(2);
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    const success = await resendOTP(email);
    setIsLoading(false);
    if (success) setOtp("");
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("OTP must be 6 digits");

    setIsLoading(true);
    const success = await verifyOTP({ email, otp });
    setIsLoading(false);

    if (success) setStep(3);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

    setIsLoading(true);
    const success = await resetPassword({ email, otp, newPassword });
    setIsLoading(false);

    if (success) {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">
                {step === 1 && "Forgot Password?"}
                {step === 2 && "Verify OTP"}
                {step === 3 && "Reset Password"}
              </h1>
              <p className="text-base-content/60">
                {step === 1 && "No worries, we'll send you reset instructions."}
                {step === 2 && `We've sent a 6-digit code to ${email}`}
                {step === 3 && "Please enter your new password."}
              </p>
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email Address</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-base-content/40" />
                  </div>
                  <input
                    type="email"
                    className="input input-bordered w-full pl-10"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send OTP"}
              </button>

              <div className="text-center">
                <Link to="/login" className="link link-primary text-sm flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Verification Code</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className="h-5 w-5 text-base-content/40" />
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10 tracking-[1em] font-bold text-center"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify OTP"}
              </button>

              <div className="text-center space-y-4">
                <p className="text-sm text-base-content/60">
                  Didn't receive the code?{" "}
                  <button 
                    type="button" 
                    onClick={handleResendOTP} 
                    className="link link-primary font-medium"
                    disabled={isLoading}
                  >
                    Resend OTP
                  </button>
                </p>
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="link link-primary text-sm flex items-center justify-center gap-2 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" /> Change Email
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">New Password</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-base-content/40" />
                  </div>
                  <input
                    type="password"
                    className="input input-bordered w-full pl-10"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Confirm New Password</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-base-content/40" />
                  </div>
                  <input
                    type="password"
                    className="input input-bordered w-full pl-10"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>

      <AuthImagePattern
        title={"Secure Your Account"}
        subtitle={"A strong password helps keep your conversations private and your data safe."}
      />
    </div>
  );
};

export default ForgotPasswordPage;
