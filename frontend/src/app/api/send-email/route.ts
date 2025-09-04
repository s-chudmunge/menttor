import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import WelcomeEmail from '@/emails/welcome-template';
import PromotionalEmail from '@/emails/promotional-template';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { to, subject, message, template, userName } = await request.json();

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject' },
        { status: 400 }
      );
    }

    let emailHtml: string;

    if (template === 'welcome') {
      // Use React Email welcome template
      emailHtml = await render(WelcomeEmail({ userName: userName || 'there' }));
    } else if (template === 'promotional') {
      // Use React Email promotional template
      emailHtml = await render(PromotionalEmail({ recipientName: 'there' }));
    } else {
      // Use custom message with simple styling
      if (!message) {
        return NextResponse.json(
          { error: 'Message is required for custom emails' },
          { status: 400 }
        );
      }
      
      emailHtml = `
        <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="padding: 32px 24px; background-color: #ffffff; text-align: center; border-bottom: 1px solid #e5e7eb;">
            <img src="https://menttor.live/logo_higres-min.png" width="140" height="auto" alt="Menttor Logo" style="margin-bottom: 16px;" />
            <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0; line-height: 32px;">
              Message from Menttor
            </h2>
          </div>
          <div style="padding: 32px 24px;">
            <div style="padding: 24px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          <div style="padding: 24px; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
              This email was sent from the Menttor Admin Panel<br />
              <a href="https://menttor.live" style="color: #3b82f6; text-decoration: none;">menttor.live</a>
            </p>
          </div>
        </div>
      `;
    }

    const { data, error } = await resend.emails.send({
      from: 'Sankalp from Menttor <sankalp@menttor.live>',
      to: [to],
      subject: subject,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Email sent successfully',
        emailId: data?.id 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}