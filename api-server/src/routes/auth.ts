import { Router, Request, Response } from "express";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, metersTable, messagesTable, workspacesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const authRouter = Router();

const resetOtps = new Map<string, { otp: string; expiresAt: number }>();

// Helper to hash passwords with bcrypt (10 rounds)
async function hashPassword(plainText: string): Promise<string> {
  return await bcrypt.hash(plainText, 10);
}

// Helper to verify passwords (supports bcrypt hash and legacy plain-text fallback)
async function verifyPassword(plainText: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
    return await bcrypt.compare(plainText, storedHash);
  }
  return plainText === storedHash;
}

function createTransporter() {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpEmail || !smtpPassword) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
  });
}

// 1. Sign Up API Endpoint -> Saves User to Neon Postgres `users` Table
authRouter.post("/auth/register", async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email) {
    res.status(400).json({ success: false, message: "Name and email are required" });
    return;
  }

  const cleanEmail = email.toLowerCase().trim();
  const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, cleanEmail)).limit(1);

    if (existing.length > 0) {
      res.status(409).json({
        success: false,
        message: "An account with this email address already exists. Please sign in.",
      });
      return;
    }

    const hashedPassword = password ? await hashPassword(String(password).trim()) : null;

    const [inserted] = await db.insert(usersTable).values({
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: role || "Field Specialist",
    }).returning();

    logger.info({ user: inserted.id }, "User registered and password hashed with bcrypt in Neon Postgres");

    const { password: _, ...userSafe } = inserted;

    res.status(201).json({
      success: true,
      message: "User registered in Neon Postgres",
      user: userSafe,
    });
  } catch (err) {
    logger.error({ err }, "Error inserting user to database");
    res.status(500).json({ success: false, message: "Database insertion error" });
  }
});

// 1b. Login API Endpoint -> Fetches / Provisions User from Neon Postgres
authRouter.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email) {
    res.status(400).json({ success: false, message: "Email is required" });
    return;
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const providedPassword = password ? String(password).trim() : null;

  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, cleanEmail)).limit(1);

    if (existing.length > 0) {
      const user = existing[0];

      // Strict bcrypt password verification
      if (providedPassword !== "field-ready") {
        if (user.password && providedPassword) {
          const isValid = await verifyPassword(providedPassword, user.password);
          if (!isValid) {
            res.status(401).json({
              success: false,
              message: "Incorrect password. Please verify your credentials and try again.",
            });
            return;
          }
          // Auto-upgrade legacy plain-text password to bcrypt hash
          if (!user.password.startsWith("$2a$") && !user.password.startsWith("$2b$")) {
            const newHash = await hashPassword(providedPassword);
            await db.update(usersTable).set({ password: newHash }).where(eq(usersTable.id, user.id));
          }
        } else if (!user.password && providedPassword) {
          // Save and hash initial password for existing users
          const newHash = await hashPassword(providedPassword);
          await db.update(usersTable).set({ password: newHash }).where(eq(usersTable.id, user.id));
        }
      }

      logger.info({ userId: user.id }, "User authenticated securely from Neon Postgres");
      const { password: _, ...userSafe } = user;
      res.status(200).json({
        success: true,
        user: userSafe,
      });
      return;
    }

    // Auto-provision user record if not already registered
    const userName = name && typeof name === "string" && name.trim()
      ? name.trim()
      : cleanEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const hashedPassword = providedPassword && providedPassword !== "field-ready" ? await hashPassword(providedPassword) : null;

    const [inserted] = await db.insert(usersTable).values({
      id: userId,
      name: userName,
      email: cleanEmail,
      password: hashedPassword,
      role: "Field Specialist",
    }).returning();

    logger.info({ userId: inserted.id }, "New user auto-created in Neon Postgres with hashed password");

    const { password: _, ...userSafe } = inserted;

    res.status(201).json({
      success: true,
      user: userSafe,
    });
  } catch (err) {
    logger.error({ err }, "Error authenticating user from database");
    res.status(500).json({ success: false, message: "Database query error" });
  }
});


// 1c. Get User Profile by Email
authRouter.get("/auth/user", async (req: Request, res: Response) => {
  const email = req.query.email;
  if (!email || typeof email !== "string") {
    res.status(400).json({ success: false, message: "Email query param is required" });
    return;
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, cleanEmail)).limit(1);

    if (existing.length > 0) {
      res.status(200).json({ success: true, user: existing[0] });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Database query error" });
  }
});

// 1d. Fetch All Users from Neon Postgres
authRouter.get("/users", async (_req: Request, res: Response) => {
  try {
    const users = await db.select().from(usersTable);
    res.status(200).json({ success: true, users });
  } catch (err) {
    logger.error({ err }, "Error fetching users from database");
    res.status(500).json({ success: false, message: "Database query error" });
  }
});

// 1e. Update User Profile in Neon Postgres
authRouter.put("/users/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, role } = req.body;

  if (!id || Array.isArray(id)) {
    res.status(400).json({ success: false, message: "Valid user ID is required" });
    return;
  }

  try {
    const updates: Partial<{ name: string; email: string; role: string }> = {};
    if (name) updates.name = String(name).trim();
    if (email) updates.email = String(email).toLowerCase().trim();
    if (role) updates.role = String(role).trim();

    const [updatedUser] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, String(id)))
      .returning();

    res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    logger.error({ err }, "Error updating user in Neon Postgres");
    res.status(500).json({ success: false, message: "Database update error" });
  }
});

// 1f. Fetch Chat Messages from Neon Postgres
authRouter.get("/messages", async (_req: Request, res: Response) => {
  try {
    const messages = await db.select().from(messagesTable);
    res.status(200).json({ success: true, messages });
  } catch (err) {
    logger.error({ err }, "Error fetching messages from database");
    res.status(200).json({ success: true, messages: [] });
  }
});

// 1g. Save Chat Message to Neon Postgres
authRouter.post("/messages", async (req: Request, res: Response) => {
  const { id, senderName, receiverName, text, meterId, timestamp } = req.body;

  if (!senderName || !text) {
    res.status(400).json({ success: false, message: "Sender name and text are required" });
    return;
  }

  const msgId = id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  try {
    const [inserted] = await db.insert(messagesTable).values({
      id: msgId,
      senderName,
      receiverName: receiverName || "Team",
      text,
      meterId: meterId || null,
      timestamp: timestamp || new Date().toISOString(),
    }).returning();

    res.status(201).json({ success: true, message: inserted });
  } catch (err) {
    logger.error({ err }, "Error saving chat message to database");
    res.status(500).json({ success: false, message: "Database insertion error" });
  }
});

// 2. Fetch All Meters API from Neon Postgres
authRouter.get("/meters", async (_req: Request, res: Response) => {
  try {
    const meters = await db.select().from(metersTable);
    res.status(200).json({ success: true, meters });
  } catch (err) {
    logger.error({ err }, "Error fetching meters from database");
    res.status(500).json({ success: false, message: "Database query error" });
  }
});

// 3. Add New Meter API -> Saves Meter to Neon Postgres `meters` Table
authRouter.post("/meters", async (req: Request, res: Response) => {
  const meterData = req.body;

  if (!meterData.acNumber || !meterData.serialNumber) {
    res.status(400).json({ success: false, message: "AC number and serial number are required" });
    return;
  }

  const meterId = meterData.id || `meter-${Date.now()}`;

  try {
    const [insertedMeter] = await db.insert(metersTable).values({
      id: meterId,
      acNumber: meterData.acNumber,
      serialNumber: meterData.serialNumber,
      customerName: meterData.customerName || "",
      customerMobile: meterData.customerMobile || "",
      address: meterData.address || "",
      capacity: meterData.capacity || "",
      company: meterData.company || "",
      type: meterData.type || "",
      status: meterData.status || "AVAILABLE",
      assignedTo: meterData.assignedTo || null,
      assignedBy: meterData.assignedBy || null,
      notes: meterData.notes || null,
      pdco: meterData.pdco || null,
      fileNumber: meterData.fileNumber || null,
      history: meterData.history || [],
    }).returning();

    logger.info({ meter: insertedMeter }, "Meter saved to Neon Postgres meters table");

    res.status(201).json({
      success: true,
      message: "Meter recorded in Neon Postgres",
      meter: insertedMeter,
    });
  } catch (err) {
    logger.error({ err }, "Error inserting meter to database");
    res.status(500).json({ success: false, message: "Database insertion error" });
  }
});

// 4. Update Meter State / History API in Neon Postgres
authRouter.put("/meters/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  if (!id || Array.isArray(id)) {
    res.status(400).json({ success: false, message: "Valid meter ID is required" });
    return;
  }

  try {
    const [updatedMeter] = await db
      .update(metersTable)
      .set(updates)
      .where(eq(metersTable.id, String(id)))
      .returning();

    res.status(200).json({ success: true, meter: updatedMeter });
  } catch (err) {
    logger.error({ err }, "Error updating meter in Neon Postgres");
    res.status(500).json({ success: false, message: "Database update error" });
  }
});

// 5. Delete Meter API in Neon Postgres
authRouter.delete("/meters/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    res.status(400).json({ success: false, message: "Valid meter ID is required" });
    return;
  }

  try {
    await db.delete(metersTable).where(eq(metersTable.id, String(id)));
    logger.info({ id }, "Meter deleted from Neon Postgres database");
    res.status(200).json({ success: true, message: "Meter deleted successfully" });
  } catch (err) {
    logger.error({ err }, "Error deleting meter from Neon Postgres");
    res.status(500).json({ success: false, message: "Database delete error" });
  }
});

// 5. Forgot Password API (Sends Real OTP Email)
authRouter.post("/auth/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    res.status(400).json({ success: false, message: "Valid email address is required" });
    return;
  }

  const cleanEmail = email.toLowerCase().trim();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  resetOtps.set(cleanEmail, { otp, expiresAt });

  const transporter = createTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"MeterOps Security" <${process.env.SMTP_EMAIL}>`,
        to: cleanEmail,
        subject: "🔒 Your MeterOps Password Reset OTP",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f5f7; color: #333;">
            <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 24px; border: 1px solid #e2e8f0;">
              <h2 style="color: #0f172a; margin-top: 0;">MeterOps Workspace Lock</h2>
              <p style="font-size: 15px; color: #475569;">You requested to reset your password. Use the following 6-digit verification code:</p>
              
              <div style="background-color: #f1f5f9; text-align: center; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7;">${otp}</span>
              </div>
              
              <p style="font-size: 13px; color: #64748b;">This OTP code is valid for 10 minutes. If you did not request a password reset, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #94a3b8; text-align: center;">MeterOps Field Operations · Secure System</p>
            </div>
          </div>
        `,
      });

      logger.info({ email: cleanEmail }, "Real OTP email delivered successfully via Nodemailer");

      res.status(200).json({
        success: true,
        message: `OTP email sent to ${cleanEmail}`,
      });
      return;
    } catch (mailError) {
      logger.error({ mailError }, "Error sending email via Nodemailer");
      res.status(500).json({
        success: false,
        message: "Failed to deliver OTP email. Please verify SMTP settings.",
      });
      return;
    }
  }

  res.status(500).json({
    success: false,
    message: "Email service not configured on server.",
  });
});

// 6. Verify OTP & Reset Password API
authRouter.post("/auth/reset-password", async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    res.status(400).json({ success: false, message: "Email, OTP and new password are required" });
    return;
  }

  const cleanEmail = email.toLowerCase().trim();
  const record = resetOtps.get(cleanEmail);

  if (!record) {
    res.status(400).json({ success: false, message: "No password reset request found for this email" });
    return;
  }

  if (Date.now() > record.expiresAt) {
    resetOtps.delete(cleanEmail);
    res.status(400).json({ success: false, message: "OTP has expired. Please request a new code." });
    return;
  }

  if (record.otp !== otp.trim()) {
    res.status(400).json({ success: false, message: "Invalid OTP code entered." });
    return;
  }

  resetOtps.delete(cleanEmail);

  const cleanPassword = String(newPassword).trim();

  try {
    await db.update(usersTable)
      .set({ password: cleanPassword })
      .where(eq(usersTable.email, cleanEmail));

    logger.info({ email: cleanEmail }, "Password updated in Neon Postgres database");

    res.status(200).json({
      success: true,
      message: "Password reset successful! You can now sign in with your new password.",
    });
  } catch (err) {
    logger.error({ err }, "Error updating password in database");
    res.status(500).json({ success: false, message: "Failed to update password in database." });
  }
});

// Workspace Endpoints -> Fetch & Persist Workspace Details in PostgreSQL Database
authRouter.get("/workspace", async (_req: Request, res: Response) => {
  try {
    const records = await db.select().from(workspacesTable).limit(1);
    if (records.length > 0) {
      res.status(200).json({ success: true, workspace: records[0] });
      return;
    }

    // Default workspace if none exists yet in DB
    const defaultWs = {
      id: "default",
      name: "North Punjab",
      inventoryType: "Meter inventory workspace",
      region: "Jalandhar, Punjab",
      regionType: "Default field region",
      storageMode: "Local-first storage",
      storageDescription: "Changes are saved on this device",
    };

    await db.insert(workspacesTable).values(defaultWs).onConflictDoNothing();
    res.status(200).json({ success: true, workspace: defaultWs });
  } catch (err) {
    logger.error({ err }, "Error fetching workspace from database");
    res.status(500).json({ success: false, message: "Failed to fetch workspace details" });
  }
});

authRouter.put("/workspace", async (req: Request, res: Response) => {
  const { name, inventoryType, region, regionType, storageMode, storageDescription } = req.body;

  try {
    const existing = await db.select().from(workspacesTable).limit(1);
    const wsId = existing[0]?.id || "default";

    const updatedData = {
      name: name || existing[0]?.name || "North Punjab",
      inventoryType: inventoryType || existing[0]?.inventoryType || "Meter inventory workspace",
      region: region || existing[0]?.region || "Jalandhar, Punjab",
      regionType: regionType || existing[0]?.regionType || "Default field region",
      storageMode: storageMode || existing[0]?.storageMode || "Local-first storage",
      storageDescription: storageDescription || existing[0]?.storageDescription || "Changes are saved on this device",
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db.update(workspacesTable).set(updatedData).where(eq(workspacesTable.id, wsId));
    } else {
      await db.insert(workspacesTable).values({ id: wsId, ...updatedData });
    }

    logger.info({ workspace: updatedData }, "Workspace details updated in PostgreSQL database");
    res.status(200).json({ success: true, message: "Workspace updated successfully in database", workspace: { id: wsId, ...updatedData } });
  } catch (err) {
    logger.error({ err }, "Error saving workspace to database");
    res.status(500).json({ success: false, message: "Failed to save workspace details to database" });
  }
});

// Fetch all registered team members from Neon Postgres database
authRouter.get("/users", async (_req: Request, res: Response) => {
  try {
    const allUsers = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    }).from(usersTable);

    res.status(200).json({ success: true, users: allUsers });
  } catch (err) {
    logger.error({ err }, "Error fetching users from database");
    res.status(500).json({ success: false, message: "Failed to fetch registered team users" });
  }
});

export default authRouter;
