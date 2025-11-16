const http = require('http');

// Test data from your tenants
const TENANTS = {
    free: {
        id: 'tenant_1763256771377_rygx61yyl',
        apiKey: '',
        name: 'Free User',
        tier: 'free',
        burstCapacity: 10
    },
    premium: {
        id: 'tenant_1763256771391_02s4c6fjz',
        apiKey: '',
        name: 'Premium User',
        tier: 'premium',
        burstCapacity: 30
    },
    enterprise: {
        id: 'tenant_1763256771402_2qvlarovp',
        apiKey: '',
        name: 'Enterprise User',
        tier: 'enterprise',
        burstCapacity: 100
    }
};

const BASE_URL = 'http://localhost:3000';

// Helper: Make HTTP request
const makeRequest = (apiKey) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/data',
            method: 'GET',
            headers: {
                'X-API-Key': apiKey
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', reject);
        req.end();
    });
};

// Helper: Make multiple requests in parallel (FAST)
const makeParallelRequests = async (apiKey, count) => {
    const promises = [];
    for (let i = 0; i < count; i++) {
        promises.push(makeRequest(apiKey));
    }
    return Promise.all(promises);
};

// Helper: Clear all buckets
const clearAllBuckets = () => {
    return new Promise((resolve, reject) => {
        const data = '';
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/v1/tenants/admin/clear-buckets',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => resolve());
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
};

// Helper: Sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test 1: Verify Different Burst Capacities (FAST - no delays)
async function test1_BurstCapacities() {
    console.log('\n========================================');
    console.log('TEST 1: Verify Different Burst Capacities');
    console.log('========================================\n');

    for (const [tier, tenant] of Object.entries(TENANTS)) {
        console.log(`\nTesting ${tier.toUpperCase()} tier (Burst: ${tenant.burstCapacity}):`);

        // Make requests rapidly in parallel
        const requestCount = tenant.burstCapacity + 5;
        console.log(`  Making ${requestCount} parallel requests...`);

        const results = await makeParallelRequests(tenant.apiKey, requestCount);

        let successCount = 0;
        let blockedCount = 0;

        results.forEach((result, i) => {
            if (result.status === 200) {
                successCount++;
            } else if (result.status === 429) {
                blockedCount++;
            }
        });

        console.log(`\n  Summary: ${successCount} succeeded, ${blockedCount} blocked`);
        console.log(`  Expected burst: ${tenant.burstCapacity}, Actual: ${successCount}`);

        // Allow tolerance of ±2 due to timing
        if (successCount >= tenant.burstCapacity - 2 && successCount <= tenant.burstCapacity + 2) {
            console.log('  ✅ PASS: Burst capacity is correct');
        } else {
            console.log('  ❌ FAIL: Burst capacity mismatch');
        }

        await sleep(2000); // Wait before next tenant
    }
}

// Test 2: Verify Tenant Isolation
async function test2_TenantIsolation() {
    console.log('\n========================================');
    console.log('TEST 2: Verify Tenant Isolation');
    console.log('========================================\n');

    console.log('Step 1: Exhaust FREE tenant tokens rapidly...');
    await makeParallelRequests(TENANTS.free.apiKey, 20);

    await sleep(500);

    console.log('\nStep 2: Test each tenant:');

    // Test FREE (should be blocked)
    const freeResult = await makeRequest(TENANTS.free.apiKey);
    console.log(`  FREE tenant: ${freeResult.status === 429 ? '❌ Blocked (Expected)' : '✅ Allowed (Unexpected!)'}`);

    // Test PREMIUM (should work)
    const premiumResult = await makeRequest(TENANTS.premium.apiKey);
    console.log(`  PREMIUM tenant: ${premiumResult.status === 200 ? '✅ Allowed (Expected)' : '❌ Blocked (Unexpected!)'}`);

    // Test ENTERPRISE (should work)
    const enterpriseResult = await makeRequest(TENANTS.enterprise.apiKey);
    console.log(`  ENTERPRISE tenant: ${enterpriseResult.status === 200 ? '✅ Allowed (Expected)' : '❌ Blocked (Unexpected!)'}`);

    if (freeResult.status === 429 && premiumResult.status === 200 && enterpriseResult.status === 200) {
        console.log('\n  ✅ PASS: Tenant isolation working correctly');
    } else {
        console.log('\n  ❌ FAIL: Tenant isolation broken');
    }
}

// Test 3: Dynamic Configuration Changes
async function test3_DynamicConfig() {
    console.log('\n========================================');
    console.log('TEST 3: Dynamic Configuration Changes');
    console.log('========================================\n');

    console.log('Step 1: Upgrade FREE tenant to PREMIUM...');

    // Update via API
    const updateData = JSON.stringify({ tier: 'premium' });
    const updateOptions = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/v1/tenants/${TENANTS.free.id}`,
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': updateData.length
        }
    };

    await new Promise((resolve, reject) => {
        const req = http.request(updateOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`  Update response: ${res.statusCode === 200 ? '✅ Success' : '❌ Failed'}`);
                resolve();
            });
        });
        req.on('error', reject);
        req.write(updateData);
        req.end();
    });

    console.log('\nStep 2: Test new burst capacity (should be 30):');

    // Make 35 parallel requests
    const results = await makeParallelRequests(TENANTS.free.apiKey, 35);

    let successCount = 0;
    results.forEach(result => {
        if (result.status === 200) successCount++;
    });

    console.log(`  Total successful requests: ${successCount}`);

    // Should be around 30 (PREMIUM burst)
    if (successCount >= 28 && successCount <= 32) {
        console.log('  ✅ PASS: Configuration change applied immediately');
    } else {
        console.log('  ❌ FAIL: Configuration change not working (expected ~30, got ' + successCount + ')');
    }
}

// Test 4: Rate Limit Headers
async function test4_Headers() {
    console.log('\n========================================');
    console.log('TEST 4: Rate Limit Headers');
    console.log('========================================\n');

    const result = await makeRequest(TENANTS.enterprise.apiKey);

    console.log('Checking response headers:');
    console.log(`  X-RateLimit-Limit: ${result.headers['x-ratelimit-limit'] || 'MISSING'}`);
    console.log(`  X-RateLimit-Remaining: ${result.headers['x-ratelimit-remaining'] || 'MISSING'}`);
    console.log(`  X-RateLimit-Reset: ${result.headers['x-ratelimit-reset'] || 'MISSING'}`);

    if (result.headers['x-ratelimit-limit'] &&
        result.headers['x-ratelimit-remaining'] !== undefined &&
        result.headers['x-ratelimit-reset']) {
        console.log('\n  ✅ PASS: All rate limit headers present');
    } else {
        console.log('\n  ❌ FAIL: Missing rate limit headers');
    }
}

// Run all tests
async function runAllTests() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   RATE LIMITER ISOLATION TEST SUITE   ║');
    console.log('╚════════════════════════════════════════╝');

    try {
        // Clear all buckets before starting
        console.log('\nClearing all rate limit buckets...');
        await clearAllBuckets();
        await sleep(1000);

        await test1_BurstCapacities();
        await sleep(2000);

        // Clear again before isolation test
        console.log('\nClearing buckets for isolation test...');
        await clearAllBuckets();
        await sleep(1000);

        await test2_TenantIsolation();
        await sleep(2000);

        // Clear again before config test
        console.log('\nClearing buckets for config test...');
        await clearAllBuckets();
        await sleep(1000);

        await test3_DynamicConfig();
        await sleep(2000);

        await test4_Headers();

        console.log('\n========================================');
        console.log('ALL TESTS COMPLETED!');
        console.log('========================================\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED WITH ERROR:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Execute
runAllTests();