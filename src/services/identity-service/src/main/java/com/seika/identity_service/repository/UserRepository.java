package com.seika.identity_service.repository;

import com.seika.identity_service.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByRoles_Name(String roleName);

    Page<User> findByRoles_Name(String roleName, Pageable pageable);

    java.util.List<User> findByRoles_Name(String roleName);

    long countByRoles_Name(String roleName);

    long countByEnabled(Boolean enabled);
}