// services/emailTemplates.js

// ─── Brand tokens (mirrored from the storefront palette) ─────────────────────
const B = {
  dark:       '#1F1F1F',
  body:       '#696C70',
  muted:      '#A0A0A0',
  heading:    '#1F1F1F',
  bgOuter:    '#F5F5F5',
  bgCard:     '#FFFFFF',
  bgWarm:     '#FBF4E8',
  bgRow:      '#F7F7F7',
  border:     '#E9E9E9',
  accent:     '#D2EF9A',
  white:      '#FFFFFF',
  name:       'Gift Unwrap',
  phone:      '+92 326 8927354',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const esc = (v) => {
  if (v === undefined || v === null) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const currency = (n) =>
  'PKR ' + Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const dateStr = (d) =>
  new Date(d || Date.now()).toLocaleDateString('en-PK', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

const payLabel = (m) => (m === 'creditCard' ? 'Credit Card' : 'Cash on Delivery');

// ─── Sub-components ──────────────────────────────────────────────────────────
const divider = () =>
  `<tr><td style="padding:0;"><div style="height:1px;background-color:${B.border};margin:0;"></div></td></tr>`;

const spacer = (h = 24) =>
  `<tr><td style="font-size:1px;line-height:${h}px;height:${h}px;">&nbsp;</td></tr>`;

const infoRow = (label, value) => `
  <tr>
    <td style="padding:8px 0;font-family:'Instrument Sans',Arial,sans-serif;font-size:14px;color:${B.body};width:50%;vertical-align:top;">${esc(label)}</td>
    <td style="padding:8px 0;font-family:'Instrument Sans',Arial,sans-serif;font-size:14px;color:${B.heading};font-weight:600;text-align:right;vertical-align:top;">${value}</td>
  </tr>`;

const itemsTable = (items = []) => {
  const rows = items.map((item, i) => `
    <tr style="background-color:${i % 2 === 0 ? B.bgCard : B.bgRow};">
      <td style="padding:14px 16px;font-family:'Instrument Sans',Arial,sans-serif;font-size:14px;color:${B.heading};border-bottom:1px solid ${B.border};">
        <span style="font-weight:600;">${esc(item.name)}</span>
      </td>
      <td style="padding:14px 16px;font-family:'Instrument Sans',Arial,sans-serif;font-size:14px;color:${B.body};text-align:center;border-bottom:1px solid ${B.border};">
        ×${esc(item.quantity)}
      </td>
      <td style="padding:14px 16px;font-family:'Instrument Sans',Arial,sans-serif;font-size:14px;color:${B.body};text-align:right;border-bottom:1px solid ${B.border};">
        ${currency(item.priceAtTimeOfOrder)}
      </td>
      <td style="padding:14px 16px;font-family:'Instrument Sans',Arial,sans-serif;font-size:14px;color:${B.heading};font-weight:600;text-align:right;border-bottom:1px solid ${B.border};">
        ${currency((item.priceAtTimeOfOrder || 0) * (item.quantity || 0))}
      </td>
    </tr>`).join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="border-collapse:collapse;border:1px solid ${B.border};border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background-color:${B.dark};">
          <th align="left"   style="padding:12px 16px;font-family:'Instrument Sans',Arial,sans-serif;font-size:11px;font-weight:600;color:${B.white};text-transform:uppercase;letter-spacing:0.08em;">Item</th>
          <th align="center" style="padding:12px 16px;font-family:'Instrument Sans',Arial,sans-serif;font-size:11px;font-weight:600;color:${B.white};text-transform:uppercase;letter-spacing:0.08em;">Qty</th>
          <th align="right"  style="padding:12px 16px;font-family:'Instrument Sans',Arial,sans-serif;font-size:11px;font-weight:600;color:${B.white};text-transform:uppercase;letter-spacing:0.08em;">Price</th>
          <th align="right"  style="padding:12px 16px;font-family:'Instrument Sans',Arial,sans-serif;font-size:11px;font-weight:600;color:${B.white};text-transform:uppercase;letter-spacing:0.08em;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
};

const totalsBlock = ({ subtotal, shippingCost, discountAmount, totalAmount }) => {
  const discountRow = discountAmount > 0 ? `
    <tr>
      <td style="padding:8px 16px;font-family:'Instrument Sans',Arial,sans-serif;font-size:14px;color:${B.body};text-align:right;">Discount</td>
      <td style="padding:8px 16px;font-family:'Instrument Sans',Arial,sans-serif;font-size:14px;color:${B.body};text-align:right;width:130px;">- ${currency(discountAmount)}</td>
    </tr>` : '';

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="border-collapse:collapse;border:1px solid ${B.border};border-radius:8px;overflow:hidden;margin-top:8px;">
      <tr>
        <td style="padding:10px 16px;font-family:'Instrument Sans',Arial,sans-serif;font-size:14px;color:${B.body};text-align:right;border-bottom:1px solid ${B.border};">Subtotal</td>
        <td style="padding:10px 16px;font-family:'Instrument Sans',Arial,sans-serif;font-size:14px;color:${B.heading};text-align:right;border-bottom:1px solid ${B.border};width:130px;">${currency(subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-family:'Instrument Sans',Arial,sans-serif;font-size:14px;color:${B.body};text-align:right;border-bottom:1px solid ${B.border};">Shipping</td>
        <td style="padding:10px 16px;font-family:'Instrument Sans',Arial,sans-serif;font-size:14px;color:${B.heading};text-align:right;border-bottom:1px solid ${B.border};">${shippingCost === 0 ? '<span style="color:#22a06b;font-weight:600;">Free</span>' : currency(shippingCost)}</td>
      </tr>
      ${discountRow}
      <tr style="background-color:${B.dark};">
        <td style="padding:14px 16px;font-family:'Instrument Sans',Arial,sans-serif;font-size:15px;font-weight:700;color:${B.white};text-align:right;">Order Total</td>
        <td style="padding:14px 16px;font-family:'Instrument Sans',Arial,sans-serif;font-size:15px;font-weight:700;color:${B.white};text-align:right;">${currency(totalAmount)}</td>
      </tr>
    </table>`;
};

const addressCard = (addr = {}) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="border-collapse:collapse;background-color:${B.bgWarm};border-radius:8px;border:1px solid ${B.border};">
    <tr>
      <td style="padding:20px 24px;">
        <p style="margin:0 0 4px;font-family:'Instrument Sans',Arial,sans-serif;font-size:11px;font-weight:700;color:${B.muted};text-transform:uppercase;letter-spacing:0.1em;">Delivery Address</p>
        <p style="margin:10px 0 0;font-family:'Instrument Sans',Arial,sans-serif;font-size:15px;font-weight:700;color:${B.heading};">${esc(addr.firstName)} ${esc(addr.lastName)}</p>
        <p style="margin:6px 0 0;font-family:'Instrument Sans',Arial,sans-serif;font-size:14px;color:${B.body};line-height:1.6;">
          ${esc(addr.street)}<br/>
          ${esc(addr.city)}, ${esc(addr.state)} ${esc(addr.postalCode)}<br/>
          ${esc(addr.country)}
          ${addr.additionalInfo ? `<br/>${esc(addr.additionalInfo)}` : ''}
        </p>
        <p style="margin:10px 0 0;font-family:'Instrument Sans',Arial,sans-serif;font-size:14px;color:${B.body};">
          📞 ${esc(addr.phone)}
        </p>
      </td>
    </tr>
  </table>`;

const statusBadge = (status) => {
  const map = {
    pending:    { bg: '#FBF4E8', text: '#92600E', label: 'Pending' },
    processing: { bg: '#EBF5FB', text: '#1A6A96', label: 'Processing' },
    shipped:    { bg: '#F0FFF4', text: '#22543D', label: 'Shipped' },
    delivered:  { bg: '#D2EF9A', text: '#2F5E00', label: 'Delivered' },
  };
  const s = map[status] || map.pending;
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background-color:${s.bg};color:${s.text};font-family:'Instrument Sans',Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">${s.label}</span>`;
};

// ─── Email wrapper ────────────────────────────────────────────────────────────
const wrapper = (body, contactEmail) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>Gift Unwrap</title>
</head>
<body style="margin:0;padding:0;background-color:${B.bgOuter};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${B.bgOuter};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
          style="max-width:600px;width:100%;background-color:${B.bgCard};border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

          <!-- HEADER -->
          <tr>
            <td style="background-color:${B.dark};padding:28px 40px;text-align:center;">
              <p style="margin:0;font-family:'Instrument Sans',Arial,sans-serif;font-size:11px;font-weight:700;color:${B.muted};letter-spacing:0.18em;text-transform:uppercase;">✦ Pakistan's Most Unique Gift Shop ✦</p>
              <h1 style="margin:8px 0 0;font-family:'Instrument Sans',Arial,sans-serif;font-size:30px;font-weight:800;color:${B.white};letter-spacing:0.06em;text-transform:uppercase;">Gift Unwrap</h1>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${body}
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:${B.dark};padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-family:'Instrument Sans',Arial,sans-serif;font-size:13px;color:${B.muted};">
                Questions? Call or WhatsApp us at <a href="tel:${B.phone}" style="color:${B.accent};text-decoration:none;font-weight:600;">${B.phone}</a>
              </p>
              ${contactEmail ? `<p style="margin:0 0 6px;font-family:'Instrument Sans',Arial,sans-serif;font-size:13px;color:${B.muted};">Or email <a href="mailto:${esc(contactEmail)}" style="color:${B.accent};text-decoration:none;">${esc(contactEmail)}</a></p>` : ''}
              <p style="margin:12px 0 0;font-family:'Instrument Sans',Arial,sans-serif;font-size:11px;color:#444444;">&copy; ${new Date().getFullYear()} Gift Unwrap. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ─── Customer Order Confirmation ──────────────────────────────────────────────
const customerBody = (order) => {
  const { shippingAddress: a = {}, orderItems = [], subtotal, shippingCost, discountAmount, totalAmount, paymentDetails = {}, _id, createdAt, status = 'pending' } = order;

  return `
    ${spacer(4)}

    <!-- Greeting -->
    <tr>
      <td>
        <p style="margin:0;font-family:'Instrument Sans',Arial,sans-serif;font-size:22px;font-weight:700;color:${B.heading};">Hey ${esc(a.firstName)},<br/>your order is confirmed! 🎁</p>
        <p style="margin:12px 0 0;font-family:'Instrument Sans',Arial,sans-serif;font-size:15px;color:${B.body};line-height:1.6;">
          Thank you for shopping with Gift Unwrap. We've received your order and our team will start preparing it right away.
        </p>
      </td>
    </tr>

    ${spacer(24)}
    ${divider()}
    ${spacer(20)}

    <!-- Order meta -->
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="background-color:${B.bgWarm};border-radius:8px;border:1px solid ${B.border};">
          <tr>
            <td style="padding:20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:'Instrument Sans',Arial,sans-serif;font-size:11px;font-weight:700;color:${B.muted};text-transform:uppercase;letter-spacing:0.1em;padding-bottom:12px;" colspan="2">Order Details</td>
                </tr>
                ${infoRow('Order Number', `<span style="font-family:monospace;font-size:13px;background:#fff;padding:2px 8px;border-radius:4px;border:1px solid ${B.border};">#${esc(_id)}</span>`)}
                ${infoRow('Order Date', esc(dateStr(createdAt)))}
                ${infoRow('Payment Method', esc(payLabel(paymentDetails.method)))}
                ${infoRow('Status', statusBadge(status))}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${spacer(28)}

    <!-- Items heading -->
    <tr>
      <td>
        <p style="margin:0 0 12px;font-family:'Instrument Sans',Arial,sans-serif;font-size:11px;font-weight:700;color:${B.muted};text-transform:uppercase;letter-spacing:0.1em;">Order Items</p>
        ${itemsTable(orderItems)}
      </td>
    </tr>

    ${spacer(12)}

    <!-- Totals -->
    <tr>
      <td>
        ${totalsBlock({ subtotal, shippingCost, discountAmount, totalAmount })}
      </td>
    </tr>

    ${spacer(28)}

    <!-- Address -->
    <tr>
      <td>${addressCard(a)}</td>
    </tr>

    ${spacer(28)}
    ${divider()}
    ${spacer(20)}

    <!-- Support note -->
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="background-color:${B.bgRow};border-radius:8px;border-left:4px solid ${B.accent};">
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0;font-family:'Instrument Sans',Arial,sans-serif;font-size:14px;color:${B.body};line-height:1.6;">
                Need to make changes or have a customization request? Our team will reach out to confirm your order shortly. You can also contact us anytime via call or WhatsApp at <strong style="color:${B.heading};">${B.phone}</strong>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${spacer(20)}
  `;
};

// ─── Admin New Order Notification ─────────────────────────────────────────────
const adminBody = (order) => {
  const { shippingAddress: a = {}, orderItems = [], subtotal, shippingCost, discountAmount, totalAmount, paymentDetails = {}, _id, createdAt, status = 'pending' } = order;

  return `
    ${spacer(4)}

    <!-- Alert banner -->
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="background-color:${B.accent};border-radius:8px;">
          <tr>
            <td style="padding:16px 24px;text-align:center;">
              <p style="margin:0;font-family:'Instrument Sans',Arial,sans-serif;font-size:16px;font-weight:700;color:${B.dark};">🛍️ &nbsp;New Order Received</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${spacer(24)}

    <!-- Order meta -->
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="background-color:${B.bgWarm};border-radius:8px;border:1px solid ${B.border};">
          <tr>
            <td style="padding:20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:'Instrument Sans',Arial,sans-serif;font-size:11px;font-weight:700;color:${B.muted};text-transform:uppercase;letter-spacing:0.1em;padding-bottom:12px;" colspan="2">Order Info</td>
                </tr>
                ${infoRow('Order Number', `<span style="font-family:monospace;font-size:13px;background:#fff;padding:2px 8px;border-radius:4px;border:1px solid ${B.border};">#${esc(_id)}</span>`)}
                ${infoRow('Date', esc(dateStr(createdAt)))}
                ${infoRow('Payment', esc(payLabel(paymentDetails.method)))}
                ${infoRow('Status', statusBadge(status))}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${spacer(24)}

    <!-- Customer info -->
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="border-radius:8px;border:1px solid ${B.border};">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-family:'Instrument Sans',Arial,sans-serif;font-size:11px;font-weight:700;color:${B.muted};text-transform:uppercase;letter-spacing:0.1em;">Customer</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${infoRow('Name',   `${esc(a.firstName)} ${esc(a.lastName)}`)}
                ${infoRow('Email',  `<a href="mailto:${esc(a.email)}" style="color:${B.dark};text-decoration:none;">${esc(a.email)}</a>`)}
                ${infoRow('Phone',  `<a href="tel:${esc(a.phone)}" style="color:${B.dark};text-decoration:none;">${esc(a.phone)}</a>`)}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${spacer(16)}

    <!-- Address -->
    <tr>
      <td>${addressCard(a)}</td>
    </tr>

    ${spacer(24)}

    <!-- Items heading -->
    <tr>
      <td>
        <p style="margin:0 0 12px;font-family:'Instrument Sans',Arial,sans-serif;font-size:11px;font-weight:700;color:${B.muted};text-transform:uppercase;letter-spacing:0.1em;">Order Items</p>
        ${itemsTable(orderItems)}
      </td>
    </tr>

    ${spacer(12)}

    <!-- Totals -->
    <tr>
      <td>
        ${totalsBlock({ subtotal, shippingCost, discountAmount, totalAmount })}
      </td>
    </tr>

    ${spacer(20)}
  `;
};

// ─── Public exports ───────────────────────────────────────────────────────────
export const buildCustomerOrderEmail = (order, contactEmail) => ({
  subject: `Order Confirmed ✓ — #${order._id} | Gift Unwrap`,
  html: wrapper(customerBody(order), contactEmail),
});

export const buildAdminOrderNotificationEmail = (order, contactEmail) => ({
  subject: `🛍️ New Order #${order._id} — ${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`,
  html: wrapper(adminBody(order), contactEmail),
});
