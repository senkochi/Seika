# Docker Swagger UI Setup Guide

## Problem

When running the application with `docker-compose`, users cannot access Swagger UI at `http://localhost:8080/swagger-ui.html`.

## Root Cause

The API Gateway (Spring Cloud Gateway with WebFlux) did not have proper static resource routing configured for Swagger UI and WebJars dependencies. Additionally, the gateway routes were catching all requests before springdoc could serve static resources.

## Solution Implemented

### 1. WebFlux Static Resource Configuration

Added `WebFluxStaticResourceConfig.java` to explicitly register resource handlers for:

- `/swagger-ui.html` - Main Swagger UI page
- `/swagger-ui/**` - Swagger UI static resources
- `/webjars/**` - JavaScript/CSS dependencies for Swagger UI
- `/v3/api-docs` - OpenAPI definition endpoints

**File**: `src/api-gateway/src/main/java/com/seika/api_gateway/config/WebFluxStaticResourceConfig.java`

This ensures that Swagger UI resources are properly served from the gateway's classpath in the WebFlux reactive environment.

### 2. Gateway Route Order

Removed problematic Swagger UI routes from the route definitions. Now:

- API routes (service-specific routes)
- OpenAPI aggregation routes (`/v3/api-docs/{service-name}`)
- **No explicit static resource routes** - springdoc handles these automatically with the WebFlux config

This allows requests to static resources to be processed by the WebFlux static resource handler instead of being captured by gateway routes.

### 3. Application Configuration

Updated `src/api-gateway/src/main/resources/application.yaml`:

- Merged duplicate `spring:` configuration blocks
- Added `spring.web.resources.static-locations` to specify classpath locations
- Removed non-standard `spring.webflux.static-path-pattern` configuration

## How to Verify

### Prerequisites

Ensure all services are running:

```bash
docker-compose up -d
```

### Step 1: Check Services are Registered

Wait 10-15 seconds for services to register with Eureka. Then access:

```
http://localhost:8761/
```

Verify all 7 services appear in the Eureka UI:

- IDENTITY-SERVICE
- PROFILE-SERVICE
- WALLET-SERVICE
- MARKETPLACE-SERVICE
- FLASHCARD-SERVICE
- QUIZ-SERVICE
- NOTIFICATION-SERVICE

### Step 2: Access Swagger UI

Once services are registered, access the central Swagger UI:

```
http://localhost:8080/swagger-ui.html
```

You should see:

1. A dropdown menu in the top-right labeled "Select a spec"
2. All 7 microservices listed in the dropdown

### Step 3: Verify Swagger Docs

1. Click on each service in the dropdown to verify their API documentation loads
2. Try expanding endpoints to see operation details
3. Check that parameters, request bodies, and responses display correctly

### Step 4: Test API Aggregation

The gateway aggregates OpenAPI docs at:

```
http://localhost:8080/v3/api-docs/identity-service
http://localhost:8080/v3/api-docs/profile-service
http://localhost:8080/v3/api-docs/wallet-service
http://localhost:8080/v3/api-docs/marketplace-service
http://localhost:8080/v3/api-docs/flashcard-service
http://localhost:8080/v3/api-docs/quiz-service
http://localhost:8080/v3/api-docs/notification-service
```

You can also get the gateway's internal API docs at:

```
http://localhost:8080/v3/api-docs
```

## Accessing from Docker Host

If accessing from a machine different from where docker-compose runs:

- **From same machine**: `http://localhost:8080/swagger-ui.html`
- **From different machine**: Replace `localhost` with the Docker host IP (e.g., `http://192.168.1.100:8080/swagger-ui.html`)

## Common Issues and Troubleshooting

### Issue: "404 Not Found" on /swagger-ui.html

**Cause**: Gateway container crashed or routes are still blocking static resources.

**Solution**:

1. Check gateway logs: `docker logs seika-api-gateway-1` (or your container name)
2. Ensure WebFluxStaticResourceConfig is properly compiled
3. Rebuild container: `docker-compose build api-gateway && docker-compose up -d api-gateway`

### Issue: Swagger UI loads but dropdown is empty

**Cause**: Services not yet registered with Eureka.

**Solution**:

1. Wait 30+ seconds for services to start
2. Check Eureka: `http://localhost:8761/`
3. Look for services in Eureka before trying Swagger dropdown

### Issue: Swagger UI loads but clicking service endpoints shows errors

**Cause**: CORS issues or service communication problems.

**Solution**:

1. Check browser console for CORS errors
2. Verify services are healthy: `docker-compose ps`
3. Check gateway logs for routing errors: `docker logs seika-api-gateway-1`

### Issue: Cannot access any endpoint from within Docker

**Cause**: Host connectivity issue or port mapping problem.

**Solution**:

1. Verify port is exposed: `docker-compose ps` (should show `0.0.0.0:8080->8080`)
2. Test connectivity: `curl http://localhost:8080/swagger-ui.html`
3. If using remote Docker (WSL, VM), ensure port forwarding is configured

## Files Modified

1. **src/api-gateway/src/main/java/com/seika/api_gateway/config/WebFluxStaticResourceConfig.java** (new)
   - Registers static resource handlers for Swagger UI and WebJars

2. **src/api-gateway/src/main/resources/application.yaml**
   - Removed Swagger UI routes that were blocking static resources
   - Added `spring.web.resources.static-locations` configuration
   - Fixed duplicate `spring:` configuration blocks

## Testing in Docker Locally

```bash
# Start all services
docker-compose up -d

# Wait for services to register (15-30 seconds)
sleep 30

# Access Swagger UI
curl http://localhost:8080/swagger-ui.html

# Test specific service docs
curl http://localhost:8080/v3/api-docs/identity-service | jq .
```

## Next Steps

If Swagger UI still doesn't work after these changes:

1. Rebuild gateway image: `docker-compose build api-gateway --no-cache`
2. Restart gateway: `docker-compose restart api-gateway`
3. Check all gateway pods are running: `docker-compose ps api-gateway`
4. Review logs: `docker-compose logs -f api-gateway`

## Architecture

The current setup uses **API Documentation Aggregation**:

- Each microservice generates its own OpenAPI spec (/v3/api-docs)
- API Gateway aggregates all specs via route definitions
- Single Swagger UI in gateway shows all services
- Users can switch between services in the dropdown

This allows:

- ✅ Decoupled service documentation (each service owns its own spec)
- ✅ Centralized documentation portal (single Swagger UI)
- ✅ No dependency on external documentation tools
- ✅ Real-time API documentation from running code
