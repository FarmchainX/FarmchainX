package com.farmchainx.chatbot;

import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatbotService {

    private final Map<String, List<ChatbotFAQ>> faqDatabase = new HashMap<>();

    public ChatbotService() {
        initializeFAQDatabase();
    }

    private void initializeFAQDatabase() {
        // Farmer Portal FAQs
        List<ChatbotFAQ> farmerFAQs = Arrays.asList(
                new ChatbotFAQ("how to add product", "To add a product: 1. Go to 'My Products' section, 2. Click 'Add New Product', 3. Fill in product details like name, quantity, price, 4. Click 'Submit'. Your product will be listed for customers."),
                new ChatbotFAQ("how to view orders", "Navigate to 'Orders' section to see all customer orders. You can filter by status, date, or customer name. Click on an order to view detailed information and payment status."),
                new ChatbotFAQ("payment methods", "We support multiple payment methods: Direct transfer, Digital wallets, and Razorpay. Payments are automatically credited to your wallet after customer payment confirmation."),
                new ChatbotFAQ("how to withdraw", "Go to 'Payments' → 'Wallet' → Click 'Withdraw'. Enter the amount and bank details. Withdrawal will be processed within 2-3 business days."),
                new ChatbotFAQ("crop batch management", "Use 'Batches' to track your crop production cycles. Add batch details, monitor growth stages, and track harvest. This helps maintain blockchain records."),
                new ChatbotFAQ("blockchain records", "All transactions are recorded on blockchain for transparency. Visit 'Blockchain' section to view immutable transaction history and verify product authenticity."),
                new ChatbotFAQ("minimum withdrawal", "Minimum withdrawal amount is ₹500. You can withdraw any amount above this threshold available in your wallet."),
                new ChatbotFAQ("product pricing", "You can set your own product prices. Consider market rates and costs. Prices can be updated anytime from 'My Products' section."),
                new ChatbotFAQ("delivery address", "Delivery is handled by our delivery partners. Confirm your farm address in 'Settings' to ensure smooth deliveries."),
                new ChatbotFAQ("profile settings", "Update your profile picture, phone number, farm address, and bank details in 'Settings' section."),
                new ChatbotFAQ("customer contact", "You can call customers directly. Their contact information is available in the order details. Please maintain professional communication."),
                new ChatbotFAQ("product quality", "Always ensure products are fresh and of good quality. Quality issues may result in refunds and affect your rating."),
                new ChatbotFAQ("inventory management", "Track your inventory from 'My Products'. When quantity runs out, product is automatically unlisted. Update quantity to re-list."),
                new ChatbotFAQ("support contact", "For technical issues or complaints, contact our support team via the 'Help & Support' section or email support@farmchainx.com"),
                new ChatbotFAQ("app performance issues", "Clear app cache, ensure stable internet connection, and try refreshing the page. If issues persist, contact support.")
        );

        // Customer Portal FAQs
        List<ChatbotFAQ> customerFAQs = Arrays.asList(
                new ChatbotFAQ("how to place order", "1. Browse products in 'Shop', 2. Click on product to view details, 3. Add to cart, 4. Review and proceed to checkout, 5. Complete payment."),
                new ChatbotFAQ("payment methods", "We accept Credit/Debit cards, UPI, and other digital payment methods via Razorpay. All payments are secure and encrypted."),
                new ChatbotFAQ("track order", "Go to 'Orders' section to view all your orders with real-time status updates. Click on order to see delivery partner details and tracking."),
                new ChatbotFAQ("cancel order", "You can cancel orders within 30 minutes of placing. Go to 'Orders' and click 'Cancel' on pending orders. Refund will be processed within 5-7 days."),
                new ChatbotFAQ("refund process", "Refunds are initiated within 24 hours of cancellation. It takes 5-7 business days for the amount to reflect in your account."),
                new ChatbotFAQ("product quality issue", "If you receive damaged or poor quality product, contact support immediately with photos. We'll arrange replacement or refund."),
                new ChatbotFAQ("delivery charges", "Delivery charges are calculated based on distance. Free delivery available on orders above ₹500 in select areas."),
                new ChatbotFAQ("scan qr code", "Use 'Scan QR' to verify product authenticity and view blockchain details. This ensures you're buying genuine farm products."),
                new ChatbotFAQ("search products", "Use search bar to find products by name. You can also browse by category or sort by price and rating."),
                new ChatbotFAQ("save favorites", "Click heart icon on product to add to favorites. Access favorites from your profile page."),
                new ChatbotFAQ("cart management", "Add/remove items from cart before checkout. Quantities can be adjusted. Cart is saved locally."),
                new ChatbotFAQ("shipping address", "Provide delivery address during checkout. Ensure address is accurate for successful delivery."),
                new ChatbotFAQ("estimated delivery", "Standard delivery: 2-4 hours in urban areas, 4-6 hours in suburban areas. Express delivery available."),
                new ChatbotFAQ("contact support", "For queries or complaints, reach out via 'Help' section in app or email support@farmchainx.com"),
                new ChatbotFAQ("return policy", "30-day return policy for unused products. For damaged items, initiate return from order details.")
        );

        // Delivery Partner FAQs
        List<ChatbotFAQ> deliveryFAQs = Arrays.asList(
                new ChatbotFAQ("how to accept delivery", "Go to 'Available Deliveries', view delivery details, and click 'Accept'. You'll get navigation and contact details for pickup and delivery."),
                new ChatbotFAQ("payment for delivery", "Earn per delivery completed. Earnings are credited to your wallet after delivery confirmation by customer."),
                new ChatbotFAQ("withdraw earnings", "Go to 'Earnings' → 'Withdraw'. Enter amount (minimum ₹500). Withdrawal processed within 2-3 business days."),
                new ChatbotFAQ("delivery completion", "After successful delivery, mark as 'Delivered' in app. Customer will confirm receipt. Take photo proof if required."),
                new ChatbotFAQ("contact details", "Farmer and customer contact info available in delivery details. Use provided phone numbers to communicate."),
                new ChatbotFAQ("navigation help", "Navigate button opens maps with address. Follow GPS directions to pickup and delivery points."),
                new ChatbotFAQ("delivery history", "View all completed deliveries in 'History' section. Details include earnings, date, location, and customer feedback."),
                new ChatbotFAQ("rating system", "Customers rate your service. Maintain high ratings by being punctual, professional, and careful with products."),
                new ChatbotFAQ("rejected delivery", "If customer rejects delivery, report immediately. Take photos of product condition. Support will investigate."),
                new ChatbotFAQ("lost item claim", "If product lost during delivery, report within 24 hours with evidence. Support will review and process claim."),
                new ChatbotFAQ("delivery zones", "You can select preferred delivery zones. Work in areas you're comfortable with. More zones = more orders."),
                new ChatbotFAQ("app features", "Key features: Available deliveries, My deliveries, History, Earnings, Profile, and Notifications."),
                new ChatbotFAQ("support contact", "For issues, contact support via 'Settings' → 'Help' or email support@farmchainx.com"),
                new ChatbotFAQ("safe delivery practices", "Handle products carefully, use thermal bags if needed, maintain delivery vehicle hygiene, and treat customers respectfully."),
                new ChatbotFAQ("minimum requirement", "Complete 5 deliveries to unlock premium features and higher earning opportunities.")
        );

        faqDatabase.put("FARMER", farmerFAQs);
        faqDatabase.put("CUSTOMER", customerFAQs);
        faqDatabase.put("DELIVERY", deliveryFAQs);
    }

    public ChatbotResponse getResponse(String userMessage, String role) {
        List<ChatbotFAQ> faqs = faqDatabase.getOrDefault(role, new ArrayList<>());

        // Find matching FAQs
        List<ChatbotFAQ> matchingFAQs = findMatchingFAQs(userMessage, faqs);

        ChatbotResponse response = new ChatbotResponse();
        response.setTimestamp(new Date());

        if (!matchingFAQs.isEmpty()) {
            response.setReply(matchingFAQs.get(0).getAnswer());
            response.setSuggestions(generateSuggestions(userMessage, faqs, matchingFAQs));
            response.setType("FAQ");
        } else {
            response.setReply(generateDefaultResponse(role));
            response.setSuggestions(generateRandomSuggestions(faqs, 3));
            response.setType("DEFAULT");
        }

        return response;
    }

    private List<ChatbotFAQ> findMatchingFAQs(String userMessage, List<ChatbotFAQ> faqs) {
        String query = userMessage.toLowerCase().trim();
        String[] queryWords = query.split("\\s+");
        
        // Calculate match score for each FAQ
        List<ChatbotFAQMatch> matches = faqs.stream()
                .map(faq -> {
                    String question = faq.getQuestion().toLowerCase();
                    
                    // Calculate similarity score
                    int wordMatches = (int) Arrays.stream(queryWords)
                            .filter(word -> word.length() > 2 && question.contains(word))
                            .count();
                    
                    // Exact match is best (score 1000)
                    int score = question.equals(query) ? 1000 : 0;
                    
                    // Phrase match is very good (score 500)
                    if (question.contains(query)) {
                        score = 500;
                    }
                    
                    // Word matches contribute to score
                    score += wordMatches * 100;
                    
                    return new ChatbotFAQMatch(faq, score);
                })
                .filter(match -> match.score > 0)  // Only FAQs with at least one match
                .sorted((a, b) -> Integer.compare(b.score, a.score))  // Sort by score descending
                .collect(Collectors.toList());
        
        // Return only the best matches (top 3 or if tied at same score)
        if (matches.isEmpty()) {
            return new ArrayList<>();
        }
        
        List<ChatbotFAQ> result = new ArrayList<>();
        int topScore = matches.get(0).score;
        
        for (ChatbotFAQMatch match : matches) {
            // Only return FAQs with the best score to avoid false positives
            if (match.score == topScore) {
                result.add(match.faq);
            } else {
                break;
            }
        }
        
        return result;
    }
    
    // Inner class to hold FAQ with match score
    private static class ChatbotFAQMatch {
        ChatbotFAQ faq;
        int score;
        
        ChatbotFAQMatch(ChatbotFAQ faq, int score) {
            this.faq = faq;
            this.score = score;
        }
    }

    private List<String> generateSuggestions(String userMessage, List<ChatbotFAQ> allFAQs, List<ChatbotFAQ> matchedFAQs) {
        Set<String> suggestions = new HashSet<>();
        
        // Add suggestions from matched FAQs
        for (ChatbotFAQ faq : matchedFAQs) {
            if (suggestions.size() < 3) {
                suggestions.add(faq.getQuestion());
            }
        }

        // Add random FAQs as suggestions
        List<ChatbotFAQ> remaining = allFAQs.stream()
                .filter(faq -> !matchedFAQs.contains(faq))
                .collect(Collectors.toList());

        Collections.shuffle(remaining);
        for (ChatbotFAQ faq : remaining) {
            if (suggestions.size() < 3) {
                suggestions.add(faq.getQuestion());
            }
        }

        return new ArrayList<>(suggestions);
    }

    private List<String> generateRandomSuggestions(List<ChatbotFAQ> faqs, int count) {
        List<ChatbotFAQ> shuffled = new ArrayList<>(faqs);
        Collections.shuffle(shuffled);
        return shuffled.stream()
                .limit(count)
                .map(ChatbotFAQ::getQuestion)
                .collect(Collectors.toList());
    }

    private String generateDefaultResponse(String role) {
        return switch (role) {
            case "FARMER" -> "I'm here to help with your farming queries! Ask me about adding products, managing orders, payments, withdrawals, or any other farm-related questions.";
            case "CUSTOMER" -> "Hello! I can help you with placing orders, tracking deliveries, payments, refunds, or any shopping-related questions.";
            case "DELIVERY" -> "Hi there! I can assist with available deliveries, earnings, payments, delivery completion, or delivery partner guidelines.";
            default -> "I'm here to help! Please ask your question and I'll do my best to assist.";
        };
    }
}

