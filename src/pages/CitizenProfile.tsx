import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Phone, ShieldCheck, Loader2, Save } from "lucide-react";

export const CitizenProfile: React.FC = () => {
  const { token, user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phonenumber, setPhonenumber] = useState(user?.phonenumber || user?.phone || "");
  
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch(`/api/v1/citizen/${user?.id || user?._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, email, phonenumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Profile updated successfully!");
        updateUser(data.citizen);
      } else {
        throw new Error(data.message || "Failed to update profile.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-left min-h-[85vh]">
      <div className="border-b border-border-light pb-6 mb-8">
        <h1 className="text-3xl font-sans font-bold text-ink tracking-tight">
          Citizen Profile
        </h1>
        <p className="text-xs text-text-light font-sans font-normal mt-1 uppercase tracking-wider">
          Manage your contact credentials and verify registered details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="bg-white border border-border-light rounded-3xl p-6 flex flex-col items-center text-center shadow-[0_12px_30px_rgba(45,106,79,0.03)]">
          <div className="h-20 w-20 bg-soft-bg border border-border-light flex items-center justify-center text-accent rounded-2xl mb-4">
            <User className="h-10 w-10" />
          </div>
          <h2 className="font-sans font-bold text-lg text-ink leading-tight">{user?.fullName || user?.name}</h2>
          <span className="text-[10px] font-sans font-bold text-text-light uppercase tracking-widest block mt-1.5">
            Registered Citizen
          </span>

          <div className="mt-6 border-t border-border-light pt-5 w-full flex items-center justify-center gap-1.5 text-[10px] font-sans font-bold text-[#1b4332] uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            <span>Verified Account</span>
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2">
          {success && (
            <div className="mb-4 border border-green-100 bg-green-50 p-4 rounded-xl text-xs font-sans font-semibold text-green-900">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 border border-rose-100 bg-rose-50 p-4 rounded-xl text-xs font-sans font-semibold text-[#b71c1c]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-sans text-xs font-bold text-text-light uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute top-3.5 left-4 h-4 w-4 text-text-light" />
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-border-light bg-white py-3 pr-4 pl-11 text-xs rounded-xl font-sans font-medium focus:outline-hidden focus:ring-1 focus:ring-accent focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block font-sans text-xs font-bold text-text-light uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute top-3.5 left-4 h-4 w-4 text-text-light" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-border-light bg-white py-3 pr-4 pl-11 text-xs rounded-xl font-sans font-medium focus:outline-hidden focus:ring-1 focus:ring-accent focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block font-sans text-xs font-bold text-text-light uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute top-3.5 left-4 h-4 w-4 text-text-light" />
                <input
                  required
                  type="text"
                  value={phonenumber}
                  onChange={(e) => setPhonenumber(e.target.value)}
                  className="w-full border border-border-light bg-white py-3 pr-4 pl-11 text-xs rounded-xl font-sans font-medium focus:outline-hidden focus:ring-1 focus:ring-accent focus:border-accent"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent/90 text-white px-5 py-3.5 text-xs font-sans font-bold uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-accent/15"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
