# Reward System – Coins & EXP for Flashcards & Quizzes (Event-Driven Version)

## Goal

Xây dựng hệ thống thưởng (Reward System) cho nền tảng học tập nhằm:

- Thưởng **Coin** và **EXP** cho Student khi hoàn thành Flashcard hoặc Quiz.
- Chống hành vi farm phần thưởng.
- Tách biệt trách nhiệm giữa Wallet và Profile theo kiến trúc microservice hiện tại.
- Sử dụng Event-Driven Architecture thay vì để Frontend gọi API nhận thưởng.

---

# Current Architecture Context

```text
Client
↓
API Gateway

├── Identity Service
├── Profile Service
├── Quiz Service
├── Flashcard Service
├── Wallet Service
├── Marketplace Service
└── Notification Service

RabbitMQ
↑
Outbox / Inbox / Command Processor
```

Quy ước ownership:

```text
Wallet Service
→ coin
→ transaction

Profile Service
→ exp
→ level
→ streak

Quiz Service
→ submission
→ completion

Flashcard Service
→ learning progress
```

---

# Reward Rules

## Flashcard Reward

Điều kiện:

- Hoàn thành toàn bộ Deck
- Chỉ nhận thưởng tối đa 1 lần trong khoảng cooldown

Mặc định:

```yaml
coin: 20
exp: 10
cooldown: 3 days
```

Ví dụ:

```text
01/07
Complete Deck
→ +20 coin
→ +10 exp

02/07
Complete lại
→ Không thưởng

04/07
Complete lại
→ Thưởng tiếp
```

---

## Quiz Reward

Điều kiện:

- Chỉ thưởng lần đầu tiên đạt yêu cầu

Mặc định:

```yaml
coin: 100
exp: 50
passing_score: 70
```

Ví dụ:

```text
Attempt 1
Score=80
→ Reward

Attempt 2
Score=95
→ No reward
```

---

# Business Events

## Flashcard

```text
DeckCompletedEvent
```

Payload:

```json
{
  "userId": "...",
  "deckId": "...",
  "completedAt": "..."
}
```

---

## Quiz

```text
QuizCompletedEvent
```

Payload:

```json
{
  "userId": "...",
  "quizId": "...",
  "score": 85,
  "completedAt": "..."
}
```

---

## Reward

```text
RewardGrantedEvent
```

Payload:

```json
{
  "userId": "...",
  "coins": 100,
  "exp": 50,
  "source": "QUIZ",
  "itemId": "..."
}
```

---

# Proposed Service Changes

## Flashcard Service

Responsibilities:

- Xác định Deck hoàn thành
- Publish DeckCompletedEvent

Không:

```text
Không cộng coin
Không cộng exp
```

Flow:

```text
Student
↓

Complete Deck

↓

DeckCompletedEvent
```

---

## Quiz Service

Responsibilities:

- Chấm điểm
- Xác định Passed
- Publish QuizCompletedEvent

Không:

```text
Không xử lý reward
```

---

## Message Processor

Tạo processor mới:

```text
Reward Processor
```

Responsibilities:

- Consume DeckCompletedEvent
- Consume QuizCompletedEvent
- Kiểm tra điều kiện nhận thưởng
- Publish RewardGrantedEvent

---

## Reward Storage

Tạo bảng:

### LearningRewardLog

```sql
id

user_id

reward_type

item_id

reward_count

last_reward_at

created_at
```

Constraint:

```sql
UNIQUE(
user_id,
reward_type,
item_id
)
```

Mục đích:

- chống nhận thưởng trùng
- cooldown
- audit

---

## Wallet Service

Consume:

```text
RewardGrantedEvent
```

Action:

```text
increase balance

create transaction
```

Transaction:

```text
type=REWARD
```

Ví dụ:

```text
+100 coin
```

---

## Profile Service

Consume:

```text
RewardGrantedEvent
```

Action:

```text
increase exp

recalculate level
```

Ví dụ:

```text
level = floor(sqrt(exp/100))
```

---

## Notification Service

Consume:

```text
RewardGrantedEvent
```

Action:

Tạo notification:

```text
You earned 100 Coins and 50 EXP
```

---

# Reward Flow

## Flashcard

```text
Student

↓

Flashcard Service

↓

DeckCompletedEvent

↓

Reward Processor

↓

RewardGrantedEvent

↓

Wallet
(+coin)

↓

Profile
(+exp)

↓

Notification
```

---

## Quiz

```text
Student

↓

Quiz Service

↓

QuizCompletedEvent

↓

Reward Processor

↓

RewardGrantedEvent

↓

Wallet

↓

Profile

↓

Notification
```

---

# Configuration

application.yml

```yaml
reward:
  flashcard:
    coins: 20
    exp: 10
    cooldown-days: 3

  quiz:
    coins: 100
    exp: 50
    passing-score: 70
```

---

# Frontend Changes

Không gọi:

```http
POST /reward
```

Frontend chỉ:

## Student Dashboard

Hiển thị:

```text
Coin
EXP
Level
```

---

## Quiz Screen

Lắng nghe:

```text
RewardGranted
```

Hiển thị:

```text
+100 Coins
+50 EXP
```

---

## Flashcard Screen

Hiển thị:

```text
Next reward available in X days
```

---

# Concurrency & Safety

Bắt buộc:

- DB Transaction
- Inbox Pattern
- Outbox Pattern
- Idempotent Consumer
- Unique Constraint

Mục tiêu:

```text
double click
↓

không nhận thưởng 2 lần
```

---

# Verification Plan

## Unit

- cooldown
- first quiz reward

## Integration

- publish event
- wallet update
- profile update

## E2E

Scenario:

```text
Complete Flashcard
↓

Reward

↓

Retry

↓

No Reward

↓

After 3 days

↓

Reward Again
```

## Load

100 requests đồng thời cho cùng user.

Kết quả:

```text
1 reward
```

---

# Success Criteria

Student:

- nhận coin đúng
- nhận exp đúng

Teacher:

- không bị ảnh hưởng

System:

- không farm được
- không duplicate reward
- event hoạt động ổn định

```

```
