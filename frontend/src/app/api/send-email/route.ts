import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import * as brevo from '@getbrevo/brevo';
import { render } from '@react-email/render';
import WelcomeEmail from '@/emails/welcome-template';
import PromotionalEmail from '@/emails/promotional-template';

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { to, subject, message, template, userName, emailService = 'resend' } = requestBody;
    
    console.log('Email API received:', { to, subject, template, emailService, requestBody });

    // Validate email service configuration
    if (emailService === 'resend' && !process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    if (emailService === 'brevo' && !process.env.BREVO_API_KEY) {
      return NextResponse.json(
        { error: 'BREVO_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

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
              Important Update
            </h2>
          </div>
          <div style="padding: 32px 24px;">
            <div style="padding: 24px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
              <div style="color: #374151; font-size: 16px; line-height: 1.6;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
          </div>
          <div style="padding: 24px; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
              <a href="https://menttor.live" style="color: #3b82f6; text-decoration: none;">menttor.live</a>
            </p>
          </div>
        </div>
      `;
    }

    // Send email using selected service
    if (emailService === 'resend') {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const { data, error } = await resend.emails.send({
        from: 'Sankalp <sankalp@menttor.live>',
        replyTo: 'csankalp21@gmail.com',
        to: [to],
        subject: subject,
        html: emailHtml,
      });

      if (error) {
        console.error('Resend error:', error);
        return NextResponse.json(
          { error: 'Failed to send email via Resend', details: error },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          success: true, 
          message: 'Email sent successfully via Resend',
          emailId: data?.id,
          service: 'resend'
        },
        { status: 200 }
      );
    } else if (emailService === 'brevo') {
      // Configure Brevo API client
      const apiInstance = new brevo.TransactionalEmailsApi();
      apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { name: 'Sankalp', email: 'sankalp@menttor.live' };
      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = emailHtml;
      sendSmtpEmail.replyTo = { email: 'csankalp21@gmail.com' };

      try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        
        return NextResponse.json(
          { 
            success: true, 
            message: 'Email sent successfully via Brevo',
            emailId: data.body?.messageId,
            service: 'brevo'
          },
          { status: 200 }
        );
      } catch (error) {
        console.error('Brevo error:', error);
        return NextResponse.json(
          { error: 'Failed to send email via Brevo', details: error },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid email service specified' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}