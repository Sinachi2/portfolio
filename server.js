const express = require("express");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5001;


// ============================================
// MIDDLEWARE
// ============================================

// NOTE: origin: "*" works for local testing. Once your
// GitHub Pages site is live, tighten this to your real
// origin, e.g.:
// app.use(cors({ origin: "https://yourusername.github.io" }));
app.use(cors({
    origin: "*"
}));

// These handle JSON / urlencoded bodies for any OTHER
// routes. They do NOT parse multipart/form-data — that
// is handled per-route below by multer, which is what
// /api/hire needs since it now accepts a file.
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


// ============================================
// FILE UPLOAD (MULTER)
// ============================================

// Keep the file in memory (not written to disk) so it
// can be attached directly to the outgoing email.
const upload = multer({

    storage: multer.memoryStorage(),

    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },

    fileFilter: (req, file, cb) => {

        const allowed = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Unsupported file type."));
        }

    }

});


// ============================================
// GMAIL
// ============================================

const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


// ============================================
// HOME
// ============================================

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "SinaFast Hire API is running 🚀"
    });

});


// ============================================
// GMAIL TEST
// ============================================

app.get("/api/test-email", async (req, res) => {

    try {

        await transporter.verify();

        res.json({
            success: true,
            message: "Gmail email system is ready!"
        });

    } catch (error) {

        console.error("Gmail error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// ============================================
// HIRE ME
// ============================================

app.post("/api/hire", upload.single("projectFile"), async (req, res) => {

    console.log("");
    console.log("================================");
    console.log("📩 NEW HIRE REQUEST");
    console.log("================================");

    console.log("Content-Type header:", req.headers["content-type"]);
    console.log("Raw req.body (text fields):", req.body);

    console.log(
        "Uploaded file:",
        req.file
            ? `${req.file.originalname} (${req.file.size} bytes, ${req.file.mimetype})`
            : "none"
    );


    try {

        // Trim everything so whitespace-only values
        // are treated as "missing", same as the frontend.
        const trim = (value) =>
            (value === undefined || value === null)
                ? ""
                : String(value).trim();

        const fullName = trim(req.body.fullName);
        const email = trim(req.body.email);
        const phone = trim(req.body.phone) || "Not provided";
        const country = trim(req.body.country) || "Not provided";
        const service = trim(req.body.service);
        const budget = trim(req.body.budget) || "Not provided";
        const timeline = trim(req.body.timeline) || "Not provided";
        const projectType = trim(req.body.projectType) || "Not provided";
        const reference = trim(req.body.reference) || "Not provided";
        const projectDescription = trim(req.body.projectDescription);


        console.log("Parsed fields:", {
            fullName,
            email,
            phone,
            country,
            service,
            budget,
            timeline,
            projectType,
            reference,
            projectDescriptionLength: projectDescription.length
        });


        // ========================================
        // VALIDATION — report exactly what's missing
        // ========================================

        const missingFields = [];

        if (!fullName) missingFields.push("fullName");
        if (!email) missingFields.push("email");
        if (!service) missingFields.push("service");
        if (!projectDescription) missingFields.push("projectDescription");

        if (missingFields.length > 0) {

            console.log(
                "❌ Missing required field(s):",
                missingFields.join(", ")
            );

            return res.status(400).json({

                success: false,

                message:
                    "Missing required field(s): " +
                    missingFields.join(", "),

                missingFields: missingFields,

                received: {
                    fullName: !!fullName,
                    email: !!email,
                    service: !!service,
                    projectDescription: !!projectDescription
                }

            });

        }


        // ========================================
        // EMAIL
        // ========================================

        const emailText = `

NEW SINAFast PROJECT REQUEST
============================

CLIENT INFORMATION
------------------

Name:
${fullName}

Email:
${email}

Phone / WhatsApp:
${phone}

Country:
${country}


PROJECT INFORMATION
-------------------

Service:
${service}

Budget:
${budget}

Timeline:
${timeline}

Project Type:
${projectType}

Reference Website:
${reference}


PROJECT DESCRIPTION
-------------------

${projectDescription}


============================
Sent from SinaFast Hire Me
System.
`;


        // ========================================
        // SEND EMAIL
        // ========================================

        console.log("📤 Sending email...");


        const mailOptions = {

            from:
                `"SinaFast Hire Me" <${process.env.EMAIL_USER}>`,

            to:
                process.env.EMAIL_TO,

            replyTo:
                email,

            subject:
                "🚀 New SinaFast Project Request",

            text:
                emailText

        };


        // Attach the uploaded file, if one was sent.
        if (req.file) {

            mailOptions.attachments = [
                {
                    filename: req.file.originalname,
                    content: req.file.buffer
                }
            ];

        }


        const info =
            await transporter.sendMail(mailOptions);


        console.log(
            "✅ EMAIL SENT!"
        );

        console.log(
            "Message ID:",
            info.messageId
        );


        // ========================================
        // RESPONSE
        // ========================================

        return res.status(200).json({

            success: true,

            message:
                "Your project request has been sent successfully! 🚀"

        });


    } catch (error) {

        console.error("");
        console.error(
            "❌ EMAIL ERROR"
        );

        console.error(
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to send your project request.",

            error:
                error.message

        });

    }

});


// ============================================
// CONTACT FORM
// ============================================

app.post("/api/contact", async (req, res) => {

    console.log("");
    console.log("================================");
    console.log("📨 NEW CONTACT MESSAGE");
    console.log("================================");

    console.log("Content-Type header:", req.headers["content-type"]);
    console.log("Raw req.body:", req.body);


    try {

        const trim = (value) =>
            (value === undefined || value === null)
                ? ""
                : String(value).trim();

        const name = trim(req.body.name);
        const email = trim(req.body.email);
        const subject = trim(req.body.subject);
        const message = trim(req.body.message);


        console.log("Parsed fields:", {
            name,
            email,
            subject,
            messageLength: message.length
        });


        // ========================================
        // VALIDATION — report exactly what's missing
        // ========================================

        const missingFields = [];

        if (!name) missingFields.push("name");
        if (!email) missingFields.push("email");
        if (!subject) missingFields.push("subject");
        if (!message) missingFields.push("message");

        if (missingFields.length > 0) {

            console.log(
                "❌ Missing required field(s):",
                missingFields.join(", ")
            );

            return res.status(400).json({

                success: false,

                message:
                    "Missing required field(s): " +
                    missingFields.join(", "),

                missingFields: missingFields

            });

        }


        // ========================================
        // EMAIL
        // ========================================

        const emailText = `

NEW SINAFast CONTACT MESSAGE
============================

From:
${name}

Email:
${email}

Subject:
${subject}


MESSAGE
-------

${message}


============================
Sent from SinaFast Contact
Form.
`;


        console.log("📤 Sending email...");


        const info = await transporter.sendMail({

            from:
                `"SinaFast Contact Form" <${process.env.EMAIL_USER}>`,

            to:
                process.env.EMAIL_TO,

            replyTo:
                email,

            subject:
                "📨 New Contact Message: " + subject,

            text:
                emailText

        });


        console.log("✅ EMAIL SENT!");

        console.log(
            "Message ID:",
            info.messageId
        );


        return res.status(200).json({

            success: true,

            message:
                "Your message has been sent successfully! 🚀"

        });


    } catch (error) {

        console.error("");
        console.error("❌ EMAIL ERROR");

        console.error(error);


        return res.status(500).json({

            success: false,

            message:
                "Unable to send your message.",

            error:
                error.message

        });

    }

});


// ============================================
// MULTER / UPLOAD ERROR HANDLING
// ============================================

// Must come AFTER the routes that use `upload`, so it
// can catch errors multer throws (oversized file, bad
// file type) before they turn into an unhandled 500.
app.use((err, req, res, next) => {

    if (err instanceof multer.MulterError) {

        console.log("❌ Upload error:", err.message);

        return res.status(400).json({
            success: false,
            message: "File upload error: " + err.message
        });

    }

    if (err && err.message === "Unsupported file type.") {

        console.log("❌ Upload error:", err.message);

        return res.status(400).json({
            success: false,
            message:
                "Unsupported file type. Please upload an " +
                "image, PDF, or Word document."
        });

    }

    next(err);

});


// ============================================
// SERVER
// ============================================

const server =
    app.listen(
        PORT,
        "127.0.0.1",
        () => {

            console.log("");
            console.log(
                "======================================"
            );

            console.log(
                "🚀 SinaFast Hire API RUNNING"
            );

            console.log(
                "🌐 http://localhost:" + PORT
            );

            console.log(
                "======================================"
            );

        }
    );


// ============================================
// SERVER ERROR
// ============================================

server.on(
    "error",
    (error) => {

        console.error(
            "❌ SERVER ERROR:",
            error.message
        );

    }
);


// ============================================
// CHECK GMAIL
// ============================================

transporter.verify()

    .then(() => {

        console.log(
            "✅ Gmail email system is ready!"
        );

    })

    .catch((error) => {

        console.error(
            "❌ Gmail connection failed!"
        );

        console.error(
            error.message
        );

    });
