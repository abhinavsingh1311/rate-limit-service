const express = require("express");
const {
    createTenant,
    getTenantById,
    updateTenant,
    deleteTenant,
    listTenants
} = require('../middleware/tenants');

const router = express.Router();

// Create new tenant
router.post('/', createTenant);

// List all tenants (must come before /:id to avoid treating 'list' as an ID)
router.get('/', listTenants);

// Get tenant by ID
router.get('/:id', getTenantById);

// Update tenant
router.put('/:id', updateTenant);

// Delete tenant
router.delete('/:id', deleteTenant);

module.exports = router;