import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === "your_resend_key") return null;
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "BidIQ <bids@bidiq.co>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendBidInvitation({
  contractorName,
  contractorEmail,
  projectName,
  projectAddress,
  deadline,
  token,
}: {
  contractorName: string;
  contractorEmail: string;
  projectName: string;
  projectAddress: string;
  deadline: Date;
  token: string;
}) {
  const bidUrl = `${APP_URL}/bid/${token}`;

  const resend = getResend();
  if (!resend) return { data: null, error: new Error("Resend not configured") };
  return resend.emails.send({
    from: FROM,
    to: contractorEmail,
    subject: `Bid Invitation: ${projectName} — Beantown Companies`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: Arial, sans-serif; background: #f4f7fa; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: #050E1A; padding: 32px 40px; text-align: center;">
      <h1 style="color: #5DCAA5; font-size: 28px; margin: 0; font-family: Georgia, serif;">BidIQ</h1>
      <p style="color: #8BA3C4; margin: 8px 0 0; font-size: 14px;">Beantown Companies Bid Portal</p>
    </div>
    <div style="padding: 40px;">
      <h2 style="color: #0A1628; font-size: 22px; margin: 0 0 16px;">You've been invited to bid</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hello ${contractorName},</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Beantown Companies invites you to submit a bid for the following project:</p>
      <div style="background: #f8fafc; border-left: 4px solid #5DCAA5; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 24px 0;">
        <p style="margin: 0; font-weight: 600; color: #0A1628; font-size: 18px;">${projectName}</p>
        <p style="margin: 4px 0 0; color: #666; font-size: 14px;">${projectAddress}</p>
        <p style="margin: 8px 0 0; color: #E24B4A; font-size: 14px; font-weight: 500;">Deadline: ${new Date(deadline).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
      </div>
      <a href="${bidUrl}" style="display: inline-block; background: #5DCAA5; color: #050E1A; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 700; font-size: 16px; margin: 8px 0;">Submit Your Bid →</a>
      <p style="color: #888; font-size: 13px; margin: 24px 0 0;">This invitation link is unique to you. Please do not share it. It expires on ${new Date(deadline).toLocaleDateString()}.</p>
    </div>
    <div style="background: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
      <p style="color: #aaa; font-size: 12px; margin: 0; text-align: center;">Beantown Companies LLC · Connecticut · <a href="${APP_URL}" style="color: #5DCAA5;">bidiq.co</a></p>
    </div>
  </div>
</body>
</html>
    `,
  });
}

export async function sendBidReceivedNotification({
  pmEmail,
  pmName,
  contractorCompany,
  projectName,
  totalAmount,
  projectId,
}: {
  pmEmail: string;
  pmName: string;
  contractorCompany: string;
  projectName: string;
  totalAmount: number;
  projectId: string;
}) {
  const projectUrl = `${APP_URL}/projects/${projectId}/bids`;

  const resend = getResend();
  if (!resend) return { data: null, error: new Error("Resend not configured") };
  return resend.emails.send({
    from: FROM,
    to: pmEmail,
    subject: `New Bid Received: ${contractorCompany} for ${projectName}`,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #050E1A;">New Bid Received</h2>
  <p>Hello ${pmName},</p>
  <p><strong>${contractorCompany}</strong> has submitted a bid for <strong>${projectName}</strong>.</p>
  <p>Total bid amount: <strong>$${totalAmount.toLocaleString()}</strong></p>
  <p>AI scoring is processing now.</p>
  <a href="${projectUrl}" style="background: #5DCAA5; color: #050E1A; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 700; display: inline-block; margin-top: 16px;">View Bid →</a>
</div>
    `,
  });
}

export async function sendBidSubmittedConfirmation({
  contractorEmail,
  contractorName,
  projectName,
  totalAmount,
}: {
  contractorEmail: string;
  contractorName: string;
  projectName: string;
  totalAmount: number;
}) {
  const resend = getResend();
  if (!resend) return { data: null, error: new Error("Resend not configured") };
  return resend.emails.send({
    from: FROM,
    to: contractorEmail,
    subject: `Bid Submitted: ${projectName} — Beantown Companies`,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #050E1A; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #5DCAA5; margin: 0; font-family: Georgia, serif;">BidIQ</h1>
  </div>
  <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 8px 8px;">
    <h2 style="color: #0A1628;">Bid Received ✓</h2>
    <p>Hello ${contractorName},</p>
    <p>Your bid for <strong>${projectName}</strong> has been received successfully.</p>
    <div style="background: #F0FAF6; border: 1px solid #5DCAA5; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; font-weight: 600;">Total Bid Amount: $${totalAmount.toLocaleString()}</p>
    </div>
    <p><strong>What happens next:</strong></p>
    <ol style="color: #555; line-height: 1.8;">
      <li>Our AI system will analyze your bid against market benchmarks</li>
      <li>The Beantown team will review all bids after the deadline</li>
      <li>You'll be notified of the decision by email</li>
    </ol>
    <p style="color: #888; font-size: 13px; margin-top: 24px;">Questions? Reply to this email or contact your Beantown project manager.</p>
  </div>
</div>
    `,
  });
}
