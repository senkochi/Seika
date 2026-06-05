package com.seika.profile_service.enity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Entity
@Table(
    name = "game_profile",
    indexes = {
        @Index(name = "idx_game_profile_level", columnList = "level")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GameProfile {
    @Id
    String userId;
    long exp;
    int level;

    @Column(name = "current_streak")
    int currentStreak;

    @Column(name = "longest_streak")
    int longestStreak;

    @Column(name = "last_active_date")
    LocalDate lastActiveDate;
}
