# Task 7 — R-8 profile-service teacher-tier consumer skips stale events

## Where this fits

Task 7 of 10. Plan: `/home/cuongnh/Projects/Seika/docs/superpowers/plans/2026-07-17-teacher-tiered-economy-v3-remediation.md`. Tasks 1-6 are complete.

## Goal

Add per-teacher event-id idempotency to the `teacher.tier.updated` consumer so out-of-order redelivery doesn't step the tier backwards (e.g. ELITE overwritten by stale GOLD).

## Read these files first

- `/home/cuongnh/Projects/Seika/src/services/profile-service/src/main/java/com/seika/profile_service/consumer/TeacherStatsConsumer.java` — the listener method `handleTeacherTierUpdated` at lines 92-121.
- `/home/cuongnh/Projects/Seika/src/services/profile-service/src/main/java/com/seika/profile_service/enity/TeacherProfile.java` — entity (note: folder is misspelled `enity/`, not `entity/`; verify).
- `/home/cuongnh/Projects/Seika/src/services/profile-service/src/main/java/com/seika/profile_service/event/TeacherTierUpdatedEvent.java` — verify `getEventId()` exists.
- `/home/cuongnh/Projects/Seika/src/services/profile-service/src/main/java/com/seika/profile_service/repository/TeacherProfileRepository.java` — confirm `save` and `findByUserId`.
- `/home/cuongnh/Projects/Seika/src/services/profile-service/src/test/java/com/seika/profile_service/consumer/TeacherStatsConsumerTest.java` — existing test style.
- Check whether the project uses Flyway: `ls src/services/profile-service/src/main/resources/db/migration/`. If yes, follow the next-migration-number convention. If no, the project relies on Hibernate `ddl-auto: update`.

## What R-8 is

The `handleTeacherTierUpdated` listener applies the event unconditionally. If RabbitMQ redelivers an old message after a newer one has already arrived (e.g. broker hiccup, channel restart), the older tier can overwrite the newer one — student sees "ELITE" briefly, then "GOLD" again, then a stale rating.

## What the fix must do

### A. Schema

Add a `last_processed_event_id` column to `teacher_profile`:

```sql
ALTER TABLE teacher_profile
    ADD COLUMN last_processed_event_id VARCHAR(64);
```

If the project has Flyway, create `V<next>__teacher_profile_last_event_id.sql`. If it relies on `ddl-auto: update`, just add the field to the entity — Hibernate will create the column on next boot.

### B. Entity

Add to `TeacherProfile.java`:
```java
@Column(name = "last_processed_event_id", length = 64)
private String lastProcessedEventId;
```
With the matching Lombok getter/setter (if `@Getter @Setter` are on the class, the field generates them; otherwise add manually).

### C. Event

Verify `TeacherTierUpdatedEvent` exposes `getEventId()`. If not, add:
```java
private String eventId;
```
With Lombok getter/setter. Set the field from the producer side (search where the event is published and add the `eventId`).

### D. Consumer

Update `handleTeacherTierUpdated` so that:
1. After loading the existing `TeacherProfile`, compare `event.getEventId()` to `teacherProfile.getLastProcessedEventId()`.
2. If `incoming != null && !incoming.isBlank() && current != null && !current.isBlank() && incoming.compareTo(current) < 0` → log and return without applying.
3. After applying (success path), set `teacherProfile.setLastProcessedEventId(event.getEventId())` and save.

Match the existing event-handling style — the current handler already does early-return validation for missing teacherId / tier.

### E. Tests

Append to `TeacherStatsConsumerTest.java`:

1. `teacherTierUpdatedSkipsStaleEventId` — pre-seed a TeacherProfile with `lastProcessedEventId = "EVT-99"` and tier "ELITE"; send an event with `eventId = "EVT-50"` (lexicographically less) and tier "GOLD"; assert the save was NEVER called and the profile is still ELITE.

## TDD / verify

```bash
./src/services/profile-service/mvnw -pl src/services/profile-service -am test \
  -Dtest=TeacherStatsConsumerTest
```
Expected: existing + new tests pass.

## DO NOT COMMIT

Leave changes un-staged on disk.

## Required output

Write full report to `/home/cuongnh/Projects/Seika/.superpowers/sdd/reports/task-7-report.md`:
- Status: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED
- Files modified / created (absolute paths)
- Test commands + exact result lines
- Decisions made (Flyway vs ddl-auto)
- Reply with: status, one-line test summary, concerns.