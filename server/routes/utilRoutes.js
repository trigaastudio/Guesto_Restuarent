import express from 'express';
import http from 'http';
import https from 'https';
import dns from 'dns';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const isAllowedHostname = (hostname) => {
  if (!hostname) return false;
  const h = hostname.toLowerCase();
  return (
    h === 'maps.app.goo.gl' ||
    h === 'goo.gl' ||
    h === 'share.google' ||
    h === 'g.co' ||
    h === 'google.com' ||
    h === 'www.google.com' ||
    h === 'maps.google.com' ||
    h.endsWith('.google.com') ||
    h.endsWith('.goo.gl')
  );
};

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
];

const isPrivateAddress = (hostname) => {
  return PRIVATE_IP_PATTERNS.some(pattern => pattern.test(hostname));
};

// Resilient DNS lookup using resolver with fallback to Google DoH
const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const fallbackLookup = (hostname, opts, cb) => {
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  dns.lookup(hostname, opts, (err, address, family) => {
    if (err && (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN' || err.code === 'ESERVFAIL')) {
      resolver.resolve4(hostname, async (err2, addresses) => {
        if (!err2 && addresses?.length) {
          if (opts && opts.all) {
            return cb(null, addresses.map(a => ({ address: a, family: 4 })));
          }
          return cb(null, addresses[0], 4);
        }
        // If resolver fails, try DoH over HTTPS
        try {
          const dohRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(hostname)}`, {
            signal: AbortSignal.timeout(3000)
          });
          const dohData = await dohRes.json();
          const ip = dohData.Answer?.find(a => a.type === 1)?.data;
          if (ip) {
            if (opts && opts.all) {
              return cb(null, [{ address: ip, family: 4 }]);
            }
            return cb(null, ip, 4);
          }
        } catch (_) {}
        return cb(err);
      });
    } else {
      cb(err, address, family);
    }
  });
};

const expandShortUrl = (startUrl, maxHops = 5) => {
  return new Promise((resolve) => {
    let hops = 0;

    const step = (target) => {
      let parsed;
      try {
        parsed = new URL(target);
      } catch {
        return resolve(target);
      }

      if (!isAllowedHostname(parsed.hostname) || isPrivateAddress(parsed.hostname)) {
        return resolve(target);
      }

      if (hops++ >= maxHops) {
        return resolve(target);
      }

      const client = parsed.protocol === 'http:' ? http : https;
      const req = client.get(
        target,
        {
          lookup: fallbackLookup,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          timeout: 8000
        },
        (res) => {
          res.resume();
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            try {
              const nextUrl = new URL(res.headers.location, target).href;
              // If destination already contains full coordinates, return right away
              if (
                nextUrl.includes('@') ||
                nextUrl.includes('!3d') ||
                nextUrl.includes('?q=') ||
                nextUrl.includes('&q=') ||
                nextUrl.includes('ll=')
              ) {
                return resolve(nextUrl);
              }
              return step(nextUrl);
            } catch {
              return resolve(target);
            }
          }
          resolve(target);
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve(target);
      });

      req.on('error', (err) => {
        console.warn(`[expand-url] Request warning on ${target}:`, err.message);
        resolve(target);
      });
    };

    step(startUrl);
  });
};

router.post('/expand-url', protect, async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  if (!isAllowedHostname(parsedUrl.hostname)) {
    return res.status(400).json({ error: 'Invalid URL hostname' });
  }

  if (isPrivateAddress(parsedUrl.hostname)) {
    return res.status(400).json({ error: 'URL points to a private or internal address' });
  }

  try {
    const finalUrl = await expandShortUrl(url.trim());

    let finalParsed;
    try {
      finalParsed = new URL(finalUrl);
    } catch {
      return res.json({ success: true, expandedUrl: url.trim() });
    }

    if (isPrivateAddress(finalParsed.hostname)) {
      return res.status(400).json({ error: 'Resolved URL points to a private or internal address' });
    }

    return res.json({ success: true, expandedUrl: finalUrl });
  } catch (error) {
    console.error('[expand-url] Failed to expand URL:', error?.message);
    return res.json({ success: true, expandedUrl: url.trim() });
  }
});

export default router;
