export type Role = "citizen" | "admin";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  address?: string;
  department?: string; // For admins, if applicable
  createdAt: string;
  fullName?: string;
  phonenumber?: string;
  adminAccessCode?: string;
  id?: string;
}

export interface IssueLocation {
  address?: string;
  lat: number;
  lng: number;
}

export interface ReportedBy {
  _id: string;
  name: string;
  email: string;
}

export interface IssueHistoryEvent {
  _id: string;
  type: "status_change" | "comment" | "department_assignment" | "creation" | "upvote";
  statusBefore?: "pending" | "in-progress" | "resolved" | "rejected";
  statusAfter?: "pending" | "in-progress" | "resolved" | "rejected";
  comment?: string;
  department?: string;
  actor: {
    _id: string;
    name: string;
    role: "citizen" | "admin" | "system";
  };
  createdAt: string;
}

export interface Issue {
  _id: string;
  title: string;
  description: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "pending" | "in-progress" | "resolved" | "rejected";
  location: IssueLocation;
  reportedBy: ReportedBy;
  assignedToDepartment?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  upvotes: string[]; // List of user IDs who upvoted this issue
  history?: IssueHistoryEvent[]; // History of status updates and comments
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
