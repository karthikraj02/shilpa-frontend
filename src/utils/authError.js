export function getAuthErrorMessage(err, fallback = 'Error processing request') {
  if (!err) return fallback;

  const data = err.response?.data;
  if (data?.msg) return data.msg;
  if (typeof data === 'string' && data.trim()) return data.trim();

  if (err.code === 'ERR_NETWORK' || !err.response) {
    return 'Cannot reach the server. Check your connection and try again.';
  }

  if (err.response?.status === 404) {
    return 'Login service not found. The app may need to be redeployed with the API enabled.';
  }

  if (err.response?.status >= 500) {
    return data?.msg || data?.detail || 'Server error. Please try again in a moment.';
  }

  return err.message || fallback;
}
