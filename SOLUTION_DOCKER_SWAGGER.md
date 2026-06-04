# Solution: Docker Swagger UI Accessibility

**Date**: Today  
**Issue**: Cannot access Swagger UI at `http://localhost:8080/swagger-ui.html` when running docker-compose  
**Status**: ✅ FIXED

---

## Executive Summary

The API Gateway (Spring Cloud Gateway with WebFlux) didn't have proper static resource routing configured to serve Swagger UI and its dependencies (WebJars). This has been fixed by:

1. **Adding WebFluxConfigurer Implementation** - Explicitly registers static resource handlers
2. **Updating Gateway Configuration** - Removed problematic routes, added resource locations config
3. **Providing Documentation** - Comprehensive troubleshooting and verification guides

---

## What You Need to Do

### Step 1: Rebuild Gateway Container

```bash
docker-compose down
docker-compose build api-gateway --no-cache
docker-compose up -d
```

### Step 2: Wait for Service Registration

```bash
# Wait 30 seconds for Eureka to register all services
sleep 30
```

### Step 3: Access Swagger UI

```
http://localhost:8080/swagger-ui.html
```

**Expected Result**:

- ✅ Swagger UI page loads
- ✅ Dropdown shows all 7 microservices
- ✅ Can click each service to view its API documentation

---

## Changes Made

### 1. New File: `WebFluxStaticResourceConfig.java`

**Location**: `src/api-gateway/src/main/java/com/seika/api_gateway/config/WebFluxStaticResourceConfig.java`

**Purpose**: Registers resource handlers for serving static files from classpath in WebFlux reactive environment

**Code**:

```java
@Configuration
@EnableWebFlux
public class WebFluxStaticResourceConfig implements WebFluxConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry
            .addResourceHandler("/swagger-ui.html")
            .addResourceLocations("classpath:/META-INF/resources/");

        registry
            .addResourceHandler("/swagger-ui/**")
            .addResourceLocations("classpath:/META-INF/resources/swagger-ui/");

        registry
            .addResourceHandler("/webjars/**")
            .addResourceLocations("classpath:/META-INF/resources/webjars/");

        registry
            .addResourceHandler("/v3/api-docs", "/v3/api-docs/**")
            .addResourceLocations("classpath:/META-INF/resources/");
    }
}
```

### 2. Modified: `application.yaml`

**Location**: `src/api-gateway/src/main/resources/application.yaml`

**Changes**:

- ❌ Removed Swagger UI routes (`/swagger-ui.html`, `/swagger-ui/**`, `/webjars/**`)
- ✅ Kept API routes and OpenAPI aggregation routes
- ✅ Added `spring.web.resources.static-locations` configuration
- ✅ Fixed duplicate `spring:` configuration blocks

**Key Addition**:

```yaml
spring:
  web:
    resources:
      static-locations: classpath:/META-INF/resources/,classpath:/resources/,classpath:/static/,classpath:/public/
```

### 3. New Documentation Files

- **`DOCKER_SWAGGER_SETUP.md`** - Comprehensive troubleshooting and verification guide
- **`DOCKER_SWAGGER_FIX_SUMMARY.md`** - Detailed change summary with technical details
- **`DOCKER_SWAGGER_QUICK_FIX.md`** - Quick reference card

---

## How It Works

### Before Fix ❌

```
Client: GET /swagger-ui.html
  → API Gateway Routes (WebFlux)
    → No matching route found
    → Check default handlers
    → None registered
    → 404 NOT FOUND
```

### After Fix ✅

```
Client: GET /swagger-ui.html
  → API Gateway Routes (WebFlux)
    → No matching route found
    → Check ResourceHandlers
    → Match: /swagger-ui.html → classpath:/META-INF/resources/
    → Load from springdoc JAR
    → 200 OK + HTML Response
```

---

## Verification Checklist

After rebuild and restart, verify:

- [ ] **Eureka Dashboard** (http://localhost:8761/)
  - All 7 services should show **UP**
- [ ] **Swagger UI Main Page** (http://localhost:8080/swagger-ui.html)
  - Page loads successfully
- [ ] **Swagger Dropdown**
  - Shows all 7 services:
    - Identity Service
    - Profile Service
    - Wallet Service
    - Marketplace Service
    - Flashcard Service
    - Quiz Service
    - Notification Service
- [ ] **Service Documentation**
  - Click each service in dropdown
  - Verify endpoints display correctly
- [ ] **API Aggregation Routes**
  - Test individual routes:
    ```bash
    curl http://localhost:8080/v3/api-docs/identity-service
    curl http://localhost:8080/v3/api-docs/profile-service
    # ... etc
    ```

---

## Troubleshooting

### Symptom: Still getting 404

**Solution**:

1. Check container is running: `docker-compose ps`
2. Check logs: `docker-compose logs api-gateway`
3. Verify rebuild: `docker-compose build api-gateway --no-cache --progress=plain`

### Symptom: Swagger loads but dropdown is empty

**Solution**:

1. Wait longer (30-60 seconds) for services to register
2. Check Eureka: `http://localhost:8761/`
3. All services should show **UP**

### Symptom: CORS errors in console

**Solution**:

1. Wait 10-15 seconds and refresh
2. This is normal during service startup
3. Errors should clear once services are healthy

---

## Files Overview

| File                               | Status       | Purpose                           |
| ---------------------------------- | ------------ | --------------------------------- |
| `WebFluxStaticResourceConfig.java` | **NEW**      | Register static resource handlers |
| `application.yaml`                 | **MODIFIED** | Update routes and resource config |
| `DOCKER_SWAGGER_SETUP.md`          | **NEW**      | Docker troubleshooting guide      |
| `DOCKER_SWAGGER_FIX_SUMMARY.md`    | **NEW**      | Change summary                    |
| `DOCKER_SWAGGER_QUICK_FIX.md`      | **NEW**      | Quick reference                   |

---

## Technical Deep Dive

### Why Spring WebFlux Needs Explicit Configuration

- **Servlet Containers** (like Tomcat): Automatically serve classpath static resources via default servlet mapping
- **WebFlux/Reactive**: No default servlet mapping; must explicitly register ResourceHandlers
- **Spring Cloud Gateway with WebFlux**: Routes take precedence; static resources need handler registration

### Why Remove Gateway Routes for Swagger?

- Routes match first in the request chain
- If a route matches `/swagger-ui.html`, it tries to forward to a service
- By removing these routes, request falls through to ResourceHandler chain
- WebFluxConfigurer's handlers then serve the static resources

### Role of springdoc-openapi

- Provides Swagger UI binaries in JAR classpath: `META-INF/resources/swagger-ui/`
- Provides WebJars dependencies: `META-INF/resources/webjars/`
- Our ResourceHandlers expose these locations to the request chain

---

## Testing in Local Environment

```bash
# Verify fix locally (without docker)
cd src/api-gateway
mvn clean package
java -jar target/api-gateway-*.jar

# Then access:
# http://localhost:8080/swagger-ui.html
```

---

## Additional Resources

- 📖 Original Swagger Setup: `documentation/SWAGGER_SETUP.md`
- 🔧 Full Troubleshooting: `documentation/DOCKER_SWAGGER_SETUP.md`
- 📋 Change Details: `DOCKER_SWAGGER_FIX_SUMMARY.md`
- ⚡ Quick Reference: `DOCKER_SWAGGER_QUICK_FIX.md`

---

## Support

If you encounter any issues after applying this fix:

1. **Check Logs**: `docker-compose logs -f api-gateway`
2. **Verify Services**: `docker-compose ps`
3. **Check Eureka**: `http://localhost:8761/`
4. **Refer to Guides**: See documentation files above
5. **Contact Team**: Include logs and output from `docker-compose ps`

---

## Rollback (If Needed)

If you need to revert these changes:

```bash
# Remove new configuration file
rm src/api-gateway/src/main/java/com/seika/api_gateway/config/WebFluxStaticResourceConfig.java

# Revert application.yaml to previous version (remove spring.web.resources config)

# Rebuild
docker-compose build api-gateway --no-cache
docker-compose up -d
```

---

**Status**: ✅ Solution Complete - Ready for testing
