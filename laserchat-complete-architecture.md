# LaserChat - Complete Software Architecture Document

**Version:** 1.0  
**Date:** January 29, 2025  
**Status:** Technical Specification

---

## Executive Summary

### Project Overview

**LaserChat** is an AI-powered focus feed for Microsoft Teams that uses machine learning to intelligently filter and prioritize group chat messages, helping users cut through noise and focus on what matters most.

### Key Objectives

1. **Reduce Information Overload** - Filter out 60-80% of non-critical messages
2. **Improve Response Time** - Help users respond to urgent messages 3x faster  
3. **Increase Productivity** - Save users 30-45 minutes daily
4. **Enhance Focus** - Allow concentration on high-priority conversations

### Deployment Models

**Primary:** Teams Tab Application (Native Integration)
- Embedded directly in Teams channels and chats
- Single Sign-On via Teams SDK
- Direct Graph API access
- Sub-second latency

**Secondary:** Standalone Web Application  
- Accessible at https://laserchat.app
- OAuth 2.0 authentication via Azure AD
- Real-time webhook synchronization
- PWA with offline support

### Technical Highlights

- **AI/ML Pipeline:** Fine-tuned BERT + GPT-4 for personalized scoring and context
- **Real-Time Sync:** SignalR + Graph webhooks (< 1 second latency)
- **Scalability:** Auto-scaling microservices on Azure Container Apps
- **Security:** Enterprise-grade with Azure AD, Key Vault, and encryption
- **Data:** Cosmos DB + SQL Database + Redis for optimal performance

---

## 1. System Architecture

### 1.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT TIER                                │
├─────────────────┬───────────────────┬──────────────────────────┤
│ Teams Desktop/  │ Standalone Web    │ Mobile (Future)          │
│ Mobile Tab      │ Application       │ React Native             │
│ (React + Teams  │ (React PWA)       │                          │
│ SDK)            │                   │                          │
└────────┬────────┴────────┬──────────┴──────────┬───────────────┘
         │                 │                     │
         │ HTTPS/WSS       │ HTTPS/WSS           │ HTTPS/WSS
         │                 │                     │
┌────────▼─────────────────▼─────────────────────▼───────────────┐
│                    EDGE/CDN TIER                                │
│  Azure Front Door + WAF + DDoS Protection                       │
└────────┬────────────────────────────────────────────────────────┘
         │
┌────────▼────────────────────────────────────────────────────────┐
│                   API GATEWAY TIER                              │
│  Azure API Management                                           │
│  - JWT Validation                                               │
│  - Rate Limiting (100 req/sec/user)                            │
│  - Request Routing                                              │
└────────┬────────────────────────────────────────────────────────┘
         │
    ┌────┴──────┬─────────────┬──────────────┐
    │           │             │              │
┌───▼────┐ ┌───▼────┐  ┌─────▼─────┐  ┌────▼────┐
│ Teams  │ │ User   │  │ Admin     │  │ SignalR │
│ API    │ │ API    │  │ API       │  │ Service │
│ Service│ │ Service│  │ Service   │  │(Real-time)│
└───┬────┘ └───┬────┘  └─────┬─────┘  └─────────┘
    │          │             │
    └──────┬───┴─────────────┘
           │
┌──────────▼────────────────────────────────────────────────────┐
│                 AI/ML PROCESSING TIER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Relevance    │  │ Context      │  │ Summary      │       │
│  │ Scorer       │  │ Generator    │  │ Engine       │       │
│  │ (BERT Model) │  │ (GPT-4)      │  │ (GPT-4)      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────┬────────────────────────────────────────────────────┘
           │
┌──────────▼────────────────────────────────────────────────────┐
│               INTEGRATION TIER                                 │
│  - Microsoft Graph API (Chat/Message access)                  │
│  - Azure Event Grid (Event-driven processing)                 │
│  - Azure Service Bus (Message queuing)                        │
└──────────┬────────────────────────────────────────────────────┘
           │
┌──────────▼────────────────────────────────────────────────────┐
│                    DATA TIER                                   │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────┐       │
│  │ Cosmos DB     │  │ Azure SQL    │  │ Redis Cache │       │
│  │ (Messages &   │  │ (Users,      │  │ (Sessions,  │       │
│  │  Scores)      │  │  Prefs,      │  │  Hot Data)  │       │
│  │               │  │  Analytics)  │  │             │       │
│  └───────────────┘  └──────────────┘  └─────────────┘       │
│                                                                │
│  ┌─────────────────────────────────────────────────┐         │
│  │ Azure Blob Storage (ML Models, Logs, Backups)   │         │
│  └─────────────────────────────────────────────────┘         │
└────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Descriptions

#### Client Applications

**Teams Tab**
- Technology: React 18 + TypeScript + Fluent UI
- Integration: @microsoft/teams-js SDK v2.0+
- Authentication: Teams SSO (automatic)
- Deployment: Embedded iFrame in Teams

**Web Application**
- Technology: React 18 + TypeScript PWA
- Authentication: MSAL.js (Azure AD B2C)
- Features: Offline support, push notifications
- Deployment: Azure Static Web Apps

#### Backend Services

**Teams API Service**
- Handles Teams-specific operations
- Chat and message management
- Webhook subscription management
- Technology: NestJS (Node.js + TypeScript)

**User API Service**
- User profile and preference management
- Settings and personalization
- Analytics tracking
- Technology: NestJS

**Admin API Service**
- Tenant configuration
- Usage analytics and reporting
- License management
- Technology: NestJS

**AI/ML Services**
- Relevance Scoring: PyTorch + FastAPI
- Context Generation: Azure OpenAI GPT-4
- Summary Engine: Azure OpenAI GPT-4
- Technology: Python 3.11 + FastAPI

---

## 2. Deployment Architecture

### 2.1 Teams Tab Deployment

```
USER WORKFLOW:
1. User opens Teams
2. Navigates to Marketing Team chat
3. Clicks "LaserChat" tab
4. Tab loads in iFrame from https://laserchat.app/teams/tab
5. Teams SDK provides context (chatId, userId, etc.)
6. SSO token automatically obtained
7. LaserChat UI loads with focused messages

TECHNICAL FLOW:
┌─────────────────────────────────────────────┐
│  Microsoft Teams Client                     │
│  ┌────────────────────────────────────────┐│
│  │ Marketing Team Chat                    ││
│  │ ├─ Posts Tab                           ││
│  │ ├─ Files Tab                           ││
│  │ └─ LaserChat Tab ◄──── Custom Tab     ││
│  │    ┌─────────────────────────────────┐││
│  │    │ iFrame:                         │││
│  │    │ https://laserchat.app/teams/tab │││
│  │    │                                 │││
│  │    │ React App with:                 │││
│  │    │ - Teams SDK Integration         │││
│  │    │ - Graph API Client              │││
│  │    │ - SignalR Connection            │││
│  │    └─────────────────────────────────┘││
│  └────────────────────────────────────────┘│
└─────────────┬───────────────────────────────┘
              │
              │ 1. teams.getContext()
              │ 2. teams.authentication.getAuthToken()
              │ 3. REST API calls with JWT
              │ 4. SignalR connection for real-time
              │
┌─────────────▼───────────────────────────────┐
│  LaserChat Backend (Azure Container Apps)   │
│  ┌────────────────────────────────────────┐│
│  │ API Services                           ││
│  │ - Validate JWT token                   ││
│  │ - Exchange for Graph API token (OBO)   ││
│  │ - Query messages from Graph            ││
│  │ - AI processing                        ││
│  │ - Return focused feed                  ││
│  └────────────────────────────────────────┘│
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│  Microsoft Graph API                        │
│  - GET /chats/{id}/messages                 │
│  - GET /chats/{id}/members                  │
│  - Delegated permissions (as user)          │
└─────────────────────────────────────────────┘
```

### 2.2 Standalone Web App Deployment

```
USER WORKFLOW:
1. User visits https://laserchat.app
2. Clicks "Sign in with Microsoft"
3. Redirected to Azure AD B2C
4. Grants permissions (one-time)
5. Redirected back to LaserChat
6. Dashboard loads with all chats

TECHNICAL FLOW:
┌─────────────────────────────────────────────┐
│  Web Browser                                │
│  https://laserchat.app                      │
│  ┌────────────────────────────────────────┐│
│  │ React PWA Application                  ││
│  │ - Chat Selector (All user's chats)    ││
│  │ - Focus Feed (Aggregated view)        ││
│  │ - Settings & Preferences               ││
│  │ - Real-time updates via SignalR        ││
│  └────────────────────────────────────────┘│
└─────────────┬───────────────────────────────┘
              │
              │ 1. OAuth 2.0 Authorization Code Flow
              │ 2. Access token + Refresh token
              │ 3. REST API calls
              │ 4. SignalR persistent connection
              │
┌─────────────▼───────────────────────────────┐
│  Azure AD B2C                               │
│  - User authentication                      │
│  - OAuth consent                            │
│  - Token issuance                           │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│  LaserChat Backend                          │
│  ┌────────────────────────────────────────┐│
│  │ On user login:                         ││
│  │ 1. Create user record (if new)         ││
│  │ 2. Subscribe to Graph webhooks         ││
│  │ 3. Initial sync of user's chats        ││
│  │ 4. Establish SignalR connection        ││
│  └────────────────────────────────────────┘│
│  ┌────────────────────────────────────────┐│
│  │ Webhook Handler:                       ││
│  │ 1. Receives message notifications      ││
│  │ 2. AI processing                       ││
│  │ 3. Push to user via SignalR            ││
│  └────────────────────────────────────────┘│
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│  Microsoft Graph API Webhooks              │
│  POST https://laserchat.app/webhooks/graph │
│  {                                          │
│    "value": [{                              │
│      "subscriptionId": "...",               │
│      "resource": "/chats/.../messages/...", │
│      "changeType": "created"                │
│    }]                                       │
│  }                                          │
└─────────────────────────────────────────────┘
```

---

## 3. Data Flow: Message Processing Pipeline

### Complete End-to-End Flow

```
Step 1: Message Creation (T=0ms)
────────────────────────────────
Sarah sends in Marketing Team chat:
"Can you review the Q1 budget projections by EOD?"

   │
   ▼
Teams stores message in cloud
messageId: "msg-12345"
chatId: "19:marketing-abc123"

Step 2: Detection (T=200ms)
────────────────────────────
┌─ Path A: Teams Tab (Direct) ─┐  ┌─ Path B: Web App (Webhook) ─┐
│ Tab polls Graph API or       │  │ Graph webhook fires          │
│ receives Teams event          │  │ POST /webhooks/graph         │
│                               │  │ notification received        │
└───────────┬───────────────────┘  └────────┬─────────────────────┘
            │                               │
            └───────────┬───────────────────┘
                        │
Step 3: Enrichment (T=250ms)
────────────────────────────
                        ▼
        ┌───────────────────────────┐
        │ Fetch full message:       │
        │ GET /chats/{id}/messages  │
        │                           │
        │ Get sender profile        │
        │ Get chat metadata         │
        │ Get recent context        │
        └───────────┬───────────────┘
                    │
Step 4: Feature Extraction (T=350ms)
────────────────────────────────────
                    ▼
        ┌───────────────────────────┐
        │ NLP Processing:           │
        │ - Tokenization            │
        │ - Entity extraction       │
        │   * People: none          │
        │   * Dates: "EOD"          │
        │   * Topics: "budget", "Q1"│
        │ - Intent: Request         │
        │ - Urgency: High           │
        │ - Question: No            │
        └───────────┬───────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │ Feature Vector:           │
        │ {                         │
        │   text_embedding: [768],  │
        │   is_mentioned: false,    │
        │   has_request: true,      │
        │   has_deadline: true,     │
        │   deadline_hours: 4,      │
        │   sender_priority: 0.8,   │
        │   keyword_match: 0.9,     │
        │   chat_activity: 0.7      │
        │ }                         │
        └───────────┬───────────────┘
                    │
Step 5: User Context Loading (T=380ms)
───────────────────────────────────────
                    ▼
        ┌───────────────────────────┐
        │ Load from database:       │
        │ - User preferences        │
        │ - Priority people list    │
        │ - Keywords (budget, Q1)   │
        │ - Historical behavior     │
        │ - Chat-specific settings  │
        └───────────┬───────────────┘
                    │
Step 6: ML Scoring (T=530ms)
────────────────────────────
                    ▼
        ┌───────────────────────────┐
        │ BERT Model Inference:     │
        │                           │
        │ Input: Feature vector     │
        │ Output: Probabilities     │
        │   Urgent: 0.72            │
        │   Important: 0.23         │
        │   FYI: 0.04               │
        │   Muted: 0.01             │
        │                           │
        │ Final Score: 0.92         │
        │ Category: URGENT          │
        └───────────┬───────────────┘
                    │
Step 7: AI Context (T=830ms)
────────────────────────────
                    ▼
        ┌───────────────────────────┐
        │ GPT-4 Prompt:             │
        │ "User is finance lead.    │
        │  Sarah needs budget       │
        │  approval by EOD.         │
        │  Context from last week's │
        │  meeting..."              │
        │                           │
        │ Generated Context:        │
        │ "You're the finance lead  │
        │  for this project. Sarah  │
        │  needs this by EOD. The   │
        │  Q1 budget was discussed  │
        │  in last week's meeting   │
        │  where you requested      │
        │  revised projections."    │
        └───────────┬───────────────┘
                    │
Step 8: Storage (T=860ms)
─────────────────────────
                    ▼
        ┌───────────────────────────┐
        │ Cosmos DB Write:          │
        │ {                         │
        │   messageId,              │
        │   chatId,                 │
        │   userId,                 │
        │   score: 0.92,            │
        │   category: "urgent",     │
        │   aiContext: "...",       │
        │   timestamp,              │
        │   ttl: 2592000 (30 days)  │
        │ }                         │
        └───────────┬───────────────┘
                    │
                    ├─► Redis Cache Update
                    │   (Hot data, 1 hour TTL)
                    │
Step 9: Real-Time Push (T=880ms)
────────────────────────────────
                    ▼
        ┌───────────────────────────┐
        │ SignalR Notification:     │
        │                           │
        │ To: user-789              │
        │ Event: "newUrgentMessage" │
        │ Payload: {                │
        │   messageId,              │
        │   category,               │
        │   preview,                │
        │   sender,                 │
        │   aiContext               │
        │ }                         │
        └───────────┬───────────────┘
                    │
Step 10: Client Update (T=900ms)
────────────────────────────────
                    ▼
        ┌───────────────────────────┐
        │ User's Browser/Teams Tab: │
        │ - Update Redux store      │
        │ - Increment badge (1→2)   │
        │ - Show toast notification │
        │ - Add to "Needs Response" │
        │ - Play subtle sound       │
        └───────────────────────────┘

TOTAL LATENCY: ~900ms
```

## 4. API Specification

### 4.1 REST API Endpoints Summary

```yaml
BASE_URL: https://api.laserchat.app/v1
AUTHENTICATION: Bearer JWT Token (Azure AD)
RATE_LIMIT: 100 requests/second per user

# Chats
GET    /chats                    # List all user's chats
GET    /chats/{id}               # Get chat details  
GET    /chats/{id}/messages      # Get messages (paginated)
GET    /chats/{id}/focus-feed    # Get focused messages
POST   /chats/{id}/score-message # Score specific message
PUT    /chats/{id}/preferences   # Update chat preferences

# Users
GET    /users/me                 # Current user profile
GET    /users/me/preferences     # Get preferences
PUT    /users/me/preferences     # Update preferences
GET    /users/me/stats           # Get usage statistics

# Subscriptions (Webhooks)
GET    /subscriptions            # List active subscriptions
POST   /subscriptions/create     # Create new subscription
PATCH  /subscriptions/{id}       # Renew subscription
DELETE /subscriptions/{id}       # Delete subscription

# Webhooks (Internal)
POST   /webhooks/graph           # Receive Graph notifications
GET    /webhooks/health          # Health check

# Admin (Tenant admins only)
GET    /admin/users              # List tenant users
GET    /admin/analytics          # Usage analytics
POST   /admin/config             # Update tenant config
```

### 4.2 Key Request/Response Examples

#### Get Focus Feed

```http
GET /api/v1/chats/19:marketing-abc123/focus-feed HTTP/1.1
Host: api.laserchat.app
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6...
```

```json
{
  "chatId": "19:marketing-abc123",
  "categories": {
    "urgent": {
      "count": 3,
      "messages": [
        {
          "id": "msg-12345",
          "from": {
            "id": "user-456",
            "displayName": "Sarah Martinez",
            "email": "sarah@contoso.com"
          },
          "body": {
            "contentType": "text",
            "content": "Can you review the Q1 budget projections by EOD?"
          },
          "createdDateTime": "2025-01-29T14:34:22Z",
          "score": 0.92,
          "category": "urgent",
          "aiContext": "You're the finance lead for this project. Sarah needs this by EOD. The Q1 budget was discussed in last week's meeting where you requested revised projections.",
          "mentions": [],
          "attachments": []
        }
      ]
    },
    "important": {
      "count": 5,
      "messages": [...]
    },
    "fyi": {
      "count": 12,
      "summary": "Team discussed design feedback on landing page mockups..."
    },
    "muted": {
      "count": 47
    }
  },
  "lastUpdated": "2025-01-29T14:35:00Z"
}
```

---

## 5. AI/ML Pipeline Details

### 5.1 Model Architecture

```python
# Relevance Scoring Model

class RelevanceClassifier(nn.Module):
    def __init__(self):
        super().__init__()
        
        # Pre-trained BERT
        self.bert = BertModel.from_pretrained('bert-base-uncased')
        
        # Feature fusion layer
        self.feature_fusion = nn.Linear(768 + 48, 384)  # BERT + custom features
        
        # Classification head
        self.classifier = nn.Sequential(
            nn.Linear(384, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 4)  # 4 categories
        )
    
    def forward(self, input_ids, attention_mask, features):
        # BERT encoding
        bert_output = self.bert(input_ids, attention_mask)
        text_features = bert_output.pooler_output  # [batch, 768]
        
        # Concatenate with custom features
        combined = torch.cat([text_features, features], dim=1)
        
        # Fusion and classification
        fused = self.feature_fusion(combined)
        logits = self.classifier(fused)
        
        return logits

# Training Configuration
config = {
    "model": "RelevanceClassifier",
    "optimizer": "AdamW",
    "learning_rate": 2e-5,
    "batch_size": 32,
    "epochs": 10,
    "loss": "CrossEntropyLoss",
    "metrics": ["accuracy", "f1_score", "precision", "recall"],
    "early_stopping": {
        "patience": 3,
        "monitor": "val_f1_score"
    }
}
```

### 5.2 Feature Engineering

```python
# Feature Extraction Pipeline

def extract_features(message, user_context, chat_context):
    features = {}
    
    # Text-based features
    features['word_count'] = len(message.body.split())
    features['has_question'] = '?' in message.body
    features['has_exclamation'] = '!' in message.body
    features['all_caps_ratio'] = sum(c.isupper() for c in message.body) / len(message.body)
    
    # Entity-based features
    entities = extract_entities(message.body)
    features['mentions_count'] = len(message.mentions)
    features['date_mentions'] = count_date_entities(entities)
    features['person_mentions'] = count_person_entities(entities)
    
    # User context features
    features['sender_importance'] = user_context.get_sender_importance(message.from_id)
    features['keyword_match_score'] = calculate_keyword_match(message.body, user_context.keywords)
    features['in_priority_people'] = message.from_id in user_context.priority_people
    
    # Behavioral features
    features['user_response_rate'] = user_context.get_response_rate(message.from_id)
    features['user_avg_response_time'] = user_context.get_avg_response_time(message.from_id)
    features['previous_interactions'] = user_context.get_interaction_count(message.from_id)
    
    # Chat context features  
    features['chat_activity_level'] = chat_context.get_activity_level()
    features['chat_member_count'] = len(chat_context.members)
    features['thread_depth'] = get_thread_depth(message.replyToId) if message.replyToId else 0
    features['time_since_last_message'] = calculate_time_delta(chat_context.last_message_time)
    
    # Temporal features
    features['hour_of_day'] = datetime.now().hour / 24.0
    features['day_of_week'] = datetime.now().weekday() / 7.0
    features['is_business_hours'] = 9 <= datetime.now().hour <= 17
    features['is_weekend'] = datetime.now().weekday() >= 5
    
    # Urgency indicators
    features['has_deadline'] = detect_deadline(message.body)
    features['deadline_urgency'] = calculate_deadline_urgency(message.body)
    features['contains_urgent_keywords'] = any(kw in message.body.lower() for kw in ['urgent', 'asap', 'immediate'])
    
    return features
```

### 5.3 Context Generation (GPT-4)

```python
# AI Context Generation

async def generate_ai_context(message, user_profile, chat_history):
    # Build context-rich prompt
    prompt = f"""
You are an AI assistant helping {user_profile.display_name} prioritize their Teams messages.

USER CONTEXT:
- Role: {user_profile.role_in_chat}
- Responsibilities: {', '.join(user_profile.responsibilities)}
- Priority keywords: {', '.join(user_profile.keywords)}

MESSAGE:
From: {message.from_name}
Content: "{message.body}"
Timestamp: {message.created_time}

RECENT CHAT HISTORY (last 5 messages):
{format_chat_history(chat_history)}

TASK:
Generate a brief, actionable context (max 50 words) explaining:
1. Why this message is important to the user specifically
2. Any relevant context from recent conversations
3. What action (if any) the user should take

Be concise, specific, and actionable. Use second person ("You").
"""

    response = await openai_client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that generates personalized message context."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=100,
        temperature=0.3  # Low temperature for consistency
    )
    
    return response.choices[0].message.content
```

---

## 6. Security & Compliance

### 6.1 Authentication & Authorization

**Authentication Flow (Teams Tab)**
1. User opens Teams
2. Teams SDK provides SSO token
3. LaserChat validates JWT signature
4. On-Behalf-Of (OBO) flow to get Graph token
5. User session created (60 min TTL)

**Authentication Flow (Web App)**
1. User visits laserchat.app
2. Redirects to Azure AD B2C
3. OAuth 2.0 authorization code flow
4. Tokens returned (access + refresh)
5. Tokens stored securely (httpOnly cookies)

**Authorization Model**
- Role-Based Access Control (RBAC)
- Roles: User, Admin, Tenant Admin
- Permissions enforced at API gateway level
- User can only access their own data

### 6.2 Data Security

**Encryption**
- In Transit: TLS 1.3
- At Rest: Azure encryption (256-bit AES)
- Secrets: Azure Key Vault with HSM

**Data Privacy**
- AI context is private to each user
- Message content never logged
- Preferences encrypted at rest
- GDPR/CCPA compliant

**Data Retention**
- Messages: 30 days (configurable)
- Scores: 30 days
- User preferences: Until account deletion
- Audit logs: 90 days

### 6.3 Compliance

**Certifications (Target)**
- SOC 2 Type II
- ISO 27001
- GDPR compliant
- HIPAA ready (for healthcare)

**Data Residency**
- Cosmos DB: Multi-region (user-selectable)
- Default: User's tenant region
- EU data stays in EU

---

## 7. Scalability & Performance

### 7.1 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time (p95) | < 200ms | 180ms |
| Message Processing Latency | < 1s | 900ms |
| ML Inference Time | < 150ms | 120ms |
| GPT-4 Context Generation | < 500ms | 400ms |
| SignalR Push Latency | < 50ms | 30ms |
| Uptime SLA | 99.9% | - |

### 7.2 Scaling Strategy

**Horizontal Scaling**
- API Services: 2-20 instances (auto-scale)
- ML Service: 2-10 instances (GPU-enabled)
- Trigger: CPU > 70% or Queue depth > 100

**Database Scaling**
- Cosmos DB: Auto-scale (400-100,000 RU/s)
- SQL Database: Elastic pool (S3-P2)
- Redis: Standard tier with clustering

**Caching Strategy**
- L1: In-memory (application)
- L2: Redis (hot data, 1 hour)
- L3: Cosmos DB (warm data, 7 days)
- L4: Blob storage (cold data, 30+ days)

### 7.3 Performance Optimizations

**API Optimizations**
- Response compression (gzip)
- HTTP/2 multiplexing
- Connection pooling
- Query result caching

**Database Optimizations**
- Indexed queries
- Partition key optimization (chatId)
- Denormalization for read-heavy patterns
- Change feed for real-time sync

**ML Optimizations**
- Batch inference (10 messages/batch)
- ONNX model quantization
- GPU acceleration
- Model prediction caching

---

## 8. Monitoring & Observability

### 8.1 Metrics

**Application Metrics**
- Request rate (req/sec)
- Error rate (%)
- Response time (p50, p95, p99)
- Active users
- Messages processed/sec

**Business Metrics**
- Daily active users (DAU)
- Messages categorized
- Time saved per user
- User engagement rate
- Feature adoption

**Infrastructure Metrics**
- CPU utilization
- Memory usage
- Disk I/O
- Network throughput
- Database RU consumption

### 8.2 Logging

**Structured Logging**
```json
{
  "timestamp": "2025-01-29T14:35:00Z",
  "level": "info",
  "service": "teams-api",
  "correlationId": "abc-123-def",
  "userId": "user-789",
  "event": "message_scored",
  "message": {
    "messageId": "msg-12345",
    "chatId": "19:marketing-abc",
    "score": 0.92,
    "category": "urgent",
    "processingTime": 850
  }
}
```

**Log Aggregation**
- Azure Application Insights
- Log Analytics Workspace
- Retention: 90 days
- Real-time alerts

### 8.3 Alerting

**Critical Alerts**
- API error rate > 5%
- Response time > 1s (p95)
- Database connection failures
- ML service unavailable

**Warning Alerts**
- API error rate > 2%
- Response time > 500ms (p95)
- Cache hit rate < 80%
- Queue depth > 1000

---

## 9. Disaster Recovery

### 9.1 Backup Strategy

**Databases**
- Cosmos DB: Continuous backup (7 days)
- SQL Database: Geo-redundant backups (daily)
- Redis: Persistence enabled (RDB + AOF)

**Configuration**
- Key Vault: Soft delete enabled (90 days)
- Infrastructure as Code: Git repository
- App configuration: Azure App Configuration

### 9.2 Recovery Procedures

**RTO (Recovery Time Objective)**
- Tier 1 (Critical): 1 hour
- Tier 2 (Important): 4 hours
- Tier 3 (Normal): 24 hours

**RPO (Recovery Point Objective)**
- Database: < 5 minutes
- Files: < 1 hour
- Configuration: Real-time (Git)

---

## 10. Implementation Roadmap

### Phase 1: MVP (Months 1-3)

**Weeks 1-4: Foundation**
- Set up Azure infrastructure
- Deploy basic API services
- Implement authentication

**Weeks 5-8: Core Features**
- Teams Tab UI
- Graph API integration
- Basic message scoring (rule-based)

**Weeks 9-12: AI Integration**
- ML model training
- GPT-4 context generation
- Real-time sync via SignalR

**Deliverable:** Teams Tab with basic AI scoring

### Phase 2: Enhancement (Months 4-6)

**Weeks 13-16: Standalone Web App**
- React PWA development
- OAuth implementation
- Webhook infrastructure

**Weeks 17-20: Advanced AI**
- Personalized ML models
- Improved context generation
- Summary engine

**Weeks 21-24: Polish**
- Performance optimization
- User testing & feedback
- Bug fixes

**Deliverable:** Web app + enhanced AI

### Phase 3: Scale (Months 7-9)

**Weeks 25-28: Enterprise Features**
- Admin portal
- Analytics dashboard
- Tenant management

**Weeks 29-32: Mobile Apps**
- React Native iOS
- React Native Android

**Weeks 33-36: Launch Prep**
- Security audit
- Load testing
- Marketing materials

**Deliverable:** Production-ready platform

---

## 11. Technology Decisions & Rationale

### Why React?
- Component reusability (Tab + Web)
- Large ecosystem
- Fluent UI integration
- Teams SDK compatibility

### Why NestJS?
- TypeScript support
- Modular architecture
- Built-in DI
- GraphQL integration

### Why Cosmos DB?
- Global distribution
- Low-latency reads
- Flexible schema
- Auto-scaling

### Why Azure OpenAI?
- Enterprise compliance
- Data residency
- SLA guarantees
- Cost predictability

---

## 12. Appendices

### Appendix A: Glossary

- **LaserChat**: The application name
- **Focus Feed**: AI-filtered message view
- **AI Context**: GPT-4 generated personalized insight
- **Relevance Score**: ML model output (0-1)
- **Category**: Message classification (Urgent/Important/FYI/Muted)
- **Webhook**: Graph API notification mechanism
- **OBO Flow**: On-Behalf-Of OAuth2.0 flow
- **TTL**: Time-To-Live (data retention)

### Appendix B: API Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| GET /chats | 100 | 1 minute |
| GET /messages | 50 | 1 minute |
| POST /score-message | 200 | 1 minute |
| POST /webhooks/graph | Unlimited | - |

### Appendix C: Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| AUTH_001 | Invalid token | 401 |
| AUTH_002 | Token expired | 401 |
| AUTH_003 | Insufficient permissions | 403 |
| RATE_001 | Rate limit exceeded | 429 |
| VAL_001 | Invalid request body | 400 |
| SVC_001 | Service unavailable | 503 |

### Appendix D: Contact Information

**Project Team**
- Architecture Lead: [Name]
- Technical Lead: [Name]
- Product Owner: [Name]

**Support**
- Email: support@laserchat.app
- Documentation: https://docs.laserchat.app
- Status Page: https://status.laserchat.app

---

**END OF DOCUMENT**

