const express = require('express');
const opsRoutes = require('../modules/ops/ops.routes');
const otpRoutes = require('../modules/otp/otp.routes');
const authRoutes = require('../modules/auth/auth.routes');
const identityRoutes = require('../modules/identities/identity.routes');
const appRoutes = require('../modules/apps/app.routes');
const auditRoutes = require('../modules/audit/audit.routes');

const router = express.Router();

router.use(opsRoutes);
router.use('/otp', otpRoutes);
router.use('/auth', authRoutes);
router.use('/identities', identityRoutes);
router.use('/apps', appRoutes);
router.use('/audit-logs', auditRoutes);

module.exports = router;
