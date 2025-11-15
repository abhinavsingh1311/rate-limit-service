const { connect } = require("../config/redis");
const tenantService = require("../services/tenantService");
const { Logger } = require("../utils/logger");

const seedTenants = async () => {
    try {
        Logger.info(`Connecting to Redis ....`);
        await connect();

        Logger.info(`Seeding test tenants....`);

        const freeTenant = await tenantService.createTenant({
            name: 'Free Test User',
            email: 'free@example.com',
            tier: 'free'
        });
        Logger.info(`Created free tenant: ${freeTenant.apiKey}`);

        const premiumTenant = await tenantService.createTenant({
            name: 'Premium tenant',
            email: 'prem@example.com',
            tier: 'premium'
        });

        Logger.info(`Created Premium tenant: ${premiumTenant.apiKey}`);

        const enterpriseTenant = await tenantService.createTenant({
            name: 'enterprise tenant',
            email: 'enterprise@example.com',
            tier: 'enterprise'
        });

        Logger.info(`Created enterprise tenant: ${enterpriseTenant.apiKey}`);

        Logger.info(`Seeding completed`);
        Logger.info(`\nFREE:       ${freeTenant.apiKey}`);
        Logger.info(`PREMIUM:    ${premiumTenant.apiKey}`);
        Logger.info(`ENTERPRISE: ${enterpriseTenant.apiKey}`);

        process.exit(0);

    }
    catch (error) {
        Logger.error(`Seeding failed: ${error.message}`);
        process.exit(1);
    }
};

seedTenants();