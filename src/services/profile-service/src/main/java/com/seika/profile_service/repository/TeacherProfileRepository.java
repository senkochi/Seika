package com.seika.profile_service.repository;

import com.seika.profile_service.enity.TeacherProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TeacherProfileRepository extends JpaRepository<TeacherProfile, String> {

    Optional<TeacherProfile> findByUserId(String userId);

    boolean existsByUserId(String userId);

    @Modifying
    @Query("UPDATE TeacherProfile t SET t.totalQuizCreated = t.totalQuizCreated + 1 WHERE t.userId = :userId")
    void incrementQuizCreated(@Param("userId") String userId);

    @Modifying
    @Query("UPDATE TeacherProfile t SET t.totalFlashcardsCreated = t.totalFlashcardsCreated + 1 WHERE t.userId = :userId")
    void incrementFlashcardsCreated(@Param("userId") String userId);

    @Modifying
    @Query("UPDATE TeacherProfile t SET t.totalStudentsReached = t.totalStudentsReached + 1 WHERE t.userId = :userId")
    void incrementStudentsReached(@Param("userId") String userId);
}

