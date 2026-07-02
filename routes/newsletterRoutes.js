const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const { sendEmail } = require('../services/emailService');

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    if (email.length > 254) {
      return res.status(413).json({ message: 'Email too long' });
    }

    // Check if already subscribed
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(400).json({ message: 'This email is already subscribed' });
    }

    // Create subscriber
    const subscriber = await prisma.newsletterSubscriber.create({
      data: { email, isActive: true }
    });

    // Send welcome email
    const welcomeTemplate = `
      <h2>Welcome to Vitthal Photo Frames!</h2>
      <p>Thank you for subscribing to our newsletter.</p>
      <p>You'll now receive updates on:</p>
      <ul>
        <li>New divine and warrior frame collections</li>
        <li>Exclusive offers and discounts</li>
        <li>Limited edition releases</li>
        <li>Cultural stories and inspiration</li>
      </ul>
      <p>Jai Maharashtra!</p>
    `;

    sendEmail(email, 'Welcome to Vitthal Photo Frames Newsletter', welcomeTemplate)
      .catch(err => console.error('Welcome email failed:', err));

    res.status(201).json({ 
      message: 'Successfully subscribed to newsletter!',
      subscriber: { email: subscriber.email, _id: subscriber.id }
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ message: 'Error subscribing to newsletter' });
  }
});

// @desc    Get all subscribers (Admin only)
// @route   GET /api/newsletter
// @access  Private - Admin
router.get('/', protect, requireAdmin, async (req, res) => {
  try {

    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const mapped = subscribers.map(s => ({ 
      ...s, 
      _id: s.id,
      subscriptionDate: s.createdAt 
    }));

    res.json({
      total: subscribers.length,
      active: subscribers.filter(s => s.isActive).length,
      subscribers: mapped
    });

  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ message: 'Error fetching subscribers' });
  }
});

// @desc    Unsubscribe from newsletter
// @route   POST /api/newsletter/unsubscribe
// @access  Public
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email }
    });

    if (!subscriber) {
      return res.status(404).json({ message: 'Email not found in newsletter' });
    }

    // Deactivate instead of delete (for audit trail)
    await prisma.newsletterSubscriber.update({
      where: { email },
      data: { isActive: false }
    });

    res.json({ message: 'You have been unsubscribed from the newsletter' });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ message: 'Error unsubscribing' });
  }
});

// @desc    Send newsletter to all subscribers (Admin only)
// @route   POST /api/newsletter/send
// @access  Private - Admin
router.post('/send', protect, requireAdmin, async (req, res) => {
  try {

    const { subject, message, template } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    // Get all active subscribers
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true }
    });

    if (subscribers.length === 0) {
      return res.status(400).json({ message: 'No active subscribers' });
    }

    const emailTemplate = template || `
      <h2>${subject}</h2>
      <p>${message}</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #888;">
        <a href="http://localhost:5000/api/newsletter/unsubscribe?email=YOUR_EMAIL" style="color: #fa873b;">Unsubscribe</a>
      </p>
    `;

    // Send emails (non-blocking)
    subscribers.forEach(subscriber => {
      sendEmail(subscriber.email, subject, emailTemplate)
        .catch(err => console.error(`Failed to send to ${subscriber.email}:`, err));
    });

    res.json({ 
      message: `Newsletter sent to ${subscribers.length} subscribers`,
      count: subscribers.length
    });

  } catch (error) {
    console.error('Error sending newsletter:', error);
    res.status(500).json({ message: 'Error sending newsletter' });
  }
});

// @desc    Delete subscriber (Admin only)
// @route   DELETE /api/newsletter/:email
// @access  Private - Admin
router.delete('/:email', protect, requireAdmin, async (req, res) => {
  try {

    await prisma.newsletterSubscriber.delete({
      where: { email: req.params.email }
    });

    res.json({ message: 'Subscriber removed' });

  } catch (error) {
    console.error('Error deleting subscriber:', error);
    res.status(500).json({ message: 'Error deleting subscriber' });
  }
});

module.exports = router;
