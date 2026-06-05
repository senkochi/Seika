package com.seika.profile_service.repository;

import com.seika.profile_service.enity.GameProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GameProfileRepository extends JpaRepository<GameProfile, String> {
	boolean existsByUserId(String userId);

	Optional<GameProfile> findByUserId(String userId);
}
