const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const { sendEmail } = require('../services/emailService');

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof subject !== 'string' || typeof message !== 'string') {
      return res.status(400).json({ message: 'Invalid form payload' });
    }

    if (message.length > 2000 || subject.length > 200) {
      return res.status(413).json({ message: 'Payload too large' });
    }

    const contact = await prisma.contactForm.create({
      data: {
        name,
        email,
        phone,
        subject,
        message
      }
    });

    // Send confirmation email to user
    sendEmail(email, 'contactConfirmation', { name, subject }).catch(err => console.error('Email failed:', err));

    // Send notification to admin
    const settings = await prisma.settings.findFirst();
    sendEmail(settings?.contactEmail || 'vitthalphotos99@gmail.com', 'newContact', { name, email, subject, message }).catch(err => console.error('Admin email failed:', err));

    res.status(201).json({ ...contact, _id: contact.id, message: 'We received your message. We\'ll get back to you soon!' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting form', error: error.message });
  }
});

// @desc    Get all contact submissions (Admin)
// @route   GET /api/contact
// @access  Private - Admin
router.get('/', protect, requireAdmin, async (req, res) => {
  try {

    const contacts = await prisma.contactForm.findMany({
      orderBy: { createdAt: 'desc' }
    });
    const mapped = contacts.map(c => ({ ...c, _id: c.id }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contacts', error: error.message });
  }
});

// @desc    Update contact status / add response (Admin)
// @route   PUT /api/contact/:id
// @access  Private - Admin
router.put('/:id', protect, requireAdmin, async (req, res) => {
  try {

    const { status, response } = req.body;
    const contact = await prisma.contactForm.findUnique({ where: { id: req.params.id } });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    const updated = await prisma.contactForm.update({
      where: { id: req.params.id },
      data: {
        status: status || undefined,
        response: response || undefined
      }
    });

    // Send response email if provided
    if (response) {
      sendEmail(contact.email, 'contactResponse', { name: contact.name, message: response }).catch(err => console.error('Response email failed:', err));
    }

    res.json({ ...updated, _id: updated.id });
  } catch (error) {
    res.status(500).json({ message: 'Error updating contact', error: error.message });
  }
});

// @desc    Delete contact submission (Admin)
// @route   DELETE /api/contact/:id
// @access  Private - Admin
router.delete('/:id', protect, requireAdmin, async (req, res) => {
  try {

    await prisma.contactForm.delete({ where: { id: req.params.id } });
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting contact', error: error.message });
  }
});

module.exports = router;
