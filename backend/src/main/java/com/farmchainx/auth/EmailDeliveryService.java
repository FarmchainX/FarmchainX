package com.farmchainx.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.Year;

@Service
public class EmailDeliveryService {

    private static final Logger log = LoggerFactory.getLogger(EmailDeliveryService.class);

    private final JavaMailSender mailSender;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.email.from:no-reply@farmchainx.local}")
    private String fromAddress;

    public EmailDeliveryService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public boolean sendVerificationCode(String recipientEmail, String verificationCode) {
        if (!emailEnabled) {
            log.info("Email sending is disabled. Verification code for {} not sent via SMTP.", recipientEmail);
            return false;
        }

        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(recipientEmail);
            helper.setSubject("FarmchainX Email Verification Code");
            helper.setText(buildVerificationHtml(verificationCode), true);
            mailSender.send(message);
            return true;
        } catch (Exception ex) {
            log.error("Failed to send verification email to {}", recipientEmail, ex);
            return false;
        }
    }

    public boolean isEmailEnabled() {
        return emailEnabled;
    }

    private String buildVerificationHtml(String verificationCode) {
        return String.format("""
                <html>
                  <body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,sans-serif;color:#0f172a;">
                    <div style="max-width:560px;margin:28px auto;background:#ffffff;border:1px solid #d1fae5;border-radius:14px;overflow:hidden;">
                      <div style="padding:18px 24px;background:linear-gradient(135deg,#064e3b,#065f46,#0f766e);color:#ffffff;">
                        <h2 style="margin:0;font-size:20px;">FarmchainX Email Verification</h2>
                      </div>
                      <div style="padding:24px;">
                        <p style="margin:0 0 14px 0;font-size:14px;color:#334155;">Use the verification code below to complete your registration:</p>
                        <div style="margin:0 0 18px 0;padding:14px;border:1px solid #a7f3d0;background:#ecfdf5;border-radius:10px;text-align:center;">
                          <span style="font-size:30px;letter-spacing:8px;font-weight:700;color:#065f46;">%s</span>
                        </div>
                        <p style="margin:0 0 8px 0;font-size:13px;color:#475569;">This code will expire in <strong>10 minutes</strong>.</p>
                        <p style="margin:0;font-size:12px;color:#64748b;">If you did not request this verification, you can safely ignore this email.</p>
                      </div>
                      <div style="padding:12px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;">
                        © %d FarmchainX
                      </div>
                    </div>
                  </body>
                </html>
                """, verificationCode, Year.now().getValue());
    }
}



