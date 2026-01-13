import { Resend } from "resend";

function getResendInstance() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(apiKey);
}

// Send order confirmation email to customer
export async function sendOrderConfirmationToCustomer(
  email: string,
  orderNumber: string,
  orderDetails: {
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    discount: number;
    couponCode?: string;
    totalAmount: number;
    customerName: string;
    address: string;
  }
): Promise<void> {
  try {
    const itemsHtml = orderDetails.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toLocaleString()}</td>
      </tr>
    `
      )
      .join("");

    const resend = getResendInstance();
    await resend.emails.send({
      from: process.env.OWNER_EMAIL || "onboarding@resend.dev",
      to: email,
      subject: `Order Confirmation - ${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Order Confirmed!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Dear ${orderDetails.customerName || "Customer"},</p>
              <p>Thank you for your order! We have received your order and payment.</p>
              
              <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #667eea;">Order Details</h2>
                <p><strong>Order Number:</strong> ${orderNumber}</p>
                <p><strong>Delivery Address:</strong><br>${orderDetails.address}</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <thead>
                    <tr style="background: #f5f5f5;">
                      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                      <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Quantity</th>
                      <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" style="padding: 10px; text-align: right; border-top: 2px solid #ddd;">Subtotal:</td>
                      <td style="padding: 10px; text-align: right; border-top: 2px solid #ddd;">₹${orderDetails.subtotal.toLocaleString()}</td>
                    </tr>
                    ${orderDetails.discount > 0 ? `
                    <tr>
                      <td colspan="2" style="padding: 10px; text-align: right; color: #10b981;">Discount ${orderDetails.couponCode ? `(${orderDetails.couponCode})` : ''}:</td>
                      <td style="padding: 10px; text-align: right; color: #10b981; font-weight: bold;">-₹${orderDetails.discount.toLocaleString()}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;">Total:</td>
                      <td style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;">₹${orderDetails.totalAmount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <p>We will process your order and ship it soon. You will receive another email with tracking information once your order is shipped.</p>
              <p>If you have any questions, please feel free to contact us.</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>${process.env.NEXT_PUBLIC_APP_NAME || "magi.cofresin"}</strong>
              </p>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    throw error;
  }
}

// Send order notification email to owner
export async function sendOrderNotificationToOwner(
  orderNumber: string,
  orderDetails: {
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    discount: number;
    couponCode?: string;
    totalAmount: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    address: string;
  }
): Promise<void> {
  try {
    const ownerEmail = process.env.OWNER_EMAIL;
    if (!ownerEmail) {
      console.warn("OWNER_EMAIL not set, skipping owner notification");
      return;
    }

    const itemsHtml = orderDetails.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toLocaleString()}</td>
      </tr>
    `
      )
      .join("");

    const resend = getResendInstance();
    await resend.emails.send({
      from: process.env.OWNER_EMAIL || "onboarding@resend.dev",
      to: ownerEmail,
      subject: `New Order Received - ${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Order</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">New Order Received!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>You have received a new order:</p>
              
              <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #f5576c;">Order Information</h2>
                <p><strong>Order Number:</strong> ${orderNumber}</p>
                <p><strong>Customer Name:</strong> ${orderDetails.customerName || "N/A"}</p>
                <p><strong>Customer Phone:</strong> ${orderDetails.customerPhone}</p>
                <p><strong>Customer Email:</strong> ${orderDetails.customerEmail}</p>
                <p><strong>Delivery Address:</strong><br>${orderDetails.address}</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <thead>
                    <tr style="background: #f5f5f5;">
                      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                      <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Quantity</th>
                      <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" style="padding: 10px; text-align: right; border-top: 2px solid #ddd;">Subtotal:</td>
                      <td style="padding: 10px; text-align: right; border-top: 2px solid #ddd;">₹${orderDetails.subtotal.toLocaleString()}</td>
                    </tr>
                    ${orderDetails.discount > 0 ? `
                    <tr>
                      <td colspan="2" style="padding: 10px; text-align: right; color: #10b981;">Discount ${orderDetails.couponCode ? `(${orderDetails.couponCode})` : ''}:</td>
                      <td style="padding: 10px; text-align: right; color: #10b981; font-weight: bold;">-₹${orderDetails.discount.toLocaleString()}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;">Total:</td>
                      <td style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;">₹${orderDetails.totalAmount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <p style="color: #f5576c; font-weight: bold;">Please process this order as soon as possible.</p>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Error sending order notification to owner:", error);
    throw error;
  }
}

// Send admin password reset email
export async function sendAdminPasswordReset(
  adminEmail: string,
  password: string
): Promise<void> {
  try {
    const resend = getResendInstance();
    await resend.emails.send({
      from: process.env.OWNER_EMAIL || "onboarding@resend.dev",
      to: adminEmail,
      subject: "Admin Password Recovery - magi.cofresin",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin Password Recovery</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Password Recovery</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Hello Admin,</p>
              <p>You have requested to recover your admin panel password.</p>
              
              <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h2 style="margin-top: 0; color: #667eea;">Your Admin Password</h2>
                <p style="font-size: 18px; font-weight: bold; color: #333; background: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; letter-spacing: 2px;">
                  ${password}
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                <strong>Security Note:</strong> Please keep this password secure and do not share it with anyone. 
                If you did not request this password recovery, please contact the system administrator immediately.
              </p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>${process.env.NEXT_PUBLIC_APP_NAME || "magi.cofresin"} Admin System</strong>
              </p>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Error sending admin password reset email:", error);
    throw error;
  }
}

