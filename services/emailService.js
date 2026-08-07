// services/emailService.js
import nodemailer from "nodemailer";
import {
  buildCustomerOrderEmail,
  buildAdminOrderNotificationEmail,
} from "./emailTemplates.js";

// Lazy init — avoids creating transporter before dotenv.config() runs in index.js (ESM evaluation order)
let _transporter = null;
const getTransporter = () => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }
  return _transporter;
};

export const sendCustomerOrderEmail = async (order) => {
  const to = order?.shippingAddress?.email;
  if (!to) {
    console.error("✗ Failed to send customer email: missing recipient address");
    return false;
  }

  try {
    const { subject, html } = buildCustomerOrderEmail(order, process.env.MAIL_USER);
    await getTransporter().sendMail({
      from: `"GiftUnwrap" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✓ Customer email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("✗ Failed to send customer email:", error.message);
    return false;
  }
};

export const sendAdminOrderNotification = async (order) => {
  const to = process.env.ADMIN_EMAIL;
  if (!to) {
    console.error("✗ Failed to send admin notification: ADMIN_EMAIL is not configured");
    return false;
  }

  try {
    const { subject, html } = buildAdminOrderNotificationEmail(order, process.env.MAIL_USER);
    await getTransporter().sendMail({
      from: `"GiftUnwrap" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✓ Admin email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("✗ Failed to send admin email:", error.message);
    return false;
  }
};
