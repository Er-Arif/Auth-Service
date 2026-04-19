function maskEmail(value) {
  const [localPart, domain] = value.split('@');
  if (!domain) {
    return '***';
  }

  const visiblePrefix = localPart.slice(0, 1) || '*';
  return `${visiblePrefix}***@${domain}`;
}

function maskPhone(value) {
  if (value.length <= 4) {
    return '****';
  }

  return `${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

function maskTarget(targetType, targetValue) {
  if (targetType === 'email') {
    return maskEmail(targetValue);
  }

  return maskPhone(targetValue);
}

module.exports = {
  maskTarget,
};
