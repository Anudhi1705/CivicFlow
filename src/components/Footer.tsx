import React from "react";
import { Landmark } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-gray-100 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <Landmark className="h-4.5 w-4.5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-gray-900">
              Civic<span className="text-indigo-600">Flow</span>
            </span>
          </div>

          {/* Quick Links */}
          <p className="text-xs text-gray-500">
            &copy; 2026 CivicFlow Municipal Systems. Connecting communities with responsive governance.
          </p>

          {/* Docs / Policy */}
          <div className="flex gap-4 text-xs font-medium text-gray-500">
            <Link to="#" className="hover:text-indigo-600 transition-colors">
              Terms
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="#" className="hover:text-indigo-600 transition-colors">
              Privacy
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="#" className="hover:text-indigo-600 transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
