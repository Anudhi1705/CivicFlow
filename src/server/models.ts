import { connectDB, getInMemoryStore, checkIsInMemory } from "./db.ts";
import { User, Issue } from "../types.ts";

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const UserModel = {
  async findByEmail(email: string): Promise<User | null> {
    const db = await connectDB();
    if (db && !checkIsInMemory()) {
      return db.collection("users").findOne({ email: email.toLowerCase() }) as any;
    } else {
      const store = getInMemoryStore();
      const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      return user || null;
    }
  },

  async findById(id: string): Promise<User | null> {
    const db = await connectDB();
    if (db && !checkIsInMemory()) {
      return db.collection("users").findOne({ _id: id } as any) as any;
    } else {
      const store = getInMemoryStore();
      const user = store.users.find(u => u._id === id);
      return user || null;
    }
  },

  async create(userData: Omit<User, "_id" | "createdAt"> & { passwordHash: string }): Promise<User> {
    const _id = "user-" + generateId();
    const createdAt = new Date().toISOString();
    const newUser = {
      _id,
      ...userData,
      email: userData.email.toLowerCase(),
      createdAt
    };

    const db = await connectDB();
    if (db && !checkIsInMemory()) {
      await db.collection("users").insertOne(newUser as any);
    } else {
      const store = getInMemoryStore();
      store.users.push(newUser);
    }

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = newUser as any;
    return userWithoutPassword;
  },

  async update(id: string, updateData: Partial<Omit<User, "_id" | "createdAt" | "role">>): Promise<User | null> {
    const db = await connectDB();
    if (db && !checkIsInMemory()) {
      const result = await db.collection("users").findOneAndUpdate(
        { _id: id } as any,
        { $set: updateData } as any,
        { returnDocument: "after" } as any
      );
      if (!result) return null;
      const { passwordHash, ...userWithoutPassword } = result as any;
      return userWithoutPassword;
    } else {
      const store = getInMemoryStore();
      const index = store.users.findIndex(u => u._id === id);
      if (index === -1) return null;
      const updatedUser = {
        ...store.users[index],
        ...updateData
      };
      store.users[index] = updatedUser;
      const { passwordHash, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    }
  }
};

export const IssueModel = {
  async findAll(): Promise<Issue[]> {
    const db = await connectDB();
    if (db && !checkIsInMemory()) {
      return db.collection("issues").find().sort({ createdAt: -1 }).toArray() as any;
    } else {
      const store = getInMemoryStore();
      // Sort in-memory issues by createdAt descending
      return [...store.issues].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  },

  async findById(id: string): Promise<Issue | null> {
    const db = await connectDB();
    if (db && !checkIsInMemory()) {
      return db.collection("issues").findOne({ _id: id } as any) as any;
    } else {
      const store = getInMemoryStore();
      const issue = store.issues.find(i => i._id === id);
      return issue || null;
    }
  },

  async create(issueData: Omit<Issue, "_id" | "createdAt" | "updatedAt" | "upvotes" | "history">): Promise<Issue> {
    const _id = "issue-" + generateId();
    const now = new Date().toISOString();
    const newIssue: Issue = {
      ...issueData,
      _id,
      upvotes: [],
      createdAt: now,
      updatedAt: now,
      history: [
        {
          _id: "hist-" + generateId(),
          type: "creation",
          actor: {
            _id: issueData.reportedBy._id,
            name: issueData.reportedBy.name,
            role: "citizen"
          },
          createdAt: now
        }
      ]
    };

    const db = await connectDB();
    if (db && !checkIsInMemory()) {
      await db.collection("issues").insertOne(newIssue as any);
    } else {
      const store = getInMemoryStore();
      store.issues.push(newIssue);
    }

    return newIssue;
  },

  async update(
    id: string,
    updateData: Partial<Omit<Issue, "_id" | "createdAt" | "reportedBy">>,
    actor?: { _id: string; name: string; role: "citizen" | "admin" | "system" }
  ): Promise<Issue | null> {
    const now = new Date().toISOString();
    const db = await connectDB();
    
    // Fetch existing issue to generate history entries
    const existingIssue = await this.findById(id);
    if (!existingIssue) return null;

    const actualActor = actor || { _id: "system", name: "System", role: "system" };
    const historyEvents = existingIssue.history ? [...existingIssue.history] : [];

    // Check status change
    if (updateData.status && updateData.status !== existingIssue.status) {
      historyEvents.push({
        _id: "hist-" + generateId(),
        type: "status_change",
        statusBefore: existingIssue.status,
        statusAfter: updateData.status,
        actor: actualActor,
        createdAt: now
      });
    }

    // Check assigned department change
    if (updateData.assignedToDepartment !== undefined && updateData.assignedToDepartment !== existingIssue.assignedToDepartment) {
      historyEvents.push({
        _id: "hist-" + generateId(),
        type: "department_assignment",
        department: updateData.assignedToDepartment,
        actor: actualActor,
        createdAt: now
      });
    }

    // Check admin notes or comment change
    if (updateData.adminNotes !== undefined && updateData.adminNotes !== existingIssue.adminNotes && updateData.adminNotes !== "") {
      historyEvents.push({
        _id: "hist-" + generateId(),
        type: "comment",
        comment: updateData.adminNotes,
        actor: actualActor,
        createdAt: now
      });
    }

    const finalUpdate = {
      ...updateData,
      history: historyEvents,
      updatedAt: now
    };

    if (db && !checkIsInMemory()) {
      const result = await db.collection("issues").findOneAndUpdate(
        { _id: id } as any,
        { $set: finalUpdate } as any,
        { returnDocument: "after" } as any
      );
      return result as any;
    } else {
      const store = getInMemoryStore();
      const index = store.issues.findIndex(i => i._id === id);
      if (index === -1) return null;

      const updatedIssue = {
        ...store.issues[index],
        ...finalUpdate
      };
      store.issues[index] = updatedIssue;
      return updatedIssue;
    }
  },

  async addComment(
    id: string,
    comment: string,
    actor: { _id: string; name: string; role: "citizen" | "admin" }
  ): Promise<Issue | null> {
    const now = new Date().toISOString();
    const db = await connectDB();
    const newEvent = {
      _id: "hist-" + generateId(),
      type: "comment" as const,
      comment,
      actor,
      createdAt: now
    };

    if (db && !checkIsInMemory()) {
      const result = await db.collection("issues").findOneAndUpdate(
        { _id: id } as any,
        { 
          $push: { history: newEvent } as any,
          $set: { updatedAt: now } as any
        } as any,
        { returnDocument: "after" } as any
      );
      return result as any;
    } else {
      const store = getInMemoryStore();
      const index = store.issues.findIndex(i => i._id === id);
      if (index === -1) return null;

      const issue = store.issues[index];
      const history = issue.history ? [...issue.history, newEvent] : [newEvent];
      const updatedIssue = {
        ...issue,
        history,
        updatedAt: now
      };
      store.issues[index] = updatedIssue;
      return updatedIssue;
    }
  },

  async upvote(issueId: string, userId: string): Promise<Issue | null> {
    const now = new Date().toISOString();
    const db = await connectDB();

    if (db && !checkIsInMemory()) {
      const issue = await db.collection("issues").findOne({ _id: issueId } as any) as any;
      if (!issue) return null;

      const upvotes: string[] = issue.upvotes || [];
      const userIndex = upvotes.indexOf(userId);
      if (userIndex === -1) {
        upvotes.push(userId);
      } else {
        upvotes.splice(userIndex, 1);
      }

      const result = await db.collection("issues").findOneAndUpdate(
        { _id: issueId } as any,
        { $set: { upvotes, updatedAt: now } } as any,
        { returnDocument: "after" } as any
      );
      return result as any;
    } else {
      const store = getInMemoryStore();
      const index = store.issues.findIndex(i => i._id === issueId);
      if (index === -1) return null;

      const issue = store.issues[index];
      const upvotes = [...issue.upvotes];
      const userIndex = upvotes.indexOf(userId);

      if (userIndex === -1) {
        upvotes.push(userId);
      } else {
        upvotes.splice(userIndex, 1);
      }

      const updatedIssue = {
        ...issue,
        upvotes,
        updatedAt: now
      };
      store.issues[index] = updatedIssue;
      return updatedIssue;
    }
  },

  async delete(id: string): Promise<boolean> {
    const db = await connectDB();
    if (db && !checkIsInMemory()) {
      const result = await db.collection("issues").deleteOne({ _id: id } as any);
      return result.deletedCount > 0;
    } else {
      const store = getInMemoryStore();
      const lengthBefore = store.issues.length;
      store.issues = store.issues.filter(i => i._id !== id);
      return store.issues.length < lengthBefore;
    }
  },

  async getStats() {
    const issues = await this.findAll();
    const total = issues.length;
    const pending = issues.filter(i => i.status === "pending").length;
    const inProgress = issues.filter(i => i.status === "in-progress").length;
    const resolved = issues.filter(i => i.status === "resolved").length;
    const rejected = issues.filter(i => i.status === "rejected").length;

    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };

    issues.forEach(issue => {
      byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
      bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
    });

    return {
      total,
      pending,
      inProgress,
      resolved,
      rejected,
      byCategory,
      bySeverity
    };
  }
};
