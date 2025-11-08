const { connect, disconnect } = require("../config/redis");
const rateLimiter = require("../services/rateLimiter");

async function test() {

    await connect();
    console.log("test 1: first request should allow");
    const result1 = await rateLimiter.checkRateLimit('tenant1', 'free');
    console.log(result1);

    console.log('\n Test 2: Burst requests (should allow 10, deny 11th)');
    for (let i = 0; i < 11; i++) {
        const result = await rateLimiter.checkRateLimit('tenant2', 'free');
        console.log(`Request ${i + 1}:`, result.allowed ? "ALLOWED" : "DENIED", `Remaining:${result.remaining}`);
    }

    console.log('\nTest 3> Wait and retry (tokens should refill)');
    await new Promise(res => setTimeout(res, 2000));
    const result3 = await rateLimiter.checkRateLimit('tenant2', "free");
    console.log(result3);

    disconnect();
    process.exit(0);
}

test().catch(console.error);