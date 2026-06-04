# Docker Swagger UI Fix - Change Summary

## Problem

Users cannot access Swagger UI at `http://localhost:8080/swagger-ui.html` when running the application with docker-compose.

## What Was Fixed

### 1. **Created WebFluxStaticResourceConfig.java** ✅

A new configuration class that explicitly registers static resource handlers for the Spring Cloud Gateway WebFlux environment.

**File**: `src/api-gateway/src/main/java/com/seika/api_gateway/config/WebFluxStaticResourceConfig.java`

**What it does**:

- Registers `/swagger-ui.html` handler to serve Swagger UI main page from classpath
- Registers `/swagger-ui/**` handler to serve Swagger UI static resources
- Registers `/webjars/**` handler to serve JavaScript/CSS dependencies
- Registers `/v3/api-docs` handlers for OpenAPI specification access

**Why needed**: Spring Cloud Gateway with WebFlux (reactive) doesn't automatically serve classpath static resources. Must explicitly register them.

### 2. **Updated Gateway Route Configuration** ✅

Modified `src/api-gateway/src/main/resources/application.yaml`

**Changes**:

- ❌ Removed: Problematic Swagger UI routes that were blocking static resources
- ✅ Kept: All API routes and OpenAPI aggregation routes (working as intended)
- ✅ Added: `spring.web.resources.static-locations` configuration
- ✅ Fixed: Merged duplicate `spring:` configuration blocks (YAML structure issue)

**Result**: Gateway routes no longer interfere with springdoc's static resource serving.

### 3. **Created Documentation** ✅

New comprehensive troubleshooting guide for Docker deployment.

**File**: `documentation/DOCKER_SWAGGER_SETUP.md`

**Includes**:

- Problem explanation and root cause analysis
- Solution architecture
- Step-by-step verification procedures
- Troubleshooting for common issues
- Tips for accessing from remote machines
- File modification summary

## How to Apply

### Option 1: Rebuild Docker (Recommended)

```bash
# Stop existing containers
docker-compose down

# Rebuild the gateway image with new configuration
docker-compose build api-gateway --no-cache

# Start all services
docker-compose up -d

# Wait for services to register (30 seconds)
sleep 30

# Access Swagger UI
open http://localhost:8080/swagger-ui.html
```

### Option 2: Manual Verification

If services are already running:

1. Copy the new `WebFluxStaticResourceConfig.java` to your IDE
2. Wait for recompilation
3. Restart gateway container: `docker-compose restart api-gateway`
4. Wait another 10-15 seconds
5. Try accessing Swagger UI

## Verification Steps

✅ **Step 1**: Check Services are registered in Eureka

```bash
# Open in browser
http://localhost:8761/

# Should see all 7 services listed
```

✅ **Step 2**: Access Swagger UI

```bash
# Open in browser
http://localhost:8080/swagger-ui.html

# Should show dropdown with all 7 services
```

✅ **Step 3**: Test one service's docs

```bash
# Click dropdown and select any service
# Should see that service's API endpoints and operations
```

## Technical Details

### Why This Works

1. **WebFluxConfigurer Implementation**: Provides hooks to customize WebFlux configuration
2. **ResourceHandlerRegistry**: Explicitly maps URL patterns to classpath locations
3. **Route Order**: By removing static resource routes from gateway routes, springdoc handlers get invoked
4. **Classpath Locations**: Springdoc library provides resources in `META-INF/resources/` which we register

### What Happens When You Access `/swagger-ui.html`

```
Client Request: GET /swagger-ui.html
    ↓
Spring Cloud Gateway (WebFlux)
    ↓
Check registered routes → No match
    ↓
Check registered handlers (ResourceHandlerRegistry)
    ↓
Match: /swagger-ui.html → classpath:/META-INF/resources/
    ↓
Load HTML from springdoc JAR
    ↓
Response: Swagger UI HTML + references to /swagger-ui/**, /webjars/**
    ↓
Browser loads Swagger UI resources using same handler chain
```

## Files Modified Summary

| File                               | Change   | Reason                                    |
| ---------------------------------- | -------- | ----------------------------------------- |
| `WebFluxStaticResourceConfig.java` | **NEW**  | Enable static resource serving in WebFlux |
| `application.yaml`                 | Modified | Fix routes and add resource locations     |
| `DOCKER_SWAGGER_SETUP.md`          | **NEW**  | Docker-specific troubleshooting guide     |

## Common Issues After Fix

### Still showing 404 on Swagger UI?

1. Ensure gateway container restarted successfully: `docker-compose ps api-gateway`
2. Check logs: `docker-compose logs -f api-gateway`
3. Try full rebuild: `docker-compose build api-gateway --no-cache && docker-compose up -d`

### Swagger loads but no services in dropdown?

1. Wait 30+ seconds for Eureka registration
2. Check Eureka: `http://localhost:8761/`
3. All 7 services should show `UP` status

### Getting CORS errors?

1. This is expected during service discovery
2. Wait 10 more seconds and refresh browser
3. If persists, check service health in Eureka

## Rollback (If Needed)

If you need to rollback:

1. Remove `WebFluxStaticResourceConfig.java`
2. Revert gateway `application.yaml` to previous version
3. Rebuild and restart: `docker-compose build api-gateway && docker-compose up -d api-gateway`

## Questions or Issues?

Refer to `documentation/DOCKER_SWAGGER_SETUP.md` for comprehensive troubleshooting or contact the team.
