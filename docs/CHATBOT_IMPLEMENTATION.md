# Chatbot Feature Implementation Guide

## Overview
A comprehensive AI-powered chatbot has been added to all three FarmchainX portals: Farmer, Customer, and Delivery Partner. The chatbot provides role-specific assistance with FAQs, quick suggestions, and an intuitive conversational interface.

## Features Implemented

### 🎯 Frontend Components
- **Chatbot.jsx**: Reusable chat interface component with:
  - Floating chatbot button in bottom-right corner
  - Full chat history with timestamps
  - Real-time message updates
  - Quick suggestion buttons for common questions
  - Typing indicators for bot responses
  - Smooth scroll-to-latest-message behavior
  - Responsive design that works on all devices
  - Beautiful gradient UI with animations

### 🔧 Backend Services
1. **ChatbotService.java**: Core business logic
   - Pre-loaded FAQ database with 15 FAQs per role
   - Intelligent keyword matching algorithm
   - Dynamic suggestion generation
   - Role-specific responses (FARMER, CUSTOMER, DELIVERY)

2. **ChatbotController.java**: REST API endpoint
   - POST `/api/chatbot/message` - Send message and get response
   - GET `/api/chatbot/health` - Health check
   - Cross-origin enabled for frontend communication

3. **Data Transfer Objects**:
   - ChatbotRequest.java - Message and role from user
   - ChatbotResponse.java - Reply, suggestions, and metadata

### 📚 FAQ Database

#### Farmer Portal (15 FAQs)
- How to add products
- Viewing and managing orders
- Payment methods and withdrawal process
- Crop batch management
- Blockchain records viewing
- Minimum withdrawal amounts
- Product pricing strategy
- And more...

#### Customer Portal (15 FAQs)
- How to place orders
- Payment and refund processes
- Order tracking and cancellation
- Product quality issues
- Delivery information
- QR code scanning
- Search and favorites
- Return policy
- And more...

#### Delivery Partner Portal (15 FAQs)
- Accepting deliveries
- Payment and earnings
- Delivery completion process
- Navigation and contact details
- Delivery history
- Rating system
- Loss/damage claims
- Safe delivery practices
- And more...

## Integration Points

### Farmer Portal
```jsx
// Added to FarmerLayout.jsx
import Chatbot from '../components/Chatbot';
// In component: <Chatbot role="FARMER" />
```

### Customer Portal
```jsx
// Added to CustomerLayout.jsx
import Chatbot from '../components/Chatbot';
// In component: <Chatbot role="CUSTOMER" />
```

### Delivery Portal
```jsx
// Added to DeliveryLayout.jsx
import Chatbot from '../components/Chatbot';
// In component: <Chatbot role="DELIVERY" />
```

## API Usage Example

```bash
POST /api/chatbot/message
Content-Type: application/json

{
  "message": "How do I withdraw my earnings?",
  "role": "FARMER"
}

Response:
{
  "reply": "Go to 'Payments' → 'Wallet' → Click 'Withdraw'...",
  "suggestions": ["payment methods", "how to view orders", ...],
  "timestamp": "2024-04-03T10:30:00Z",
  "type": "FAQ"
}
```

## How It Works

1. **User Opens Chat**: Click the 💬 button in bottom-right corner
2. **User Sends Message**: Type a question and press Enter
3. **Backend Processing**:
   - Message sent to `/api/chatbot/message`
   - Service performs keyword matching against FAQs
   - Returns best matching answer or default response
4. **Bot Responds**: Answer displayed with quick suggestion buttons
5. **User Can Click Suggestions**: Pre-loaded questions for easy navigation

## Technical Details

### Frontend Technologies
- React.js with hooks
- Tailwind CSS for styling
- Axios for API calls
- Smooth animations and transitions

### Backend Technologies
- Spring Boot REST API
- Java service layer
- Cross-Origin Resource Sharing (CORS) enabled
- Stateless architecture for scalability

### Algorithm
- Keyword-based FAQ matching
- Multi-word keyword detection
- Smart suggestion generation from related FAQs
- Fallback default responses per role

## Files Created/Modified

### New Files
```
backend/src/main/java/com/farmchainx/chatbot/
├── ChatbotController.java
├── ChatbotFAQ.java
├── ChatbotRequest.java
├── ChatbotResponse.java
└── ChatbotService.java

FarmchainX/src/components/
└── Chatbot.jsx
```

### Modified Files
```
FarmchainX/src/farmer/FarmerLayout.jsx (added Chatbot import & component)
FarmchainX/src/customer/CustomerLayout.jsx (added Chatbot import & component)
FarmchainX/src/delivery/DeliveryLayout.jsx (added Chatbot import & component)
```

## Installation & Deployment

1. **Backend**: No additional dependencies required - uses existing Spring Boot
2. **Frontend**: No additional npm packages required
3. **Database**: No database changes needed - FAQs are in-memory
4. **Configuration**: CORS already configured

## Future Enhancements

1. **AI Integration**: Replace keyword matching with GPT-3/4 API
2. **Chat History**: Persist messages in database
3. **Analytics**: Track common questions and user issues
4. **Multi-Language Support**: Translate FAQs to other languages
5. **Admin Dashboard**: Manage FAQs from admin panel
6. **Feedback System**: Users can rate chatbot responses
7. **Context Awareness**: Remember user information across sessions
8. **Escalation**: Transfer to human support if needed

## Testing the Chatbot

1. Start the backend application
2. Start the frontend application
3. Log in to any portal (Farmer, Customer, or Delivery)
4. Click the 💬 button in the bottom-right corner
5. Type questions like:
   - "How to place order?" (Customer)
   - "How to withdraw money?" (Farmer)
   - "How to accept delivery?" (Delivery)
6. Try clicking the suggested questions
7. Check that answers are relevant and helpful

## Support

For issues or questions about the chatbot:
1. Check the FAQ database in ChatbotService.java
2. Add new FAQs as needed
3. Modify keyword matching in findMatchingFAQs() method
4. Adjust suggestion generation in generateSuggestions() method

