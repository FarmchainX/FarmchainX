package com.farmchainx.chatbot;

import java.util.Date;
import java.util.List;

public class ChatbotResponse {
    private String reply;
    private Date timestamp;
    private List<String> suggestions;
    private String type;

    public ChatbotResponse() {
    }

    public ChatbotResponse(String reply, Date timestamp, List<String> suggestions, String type) {
        this.reply = reply;
        this.timestamp = timestamp;
        this.suggestions = suggestions;
        this.type = type;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }

    public List<String> getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(List<String> suggestions) {
        this.suggestions = suggestions;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}

