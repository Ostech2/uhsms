import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  email: string;
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      throw new Error('User not authenticated');
    }

    const { email, token }: VerificationRequest = await req.json();

    console.log(`Sending verification token to ${email}`);

    // Send verification email
    const emailResponse = await resend.emails.send({
      from: "UCU Hostel System <onboarding@resend.dev>",
      to: [email],
      subject: "Password Change Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">Password Change Verification</h1>
          <p style="font-size: 16px; color: #555;">You have requested to change your password.</p>
          <p style="font-size: 16px; color: #555;">Please use the verification code below to proceed:</p>
          
          <div style="background-color: #f4f4f4; border: 2px solid #4F46E5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">Your Verification Code:</p>
            <h2 style="color: #4F46E5; font-size: 32px; letter-spacing: 8px; margin: 0; font-weight: bold;">${token}</h2>
          </div>

          <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>
          <p style="font-size: 14px; color: #666;">If you did not request this password change, please ignore this email or contact support immediately.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">
            Uganda Christian University - Bishop Barham University College Kabale<br/>
            Hostel Management System
          </p>
        </div>
      `,
    });

    console.log("Verification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, message: "Verification code sent" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-verification-token function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
