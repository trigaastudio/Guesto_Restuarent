import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// MED-10 FIX: This endpoint now requires authentication
// Previously any anonymous user could use our server as an HTTP proxy

// Allowed Google Maps hostnames (SSRF allowlist)
const ALLOWED_HOSTNAMES = new Set([
  'maps.app.goo.gl',
  'goo.gl',
  'maps.google.com',
  'share.google'
]);

// RFC 1918 private ranges + loopback — block SSRF to internal networks
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,                    // Link-local (AWS metadata etc.)
  /^::1$/,                          // IPv6 loopback
  /^fc00:/i,                        // IPv6 private
];

const isPrivateAddress = (hostname) => {
  return PRIVATE_IP_PATTERNS.some(pattern => pattern.test(hostname));
};

router.post('/expand-url', protect, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // SSRF pre-check: validate initial URL hostname
  if (!ALLOWED_HOSTNAMES.has(parsedUrl.hostname)) {
    return res.status(400).json({ error: 'Invalid URL hostname' });
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GuestO/1.0)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(5000) // 5s timeout
    });

    const finalUrl = response.url;

    // MED-10 FIX: Validate final resolved URL to prevent redirect-based SSRF
    // A redirect chain could navigate to internal IPs (e.g., AWS metadata endpoint)
    let finalParsed;
    try {
      finalParsed = new URL(finalUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid resolved URL' });
    }

    if (isPrivateAddress(finalParsed.hostname)) {
      return res.status(400).json({ error: 'Resolved URL points to a private or internal address' });
    }

    res.json({ expandedUrl: finalUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to expand URL' });
  }
});

export default router;
