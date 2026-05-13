// utils/sendOrderEmail.js
import dotenv from "dotenv";
dotenv.config(); 
import nodemailer from "nodemailer";

console.log('Password being used:', process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOrderEmail = async (to, name, orderId, orderItems, totalAmount) => {
  const itemsHtml = orderItems
    .map(
      (item) => `
      <li>
        <strong>Item name: ${item.name}</strong><br/> 
        Quantity: ${item.quantity}<br/>
        Price: PKR${item.priceAtTimeOfOrder.toFixed(2)}
      </li>`
    )
    .join("");

  const htmlContent = `
    <div style="font-family:sans-serif; line-height:1.5;">
      <h2>Hey ${name},</h2>
      <p>Thank you for placing an order with GiftUnwrap. We are pleased to confirm the receipt of your order <strong>#${orderId}</strong>.</p>
      <h3>Order Summary:</h3>
      <ul>${itemsHtml}</ul>
      <p><strong>Total:</strong> PKR${totalAmount.toFixed(2)}</p>
      <p>For any customizations, feel free to contact us at <strong> +92 313 0216931 </strong> via call or WhatsApp. Our team will also be reaching out to you shortly for confirmation or to discuss any customization requests.</p>
      <br/>
      <p>Best regards,<br/>GiftUnwrap Team</p>
    </div>
  `;

  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log(
    "EMAIL_PASS:",
    process.env.EMAIL_PASS ? "✔ Loaded" : "❌ Missing"
  );

  await transporter.sendMail({
    from: `"GiftUnwrap" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Your GiftUnwrap Order #${orderId} is Confirmed!`,
    html: htmlContent,
  });
};

export default sendOrderEmail;