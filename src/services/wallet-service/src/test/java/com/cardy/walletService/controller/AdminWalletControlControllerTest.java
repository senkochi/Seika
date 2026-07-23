package com.cardy.walletService.controller;

import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.security.JwtAuthenticationFilter;
import com.cardy.walletService.service.WalletService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringJUnitWebConfig(AdminWalletControlControllerTest.TestSecurityConfig.class)
class AdminWalletControlControllerTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private WalletService walletService;

    @BeforeEach
    void setUp() {
        reset(walletService);
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    private Authentication adminAuth() {
        return new UsernamePasswordAuthenticationToken(
                "admin-user-id",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }

    private Authentication studentAuth() {
        return new UsernamePasswordAuthenticationToken(
                "student-user-id",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_STUDENT")));
    }

    @Test
    void adminCanFreezeWallet() throws Exception {
        UUID userId = UUID.randomUUID();
        when(walletService.applyFreeze(eq(userId), any(), any(), any()))
                .thenReturn(Wallet.builder().userId(userId).frozen(true).build());

        String body = "{\"userId\":\"" + userId + "\",\"reason\":\"test freeze\"}";
        mockMvc.perform(post("/api/wallet/admin/freeze")
                        .with(authentication(adminAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        verify(walletService).applyFreeze(eq(userId), eq("test freeze"), any(), any());
    }

    @Test
    void adminCanUnfreezeWallet() throws Exception {
        UUID userId = UUID.randomUUID();
        when(walletService.removeFreeze(eq(userId), any(), any()))
                .thenReturn(Wallet.builder().userId(userId).frozen(false).build());

        String body = "{\"userId\":\"" + userId + "\",\"reason\":\"appeal accepted\"}";
        mockMvc.perform(post("/api/wallet/admin/unfreeze")
                        .with(authentication(adminAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        verify(walletService).removeFreeze(eq(userId), eq("appeal accepted"), any());
    }

    @Test
    void nonAdminIsForbiddenFromFreeze() throws Exception {
        UUID userId = UUID.randomUUID();
        String body = "{\"userId\":\"" + userId + "\",\"reason\":\"x\"}";
        mockMvc.perform(post("/api/wallet/admin/freeze")
                        .with(authentication(studentAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());

        verify(walletService, never()).applyFreeze(any(), any(), any(), any());
    }

    @Configuration
    @EnableWebMvc
    @EnableWebSecurity
    @EnableMethodSecurity(prePostEnabled = true)
    static class TestSecurityConfig {

        @Bean
        public WalletService walletService() {
            return mock(WalletService.class);
        }

        @Bean
        public JwtAuthenticationFilter jwtAuthenticationFilter() {
            return mock(JwtAuthenticationFilter.class);
        }

        @Bean
        public org.springframework.http.converter.json.MappingJackson2HttpMessageConverter jacksonMessageConverter(com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
            return new org.springframework.http.converter.json.MappingJackson2HttpMessageConverter(objectMapper);
        }

        @Bean
        public com.fasterxml.jackson.databind.ObjectMapper objectMapper() {
            return new com.fasterxml.jackson.databind.ObjectMapper();
        }

        @Bean
        public AdminWalletControlController adminWalletControlController(WalletService walletService) {
            return new AdminWalletControlController(walletService);
        }

        @Bean
        public org.springframework.security.web.SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
            http
                    .csrf(csrf -> csrf.disable())
                    .authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
            return http.build();
        }
    }
}