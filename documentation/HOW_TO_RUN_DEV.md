# Seika Microservices - Development & Testing Guide

## How to run

Our system infrastructure, databases, and core services are fully containerized using Docker Compose.

### 1. First-Time Setup & Full Rebuilds

To build and start all microservices (including Service Discovery, Identity, Profile, Wallet, and Marketplace services) for the first time, run the following command in the root directory:

```bash
docker compose up -d --build

```

### 2. Subsequent Runs & Development Workflow

- **Standard Start:** If you haven't made any code modifications and just want to resume development, you can simply run:

```bash
docker compose up -d

```

- **Applying Code Changes:** Docker does not automatically track source code modifications outside the containers. If you modify the codebase and want to test the new logic, you **must rebuild the specific service or the entire stack** using the `--build` flag:

```bash
docker compose up -d --build

```

**Tip for Faster Builds:** If you only modified a single service (e.g., `wallet-service`), you can rebuild just that specific container instead of the whole infrastructure:\*

```bash
docker compose build wallet-service
docker compose up -d wallet-service

```

---

## System Verification & Testing

Once the containers are up and running, verify the health of the ecosystem using the core infrastructure endpoints below:

### 1. Service Discovery (Netflix Eureka)

We use Eureka for service registry and discovery. You can monitor the status and health of all registered microservices instances here:

- **Dashboard URL:** [http://localhost:8761/](https://www.google.com/search?q=http://localhost:8761/)

### 2. Centralized API Documentation (Swagger UI)

All API endpoints exposed through the API Gateway are documented dynamically. Use this interface to test requests, inspect payloads, and understand the internal contracts:

- **API Docs URL:** [http://localhost:8080/swagger-ui/index.html](https://www.google.com/search?q=http://localhost:8080/swagger-ui/index.html)

---
