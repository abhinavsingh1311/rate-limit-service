# API Documentation

## Base URL
- http://localhost:3000/api/v1

## Authentication
- All requests require an API key in the header:
- X-API-Key: your-tenant-api-key

text

## Endpoints

### Check Rate Limit
```http
- GET /check-limit
- Response:

- json
    {
  "allowed": true,
  "remaining": 95,
  "reset_time": "2024-01-15T10:30:00Z",
  "limit": 100,
  "window": "1 minute"
    }
```

### Get Usage Analytics
```http
  GET /analytics?period=7d
  Parameters:

  period: 1h, 24h, 7d, 30d

- Response:

 - json
    {
  "total_requests": 15000,
  "allowed_requests": 14200,
  "blocked_requests": 800,
  "peak_rps": 245,
  "average_rps": 89
    }
```

### Configure Rate Limits
```http
    PUT /config
    Body:

- json
    {
  "requests_per_minute": 100,
  "burst_capacity": 20,
  "strategy": "token_bucket"
    }
```