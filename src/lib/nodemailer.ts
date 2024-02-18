import dotenv from "dotenv"

dotenv.config({});

import nodemailer from "nodemailer";

interface ISendEmail {
  to: string;
  subject: string;
  html: string;
}
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }: ISendEmail) => {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    html: html,
  });
  return info;
};
