import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { KeyRound, Mail, Shield } from "lucide-react";

interface ChangePasswordProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function ChangePassword({ isOpen, onOpenChange }: ChangePasswordProps) {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error("User not found");
      }

      // Generate a 6-digit token
      const token = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedToken(token);

      // Send verification email
      const { data, error } = await supabase.functions.invoke('send-verification-token', {
        body: { email: user.email, token }
      });

      if (error) throw error;

      toast({
        title: "Verification Code Sent",
        description: `A verification code has been sent to ${user.email}`,
      });

      setStep('verify');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Verify token first
    if (verificationCode !== generatedToken) {
      setErrors({ verificationCode: "Invalid verification code" });
      return;
    }

    // Validate input
    const validation = passwordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validation.success) {
      const newErrors: { [key: string]: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // Verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error("User not found");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setErrors({ currentPassword: "Current password is incorrect" });
        setLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Your password has been updated successfully",
      });

      // Reset form
      setStep('request');
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setVerificationCode("");
      setGeneratedToken("");
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('request');
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setVerificationCode("");
    setGeneratedToken("");
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'request' ? <Mail className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
            {step === 'request' ? 'Verify Your Email' : 'Change Password'}
          </DialogTitle>
          <DialogDescription>
            {step === 'request' 
              ? 'We will send a verification code to your email address for security.'
              : 'Enter the verification code sent to your email and your new password.'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'request' ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                For your security, we'll send a verification code to your registered email address.
              </p>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Sending..." : "Send Verification Code"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verificationCode">Verification Code</Label>
              <Input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
              {errors.verificationCode && (
                <p className="text-sm text-destructive">{errors.verificationCode}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Check your email for the verification code
              </p>
            </div>
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            {errors.currentPassword && (
              <p className="text-sm text-destructive">{errors.currentPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters with uppercase, lowercase, and number
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('request')}
                className="flex-1"
                disabled={loading}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
