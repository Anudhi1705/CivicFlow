import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models.ts";

const JWT_SECRET = process.env.JWT_PASSWORD || "civicflow_super_secret_jwt_password_2026";

export const AdminAuthController = {
  async signIn(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const normalizedEmail = email.toLowerCase();
      let userDoc: any = null;

      // Access DB directly to find passwordHash and role
      const mongoDb = await import("../db.ts").then(m => m.connectDB());
      const isInMemory = await import("../db.ts").then(m => m.checkIsInMemory());

      if (mongoDb && !isInMemory) {
        userDoc = await mongoDb.collection("users").findOne({ email: normalizedEmail });
      } else {
        const store = await import("../db.ts").then(m => m.getInMemoryStore());
        userDoc = store.users.find(u => u.email.toLowerCase() === normalizedEmail);
      }

      // Dynamic seeding for default admin
      if (!userDoc && normalizedEmail === "admin@civicflow.gov") {
        console.log("Seeding default admin user...");
        const passwordHash = await bcrypt.hash("admin123", 10);
        userDoc = {
          _id: "admin-default",
          name: "Chief Admin Officer",
          email: "admin@civicflow.gov",
          passwordHash,
          role: "admin",
          department: "City General Administration",
          createdAt: new Date().toISOString()
        };

        if (mongoDb && !isInMemory) {
          await mongoDb.collection("users").insertOne(userDoc);
        } else {
          const store = await import("../db.ts").then(m => m.getInMemoryStore());
          store.users.push(userDoc);
        }
      }

      if (!userDoc || userDoc.role !== "admin") {
        return res.status(401).json({ message: "Invalid administrative credentials" });
      }

      // If demo password "admin123" is entered, let it match
      const isMatch = await bcrypt.compare(password, userDoc.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid administrative credentials" });
      }

      const token = jwt.sign({ userId: userDoc._id, role: userDoc.role }, JWT_SECRET, { expiresIn: "7d" });

      const { passwordHash, ...user } = userDoc;
      return res.status(200).json({ user, token });
    } catch (err: any) {
      console.error("Admin Sign In Error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};
