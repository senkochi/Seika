package com.seika.profile_service.enity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(
    name = "teacher_profile",
    indexes = {
        @Index(name = "idx_teacher_profile_user_id", columnList = "user_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TeacherProfile {

    @Id
    @Column(name = "user_id")
    String userId;

    @Column(name = "total_quiz_created", nullable = false)
    @Builder.Default
    int totalQuizCreated = 0;

    @Column(name = "total_flashcards_created", nullable = false)
    @Builder.Default
    int totalFlashcardsCreated = 0;

    @Column(name = "total_students_reached", nullable = false)
    @Builder.Default
    int totalStudentsReached = 0;
}

