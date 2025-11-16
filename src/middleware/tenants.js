const { TIERS } = require("../config/rateLimits");
const tenantService = require("../services/tenantService");
const { Logger } = require("../utils/logger");

// Helper function 
const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};

// Helper: Mask API key for security
const maskApiKey = (apiKey) => {
    if (!apiKey || apiKey.length < 12) {
        return "****";
    }
    const prefix = apiKey.substring(0, 7); // "sk_live"
    const last4 = apiKey.substring(apiKey.length - 4);
    return `${prefix}_****...${last4}`;
};

// 1. CREATE TENANT
const createTenant = async (req, res) => {
    const { name, email, tier = "free" } = req.body;

    // Validation 1: Name is required
    if (!name || name.trim() === "") {
        Logger.warning('Name is missing');
        return res.status(400).json({
            error: "Validation Error",
            message: "Name is required"
        });
    }

    // Validation 2: Name length
    if (name.length < 3) {
        Logger.warning('Name must be at least 3 chars');
        return res.status(400).json({
            error: 'Validation Error',
            message: "Name must be at least 3 characters"
        });
    }

    // Validation 3: Valid tier
    const validTiers = Object.values(TIERS);
    if (!validTiers.includes(tier)) {
        Logger.warning(`Invalid tier attempted: ${tier}`);
        return res.status(400).json({
            error: 'Validation Error',
            message: `Invalid tier. Must be one of: ${validTiers.join(', ')}`
        });
    }

    // Validation 4: Email format (if provided)
    if (email && !validateEmail(email)) {
        Logger.warning(`Invalid email format: ${email}`);
        return res.status(400).json({
            error: "Validation Error",
            message: "Invalid email format"
        });
    }

    // Create tenant
    try {
        const tenant = await tenantService.createTenant({
            name,
            email,
            tier
        });

        Logger.info(`Tenant created successfully: ${tenant.id}`);

        return res.status(201).json({
            message: "Tenant created successfully",
            data: {
                id: tenant.id,
                apiKey: tenant.apiKey,
                name: tenant.name,
                email: tenant.email,
                tier: tenant.tier,
                isActive: tenant.isActive,
                createdAt: tenant.createdAt
            }
        });
    } catch (error) {
        Logger.error(`Failed to create tenant: ${error.message}`);
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to create tenant"
        });
    }
};

// 2. GET TENANT BY ID
const getTenantById = async (req, res) => {
    const { id } = req.params;

    // Validation: Tenant ID is required
    if (!id || id.trim() === "") {
        Logger.warning('Tenant ID is missing');
        return res.status(400).json({
            error: "Validation Error",
            message: "Tenant ID is required"
        });
    }

    try {
        const tenant = await tenantService.getTenantById(id);

        // Check if tenant exists
        if (!tenant) {
            Logger.warning(`Tenant not found: ${id}`);
            return res.status(404).json({
                error: "Not Found",
                message: "Tenant not found"
            });
        }

        Logger.info(`Retrieved tenant: ${id}`);

        return res.status(200).json({
            data: {
                id: tenant.id,
                apiKey: tenant.apiKey,
                name: tenant.name,
                email: tenant.email,
                tier: tenant.tier,
                isActive: tenant.isActive,
                customRpm: tenant.customRpm,
                customBurst: tenant.customBurst,
                createdAt: tenant.createdAt,
                updatedAt: tenant.updatedAt
            }
        });
    } catch (error) {
        Logger.error(`Failed to get tenant: ${error.message}`);
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to retrieve tenant"
        });
    }
};

// 3. UPDATE TENANT
const updateTenant = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Validation 1: Tenant ID is required
    if (!id || id.trim() === "") {
        Logger.warning('Tenant ID is missing');
        return res.status(400).json({
            error: "Validation Error",
            message: "Tenant ID is required"
        });
    }

    // Validation 2: At least one field to update
    if (!updates || Object.keys(updates).length === 0) {
        Logger.warning('No update fields provided');
        return res.status(400).json({
            error: "Validation Error",
            message: "At least one field to update must be provided"
        });
    }

    // Validation 3: Valid tier if provided
    if (updates.tier) {
        const validTiers = Object.values(TIERS);
        if (!validTiers.includes(updates.tier)) {
            Logger.warning(`Invalid tier in update: ${updates.tier}`);
            return res.status(400).json({
                error: 'Validation Error',
                message: `Invalid tier. Must be one of: ${validTiers.join(', ')}`
            });
        }
    }

    // Validation 4: Name length if provided
    if (updates.name && updates.name.length < 3) {
        Logger.warning('Name too short in update');
        return res.status(400).json({
            error: 'Validation Error',
            message: "Name must be at least 3 characters"
        });
    }

    // Validation 5: Email format if provided
    if (updates.email && !validateEmail(updates.email)) {
        Logger.warning(`Invalid email in update: ${updates.email}`);
        return res.status(400).json({
            error: "Validation Error",
            message: "Invalid email format"
        });
    }

    // Validation 6: Custom RPM if provided
    if (updates.customRpm !== undefined) {
        const rpm = parseInt(updates.customRpm);
        if (isNaN(rpm) || rpm < 0 || rpm > 10000) {
            Logger.warning(`Invalid customRpm: ${updates.customRpm}`);
            return res.status(400).json({
                error: "Validation Error",
                message: "Custom RPM must be between 0 and 10000"
            });
        }
    }

    // Validation 7: Custom Burst if provided
    if (updates.customBurst !== undefined) {
        const burst = parseInt(updates.customBurst);
        if (isNaN(burst) || burst < 0 || burst > 1000) {
            Logger.warning(`Invalid customBurst: ${updates.customBurst}`);
            return res.status(400).json({
                error: "Validation Error",
                message: "Custom burst must be between 0 and 1000"
            });
        }
    }

    try {
        const updatedTenant = await tenantService.updateTenant(id, updates);

        Logger.info(`Tenant updated successfully: ${id}`);

        return res.status(200).json({
            message: "Tenant updated successfully",
            data: updatedTenant
        });
    } catch (error) {
        // Check if tenant not found
        if (error.message.includes('not found')) {
            Logger.warning(`Tenant not found for update: ${id}`);
            return res.status(404).json({
                error: "Not Found",
                message: "Tenant not found"
            });
        }

        Logger.error(`Failed to update tenant: ${error.message}`);
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to update tenant"
        });
    }
};

// 4. DELETE TENANT
const deleteTenant = async (req, res) => {
    const { id } = req.params;

    // Validation: Tenant ID is required
    if (!id || id.trim() === "") {
        Logger.warning('Tenant ID is missing');
        return res.status(400).json({
            error: "Validation Error",
            message: "Tenant ID is required"
        });
    }

    try {
        // Check if tenant exists
        const tenant = await tenantService.getTenantById(id);

        if (!tenant) {
            Logger.warning(`Tenant not found for deletion: ${id}`);
            return res.status(404).json({
                error: "Not Found",
                message: "Tenant not found"
            });
        }

        // Delete tenant
        await tenantService.deleteTenant(id);

        Logger.info(`Tenant deleted successfully: ${id}`);

        return res.status(200).json({
            message: "Tenant deleted successfully",
            data: {
                deletedTenantId: id
            }
        });
    } catch (error) {
        if (error.message.includes('not found')) {
            Logger.warning(`Tenant not found for deletion: ${id}`);
            return res.status(404).json({
                error: "Not Found",
                message: "Tenant not found"
            });
        }

        Logger.error(`Failed to delete tenant: ${error.message}`);
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to delete tenant"
        });
    }
};

// 5. LIST ALL TENANTS
const listTenants = async (req, res) => {
    const { tier, active } = req.query;

    // Validation: Valid tier filter if provided
    if (tier) {
        const validTiers = Object.values(TIERS);
        if (!validTiers.includes(tier)) {
            Logger.warning(`Invalid tier filter: ${tier}`);
            return res.status(400).json({
                error: 'Validation Error',
                message: `Invalid tier filter. Must be one of: ${validTiers.join(', ')}`
            });
        }
    }

    try {
        // Get all tenants
        let allTenants = await tenantService.listTenants();

        // Apply tier filter if provided
        if (tier) {
            allTenants = allTenants.filter(t => t.tier === tier);
        }

        // Apply active filter if provided
        if (active !== undefined) {
            const isActive = active === 'true';
            allTenants = allTenants.filter(t => t.isActive === isActive);
        }

        // Format response (mask API keys for security in list view)
        const tenantsData = allTenants.map(tenant => ({
            id: tenant.id,
            apiKey: maskApiKey(tenant.apiKey),
            name: tenant.name,
            email: tenant.email,
            tier: tenant.tier,
            isActive: tenant.isActive,
            createdAt: tenant.createdAt
        }));

        Logger.info(`Listed ${tenantsData.length} tenants`);

        return res.status(200).json({
            data: {
                tenants: tenantsData,
                total: tenantsData.length,
                filters: {
                    tier: tier || null,
                    active: active || null
                }
            }
        });
    } catch (error) {
        Logger.error(`Failed to list tenants: ${error.message}`);
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to retrieve tenants"
        });
    }
};

const clearAllBuckets = async (req, res) => {
    try {
        const rateLimiter = require('../services/rateLimiter');
        await rateLimiter.clearAllBuckets();

        Logger.info('All rate limit buckets cleared');

        return res.status(200).json({
            message: 'All rate limit buckets cleared successfully'
        });
    } catch (error) {
        Logger.error(`Failed to clear buckets: ${error.message}`);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to clear buckets'
        });
    }
};

module.exports = {
    createTenant,
    getTenantById,
    updateTenant,
    deleteTenant,
    listTenants,
    clearAllBuckets
};