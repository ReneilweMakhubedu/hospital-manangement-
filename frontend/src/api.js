/** API base — follows the browser host so LAN access (e.g. 192.168.x.x:3000) still reaches the Java API. */
function resolveApiBase() {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
}

const API_BASE = resolveApiBase();
const API_ORIGIN = process.env.REACT_APP_API_ORIGIN || API_BASE.replace(/\/api\/?$/, '');

export default API_BASE;
export { API_BASE, API_ORIGIN };
