import { IBuyer } from "../models/buyer.model"
import { IOrderPopulated } from "../models/order.model"

export const order_placed_email_template_buyer = ({ order}:{order: IOrderPopulated}) => {
    return`<!DOCTYPE html>
    <html>
    <head>
        <title>Order Confirmation - Wafipix</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .email-container {
                width: 80%;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 10px;
            }
            .email-header {
                text-align: center;
                padding: 20px;
                background-color: #007BFF;
                color: #ffffff;
            }
            .email-body {
                padding: 20px;
            }
            .email-footer {
                text-align: center;
                padding: 20px;
                background-color: #f4f4f4;
                color: #333333;
            }
            .order-details {
                margin-top: 20px;
            }
            .order-details h3 {
                margin-bottom: 10px;
            }
            .order-details p {
                margin-bottom: 10px;
            }
            .features-list {
                list-style-type: disc;
                padding-left: 20px;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <h1>Congrats! Your order Placed Successfuly!</h1>
            </div>
            <div class="email-body">
                <p>Dear ${order.buyer.name},</p>
                <p>Thank you for placing your order with Wafipix. We're excited to inform you that your order has been successfully placed and is now being processed.</p>
                <div class="order-details">
                    <h3>Order Details:</h3>
                    <p>Order ID: ${order._id}</p>
                    <p>Package: ${order.packageOption.title}</p>
                    <p>price: ${order.packageOption.price_bdt} BDT</p>
                    <ul class="features-list">
                    <p>You will get:</p>
                        ${order?.packageOption?.features?.map(feature => {
                            return (
                                `<li>${feature}</li>`
                            )
                        }).join('')}
                    </ul>
                </div>
                <p>We will contact you as soon as possible to provide further details and confirm the delivery date. If you have any questions or need assistance, please feel free to contact us at ${process.env.PHONE} .</p>
                <p>Jazakumullah Khair! for choosing Wafipix. We look forward to serving you.</p>
                <p>Best regards,</p>
                <p>Habibur Rahman</p>
                <p>CEO</p>
                <p>Wafipix</p>
                <p>Chittagong, Bangladesh.</p>
                <p>Email: info@wafipix.com</p>
                <p>Phone: ${process.env.PHONE}</p>
            </div>
            <div class="email-footer">
                <p>&copy; ${(new Date()).getFullYear()} Wafipix. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `
  }