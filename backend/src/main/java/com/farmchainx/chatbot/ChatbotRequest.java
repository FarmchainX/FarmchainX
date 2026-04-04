package com.farmchainx.chatbot;

public class ChatbotRequest {
    private String message;
    private String role;

    public ChatbotRequest() {
    }

    public ChatbotRequest(String message, String role) {
        this.message = message;
        this.role = role;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}

