import nodemailer from "nodemailer";

// Create transporter for Mandrill SMTP with new credentials
export const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.mandrillapp.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || "Athlekt",
      pass: process.env.EMAIL_PASS || "md-2bFOzTgMNPHJH1Wi0AcvJg"
    }
  });
};

// New function for sending form submission emails
export const sendFormSubmissionEmail = async (formData) => {
  try {
    console.log("📧 Attempting to send form submission email to:", formData.email);

    const transporter = createTransporter();

    const subject = "Welcome to the Athlekt Family!";
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
        <div style="background-color: #2a2a2a; padding: 30px; text-align: center;">
          <h1 style="color: #cbf26c; margin: 0; font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
            ATHLEKT
          </h1>
        </div>
        
        <div style="padding: 30px; background-color: white;">
          <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">
            Welcome to the Athlekt Family! 🏋️‍♂️
          </h2>
          
          <p style="color: #666; margin-bottom: 20px; line-height: 1.6;">
            Thank you for joining the Athlekt family! We're excited to have you on board.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 15px; font-size: 18px;">Your Information:</h3>
            <p style="color: #666; margin: 5px 0;"><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Email:</strong> ${formData.email}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Phone:</strong> ${formData.phone}</p>
          </div>
          
          <p style="color: #666; margin-bottom: 20px; line-height: 1.6;">
            We'll keep you updated with the latest news, exclusive offers, and fitness tips to help you achieve your goals.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://athlekt.com/collection" style="background-color: #cbf26c; color: #2a2a2a; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
              EXPLORE OUR PRODUCTS
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
            Thank you for choosing Athlekt! 
          </p>
        </div>
        
        <div style="background-color: #2a2a2a; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            © 2024 Athlekt. All rights reserved.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "marketing@athlekt.com",
      to: formData.email,
      subject: subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Form submission email sent successfully to ${formData.email}`);
    return true;
  } catch (error) {
    console.error("Form submission email sending error:", error);
    return false;
  }
};

export const sendOTPEmail = async (email, otp, type = "verification") => {
  try {
    console.log("📧 Attempting to send email to:", email);

    const transporter = createTransporter();

    const subject = type === "verification" 
      ? "Email Verification - Athlekt" 
      : "Password Reset - Athlekt";
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Athlekt</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h3 style="color: #333; margin-bottom: 20px;">
            ${type === "verification" ? "Email Verification" : "Password Reset"}
          </h3>
          <p style="color: #666; margin-bottom: 20px;">
            ${type === "verification" 
              ? "Please verify your email address by entering the OTP below:" 
              : "Please use the OTP below to reset your password:"}
          </p>
          <div style="background-color: #007bff; color: white; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 14px;">
            This OTP will expire in 10 minutes.
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "marketing@athlekt.com",
      to: email,
      subject: subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    // For development, still return true and log the OTP
    console.log(`📧 OTP for ${email}: ${otp} (Email failed - check console)`);
    return true; // Return true for testing
  }
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function for sending order receipt emails (Professional Receipt Format)
export const sendOrderConfirmationEmail = async (order) => {
  try {
    console.log("📧 Attempting to send order receipt email to:", order.customer.email);

    const transporter = createTransporter();

    const subject = `Order Receipt - ${order.orderNumber}`;
    
    // Format order date
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #2a2a2a; padding: 30px; text-align: center;">
          <h1 style="color: #cbf26c; margin: 0; font-size: 32px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
            ATHLEKT
          </h1>
          <p style="color: #cbf26c; margin: 10px 0 0 0; font-size: 16px;">Your Fitness Partner</p>
        </div>
        
        <!-- Receipt Title -->
        <div style="padding: 30px; background-color: white; border-bottom: 3px solid #cbf26c;">
          <h2 style="color: #333; margin: 0; font-size: 28px; text-align: center;">
            ORDER RECEIPT
          </h2>
          <p style="color: #666; text-align: center; margin: 10px 0 0 0; font-size: 16px;">
            Thank you for your purchase! Your payment has been confirmed.
          </p>
        </div>
        
        <!-- Order & Customer Info -->
        <div style="padding: 30px; background-color: white;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div style="flex: 1; margin-right: 20px;">
              <h3 style="color: #333; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid #cbf26c; padding-bottom: 5px;">Order Information</h3>
              <p style="color: #666; margin: 8px 0;"><strong>Receipt #:</strong> ${order.orderNumber}</p>
              <p style="color: #666; margin: 8px 0;"><strong>Order Date:</strong> ${orderDate}</p>
              <p style="color: #666; margin: 8px 0;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">${order.status.toUpperCase()}</span></p>
              <p style="color: #666; margin: 8px 0;"><strong>Payment:</strong> <span style="color: #28a745; font-weight: bold;">PAID</span></p>
            </div>
            <div style="flex: 1; margin-left: 20px;">
              <h3 style="color: #333; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid #cbf26c; padding-bottom: 5px;">Billing Information</h3>
              <p style="color: #666; margin: 8px 0;"><strong>Name:</strong> ${order.customer.name}</p>
              <p style="color: #666; margin: 8px 0;"><strong>Email:</strong> ${order.customer.email}</p>
              <p style="color: #666; margin: 8px 0;"><strong>Phone:</strong> ${order.customer.phone}</p>
              ${order.customer.address ? `
                <p style="color: #666; margin: 8px 0;"><strong>Address:</strong></p>
                <p style="color: #666; margin: 2px 0; padding-left: 10px;">${order.customer.address.street}</p>
                <p style="color: #666; margin: 2px 0; padding-left: 10px;">${order.customer.address.city}, ${order.customer.address.state} ${order.customer.address.zipCode}</p>
              ` : ''}
            </div>
          </div>
          
          <!-- Items Table -->
          <div style="margin: 30px 0;">
            <h3 style="color: #333; margin-bottom: 20px; font-size: 20px; border-bottom: 2px solid #cbf26c; padding-bottom: 8px;">Items Purchased</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="border: 1px solid #ddd; padding: 12px; text-align: left; color: #333;">Item</th>
                  <th style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #333;">Size</th>
                  <th style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #333;">Color</th>
                  <th style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #333;">Qty</th>
                  <th style="border: 1px solid #ddd; padding: 12px; text-align: right; color: #333;">Price</th>
                  <th style="border: 1px solid #ddd; padding: 12px; text-align: right; color: #333;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 12px; color: #666;"><strong>${item.productName}</strong></td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #666;">${item.variant?.size || 'Standard'}</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #666;">${item.variant?.color || 'Default'}</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #666;">${item.quantity}</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: right; color: #666;">AED ${item.price.toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: right; color: #666; font-weight: bold;">AED ${item.totalPrice.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Order Summary -->
          <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #333; margin-bottom: 20px; font-size: 20px; text-align: center;">Order Summary</h3>
            <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #ddd;">
              <span style="color: #666;">Subtotal:</span>
              <span style="color: #666; font-weight: bold;">AED ${order.subtotal.toFixed(2)}</span>
            </div>
            ${order.bundleDiscount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #ddd;">
                <span style="color: #28a745;">Bundle Discount:</span>
                <span style="color: #28a745; font-weight: bold;">-AED ${order.bundleDiscount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #ddd;">
              <span style="color: #666;">Shipping:</span>
              <span style="color: #666; font-weight: bold;">${order.shippingCost === 0 ? 'FREE' : `AED ${order.shippingCost.toFixed(2)}`}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 20px 0 10px 0; padding: 15px 0; border-top: 2px solid #cbf26c; border-bottom: 2px solid #cbf26c;">
              <span style="color: #333; font-size: 18px; font-weight: bold;">TOTAL PAID:</span>
              <span style="color: #333; font-size: 18px; font-weight: bold;">AED ${order.total.toFixed(2)}</span>
            </div>
          </div>
          
          <!-- Next Steps -->
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #cbf26c;">
            <h4 style="color: #333; margin: 0 0 10px 0;">What's Next?</h4>
            <p style="color: #666; margin: 5px 0;">✅ Your payment has been confirmed</p>
            <p style="color: #666; margin: 5px 0;">📦 We're preparing your order for shipment</p>
            <p style="color: #666; margin: 5px 0;">📧 You'll receive tracking information once shipped</p>
          </div>
          
          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background-color: #cbf26c; color: #2a2a2a; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block; font-size: 16px;">
              TRACK YOUR ORDER
            </a>
          </div>
          
          <!-- Footer Message -->
          <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center; line-height: 1.6;">
            Thank you for choosing Athlekt! <br>
            Keep this receipt for your records. If you have any questions, please contact our customer support.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #2a2a2a; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            © 2024 Athlekt. All rights reserved. | This is your official receipt.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "marketing@athlekt.com",
      to: order.customer.email,
      bcc: process.env.TO_EMAIL_SUBMISSIONS, // BCC to admin for order notifications
      subject: subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Order receipt sent successfully to ${order.customer.email}`);
    return true;
  } catch (error) {
    console.error("Order receipt sending error:", error);
    return false;
  }
}; 