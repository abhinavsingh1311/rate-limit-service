const { TIERS } = require("../config/rateLimits");
const { client } = require("../config/redis");
const { generateUniqueApiKey } = require("../utils/apiKeyGenerator");
const { Logger } = require("../utils/logger");

class TenantService {
    constructor() {
        this.keyPrefix = 'tenant';
        this.indexKey = 'tenants:index';
    }

    getTenantKey(apiKey) {
        return `${this.keyPrefix}:${apiKey}`;
    }

    async createTenant(data) {
        try {
            const { name, email, tier = TIERS.FREE } = data;
            if (!Object.values(TIERS).includes(tier)) {
                throw new Error(`Invalid Tier. Must be one of: ${Object.values(TIERS).join(', ')}`);
            }

            const apiKey = await generateUniqueApiKey('sk_live');
            const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const tenant = {
                id: tenantId,
                apiKey,
                name,
                email: email || '',
                tier,
                createdAt: Date.now().toString(),
                updatedAt: Date.now().toString(),
                isActive: 'true',
                customRpm: '',
                customBurst: ''
            };

            await client.hSet(this.getTenantKey(apiKey), tenant);
            await client.sAdd(this.indexKey, tenantId);
            await client.set(`tenantId:${tenantId}`, apiKey);

            Logger.info(`Tenant created: ${tenantId} (${tier})`);

            return {
                ...tenant,
                createdAt: parseInt(tenant.createdAt),
                updatedAt: parseInt(tenant.updatedAt),
                isActive: tenant.isActive === 'true'
            };
        }
        catch (ex) {
            Logger.error(`Error creating tenant: ${ex.message}`);
            throw ex;
        }
    }

    async getTenantByApiKey(apiKey) {
        try {
            const tenant = await client.hGetAll(this.getTenantKey(apiKey));

            if (!tenant || Object.keys(tenant).length === 0) {
                return null;
            }

            return {
                ...tenant,
                createdAt: parseInt(tenant.createdAt),
                updatedAt: parseInt(tenant.updatedAt),
                isActive: tenant.isActive === 'true',
                customRpm: tenant.customRpm ? parseInt(tenant.customRpm) : null,
                customBurst: tenant.customBurst ? parseInt(tenant.customBurst) : null
            };
        }
        catch (err) {
            Logger.error(`Error looking up tenant by API key: ${err.message}`);
            return null;
        }
    }

    async getTenantById(tenantId) {
        try {
            const apiKey = await client.get(`tenantId:${tenantId}`);

            if (!apiKey) {
                return null;
            }
            return await this.getTenantByApiKey(apiKey);
        }
        catch (err) {
            Logger.error(`Error looking up tenant by id: ${err.message}`);
            return null;
        }
    }

    async updateTenant(tenantId, updates) {
        try {
            const tenant = await this.getTenantById(tenantId);
            if (!tenant) {
                throw new Error(`Tenant not found: ${tenantId}`);
            }
            if (updates.tier && !Object.values(TIERS).includes(updates.tier)) {
                throw new Error(`Invalid Tier: ${updates.tier}`);
            }

            const updateData = {
                updatedAt: Date.now().toString()
            };

            if (updates.name) updateData.name = updates.name;
            if (updates.email) updateData.email = updates.email;
            if (updates.tier) updateData.tier = updates.tier;
            if (updates.customRpm !== undefined) updateData.customRpm = updates.customRpm.toString();
            if (updates.customBurst !== undefined) updateData.customBurst = updates.customBurst.toString();
            if (updates.isActive !== undefined) updateData.isActive = updates.isActive.toString();

            await client.hSet(this.getTenantKey(tenant.apiKey), updateData);

            Logger.info(`Tenant updated: ${tenantId}`);

            return await this.getTenantById(tenantId);
        }
        catch (error) {
            Logger.error(`Error updating tenant: ${error.message}`);
            throw error;
        }
    }

    async deleteTenant(tenantId) {
        try {
            const tenant = await this.getTenantById(tenantId);
            if (!tenant) {
                throw new Error(`Tenant not found: ${tenantId}`);
            }

            await client.del(this.getTenantKey(tenant.apiKey));
            await client.sRem(this.indexKey, tenantId);
            await client.del(`tenantId:${tenantId}`);

            Logger.info(`Tenant deleted: ${tenantId}`);

            return true;
        }
        catch (error) {
            Logger.error(`Error deleting tenant: ${error.message}`);
            throw error;
        }
    }

    async listTenants() {
        try {
            const tenantIds = await client.sMembers(this.indexKey);

            const tenants = await Promise.all(
                tenantIds.map(id => this.getTenantById(id))
            );

            return tenants.filter(t => t !== null);
        }
        catch (err) {
            Logger.error(`Error listing all tenants: ${err.message}`);
            return [];
        }
    }
}

module.exports = new TenantService();