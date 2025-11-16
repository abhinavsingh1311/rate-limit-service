# API Documentation

## Overview

Multi-tenant API Rate Limiting Service with Redis backend. Supports three tier levels (free, premium, enterprise) with different rate limits and burst capacities.

## Base URL
```
http://localhost:3000
```

## Authentication

All protected API endpoints require an API key in the request header:

```http
X-API-Key: your-tenant-api-key
```

### API Key Format
- **Production keys**: `sk_live_[48-character-hex]`
- **Test keys**: `sk_test_[48-character-hex]`

---

## Rate Limiting

### Tier System

| Tier | Requests/Minute | Burst Capacity | Use Case |
|------|-----------------|----------------|----------|
| **Free** | 60 | 10 | Development, testing |
| **Premium** | 600 | 30 | Small to medium applications |
| **Enterprise** | 6000 | 100 | Large-scale production systems |

### Rate Limit Headers

All API responses include rate limiting information:

```http
X-RateLimit-Limit: 100          # Maximum requests in burst
X-RateLimit-Remaining: 95       # Remaining requests
X-RateLimit-Reset: 1642234567890 # Unix timestamp when limit resets
```

### Rate Limit Exceeded Response

When rate limit is exceeded, you'll receive:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 5

{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "limit": 100,
  "remaining": 0,
  "retryAfter": 5,
  "resetTime": 1642234567890
}
```

---

## Endpoints

### Health Check Endpoints

#### Get Service Status
```http
GET /health
```

**Response**
```json
{
  "status": "ok",
  "timestamp": 1642234567890,
  "environment": "production"
}
```

#### Check Readiness
```http
GET /health/ready
```

**Response**
```json
{
  "status": "ready",
  "redis": "connected"
}
```

#### Check Liveness
```http
GET /health/live
```

**Response**
```json
{
  "status": "alive",
  "uptime": 3600.5
}
```

---

## Tenant Management API

### 1. Create Tenant

Create a new tenant with specified tier and generate API key.

```http
POST /api/v1/tenants
Content-Type: application/json
```

**Request Body**
```json
{
  "name": "Acme Corporation",
  "email": "api@acme.com",
  "tier": "premium"
}
```

**Parameters**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Tenant name (min 3 characters) |
| email | string | No | Contact email (must be valid format) |
| tier | string | No | Rate limit tier: `free`, `premium`, `enterprise` (default: `free`) |

**Success Response (201 Created)**
```json
{
  "message": "Tenant created successfully",
  "data": {
    "id": "tenant_1642234567890_abc123xyz",
    "apiKey": "sk_.....",
    "name": "Acme Corporation",
    "email": "api@acme.com",
    "tier": "premium",
    "isActive": true,
    "createdAt": 1642234567890
  }
}
```

**Error Responses**

```json
// 400 Bad Request - Missing name
{
  "error": "Validation Error",
  "message": "Name is required"
}

// 400 Bad Request - Invalid tier
{
  "error": "Validation Error",
  "message": "Invalid tier. Must be one of: free, premium, enterprise"
}

// 400 Bad Request - Invalid email
{
  "error": "Validation Error",
  "message": "Invalid email format"
}

// 500 Internal Server Error
{
  "error": "Internal Server Error",
  "message": "Failed to create tenant"
}
```

---

### 2. Get Tenant by ID

Retrieve detailed information about a specific tenant.

```http
GET /api/v1/tenants/:id
```

**URL Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Tenant ID (e.g., `tenant_1642234567890_abc123xyz`) |

**Success Response (200 OK)**
```json
{
  "data": {
    "id": "tenant_1642234567890_abc123xyz",
    "apiKey": "sk_",
    "name": "Acme Corporation",
    "email": "api@acme.com",
    "tier": "premium",
    "isActive": true,
    "customRpm": null,
    "customBurst": null,
    "createdAt": 1642234567890,
    "updatedAt": 1642234567890
  }
}
```

**Error Responses**

```json
// 400 Bad Request
{
  "error": "Validation Error",
  "message": "Tenant ID is required"
}

// 404 Not Found
{
  "error": "Not Found",
  "message": "Tenant not found"
}

// 500 Internal Server Error
{
  "error": "Internal Server Error",
  "message": "Failed to retrieve tenant"
}
```

---

### 3. List All Tenants

Retrieve a list of all tenants with optional filtering.

```http
GET /api/v1/tenants?tier=premium&active=true
```

**Query Parameters**

| Parameter | Type | Optional | Description |
|-----------|------|----------|-------------|
| tier | string | Yes | Filter by tier: `free`, `premium`, `enterprise` |
| active | boolean | Yes | Filter by active status: `true`, `false` |

**Success Response (200 OK)**
```json
{
  "data": {
    "tenants": [
      {
        "id": "tenant_1642234567890_abc123xyz",
        "apiKey": "sk_live_****...x4y5",
        "name": "Acme Corporation",
        "email": "api@acme.com",
        "tier": "premium",
        "isActive": true,
        "createdAt": 1642234567890
      },
      {
        "id": "tenant_1642234567891_def456uvw",
        "apiKey": "sk_live_****...z6a7",
        "name": "Beta Industries",
        "email": "dev@beta.io",
        "tier": "premium",
        "isActive": true,
        "createdAt": 1642234567891
      }
    ],
    "total": 2,
    "filters": {
      "tier": "premium",
      "active": "true"
    }
  }
}
```

**Note**: API keys are masked in list responses for security (shows prefix and last 4 characters).

**Error Responses**

```json
// 400 Bad Request - Invalid tier filter
{
  "error": "Validation Error",
  "message": "Invalid tier filter. Must be one of: free, premium, enterprise"
}

// 500 Internal Server Error
{
  "error": "Internal Server Error",
  "message": "Failed to retrieve tenants"
}
```

---

### 4. Update Tenant

Update tenant information including tier, name, email, or custom rate limits.

```http
PUT /api/v1/tenants/:id
Content-Type: application/json
```

**URL Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Tenant ID to update |

**Request Body**

All fields are optional, but at least one must be provided:

```json
{
  "name": "Acme Corp (Updated)",
  "email": "newapi@acme.com",
  "tier": "enterprise",
  "isActive": true,
  "customRpm": 1200,
  "customBurst": 50
}
```

**Parameters**

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| name | string | Yes | New tenant name (min 3 characters) |
| email | string | Yes | New email address |
| tier | string | Yes | New tier: `free`, `premium`, `enterprise` |
| isActive | boolean | Yes | Activate/deactivate tenant |
| customRpm | integer | Yes | Custom requests per minute (0-10000) |
| customBurst | integer | Yes | Custom burst capacity (0-1000) |

**Success Response (200 OK)**
```json
{
  "message": "Tenant updated successfully",
  "data": {
    "id": "tenant_1642234567890_abc123xyz",
    "apiKey": "sk_.....",
    "name": "Acme Corp (Updated)",
    "email": "newapi@acme.com",
    "tier": "enterprise",
    "isActive": true,
    "customRpm": 1200,
    "customBurst": 50,
    "createdAt": 1642234567890,
    "updatedAt": 1642234570000
  }
}
```

**Important Notes**:
- Tier changes take effect immediately on next request
- Custom rate limits override tier defaults when set
- Deactivating a tenant (`isActive: false`) blocks all API access

**Error Responses**

```json
// 400 Bad Request - No fields to update
{
  "error": "Validation Error",
  "message": "At least one field to update must be provided"
}

// 400 Bad Request - Invalid tier
{
  "error": "Validation Error",
  "message": "Invalid tier. Must be one of: free, premium, enterprise"
}

// 400 Bad Request - Invalid custom RPM
{
  "error": "Validation Error",
  "message": "Custom RPM must be between 0 and 10000"
}

// 404 Not Found
{
  "error": "Not Found",
  "message": "Tenant not found"
}

// 500 Internal Server Error
{
  "error": "Internal Server Error",
  "message": "Failed to update tenant"
}
```

---

### 5. Delete Tenant

Permanently delete a tenant and all associated data.

```http
DELETE /api/v1/tenants/:id
```

**URL Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Tenant ID to delete |

**Success Response (200 OK)**
```json
{
  "message": "Tenant deleted successfully",
  "data": {
    "deletedTenantId": "tenant_1642234567890_abc123xyz"
  }
}
```

**Warning**: This operation is irreversible. The API key will be permanently invalidated.

**Error Responses**

```json
// 400 Bad Request
{
  "error": "Validation Error",
  "message": "Tenant ID is required"
}

// 404 Not Found
{
  "error": "Not Found",
  "message": "Tenant not found"
}

// 500 Internal Server Error
{
  "error": "Internal Server Error",
  "message": "Failed to delete tenant"
}
```

---

## Protected API Endpoints

### Sample Protected Endpoint

Example of a rate-limited API endpoint.

```http
GET /api/data
X-API-Key: sk_live_your_api_key_here
```

**Success Response (200 OK)**
```json
{
  "message": "API request successful",
  "data": {
    "timestamp": 1642234567890,
    "tenant": "Acme Corporation"
  }
}
```

**Error Responses**

```json
// 401 Unauthorized - Missing API key
{
  "error": "Unauthorized",
  "message": "API key is required. Please provide X-API-Key header."
}

// 401 Unauthorized - Invalid API key
{
  "error": "Unauthorized",
  "message": "Invalid API key"
}

// 403 Forbidden - Inactive tenant
{
  "error": "Forbidden",
  "message": "Your account has been deactivated. Please contact support."
}

// 429 Too Many Requests - Rate limit exceeded
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "limit": 100,
  "remaining": 0,
  "retryAfter": 5,
  "resetTime": 1642234567890
}
```

---

## Admin Endpoints

### Clear All Rate Limit Buckets

**Admin Only** - Clears all rate limit state (useful for testing).

```http
POST /api/v1/tenants/admin/clear-buckets
```

**Success Response (200 OK)**
```json
{
  "message": "All rate limit buckets cleared successfully"
}
```

**Error Response**
```json
{
  "error": "Internal Server Error",
  "message": "Failed to clear buckets"
}
```

---

## Token Bucket Algorithm

The service uses the **Token Bucket** algorithm for fair rate limiting:

### How It Works

1. **Initialization**: Each tenant gets a bucket with capacity = burst capacity
2. **Token Refill**: Tokens refill continuously at the specified RPM rate
3. **Request Handling**: Each request consumes 1 token
4. **Burst Handling**: Allows bursts up to bucket capacity
5. **State Management**: Token state stored in Redis for distributed systems

### Formula

```
Tokens = min(Capacity, CurrentTokens + (ElapsedTime × RefillRate))
RefillRate = RequestsPerMinute / 60 / 1000  (tokens per millisecond)
```

### Example Scenarios

**Scenario 1: Burst Usage (Premium Tier)**
- Burst capacity: 30 tokens
- RPM: 600 (10 tokens/second)
- User makes 25 requests instantly → Allowed (5 tokens remaining)
- User makes 10 more requests immediately → 5 allowed, 5 blocked

**Scenario 2: Sustained Load (Free Tier)**
- Burst capacity: 10 tokens
- RPM: 60 (1 token/second)
- User makes 1 request per second → All allowed indefinitely
- User makes 2 requests per second → Every other request blocked

---

## Best Practices

### 1. Handle Rate Limits Gracefully

```javascript
async function makeApiRequest(url, apiKey) {
  const response = await fetch(url, {
    headers: { 'X-API-Key': apiKey }
  });
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);
    
    // Implement exponential backoff
    await sleep(retryAfter * 1000);
    return makeApiRequest(url, apiKey);
  }
  
  return response.json();
}
```

### 2. Monitor Rate Limit Headers

Always check the `X-RateLimit-Remaining` header to avoid hitting limits:

```javascript
const remaining = response.headers.get('X-RateLimit-Remaining');
if (remaining < 10) {
  console.warn('Approaching rate limit!');
}
```

### 3. Use Appropriate Tiers

- **Free**: Development, testing, personal projects
- **Premium**: Production apps with moderate traffic
- **Enterprise**: High-volume applications, mission-critical systems

### 4. Implement Client-Side Rate Limiting

Don't rely solely on server-side limits:

```javascript
// Simple client-side rate limiter
class ClientRateLimiter {
  constructor(requestsPerSecond) {
    this.interval = 1000 / requestsPerSecond;
    this.lastRequest = 0;
  }
  
  async throttle() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.interval) {
      await sleep(this.interval - timeSinceLastRequest);
    }
    
    this.lastRequest = Date.now();
  }
}
```

---

## Error Codes Summary

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid request parameters or body |
| 401 | Unauthorized | Missing or invalid API key |
| 403 | Forbidden | Valid key but account is inactive |
| 404 | Not Found | Tenant or resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error occurred |

---

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Token bucket rate limiting
- Three-tier system (free, premium, enterprise)
- Multi-tenant support
- Redis-backed distributed state
- Complete CRUD API for tenant management
- Real-time configuration updates

---

*Last Updated: November 15, 2025*