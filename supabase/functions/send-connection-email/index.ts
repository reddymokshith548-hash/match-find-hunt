import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "connection_request" | "connection_accepted";
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  connectionId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipientEmail, recipientName, senderName, connectionId }: EmailRequest = await req.json();
    
    console.log(`Processing ${type} email to ${recipientEmail} from ${senderName}`);

    if (!recipientEmail || !recipientName || !senderName) {
      console.error("Missing required fields:", { recipientEmail, recipientName, senderName });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let subject: string;
    let htmlContent: string;

    if (type === "connection_request") {
      subject = `🤝 ${senderName} wants to connect with you on FounderMatch!`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🤝 New Connection Request!</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi <strong>${recipientName}</strong>,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Great news! <strong>${senderName}</strong> is interested in connecting with you on FounderMatch.
            </p>
            <p style="font-size: 16px; margin-bottom: 25px;">
              They've seen your profile and think you might be a great match for their co-founder journey!
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://foundermatch.app/dashboard" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                View Connection Request →
              </a>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Don't miss out on potential partnerships – review this request and decide if you'd like to connect!
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
            <p>© ${new Date().getFullYear()} FounderMatch. Building great teams together.</p>
            <p>You're receiving this because you have an account on FounderMatch.</p>
          </div>
        </body>
        </html>
      `;
    } else if (type === "connection_accepted") {
      subject = `🎉 ${senderName} accepted your connection request!`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Connection Accepted!</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi <strong>${recipientName}</strong>,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Exciting news! <strong>${senderName}</strong> has accepted your connection request.
            </p>
            <p style="font-size: 16px; margin-bottom: 25px;">
              You're now connected! Once both of you sign the mutual NDA, you can start chatting and exploring potential collaboration.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://foundermatch.app/messages" 
                 style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Start Chatting →
              </a>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Build something great together! 🚀
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
            <p>© ${new Date().getFullYear()} FounderMatch. Building great teams together.</p>
            <p>You're receiving this because you have an account on FounderMatch.</p>
          </div>
        </body>
        </html>
      `;
    } else {
      console.error("Invalid email type:", type);
      return new Response(
        JSON.stringify({ error: "Invalid email type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending ${type} email to ${recipientEmail}`);

    const emailResponse = await resend.emails.send({
      from: "FounderMatch <onboarding@resend.dev>",
      to: [recipientEmail],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-connection-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
