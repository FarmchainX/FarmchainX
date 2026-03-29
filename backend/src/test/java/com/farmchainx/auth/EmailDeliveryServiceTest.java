package com.farmchainx.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class EmailDeliveryServiceTest {

    @Mock
    private JavaMailSender javaMailSender;

    private EmailDeliveryService emailDeliveryService;

    @BeforeEach
    void setup() {
        emailDeliveryService = new EmailDeliveryService(javaMailSender);
        ReflectionTestUtils.setField(emailDeliveryService, "fromAddress", "no-reply@farmchainx.com");
    }

    @Test
    void shouldNotSendWhenEmailDisabled() {
        ReflectionTestUtils.setField(emailDeliveryService, "emailEnabled", false);

        boolean sent = emailDeliveryService.sendVerificationCode("user@example.com", "123456");

        assertFalse(sent);
        verify(javaMailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void shouldSendWhenEmailEnabled() {
        ReflectionTestUtils.setField(emailDeliveryService, "emailEnabled", true);
        MimeMessage mimeMessage = new MimeMessage((Session) null);
        doReturn(mimeMessage).when(javaMailSender).createMimeMessage();

        boolean sent = emailDeliveryService.sendVerificationCode("user@example.com", "123456");

        assertTrue(sent);
        verify(javaMailSender).send(any(MimeMessage.class));
    }
}



