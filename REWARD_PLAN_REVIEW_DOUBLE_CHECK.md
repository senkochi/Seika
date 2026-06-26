Tôi đã đọc review của agent. Nhìn chung chất lượng review khá tốt (điểm khoảng **8.5–9/10**) nhưng có vài chỗ đang bị **over-engineering** hoặc áp dụng pattern doanh nghiệp quá sớm so với trạng thái hiện tại của Quizzy.

Tôi sẽ review lại từng điểm và **trả lời dứt điểm các câu hỏi để bạn có thể implement ngay**.

---

# 1. Có nên tạo Reward Service riêng không?

Agent đề xuất:

```text
Reward Service
↓
own LearningRewardLog
```

## Kết luận: CÓ — nhưng tạo kiểu lightweight

Tôi đồng ý.

Kiến trúc mới:

```text
API Gateway

Quiz
Flashcard
Wallet
Profile
Notification
Marketplace

Reward Service ← thêm
```

Reward Service chịu trách nhiệm:

```text
Reward Rule
Cooldown
Eligibility
LearningRewardLog
RewardGrantedEvent
```

KHÔNG chứa:

```text
coin
exp
wallet
profile
```

---

Cấu trúc:

```text
reward-service

controller/

consumer/

processor/

entity/

repository/

outbox/

config/
```

---

# 2. Reward Service có cần REST API không?

Agent đề xuất:

```text
tiny REST API
```

## Kết luận: KHÔNG

Không cần.

Hiện tại dùng:

```text
RabbitMQ only
```

Reward không phải user-facing.

---

Flow:

```text
QuizCompleted

↓

RabbitMQ

↓

Reward Service
```

---

# 3. Có nên thêm correlationId?

Agent đề xuất:

```text
rewardConfigVersion
correlationId
```

## Kết luận: CÓ — chỉ thêm correlationId

Không cần:

```text
rewardConfigVersion
```

quá sớm.

---

Thêm:

```json
{
 eventId,

 correlationId
}
```

Ví dụ:

```json
{
  "correlationId": "quiz-123-user-456"
}
```

---

# 4. Reward Processor có cần Outbox không?

Agent:

```text
Reward
↓
Outbox
↓
RewardGranted
```

## Kết luận: CÓ — bắt buộc

Bạn đang dùng:

```text
Inbox
Outbox
```

rồi.

Nên:

```text
Reward Service

consume

↓

save log

↓

write outbox

↓

ack
```

KHÔNG publish trực tiếp.

---

# 5. Wallet thành công nhưng Profile fail thì sao?

Agent đề xuất:

```text
Saga
2PC
```

## Kết luận: KHÔNG dùng Saga

Agent đang over-engineering.

Bạn chưa cần.

---

Dùng:

```text
eventual consistency
```

---

Flow:

```text
RewardGranted

↓

Wallet

↓

Profile
```

Nếu Profile fail:

```text
retry
```

---

Thêm:

```text
dead-letter queue
```

đủ.

KHÔNG cần:

```text
2PC
orchestrator
```

---

# 6. Passing Score xử lý ở đâu?

Agent hỏi.

## Kết luận:

QUIZ SERVICE.

---

Quiz:

```text
submit

↓

score

↓

passed=true

↓

publish
```

Event:

```json
{
 userId,

 quizId,

 passed:true
}
```

Reward không tự chấm.

---

# 7. Có cần GET reward/status không?

Agent:

```text
GET
/user/reward/status
```

## Kết luận: CÓ

Đây là chỗ tôi đồng ý.

Tạo:

```http
GET
/rewards/status
```

Request:

```text
type
itemId
```

Response:

```json
{
 eligible:false,

 nextEligibleAt:

 rewardCount
}
```

---

Frontend:

```text
Flashcard Detail
```

render:

```text
Available in 2 days
```

---

# 8. Notification i18n?

Agent:

```text
reward.granted
```

## Kết luận: KHÔNG cần

Hiện tại quá sớm.

Dùng:

```json
{
 title,

 body
}
```

là đủ.

Sau này mới i18n.

---

# 9. Có cần rate limit DeckCompleted?

Agent:

```text
limit/day
```

## Kết luận: KHÔNG

Cooldown đã đủ.

Không nên thêm.

---

# 10. Nên lưu LearningRewardLog ở DB nào?

Đây là câu quan trọng.

## Kết luận:

Reward Service → PostgreSQL

KHÔNG Mongo.

---

Entity:

```java
LearningRewardLog

id

userId

rewardType

itemId

rewardCount

lastRewardAt

createdAt
```

Index:

```sql
(user_id)

(user_id,reward_type)

(user_id,reward_type,item_id)
```

Unique:

```sql
UNIQUE(
user_id,
reward_type,
item_id
)
```

---

# 11. Cần sửa Event Payload

Hiện tại:

```json
{
 userId,
 quizId
}
```

Tôi chốt:

---

DeckCompletedEvent

```json
{
 eventId,

 correlationId,

 userId,

 deckId,

 completedAt
}
```

---

QuizCompletedEvent

```json
{
 eventId,

 correlationId,

 userId,

 quizId,

 passed,

 score,

 completedAt
}
```

---

RewardGrantedEvent

```json
{
 eventId,

 correlationId,

 userId,

 coins,

 exp,

 source,

 itemId
}
```

---

# 12. Reward values (tôi chốt luôn)

Flashcard:

```yaml
coin:20
exp:10
cooldown:3
```

Quiz:

```yaml
easy:
 coin:50
 exp:20

medium:
 coin:80
 exp:40

hard:
 coin:120
 exp:60

passing:70
```

---

# 13. Kế hoạch implement cuối cùng

## B1

Tạo:

```text
reward-service
```

---

## B2

DB:

```text
LearningRewardLog
Outbox
Inbox
```

---

## B3

Flashcard publish:

```text
DeckCompleted
```

---

## B4

Quiz publish:

```text
QuizCompleted
```

---

## B5

Reward consume.

Tính.

Ghi DB.

Publish:

```text
RewardGranted
```

---

## B6

Wallet consume.

```text
+coin
```

---

## B7

Profile consume.

```text
+exp
```

---

## B8

Notification consume.

Toast.

---

# Những câu hỏi đã được trả lời để implement

| Câu hỏi            | Quyết định     |
| ------------------ | -------------- |
| Reward Service?    | Có             |
| REST API?          | Không          |
| RewardLog ở đâu?   | Reward Service |
| Outbox?            | Có             |
| Saga?              | Không          |
| Passing score?     | Quiz Service   |
| Reward status API? | Có             |
| i18n?              | Chưa           |
| Rate limit?        | Không          |
| DB?                | PostgreSQL     |

Với các quyết định trên, bạn có thể bắt đầu implement mà không còn blocker kiến trúc nữa.
