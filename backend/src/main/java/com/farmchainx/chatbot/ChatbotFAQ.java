package com.farmchainx.chatbot;

import java.util.List;
import java.util.Date;

public class ChatbotFAQ {
    private String question;
    private String answer;

    public ChatbotFAQ(String question, String answer) {
        this.question = question;
        this.answer = answer;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }
}

