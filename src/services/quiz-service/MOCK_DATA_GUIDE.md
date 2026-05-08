# Mock Data Testing Guide - Quiz Service

## Tổng Quan

Mock data đã được tạo để hỗ trợ testing toàn bộ các loại quiz trong quiz-service mà không cần kết nối database.

## Files Tạo Ra

### 1. **QuizMockData.java**
📁 `/src/main/java/com/seika/quiz_service/constant/data/QuizMockData.java`

File chứa tất cả mock data với các phương thức helper:
- `createMockMultipleChoiceQuiz()` - Tạo 1 multiple choice quiz
- `createMockFillInBlankQuiz()` - Tạo 1 fill in blank quiz
- `createMockMatchingQuiz()` - Tạo 1 matching quiz
- `createMockReorderQuiz()` - Tạo 1 reorder quiz
- `getAllMockQuizzes()` - Lấy tất cả mock data (8 quizzes)
- `getMockQuizzesByType(String type)` - Lấy quizzes theo loại
- `getMockQuizById(String id)` - Lấy 1 quiz theo ID

### 2. **MockDataController.java**
📁 `/src/main/java/com/seika/quiz_service/controller/MockDataController.java`

REST endpoints để test mock data qua HTTP:

```
GET /api/v1/dev/mock/quizzes                     - Lấy tất cả mock quizzes
GET /api/v1/dev/mock/quizzes/{id}                - Lấy quiz theo ID
GET /api/v1/dev/mock/quizzes/type/{type}         - Lấy quizzes theo loại
GET /api/v1/dev/mock/multiple-choice             - Lấy multiple choice quizzes
GET /api/v1/dev/mock/fill-in-blank               - Lấy fill in blank quizzes
GET /api/v1/dev/mock/matching                    - Lấy matching quizzes
GET /api/v1/dev/mock/reorder                     - Lấy reorder quizzes
```

### 3. **QuizMockDataTest.java**
📁 `/src/test/java/com/seika/quiz_service/QuizMockDataTest.java`

Unit tests cho mock data (11 test cases)

### 4. **MockDataControllerTest.java**
📁 `/src/test/java/com/seika/quiz_service/controller/MockDataControllerTest.java`

Integration tests cho controller (10 test cases)

---

## Cách Sử Dụng

### 1️⃣ **Sử dụng trong Unit Tests**

```java
import com.seika.quiz_service.constant.data.QuizMockData;

@Test
public void testQuizProcessing() {
    // Lấy 1 quiz cụ thể
    MultipleChoiceQuiz quiz = QuizMockData.createMockMultipleChoiceQuiz();
    
    // Hoặc lấy tất cả
    List<BaseQuiz> allQuizzes = QuizMockData.getAllMockQuizzes();
    
    // Hoặc lấy theo loại
    List<?> mcQuizzes = QuizMockData.getMockQuizzesByType("MULTIPLE_CHOICE");
    
    // Hoặc lấy theo ID
    Optional<BaseQuiz> quiz = QuizMockData.getMockQuizById("625f5d7b4c3f1a2b9c8d7e6f");
}
```

### 2️⃣ **Sử dụng qua REST API (Development)**

Chạy application và gọi các endpoint:

```bash
# Lấy tất cả mock quizzes
curl http://localhost:8080/api/v1/dev/mock/quizzes

# Lấy multiple choice quizzes
curl http://localhost:8080/api/v1/dev/mock/multiple-choice

# Lấy quiz theo loại
curl http://localhost:8080/api/v1/dev/mock/quizzes/type/MATCHING

# Lấy quiz theo ID
curl http://localhost:8080/api/v1/dev/mock/quizzes/625f5d7b4c3f1a2b9c8d7e6f
```

### 3️⃣ **Chạy Tests**

```bash
# Chạy tất cả tests
mvn test

# Chạy chỉ mock data tests
mvn test -Dtest=QuizMockDataTest

# Chạy chỉ controller tests
mvn test -Dtest=MockDataControllerTest
```

---

## Mock Data Structure

### Multiple Choice Quiz (2 instances)
- **ID**: `625f5d7b4c3f1a2b9c8d7e6f`, `625f5d7b4c3f1a2b9c8d7e70`
- **Questions**: Geography, Astronomy
- **Options**: 4 options mỗi cái
- **Correct Answer**: Index based (0-3)

### Fill in Blank Quiz (2 instances)
- **ID**: `625f5d7b4c3f1a2b9c8d7e71`, `625f5d7b4c3f1a2b9c8d7e72`
- **Questions**: Geography, Chemistry
- **Accepted Answers**: Multiple variations (e.g., "China", "china")

### Matching Quiz (2 instances)
- **ID**: `625f5d7b4c3f1a2b9c8d7e73`, `625f5d7b4c3f1a2b9c8d7e74`
- **Pairs**: Country-Capital, Animal-Sounds
- **Format**: Map<String, String>

### Reorder Quiz (2 instances)
- **ID**: `625f5d7b4c3f1a2b9c8d7e75`, `625f5d7b4c3f1a2b9c8d7e76`
- **Sequences**: Tea preparation, Size order
- **Format**: List<String>

---

## Thông Tin Quan Trọng

- ✅ **Total Mock Quizzes**: 8 (2 of each type)
- ✅ **Test Cases**: 21 (11 unit + 10 integration)
- ✅ **All with realistic data**: Timestamps, creators, IDs
- ⚠️ **Remove MockDataController in production** (chỉ dùng cho development)
- ⚠️ **Use QuizMockData directly in tests** (không phụ thuộc MongoDB)

---

## Ví Dụ Response JSON

### Multiple Choice Response
```json
{
  "code": 200,
  "message": "Mock multiple choice quizzes",
  "data": [
    {
      "id": "625f5d7b4c3f1a2b9c8d7e6f",
      "questionText": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correctOptionIndex": 2,
      "createdBy": "user123",
      "type": "MULTIPLE_CHOICE",
      "createdAt": "2026-05-03T...",
      "updatedAt": "2026-05-06T..."
    }
  ]
}
```

### Matching Response
```json
{
  "code": 200,
  "message": "Mock matching quizzes",
  "data": [
    {
      "id": "625f5d7b4c3f1a2b9c8d7e73",
      "questionText": "Match countries with their capitals",
      "matchingPairs": {
        "France": "Paris",
        "Japan": "Tokyo",
        "Brazil": "Brasília",
        "Egypt": "Cairo"
      },
      "createdBy": "user202",
      "type": "MATCHING"
    }
  ]
}
```

---

## Next Steps

1. ✅ Chạy tests: `mvn test`
2. ✅ Chạy application: `mvn spring-boot:run`
3. ✅ Test endpoints với Postman hoặc curl
4. ✅ Sử dụng mock data trong service tests
5. 🔄 Bỏ MockDataController khi deploy production

---

**Last Updated**: May 8, 2026
**Status**: Ready for Testing
