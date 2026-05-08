# Standard Response Wrapper - Quiz Service Implementation Guide

## Overview
Các Response Wrapper classes đã được implement vào quiz_service để standardize tất cả API responses.

## Files Created

### 1. Response Wrappers (shared/)
- **ApiResponse.java** - Standard API response wrapper cho tất cả responses
- **PagedResponse.java** - Wrapper cho paginated responses

### 2. Custom Exceptions (exception/)
- **QuizServiceException.java** - Base exception class
- **ResourceNotFoundException.java** - Khi resource không tồn tại (404)
- **InvalidRequestException.java** - Khi request không hợp lệ (400)
- **UnauthorizedException.java** - Khi user không xác thực (401)
- **ForbiddenException.java** - Khi user không có quyền (403)

### 3. Global Handler (config/)
- **GlobalExceptionHandler.java** - Xử lý tất cả exceptions và convert thành standardized responses

---

## Usage Examples

### 1. Success Response
```java
@RestController
@RequestMapping("/api/v1/quizzes")
@Slf4j
@RequiredArgsConstructor
public class QuizController {
    private final QuizService quizService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuizResponse>> getById(@PathVariable String id) {
        log.info("Fetching quiz with id: {}", id);
        QuizResponse response = quizService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
```

### 2. Created Response (POST)
```java
    @PostMapping
    public ResponseEntity<ApiResponse<QuizResponse>> create(
            @Valid @RequestBody QuizRequest request) {
        log.info("Creating new quiz: {}", request.getTitle());
        QuizResponse response = quizService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }
```

### 3. Paginated Response
```java
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<QuizResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Fetching quizzes - page: {}, size: {}", page, size);
        PagedResponse<QuizResponse> response = quizService.getAll(page, size);
        return ResponseEntity.ok(ApiResponse.success(response, "Quiz list"));
    }
```

### 4. No Content Response (DELETE)
```java
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        log.info("Deleting quiz with id: {}", id);
        quizService.delete(id);
        return ResponseEntity.noContent().build();
    }
```

### 5. Custom Error Messages
```java
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuizResponse>> getById(@PathVariable String id) {
        log.info("Fetching quiz with id: {}", id);
        
        QuizResponse response = quizService.getById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Quiz", id));
        
        return ResponseEntity.ok(ApiResponse.success(response, "Quiz found"));
    }
```

---

## Response Formats

### Success Response (200)
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": "123",
    "title": "Sample Quiz",
    ...
  },
  "timestamp": "2024-05-07T10:30:00"
}
```

### Created Response (201)
```json
{
  "code": 201,
  "message": "Created",
  "data": {
    "id": "123",
    "title": "Sample Quiz",
    ...
  },
  "timestamp": "2024-05-07T10:30:00"
}
```

### Paginated Response (200)
```json
{
  "code": 200,
  "message": "Quiz list",
  "data": {
    "content": [
      {
        "id": "123",
        "title": "Sample Quiz"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 100,
    "totalPages": 10,
    "isLast": false,
    "timestamp": "2024-05-07T10:30:00"
  },
  "timestamp": "2024-05-07T10:30:00"
}
```

### Error Response (4xx/5xx)
```json
{
  "code": 404,
  "message": "Quiz with ID 123 not found",
  "data": null,
  "timestamp": "2024-05-07T10:30:00"
}
```

---

## Exception Handling

Tất cả exceptions sẽ được tự động handle bởi GlobalExceptionHandler:

```java
// This will automatically return:
// {
//   "code": 404,
//   "message": "Quiz with ID 123 not found",
//   "data": null,
//   "timestamp": "..."
// }
throw new ResourceNotFoundException("Quiz", "123");

// This will automatically return:
// {
//   "code": 400,
//   "message": "Title must not be blank",
//   "data": null,
//   "timestamp": "..."
// }
throw new InvalidRequestException("Title must not be blank");

// This will automatically return:
// {
//   "code": 401,
//   "message": "User not authenticated",
//   "data": null,
//   "timestamp": "..."
// }
throw new UnauthorizedException("User not authenticated");

// This will automatically return:
// {
//   "code": 403,
//   "message": "User does not have permission",
//   "data": null,
//   "timestamp": "..."
// }
throw new ForbiddenException("User does not have permission");
```

---

## Integration Checklist

- [ ] Import ApiResponse in controllers
- [ ] Import PagedResponse for paginated endpoints
- [ ] Import custom exceptions where needed
- [ ] Wrap all endpoint responses with ApiResponse
- [ ] Use PagedResponse.of(page) for paginated results
- [ ] Throw appropriate exceptions in service layer
- [ ] Add @Slf4j annotation to controllers/services
- [ ] Test exception handling works correctly

---

## Next Steps

1. Update existing QuizController to use ApiResponse wrapper
2. Create DTOs (Request/Response) if not already exist
3. Implement Service layer with proper exception handling
4. Add validation annotations to DTOs
5. Test all endpoints with Postman or similar tool
6. Apply same pattern to other services

---

**Status**: Ready for implementation
**Date Created**: 2024-05-07
