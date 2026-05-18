const emailService = require('./emailService');
const smsService = require('./smsService');

/**
 * Send order notifications based on status
 */
const sendOrderNotification = async (order, status, trackingInfo = null) => {
  const { email, phone, customerName, id } = order;

  const notifications = {
    'pending': {
      subject: `Order Confirmed - #${id}`,
      message: `Dear ${customerName}, your order has been confirmed. We'll process it soon!`,
      emailTemplate: `
        <h2>Order Confirmed!</h2>
        <p>Dear ${customerName},</p>
        <p>Thank you for your order! Order ID: <strong>#${id}</strong></p>
        <p>Your order is being processed and will be shipped soon.</p>
        <p>We'll send you a shipping update shortly.</p>
      `
    },
    'processing': {
      subject: `Order Processing - #${id}`,
      message: `Hi ${customerName}, your order #${id} is being processed.`,
      emailTemplate: `
        <h2>Order Processing</h2>
        <p>Dear ${customerName},</p>
        <p>Your order #${id} is being prepared for shipment.</p>
        <p>We'll notify you as soon as it ships.</p>
      `
    },
    'shipped': {
      subject: `Order Shipped - #${id}`,
      message: `Your order #${id} has been shipped! ${trackingInfo ? `Tracking: ${trackingInfo}` : ''}`,
      emailTemplate: `
        <h2>Order Shipped!</h2>
        <p>Dear ${customerName},</p>
        <p>Great news! Your order #${id} has been shipped.</p>
        ${trackingInfo ? `<p>Tracking Information: <strong>${trackingInfo}</strong></p>` : ''}
        <p>You can track your package using the link above.</p>
      `
    },
    'delivered': {
      subject: `Order Delivered - #${id}`,
      message: `Your order #${id} has been delivered!`,
      emailTemplate: `
        <h2>Order Delivered!</h2>
        <p>Dear ${customerName},</p>
        <p>Your order #${id} has been successfully delivered.</p>
        <p>Thank you for shopping with us! Please review your purchase.</p>
      `
    },
    'cancelled': {
      subject: `Order Cancelled - #${id}`,
      message: `Your order #${id} has been cancelled.`,
      emailTemplate: `
        <h2>Order Cancelled</h2>
        <p>Dear ${customerName},</p>
        <p>Your order #${id} has been cancelled.</p>
        <p>If you have questions, please contact us.</p>
      `
    },
    'returned': {
      subject: `Return Processed - #${id}`,
      message: `Your return for order #${id} has been processed and refunded.`,
      emailTemplate: `
        <h2>Return Processed</h2>
        <p>Dear ${customerName},</p>
        <p>Your return for order #${id} has been approved and processed.</p>
        <p>The refund will be credited to your original payment method within 5-7 business days.</p>
      `
    }
  };

  const notification = notifications[status];
  if (!notification) return;

  try {
    // Send email
    if (email) {
      await emailService.sendOrderNotification(email, notification.subject, notification.emailTemplate);
    }

    // Send SMS
    if (phone) {
      console.log(`📱 Attempting to send SMS to ${phone}...`);
      await smsService.sendOrderNotification(phone, notification.message);
    } else {
      console.log('⚠️ No phone number found for order notification');
    }
  } catch (error) {
    console.error(`Error sending ${status} notification for order ${id}:`, error);
  }
};

/**
 * Send admin notification about new orders
 */
const notifyAdminNewOrder = async (order, adminEmails = []) => {
  try {
    const adminEmail = adminEmails[0] || process.env.ADMIN_EMAIL || 'admin@vitthalphotolframes.com';
    
    const emailTemplate = `
      <h2>New Order Received!</h2>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Customer:</strong> ${order.customerName}</p>
      <p><strong>Email:</strong> ${order.email}</p>
      <p><strong>Amount:</strong> ₹${order.totalPrice}</p>
      <p><strong>Items:</strong> ${order.orderItems?.length || 0}</p>
      <p><a href="${process.env.BASE_URL}/admin?tab=orders&id=${order.id}">View Order</a></p>
    `;

    await emailService.sendOrderNotification(
      adminEmail,
      `New Order #${order.id}`,
      emailTemplate
    );

    // Send Admin SMS Notification
    const adminPhone = process.env.ADMIN_PHONE;
    if (adminPhone) {
      const adminSmsMessage = `New Order Received! Order ID: #${order.id}, Customer: ${order.customerName}, Total: ₹${order.totalPrice}`;
      await smsService.sendSMS(adminPhone, adminSmsMessage);
    }
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
};

/**
 * Send review reminder to customer
 */
const sendReviewReminder = async (order) => {
  try {
    if (!order.email) return;

    const emailTemplate = `
      <h2>Please Review Your Purchase</h2>
      <p>Dear ${order.customerName},</p>
      <p>We hope you enjoyed your purchase! Your reviews help us improve.</p>
      <p><a href="${process.env.BASE_URL}/reviews?orderId=${order.id}">Leave a Review</a></p>
    `;

    await emailService.sendOrderNotification(
      order.email,
      `Review Your Order #${order.id}`,
      emailTemplate
    );
  } catch (error) {
    console.error('Error sending review reminder:', error);
  }
};

module.exports = {
  sendOrderNotification,
  notifyAdminNewOrder,
  sendReviewReminder
};
