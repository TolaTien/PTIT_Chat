import nodemailer from "nodemailer";

export const sendMail = async (to: string, subject: string, html: string) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("EMAIL_USER or EMAIL_PASS is not configured.");
        return false;
    }

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"PTIT Chat Support" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
        return true;
    } catch (error) {
        console.log("Error sending email: ", error);
        return false;
    }
};

export const getOTPTemplate = (otp: string, name: string = "Người dùng") => {
    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mã OTP</title>
        <style>
            body {
                margin: 0;
                padding: 24px;
                background: #ffffff;
                color: #111827;
                font-family: Arial, Helvetica, sans-serif;
                line-height: 1.6;
            }
            .container {
                max-width: 520px;
                margin: 0 auto;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 24px;
            }
            h1 {
                margin: 0 0 16px;
                font-size: 20px;
                font-weight: 700;
            }
            p {
                margin: 0 0 12px;
                font-size: 14px;
            }
            .otp-code {
                margin: 20px 0;
                padding: 14px 16px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: 6px;
                text-align: center;
            }
            .note {
                color: #6b7280;
                font-size: 13px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Mã OTP của bạn</h1>
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Vui lòng dùng mã OTP dưới đây để tiếp tục:</p>
            <div class="otp-code">${otp}</div>
            <p class="note">Mã OTP có hiệu lực trong 5 phút.</p>
            <p class="note">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
        </div>
    </body>
    </html>
    `;
};
