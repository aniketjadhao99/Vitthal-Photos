const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// @desc    Generate dynamic sitemap.xml
// @route   GET /api/seo/sitemap.xml
// @access  Public
router.get('/sitemap.xml', async (req, res) => {
  try {
    // Get all products and pages
    const products = await prisma.product.findMany({ select: { id: true, updatedAt: true } });
    
    const baseUrl = process.env.BASE_URL || 'https://vitthalphotolframes.com';
    const staticPages = [
      { url: '', priority: 1.0, changefreq: 'daily' },
      { url: 'about', priority: 0.8, changefreq: 'monthly' },
      { url: 'contact', priority: 0.7, changefreq: 'monthly' },
      { url: 'faq', priority: 0.7, changefreq: 'monthly' },
      { url: 'legal', priority: 0.5, changefreq: 'yearly' },
      { url: 'god-frames', priority: 0.9, changefreq: 'weekly' },
      { url: 'warrior-frames', priority: 0.9, changefreq: 'weekly' },
      { url: 'new-arrivals', priority: 0.9, changefreq: 'daily' },
      { url: 'custom-frame', priority: 0.8, changefreq: 'monthly' }
    ];

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    staticPages.forEach(page => {
      const lastmod = new Date().toISOString().split('T')[0];
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/${page.url}</loc>\n`;
      sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
      sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
      sitemap += `    <priority>${page.priority}</priority>\n`;
      sitemap += `  </url>\n`;
    });

    // Add product pages
    products.forEach(product => {
      const lastmod = new Date(product.updatedAt).toISOString().split('T')[0];
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/product/${product.id}</loc>\n`;
      sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.6</priority>\n`;
      sitemap += `  </url>\n`;
    });

    sitemap += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Robots.txt for search engine crawlers
// @route   GET /api/seo/robots.txt
// @access  Public
router.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *
Allow: /
Allow: /api/products
Disallow: /api/users
Disallow: /api/orders
Disallow: /api/payment
Disallow: /admin
Sitemap: ${process.env.BASE_URL || 'https://vitthalphotolframes.com'}/api/seo/sitemap.xml

User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1`;

  res.header('Content-Type', 'text/plain');
  res.send(robots);
});

module.exports = router;
