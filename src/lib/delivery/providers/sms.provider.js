const { env } = require('../../../config/env');
const { AppError } = require('../../../utils/errors');

function ensureMsg91Config() {
  if (!env.MSG91_AUTH_KEY || !env.MSG91_SMS_SENDER_ID) {
    throw new AppError({
      statusCode: 503,
      message: 'Delivery provider unavailable',
      errors: [{ code: 'DELIVERY_PROVIDER_UNAVAILABLE' }],
    });
  }
}

function normalizeMsg91Mobile(targetValue) {
  return targetValue.replace(/[^\d]/g, '');
}

async function sendViaMsg91(payload) {
  ensureMsg91Config();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.MSG91_SMS_TIMEOUT_MS);

  try {
    const response = await fetch(`${env.MSG91_SMS_BASE_URL}/api/v2/sendsms`, {
      method: 'POST',
      headers: {
        authkey: env.MSG91_AUTH_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: env.MSG91_SMS_SENDER_ID,
        route: env.MSG91_SMS_ROUTE,
        country: env.MSG91_SMS_COUNTRY,
        sms: [
          {
            message: payload.message,
            to: [normalizeMsg91Mobile(payload.targetValue)],
          },
        ],
      }),
      signal: controller.signal,
    });

    const responseText = await response.text();
    let parsed;

    try {
      parsed = responseText ? JSON.parse(responseText) : null;
    } catch {
      parsed = null;
    }

    if (!response.ok || parsed?.type === 'error') {
      throw new AppError({
        statusCode: 502,
        message: 'Delivery failed',
        errors: [{ code: 'DELIVERY_FAILED' }],
      });
    }

    return {
      channel: 'sms',
      provider: 'msg91',
      accepted: true,
      providerResponse: parsed,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError({
      statusCode: 502,
      message: 'Delivery failed',
      errors: [{ code: 'DELIVERY_FAILED' }],
    });
  } finally {
    clearTimeout(timeout);
  }
}

const smsProvider = {
  async sendOtp(payload) {
    return sendViaMsg91(payload);
  },
};

module.exports = smsProvider;
