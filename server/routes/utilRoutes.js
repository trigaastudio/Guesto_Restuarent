import express from 'express';

const router = express.Router();

router.post('/expand-url', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const parsedUrl = new URL(url);
    const validHostnames = ['maps.app.goo.gl', 'goo.gl', 'maps.google.com', 'share.google'];
    
    if (!validHostnames.includes(parsedUrl.hostname)) {
      return res.status(400).json({ error: 'Invalid URL hostname' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    const finalUrl = response.url;
    res.json({ expandedUrl: finalUrl });
  } catch (error) {
    console.error('Error expanding URL:', error);
    res.status(500).json({ error: 'Failed to expand URL' });
  }
});

export default router;
