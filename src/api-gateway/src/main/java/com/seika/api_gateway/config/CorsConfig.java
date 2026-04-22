package com.seika.api_gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {
    @Bean
    public CorsWebFilter corsWebFilter() { //Vì ta dùng Webflux(Non-blocking), nên phải dùng CorsWebFilter(của Reactive) thay vì CorsFilter(của MVC truyền thống)
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        corsConfiguration.setAllowedOrigins(List.of("http://localhost:5173"));
        corsConfiguration.setAllowedHeaders(List.of("Content-Type", "Authorization"));
        corsConfiguration.setAllowedMethods(List.of("GET", "POST","PATCH", "PUT", "DELETE"));
        corsConfiguration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource(); //Là đối tượng đóng vai trò lưu trữ và tra cứu các cấu hình CORS dựa trên đường dẫn (URL).
        source.registerCorsConfiguration("/**", corsConfiguration);
        //Phương thức registerCorsConfiguration() dùng để đăng ký cấu hình UrlBasedCorsConfigurationSource
        //Tham số /** cho phép ta áp dụng cấu hình corsConfiguration lên tất cả services trên hệ thống

        return new CorsWebFilter(source);
    }
}
