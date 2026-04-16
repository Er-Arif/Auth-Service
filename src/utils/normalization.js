const { TARGET_TYPES } = require("../config/constants");

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function normalizePhone(value) {
  return value.replace(/\s+/g, "").replace(/-/g, "");
}

function normalizeTarget(targetType, targetValue) {
  if (targetType === TARGET_TYPES.EMAIL) {
    return normalizeEmail(targetValue);
  }

  return normalizePhone(targetValue);
}

module.exports = {
  normalizeEmail,
  normalizePhone,
  normalizeTarget,
};
