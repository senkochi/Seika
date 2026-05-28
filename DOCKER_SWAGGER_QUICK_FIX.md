# Quick Fix Reference - Docker Swagger UI Access

## TL;DR - What Changed

✅ **Problem**: Cannot access `http://localhost:8080/swagger-ui.html` in Docker  
✅ **Solution**: Added WebFlux static resource configuration  
✅ **Action**: Rebuild gateway container

## Files Changed

```
NEW:  src/api-gateway/src/main/java/com/seika/api_gateway/config/WebFluxStaticResourceConfig.java
EDIT: src/api-gateway/src/main/resources/application.yaml
NEW:  documentation/DOCKER_SWAGGER_SETUP.md
NEW:  DOCKER_SWAGGER_FIX_SUMMARY.md
```

## Commands to Apply Fix

```bash
# 1. Stop current services
docker-compose down

# 2. Rebuild gateway image (required!)
docker-compose build api-gateway --no-cache

# 3. Start all services
docker-compose up -d

# 4. Wait for services to register with Eureka
sleep 30

# 5. Access Swagger UI
# Desktop: open http://localhost:8080/swagger-ui.html
# Terminal: curl http://localhost:8080/swagger-ui.html
```

## What to Expect

### ✅ After Fix Works

1. **http://localhost:8080/swagger-ui.html** → Shows Swagger UI page
2. **Dropdown menu** → Shows all 7 services (Identity, Profile, Wallet, Marketplace, Flashcard, Quiz, Notification)
3. **Service selection** → Clicking each service loads its API docs
4. **Endpoints** → Can view and test API endpoints

### ❌ Still Not Working?

**Symptom**: Still getting 404 on `/swagger-ui.html`

**Fix**:

1. Check logs: `docker-compose logs -f api-gateway`
2. Verify container running: `docker-compose ps api-gateway`
3. Full reset:
   ```bash
   docker-compose down
   docker system prune -f
   docker-compose build api-gateway --no-cache
   docker-compose up -d
   ```

**Symptom**: Swagger UI loads but dropdown empty

**Fix**:

1. Wait another 30+ seconds (services registering with Eureka)
2. Check: `http://localhost:8761/` (Eureka)
3. All services should show **UP**

## Technical Summary

| Aspect           | Before                    | After                                       |
| ---------------- | ------------------------- | ------------------------------------------- |
| Static Resources | ❌ Not served by gateway  | ✅ WebFluxConfigurer handles them           |
| Gateway Routes   | Blocked Swagger UI paths  | API routes only (static handled separately) |
| WebFlux Config   | None for static resources | ResourceHandlerRegistry registered          |
| Swagger Access   | 404 error                 | ✅ Works                                    |

## Key Technical Change

Added **WebFluxConfigurer** implementation that registers ResourceHandlers:

- `/swagger-ui.html` → `classpath:/META-INF/resources/`
- `/swagger-ui/**` → `classpath:/META-INF/resources/swagger-ui/`
- `/webjars/**` → `classpath:/META-INF/resources/webjars/`
- `/v3/api-docs` → `classpath:/META-INF/resources/`

This enables Spring Cloud Gateway (WebFlux/reactive) to serve Swagger UI static assets, similar to how servlet containers work.

## Testing Commands

```bash
# Verify gateway is running
curl -i http://localhost:8080/swagger-ui.html

# Check service registration
curl http://localhost:8761/eureka/apps | grep SERVICE

# Get identity-service docs
curl http://localhost:8080/v3/api-docs/identity-service | jq .

# Get all available API docs endpoints
curl http://localhost:8080/v3/api-docs | jq .
```

## Documentation

- **Full Guide**: See `documentation/DOCKER_SWAGGER_SETUP.md`
- **Detailed Summary**: See `DOCKER_SWAGGER_FIX_SUMMARY.md`
- **Original Setup**: See `documentation/SWAGGER_SETUP.md`

## Questions?

Refer to the troubleshooting section in `DOCKER_SWAGGER_SETUP.md` for common issues and solutions.
