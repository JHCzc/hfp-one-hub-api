const nodemailer = require("nodemailer");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

// SMTP transporter without authentication
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com", // Replace with your SMTP server's hostname
  port: 587, // Common port for unauthenticated SMTP
  secure: false, // Set to true if using port 465 with SSL
  auth: {
    user: "asn-sender@helerfoods.com",
    pass: "JHCas73.059!",
  },
 
});

const sendEmail = async (req, res) => {
  const { recipient, subject, message } = req.body;
  const file = req.file;
  if (!recipient || !subject || !file) {
    return res.status(400).json({
      message:
        "Invalid request. Missing required fields or data is not an array.",
    });
  }

  const mailOptions = {
    from: "asn-sender@helerfoods.com",
    to: recipient,
    subject: subject,
    text: message,
    attachments: [
      {
        filename: file.originalname,
        path: path.resolve(file.path),
      },
    ],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ message: "Failed to send email.", error });
    }

    // Delete the uploaded file after sending the email
    const fs = require("fs");
    fs.unlink(file.path, (err) => {
      if (err) console.error("Error deleting uploaded file:", err);
    });

    res.status(200).json({ message: "Email sent successfully.", info });
  });
};

module.exports = { sendEmail };
