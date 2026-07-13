import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { MapPicker } from "../components/MapPicker.tsx";
import { ArrowLeft, Send, AlertTriangle, Camera, Upload, Link as LinkIcon, X, VideoOff, RefreshCw } from "lucide-react";

const CATEGORIES = [
  "Roads & Potholes",
  "Streetlights & Electricity",
  "Sanitation & Trash",
  "Water & Sewerage",
  "Public Safety",
  "Others"
];

export const ReportIssue: React.FC = () => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Redirect if guest
  useEffect(() => {
    if (!user) navigate("/signin");
  }, [user]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [lat, setLat] = useState(37.7749);
  const [lng, setLng] = useState(-122.4194);
  const [address, setAddress] = useState("Oak St & 5th Ave, Downtown");
  const [imageUrl, setImageUrl] = useState("");
  
  const [imageSource, setImageSource] = useState<"upload" | "camera" | "url">("upload");
  const [dragActive, setDragActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error("Error playing video:", e));
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError(
        "Could not access your device camera. Please check camera permissions, secure context (HTTPS), or select 'Upload File' tab."
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (imageSource !== "camera") {
      stopCamera();
    }
  }, [imageSource]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const captureSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        compressAndSetImage(dataUrl);
        stopCamera();
      }
    }
  };

  const compressAndSetImage = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 600;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
        setImageUrl(compressedBase64);
      }
    };
    img.src = dataUrl;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Please upload a valid image file.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        compressAndSetImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLocationChange = (newLat: number, newLng: number, newAddress: string) => {
    setLat(newLat);
    setLng(newLng);
    setAddress(newAddress);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!title.trim() || !description.trim()) {
      setError("Please fill in the title and description of the issue.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          category,
          severity,
          location: {
            address,
            lat,
            lng
          },
          imageUrl: imageUrl.trim() || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit report");
      }

      showToast("Issue successfully reported! Local administration has been notified.", "success");
      // Success, redirect to dashboard
      navigate("/citizen");
    } catch (err: any) {
      const msg = err.message || "Failed to submit issue. Please try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="report-issue-page" className="max-w-4xl mx-auto py-4 px-4 space-y-6 text-left">
      {/* Header back link */}
      <div className="text-left">
        <button
          onClick={() => navigate("/citizen")}
          className="inline-flex items-center gap-1.5 px-4.5 py-2.5 border border-border-light bg-white text-ink hover:bg-soft-bg rounded-xl font-sans font-semibold text-xs uppercase tracking-wide cursor-pointer transition-all"
          id="report-back-btn"
        >
          <ArrowLeft size={13} />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="bg-white border border-border-light rounded-3xl p-6 sm:p-10 shadow-[0_15px_40px_rgba(45,106,79,0.03)] space-y-8">
        <div className="space-y-2 text-left border-b border-border-light pb-6">
          <span className="font-mono text-[10px] uppercase tracking-widest text-accent bg-[#e8f5e9] text-[#1b4332] px-3 py-1 rounded-full font-bold inline-block">[ SYSTEM WORK ORDER DISPATCH ]</span>
          <h1 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-ink leading-tight">Report a Community Concern</h1>
          <p className="text-xs sm:text-sm text-text-light font-sans font-normal">Provide precise details so CivicFlow municipal crews can resolve this issue quickly.</p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-sans font-medium text-[#b71c1c] flex items-start gap-2 leading-relaxed text-left">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-[#b71c1c]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left side details */}
            <div className="space-y-6 text-left">
              <div className="space-y-1.5">
                <label className="font-sans text-[11px] uppercase tracking-wider font-bold text-text-light block">
                  Issue Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Deep pothole in front of community gate"
                  className="w-full px-4 py-3 bg-soft-bg border border-border-light rounded-xl focus:outline-hidden focus:ring-1 focus:ring-accent focus:border-accent text-xs text-ink font-normal font-sans placeholder-text-light/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-[11px] uppercase tracking-wider font-bold text-text-light block">
                  Sector Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-border-light rounded-xl focus:outline-hidden focus:ring-1 focus:ring-accent focus:border-accent text-xs text-ink font-semibold cursor-pointer"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-[11px] uppercase tracking-wider font-bold text-text-light block">
                  Severity Priority *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["low", "medium", "high", "critical"] as const).map(sev => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`py-2.5 px-1 text-[10px] font-sans font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
                        severity === sev
                          ? "bg-accent text-white border-transparent shadow-md shadow-accent/15"
                          : "bg-white text-text-light border-border-light hover:bg-soft-bg"
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-[11px] uppercase tracking-wider font-bold text-text-light block">
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide helpful instructions, references, or specific markers (e.g., adjacent color of poles, dimensions, how long the water has been flowing)."
                  className="w-full px-4 py-3 bg-soft-bg border border-border-light rounded-xl focus:outline-hidden focus:ring-1 focus:ring-accent focus:border-accent text-xs text-ink font-normal font-sans leading-relaxed placeholder-text-light/50"
                />
              </div>

              <div className="space-y-3 font-sans">
                <label className="font-sans text-[11px] uppercase tracking-wider font-bold text-text-light block">
                  Issue Photo / Attachment
                </label>
                
                {/* Mode Selector Tabs */}
                <div className="flex bg-soft-bg border border-border-light rounded-2xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setImageSource("upload")}
                    className={`flex-1 py-2 text-[10px] font-sans font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      imageSource === "upload"
                        ? "bg-accent text-white shadow-sm"
                        : "text-text-light hover:text-ink hover:bg-white/50"
                    }`}
                    id="img-tab-upload"
                  >
                    <Upload size={12} />
                    <span>Upload</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageSource("camera")}
                    className={`flex-1 py-2 text-[10px] font-sans font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      imageSource === "camera"
                        ? "bg-accent text-white shadow-sm"
                        : "text-text-light hover:text-ink hover:bg-white/50"
                    }`}
                    id="img-tab-camera"
                  >
                    <Camera size={12} />
                    <span>Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageSource("url")}
                    className={`flex-1 py-2 text-[10px] font-sans font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      imageSource === "url"
                        ? "bg-accent text-white shadow-sm"
                        : "text-text-light hover:text-ink hover:bg-white/50"
                    }`}
                    id="img-tab-url"
                  >
                    <LinkIcon size={12} />
                    <span>Link</span>
                  </button>
                </div>

                {/* Tab 1: File Upload (Drag & Drop) */}
                {imageSource === "upload" && (
                  <div className="space-y-3">
                    {!imageUrl ? (
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed border-border-light rounded-2xl bg-soft-bg p-8 text-center transition-all cursor-pointer ${
                          dragActive ? "border-accent bg-[#edf5ef]" : "hover:bg-[#f3faf5]"
                        }`}
                        id="drag-drop-zone"
                      >
                        <input
                          type="file"
                          id="file-upload-input"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label htmlFor="file-upload-input" className="cursor-pointer space-y-3 block">
                          <div className="h-12 w-12 mx-auto border border-border-light bg-white rounded-full flex items-center justify-center text-[#2d6a4f] shadow-xs">
                            <Upload size={18} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-[#1b4332]">
                              DRAG & DROP OR <span className="underline text-accent">BROWSE</span>
                            </p>
                            <p className="text-[10px] text-text-light/70">JPEG or PNG files will be auto-optimized</p>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="relative border border-border-light rounded-2xl bg-soft-bg p-3 flex items-center gap-3">
                        <img
                          src={imageUrl}
                          alt="Uploaded attachment preview"
                          className="h-16 w-20 object-cover border border-border-light rounded-xl shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#1b4332] truncate">PHOTO LINKED SUCCESSFULLY</p>
                          <p className="text-[10px] text-text-light/70">Compressed Data URI</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setImageUrl("")}
                          className="h-8 w-8 border border-border-light rounded-xl hover:bg-white flex items-center justify-center text-text-light hover:text-red-600 cursor-pointer transition-all"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Live Camera Snapshot */}
                {imageSource === "camera" && (
                  <div className="space-y-3">
                    {cameraError && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] text-rose-950 font-sans font-semibold leading-relaxed">
                        {cameraError}
                      </div>
                    )}

                    {!imageUrl && !isCameraActive && (
                      <button
                        type="button"
                        onClick={startCamera}
                        className="w-full py-6 border-2 border-dashed border-border-light bg-soft-bg rounded-2xl hover:bg-[#f3faf5] flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all"
                        id="start-camera-btn"
                      >
                        <div className="h-12 w-12 border border-border-light bg-white rounded-full flex items-center justify-center text-[#2d6a4f] mb-1 shadow-xs">
                          <Camera size={18} />
                        </div>
                        <span className="text-xs font-bold text-[#1b4332] uppercase">Access Device Camera</span>
                        <span className="text-[10px] text-text-light/70">Capture concern with active device lens</span>
                      </button>
                    )}

                    {isCameraActive && (
                      <div className="relative border border-border-light rounded-2xl overflow-hidden bg-black aspect-video max-w-md mx-auto shadow-sm">
                        <video
                          ref={videoRef}
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
                          <button
                            type="button"
                            onClick={captureSnapshot}
                            className="px-5 py-2.5 bg-accent text-white rounded-xl text-xs font-sans font-bold uppercase tracking-wide shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                            id="capture-photo-btn"
                          >
                            <Camera size={12} />
                            <span>Capture</span>
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-5 py-2.5 bg-white text-ink border border-border-light rounded-xl text-xs font-sans font-bold uppercase tracking-wide shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <VideoOff size={12} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {imageUrl && (
                      <div className="relative border border-border-light rounded-2xl bg-soft-bg p-3 flex items-center gap-3">
                        <img
                          src={imageUrl}
                          alt="Captured web camera preview"
                          className="h-16 w-20 object-cover border border-border-light rounded-xl shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#1b4332] uppercase">Live Snapshot Captured</p>
                          <button
                            type="button"
                            onClick={() => {
                              setImageUrl("");
                              startCamera();
                            }}
                            className="text-[10px] text-accent hover:underline font-sans font-bold flex items-center gap-1 mt-0.5 cursor-pointer"
                          >
                            <RefreshCw size={10} className="animate-spin-slow" />
                            <span>RETAKE PHOTO</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setImageUrl("")}
                          className="h-8 w-8 border border-border-light rounded-xl hover:bg-white flex items-center justify-center text-text-light hover:text-red-600 cursor-pointer transition-all"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Reference Web URL */}
                {imageSource === "url" && (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="url"
                        value={imageUrl.startsWith("data:") ? "" : imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... (optional)"
                        className="w-full pl-4 pr-10 py-3 bg-soft-bg border border-border-light rounded-xl focus:outline-hidden focus:ring-1 focus:ring-accent focus:border-accent text-xs text-ink font-normal font-sans"
                      />
                      {imageUrl && !imageUrl.startsWith("data:") && (
                        <button
                          type="button"
                          onClick={() => setImageUrl("")}
                          className="absolute right-2.5 top-2.5 h-7 w-7 border border-border-light rounded-lg hover:bg-white flex items-center justify-center text-text-light hover:text-ink cursor-pointer transition-all"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                    {imageUrl && !imageUrl.startsWith("data:") && (
                      <div className="border border-border-light rounded-2xl bg-soft-bg p-3 flex items-center gap-3">
                        <img
                          src={imageUrl}
                          alt="Web URL live preview"
                          className="h-16 w-20 object-cover border border-border-light rounded-xl shrink-0"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?q=80&w=200&auto=format&fit=crop";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#1b4332] uppercase">Web Image Connected</p>
                          <p className="text-[10px] text-text-light/70 truncate">{imageUrl}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right side interactive map */}
            <div className="bg-soft-bg border border-border-light rounded-3xl p-5 flex flex-col justify-between">
              <div className="mb-3">
                <span className="font-sans text-[11px] uppercase tracking-wider font-bold text-text-light block">
                  Pin Location on Map
                </span>
                <p className="text-[11px] text-text-light/80 mt-0.5">Drag marker to precise geo-coordinates of issue</p>
              </div>
              <div className="h-[360px] md:h-full min-h-[300px] rounded-2xl overflow-hidden border border-border-light">
                <MapPicker
                  lat={lat}
                  lng={lng}
                  address={address}
                  onChange={handleLocationChange}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 bg-accent hover:bg-accent/90 text-white border-transparent rounded-xl font-sans font-bold text-xs sm:text-sm uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-md shadow-accent/15"
            id="report-submit-btn"
          >
            <Send size={14} />
            <span>{isLoading ? "Submitting Dispatch..." : "Dispatch Civic Work Order"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
