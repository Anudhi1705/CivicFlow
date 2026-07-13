import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models.ts";

const JWT_SECRET = process.env.JWT_PASSWORD || "civicflow_super_secret_jwt_password_2026";

export const CitizenAuthController = {
  async signUp(req: Request, res: Response) {
    try {
      const { name, email, password, phone, address } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required" });
      }

      // Check if email already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user as a citizen
      const user = await UserModel.create({
        name,
        email,
        passwordHash,
        role: "citizen",
        phone,
        address
      });

      // Generate JWT
      const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

      return res.status(201).json({ user, token });
    } catch (err: any) {
      console.error("Citizen Sign Up Error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  async signIn(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const db = await UserModel.findByEmail(email);
      if (!db) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Get user from DB/In-memory store, check password
      // Since our UserModel.create or db stores users, let's look at password checking.
      // Wait, let's make sure the db we retrieve has the passwordHash.
      // In UserModel, db.collection("users") has passwordHash.
      // In inMemoryStore, users has passwordHash.
      // Let's query directly to make sure we can read it.
      // Let's find user with passwordHash.
      let userDoc: any = null;
      const mongoDb = await import("../db.ts").then(m => m.connectDB());
      const isInMemory = await import("../db.ts").then(m => m.checkIsInMemory());
      
      if (mongoDb && !isInMemory) {
        userDoc = await mongoDb.collection("users").findOne({ email: email.toLowerCase() });
      } else {
        const store = await import("../db.ts").then(m => m.getInMemoryStore());
        userDoc = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      }

      if (!userDoc || userDoc.role !== "citizen") {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isMatch = await bcrypt.compare(password, userDoc.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign({ userId: userDoc._id, role: userDoc.role }, JWT_SECRET, { expiresIn: "7d" });
      
      const { passwordHash, ...user } = userDoc;
      return res.status(200).json({ user, token });
    } catch (err: any) {
      console.error("Citizen Sign In Error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};
