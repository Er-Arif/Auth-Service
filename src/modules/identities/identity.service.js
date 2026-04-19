const { AppError } = require('../../utils/errors');
const identityRepository = require('./identity.repository');

function mapIdentity(identity) {
  return {
    id: identity.id,
    app_id: identity.appId,
    identity_type: identity.identityType,
    identity_value: identity.identityValue,
    is_verified: identity.isVerified,
    metadata: identity.metadataJson || {},
  };
}

class IdentityService {
  async createOrVerifyIdentity({ appId, identityType, identityValue, metadata }) {
    return identityRepository.upsertIdentity({
      appId,
      identityType,
      identityValue,
      metadataJson: metadata || {},
    });
  }

  async getIdentityByIdAndApp(identityId, appId) {
    const identity = await identityRepository.findByIdAndApp(identityId, appId);
    if (!identity) {
      throw new AppError({
        statusCode: 404,
        message: 'Identity not found',
        errors: [{ code: 'IDENTITY_NOT_FOUND' }],
      });
    }

    return mapIdentity(identity);
  }

  async getCurrentIdentity(auth) {
    return this.getIdentityByIdAndApp(auth.identity_id, auth.app_id);
  }

  async countIdentities() {
    return identityRepository.countIdentities();
  }
}

module.exports = new IdentityService();
