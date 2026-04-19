(function () {
  const elements = {
    apiBaseUrl: document.getElementById('apiBaseUrl'),
    appId: document.getElementById('appId'),
    appKey: document.getElementById('appKey'),
    deviceId: document.getElementById('deviceId'),
    email: document.getElementById('email'),
    purpose: document.getElementById('purpose'),
    otp: document.getElementById('otp'),
    sendStatus: document.getElementById('sendStatus'),
    verifyStatus: document.getElementById('verifyStatus'),
    sendPill: document.getElementById('sendPill'),
    verifyPill: document.getElementById('verifyPill'),
    sessionPill: document.getElementById('sessionPill'),
    responseOutput: document.getElementById('responseOutput'),
    sessionOutput: document.getElementById('sessionOutput'),
    sendOtpButton: document.getElementById('sendOtpButton'),
    resendOtpButton: document.getElementById('resendOtpButton'),
    verifyOtpButton: document.getElementById('verifyOtpButton'),
    fetchMeButton: document.getElementById('fetchMeButton'),
    refreshButton: document.getElementById('refreshButton'),
    logoutButton: document.getElementById('logoutButton'),
  };

  const state = {
    accessToken: '',
    refreshToken: '',
    identity: null,
  };

  elements.apiBaseUrl.value = `${window.location.origin}/api/v1`;

  elements.sendOtpButton.addEventListener('click', handleSendOtp);
  elements.resendOtpButton.addEventListener('click', handleResendOtp);
  elements.verifyOtpButton.addEventListener('click', handleVerifyOtp);
  elements.fetchMeButton.addEventListener('click', handleFetchIdentity);
  elements.refreshButton.addEventListener('click', handleRefresh);
  elements.logoutButton.addEventListener('click', handleLogout);

  function getApiBaseUrl() {
    return elements.apiBaseUrl.value.trim().replace(/\/$/, '');
  }

  function getAppHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-app-id': elements.appId.value.trim(),
      'x-app-key': elements.appKey.value.trim(),
    };
  }

  function getFlowPayload() {
    return {
      target_type: 'email',
      target_value: elements.email.value.trim(),
      purpose: elements.purpose.value,
      device_id: elements.deviceId.value.trim() || 'demo-browser-device',
    };
  }

  async function apiRequest(path, options) {
    const response = await fetch(`${getApiBaseUrl()}${path}`, options);
    const body = await response.json().catch(() => ({
      success: false,
      message: 'Unable to parse API response',
    }));

    renderResponse({
      path,
      status: response.status,
      body,
    });

    if (!response.ok) {
      const error = new Error(body.message || 'Request failed');
      error.payload = body;
      throw error;
    }

    return body;
  }

  async function handleSendOtp() {
    setStatus(elements.sendStatus, elements.sendPill, 'Sending OTP...', 'pending');

    try {
      const data = await apiRequest('/otp/send', {
        method: 'POST',
        headers: getAppHeaders(),
        body: JSON.stringify({
          ...getFlowPayload(),
          metadata: { source: 'otp-login-showcase' },
        }),
      });

      setStatus(
        elements.sendStatus,
        elements.sendPill,
        `${data.message}. Check the inbox for ${elements.email.value.trim()}.`,
        'success',
      );
    } catch (error) {
      setStatus(elements.sendStatus, elements.sendPill, extractErrorMessage(error), 'error');
    }
  }

  async function handleResendOtp() {
    setStatus(elements.sendStatus, elements.sendPill, 'Resending OTP...', 'pending');

    try {
      const data = await apiRequest('/otp/resend', {
        method: 'POST',
        headers: getAppHeaders(),
        body: JSON.stringify(getFlowPayload()),
      });

      setStatus(
        elements.sendStatus,
        elements.sendPill,
        `${data.message}. Retry after ${data.data.retry_after_seconds} seconds if needed.`,
        'success',
      );
    } catch (error) {
      setStatus(elements.sendStatus, elements.sendPill, extractErrorMessage(error), 'error');
    }
  }

  async function handleVerifyOtp() {
    setStatus(elements.verifyStatus, elements.verifyPill, 'Verifying OTP...', 'pending');

    try {
      const data = await apiRequest('/otp/verify', {
        method: 'POST',
        headers: getAppHeaders(),
        body: JSON.stringify({
          ...getFlowPayload(),
          otp: elements.otp.value.trim(),
        }),
      });

      state.accessToken = data.data.access_token;
      state.refreshToken = data.data.refresh_token;
      state.identity = data.data.identity;

      renderSession();
      setStatus(
        elements.verifyStatus,
        elements.verifyPill,
        `${data.message}. Session created successfully.`,
        'success',
      );
      updateSessionPill('Session Active', 'success');
    } catch (error) {
      setStatus(elements.verifyStatus, elements.verifyPill, extractErrorMessage(error), 'error');
    }
  }

  async function handleFetchIdentity() {
    if (!state.accessToken) {
      setStatus(
        elements.verifyStatus,
        elements.verifyPill,
        'Verify the OTP first so the demo has an access token.',
        'error',
      );
      return;
    }

    try {
      const data = await apiRequest('/identities/me', {
        method: 'GET',
        headers: {
          ...getAppHeaders(),
          Authorization: `Bearer ${state.accessToken}`,
        },
      });

      state.identity = data.data;
      renderSession();
      setStatus(
        elements.verifyStatus,
        elements.verifyPill,
        'Fetched the current identity successfully.',
        'success',
      );
    } catch (error) {
      setStatus(elements.verifyStatus, elements.verifyPill, extractErrorMessage(error), 'error');
    }
  }

  async function handleRefresh() {
    if (!state.refreshToken) {
      setStatus(
        elements.verifyStatus,
        elements.verifyPill,
        'No refresh token yet. Verify the OTP first.',
        'error',
      );
      return;
    }

    try {
      const data = await apiRequest('/auth/refresh', {
        method: 'POST',
        headers: getAppHeaders(),
        body: JSON.stringify({
          refresh_token: state.refreshToken,
          device_id: elements.deviceId.value.trim() || 'demo-browser-device',
        }),
      });

      state.accessToken = data.data.access_token;
      state.refreshToken = data.data.refresh_token;
      renderSession();
      updateSessionPill('Session Refreshed', 'success');
      setStatus(elements.verifyStatus, elements.verifyPill, data.message, 'success');
    } catch (error) {
      setStatus(elements.verifyStatus, elements.verifyPill, extractErrorMessage(error), 'error');
    }
  }

  async function handleLogout() {
    if (!state.refreshToken) {
      setStatus(
        elements.verifyStatus,
        elements.verifyPill,
        'No active session to log out.',
        'error',
      );
      return;
    }

    try {
      const data = await apiRequest('/auth/logout', {
        method: 'POST',
        headers: getAppHeaders(),
        body: JSON.stringify({
          refresh_token: state.refreshToken,
          device_id: elements.deviceId.value.trim() || 'demo-browser-device',
        }),
      });

      clearSession();
      updateSessionPill('Logged Out', 'pending');
      setStatus(elements.verifyStatus, elements.verifyPill, data.message, 'success');
    } catch (error) {
      setStatus(elements.verifyStatus, elements.verifyPill, extractErrorMessage(error), 'error');
    }
  }

  function setStatus(textEl, pillEl, message, type) {
    textEl.textContent = message;
    textEl.className = `status-text ${type}`;
    pillEl.textContent =
      type === 'pending' ? 'In Progress' : type === 'success' ? 'Success' : 'Needs Attention';
    pillEl.className = `status-pill ${type}`;
  }

  function updateSessionPill(message, type) {
    elements.sessionPill.textContent = message;
    elements.sessionPill.className = `status-pill ${type}`;
  }

  function renderResponse(payload) {
    elements.responseOutput.textContent = JSON.stringify(payload, null, 2);
  }

  function renderSession() {
    elements.sessionOutput.textContent = JSON.stringify(
      {
        identity: state.identity,
        access_token_preview: previewToken(state.accessToken),
        refresh_token_preview: previewToken(state.refreshToken),
      },
      null,
      2,
    );
  }

  function clearSession() {
    state.accessToken = '';
    state.refreshToken = '';
    state.identity = null;
    elements.sessionOutput.textContent = 'No active session yet.';
  }

  function previewToken(token) {
    if (!token) {
      return '';
    }

    if (token.length <= 18) {
      return token;
    }

    return `${token.slice(0, 12)}...${token.slice(-8)}`;
  }

  function extractErrorMessage(error) {
    if (error?.payload?.errors?.length) {
      return `${error.payload.message}: ${error.payload.errors
        .map((item) => `${item.field || 'general'} ${item.code}`)
        .join(', ')}`;
    }

    return error?.payload?.message || error.message || 'Request failed';
  }
})();
