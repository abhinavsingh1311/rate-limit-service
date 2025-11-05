# rate-limit-service
Multi-tenant API Rate Limiting Service with Redis

## Component Details

### Rate Limiting Service
- **Express.js**: HTTP server and middleware
- **Redis**: Distributed token storage
- **Token Bucket Algorithm**: Fair rate limiting
- **Prometheus**: Metrics collection

### Data Flow
1. Request arrives with API key
2. Extract tenant identifier from API key
3. Check Redis for current token count
4. Apply token bucket algorithm
5. Update metrics and respond
6. Log for analytics

## Scaling Strategy
- **Horizontal**: Multiple service instances behind load balancer
- **Redis Cluster**: For high availability and partition tolerance
- **Regional Deployment**: Multi-region Redis for global applications