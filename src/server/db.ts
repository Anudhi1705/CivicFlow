import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;

let client: MongoClient | null = null;
let db: Db | null = null;
let isInMemory = false;

// In-Memory Database fallback structure
export interface InMemoryStore {
  users: any[];
  issues: any[];
}

export const inMemoryStore: InMemoryStore = {
  users: [],
  issues: [
    {
      _id: "issue-1",
      title: "Major Pothole on Oak Street",
      description: "A very large pothole has formed near the intersection of Oak Street and 5th Avenue. It is causing cars to swerve dangerously into the oncoming lane.",
      category: "Roads & Potholes",
      severity: "high",
      status: "in-progress",
      location: {
        address: "Oak St & 5th Ave, Downtown",
        lat: 37.7749,
        lng: -122.4194
      },
      reportedBy: {
        _id: "user-1",
        name: "Jane Doe",
        email: "jane@example.com"
      },
      assignedToDepartment: "Public Works - Roads Division",
      adminNotes: "Inspection crew dispatched. Repair scheduled for Wednesday morning.",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      upvotes: ["user-2", "user-3"],
      history: [
        {
          _id: "hist-1-1",
          type: "creation",
          actor: { _id: "user-1", name: "Jane Doe", role: "citizen" },
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: "hist-1-2",
          type: "department_assignment",
          department: "Public Works - Roads Division",
          actor: { _id: "admin-1", name: "Chief Dispatcher", role: "admin" },
          createdAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: "hist-1-3",
          type: "status_change",
          statusBefore: "pending",
          statusAfter: "in-progress",
          actor: { _id: "admin-1", name: "Chief Dispatcher", role: "admin" },
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: "hist-1-4",
          type: "comment",
          comment: "Inspection crew dispatched. Repair scheduled for Wednesday morning.",
          actor: { _id: "admin-1", name: "Chief Dispatcher", role: "admin" },
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      _id: "issue-2",
      title: "Broken Streetlight near Library",
      description: "The streetlight directly in front of the public library entrance has been dark for over a week. The area is extremely dark at night, causing safety concerns.",
      category: "Streetlights & Electricity",
      severity: "medium",
      status: "pending",
      location: {
        address: "101 Library Lane, Westside",
        lat: 37.7833,
        lng: -122.4167
      },
      reportedBy: {
        _id: "user-2",
        name: "John Smith",
        email: "john@example.com"
      },
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      upvotes: ["user-1"],
      history: [
        {
          _id: "hist-2-1",
          type: "creation",
          actor: { _id: "user-2", name: "John Smith", role: "citizen" },
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      _id: "issue-3",
      title: "Illegal Trash Dumping in Park Alley",
      description: "Someone dumped multiple mattresses, broken furniture, and bags of household garbage in the alleyway behind CivicFlow Community Park.",
      category: "Sanitation & Trash",
      severity: "high",
      status: "resolved",
      location: {
        address: "CivicFlow Park Alley, Civic Heights",
        lat: 37.7699,
        lng: -122.4468
      },
      reportedBy: {
        _id: "user-3",
        name: "Alice Johnson",
        email: "alice@example.com"
      },
      assignedToDepartment: "Environmental Services - Sanitation",
      adminNotes: "Waste management team cleared the dumping site and placed warning signs.",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      upvotes: ["user-1", "user-2", "user-4"],
      history: [
        {
          _id: "hist-3-1",
          type: "creation",
          actor: { _id: "user-3", name: "Alice Johnson", role: "citizen" },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: "hist-3-2",
          type: "status_change",
          statusBefore: "pending",
          statusAfter: "in-progress",
          actor: { _id: "admin-1", name: "Chief Dispatcher", role: "admin" },
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: "hist-3-3",
          type: "department_assignment",
          department: "Environmental Services - Sanitation",
          actor: { _id: "admin-1", name: "Chief Dispatcher", role: "admin" },
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: "hist-3-4",
          type: "status_change",
          statusBefore: "in-progress",
          statusAfter: "resolved",
          actor: { _id: "admin-1", name: "Chief Dispatcher", role: "admin" },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: "hist-3-5",
          type: "comment",
          comment: "Waste management team cleared the dumping site and placed warning signs.",
          actor: { _id: "admin-1", name: "Chief Dispatcher", role: "admin" },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      _id: "issue-4",
      title: "Leaking Water Main on Maple Ave",
      description: "Water is bubbling up through the asphalt on Maple Avenue near House #452. It has been flowing constantly, wasting water and turning the pavement muddy.",
      category: "Water & Sewerage",
      severity: "critical",
      status: "pending",
      location: {
        address: "452 Maple Ave, Northpark",
        lat: 37.7946,
        lng: -122.4018
      },
      reportedBy: {
        _id: "user-4",
        name: "Bob Wilson",
        email: "bob@example.com"
      },
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      upvotes: [],
      history: [
        {
          _id: "hist-4-1",
          type: "creation",
          actor: { _id: "user-4", name: "Bob Wilson", role: "citizen" },
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  ]
};

export async function connectDB(): Promise<Db | null> {
  if (db) return db;

  if (!mongoUri) {
    console.warn("⚠️ MONGODB_URI/DATABASE_URL not set. Running CivicFlow in-memory mode.");
    isInMemory = true;
    return null;
  }

  try {
    console.log("Connecting to MongoDB...");
    client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db();
    console.log("✅ Successfully connected to MongoDB");
    isInMemory = false;
    return db;
  } catch (err: any) {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    console.warn("⚠️ Falling back to CivicFlow in-memory mode.");
    isInMemory = true;
    return null;
  }
}

export function getInMemoryStore() {
  return inMemoryStore;
}

export function checkIsInMemory() {
  return isInMemory;
}
