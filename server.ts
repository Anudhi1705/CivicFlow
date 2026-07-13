import express, { Response } from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { connectDB } from "./src/server/db.ts";
import { CitizenAuthController } from "./src/server/controllers/citizen.auth.ts";
import { AdminAuthController } from "./src/server/controllers/admin.auth.ts";
import { authenticateToken, authorizeAdmin, AuthenticatedRequest } from "./src/server/middleware/auth.ts";
import { IssueModel, UserModel } from "./src/server/models.ts";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  
  // Connect to Database
  await connectDB();

  // Basic Middlewares
  app.use(cors());
  app.use(express.json());

  // API - Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // API - Auth Routes
  app.post("/api/auth/citizen/signup", CitizenAuthController.signUp);
  app.post("/api/auth/citizen/signin", CitizenAuthController.signIn);
  app.post("/api/auth/admin/signin", AdminAuthController.signIn);

  // API - User profile
  app.get("/api/users/me", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const user = await UserModel.findById(req.user.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.json({ user });
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // API - Citizen Profile Update (Security enforced: Prevent BOLA / IDOR)
  app.put("/api/v1/citizen/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      
      const userId = req.user.userId;
      if (userId !== req.params.id) {
        return res.status(403).json({ message: "Forbidden: You are only authorized to update your own profile details." });
      }

      const { fullName, email, phonenumber, address } = req.body;
      const updatePayload: any = {};
      if (fullName !== undefined) updatePayload.name = fullName;
      if (email !== undefined) updatePayload.email = email.toLowerCase();
      if (phonenumber !== undefined) updatePayload.phone = phonenumber;
      if (address !== undefined) updatePayload.address = address;

      const updatedUser = await UserModel.update(userId, updatePayload);
      if (!updatedUser) return res.status(404).json({ message: "User not found" });

      const citizen = {
        ...updatedUser,
        id: updatedUser._id,
        fullName: updatedUser.name,
        phonenumber: updatedUser.phone
      };

      return res.json({ citizen });
    } catch (err) {
      console.error("Error updating citizen profile:", err);
      return res.status(500).json({ message: "Server error updating profile details" });
    }
  });

  // API - Admin Profile Update (Security enforced: Prevent BOLA / IDOR)
  app.put("/api/v1/admin/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access required" });

      const userId = req.user.userId;
      if (userId !== req.params.id) {
        return res.status(403).json({ message: "Forbidden: You are only authorized to update your own profile details." });
      }

      const { fullName, email, phonenumber, department } = req.body;
      const updatePayload: any = {};
      if (fullName !== undefined) updatePayload.name = fullName;
      if (email !== undefined) updatePayload.email = email.toLowerCase();
      if (phonenumber !== undefined) updatePayload.phone = phonenumber;
      if (department !== undefined) updatePayload.department = department;

      const updatedUser = await UserModel.update(userId, updatePayload);
      if (!updatedUser) return res.status(404).json({ message: "User not found" });

      const admin = {
        ...updatedUser,
        id: updatedUser._id,
        fullName: updatedUser.name,
        phonenumber: updatedUser.phone
      };

      return res.json({ admin });
    } catch (err) {
      console.error("Error updating admin profile:", err);
      return res.status(500).json({ message: "Server error updating administrative profile details" });
    }
  });

  // API - Issue Stats (Admin only, put before /api/issues/:id to prevent matching)
  app.get("/api/issues/stats", authenticateToken, authorizeAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await IssueModel.getStats();
      return res.json(stats);
    } catch (err) {
      return res.status(500).json({ message: "Server error fetching stats" });
    }
  });

  // API - Issues Routes
  app.get("/api/issues", async (req, res) => {
    try {
      const issues = await IssueModel.findAll();
      return res.json(issues);
    } catch (err) {
      return res.status(500).json({ message: "Server error fetching issues" });
    }
  });

  app.get("/api/issues/:id", async (req, res) => {
    try {
      const issue = await IssueModel.findById(req.params.id);
      if (!issue) return res.status(404).json({ message: "Issue not found" });
      return res.json(issue);
    } catch (err) {
      return res.status(500).json({ message: "Server error fetching issue" });
    }
  });

  app.post("/api/issues", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      
      const { title, description, category, severity, location, imageUrl } = req.body;
      if (!title || !description || !category || !severity || !location) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Fetch user details to attach
      const user = await UserModel.findById(req.user.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const newIssue = await IssueModel.create({
        title,
        description,
        category,
        severity,
        status: "pending",
        location,
        imageUrl,
        reportedBy: {
          _id: user._id,
          name: user.name,
          email: user.email
        }
      });

      return res.status(201).json(newIssue);
    } catch (err) {
      console.error("Error creating issue:", err);
      return res.status(500).json({ message: "Server error creating issue" });
    }
  });

  app.put("/api/issues/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const issue = await IssueModel.findById(req.params.id);
      if (!issue) return res.status(404).json({ message: "Issue not found" });

      const user = await UserModel.findById(req.user.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const actor = { _id: user._id, name: user.name, role: user.role };

      // If user is a citizen, they can only update their own issue, and only if it's pending/draft
      if (req.user.role === "citizen") {
        if (issue.reportedBy._id !== req.user.userId) {
          return res.status(403).json({ message: "You can only update issues reported by you" });
        }
        
        const { title, description, category, severity, location, imageUrl } = req.body;
        const updated = await IssueModel.update(req.params.id, {
          title,
          description,
          category,
          severity,
          location,
          imageUrl
        }, actor);
        return res.json(updated);
      }

      // If user is admin, they can update everything including status, notes, department
      if (req.user.role === "admin") {
        const { status, assignedToDepartment, adminNotes } = req.body;
        const updated = await IssueModel.update(req.params.id, {
          status,
          assignedToDepartment,
          adminNotes
        }, actor);
        return res.json(updated);
      }

      return res.status(403).json({ message: "Invalid role" });
    } catch (err) {
      return res.status(500).json({ message: "Server error updating issue" });
    }
  });

  app.post("/api/issues/:id/comments", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const { comment } = req.body;
      if (!comment || comment.trim() === "") {
        return res.status(400).json({ message: "Comment content is required" });
      }

      const user = await UserModel.findById(req.user.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const actor = { _id: user._id, name: user.name, role: user.role };
      const updated = await IssueModel.addComment(req.params.id, comment, actor);
      if (!updated) return res.status(404).json({ message: "Issue not found" });

      return res.json(updated);
    } catch (err) {
      console.error("Error adding comment:", err);
      return res.status(500).json({ message: "Server error adding comment" });
    }
  });

  app.post("/api/issues/:id/upvote", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const updated = await IssueModel.upvote(req.params.id, req.user.userId);
      if (!updated) return res.status(404).json({ message: "Issue not found" });
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: "Server error processing upvote" });
    }
  });

  app.delete("/api/issues/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const issue = await IssueModel.findById(req.params.id);
      if (!issue) return res.status(404).json({ message: "Issue not found" });

      // Only Admin or the reporting citizen can delete
      if (req.user.role !== "admin" && issue.reportedBy._id !== req.user.userId) {
        return res.status(403).json({ message: "Not authorized to delete this issue" });
      }

      const success = await IssueModel.delete(req.params.id);
      if (success) {
        return res.json({ message: "Issue deleted successfully" });
      } else {
        return res.status(500).json({ message: "Failed to delete issue" });
      }
    } catch (err) {
      return res.status(500).json({ message: "Server error deleting issue" });
    }
  });

  // Vite static middleware serving or compilation
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start Server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
