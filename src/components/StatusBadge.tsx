import React from "react";
import { motion } from "motion/react";
import { Clock, Hammer, CheckCircle2, XCircle } from "lucide-react";
import { Issue } from "../types.ts";

interface StatusBadgeProps {
  status: Issue["status"];
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  className = ""
}) => {
  // Styles based on status
  const getStatusConfig = () => {
    switch (status) {
      case "resolved":
        return {
          bgClass: "bg-emerald-50 border-emerald-200 text-emerald-800 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
          dotColor: "bg-emerald-500",
          rippleColor: "rgba(16, 185, 129, 0.4)",
          label: "Resolved",
          icon: <CheckCircle2 className="text-emerald-600 shrink-0" />
        };
      case "in-progress":
        return {
          bgClass: "bg-amber-50 border-amber-200 text-amber-800 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
          dotColor: "bg-amber-500",
          rippleColor: "rgba(245, 158, 11, 0.4)",
          label: "In Progress",
          icon: (
            <motion.div
              animate={{ rotate: [0, 10, -10, 10, 0] }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
                repeatDelay: 1
              }}
              style={{ display: "inline-block" }}
            >
              <Hammer className="text-amber-600 shrink-0" />
            </motion.div>
          )
        };
      case "rejected":
        return {
          bgClass: "bg-rose-50 border-rose-200 text-rose-800 shadow-[0_0_12px_rgba(244,63,94,0.15)]",
          dotColor: "bg-rose-500",
          rippleColor: "rgba(244, 63, 94, 0.4)",
          label: "Rejected",
          icon: <XCircle className="text-rose-600 shrink-0" />
        };
      case "pending":
      default:
        return {
          bgClass: "bg-blue-50 border-blue-200 text-blue-800 shadow-[0_0_12px_rgba(59,130,246,0.15)]",
          dotColor: "bg-blue-500",
          rippleColor: "rgba(59, 130, 246, 0.4)",
          label: "Pending Review",
          icon: (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              }}
              style={{ display: "inline-block" }}
            >
              <Clock className="text-blue-600 shrink-0" />
            </motion.div>
          )
        };
    }
  };

  const config = getStatusConfig();

  // Size configurations
  const sizeClasses = {
    sm: {
      container: "px-2 py-0.5 text-[10px] rounded-lg border",
      dot: "w-1.5 h-1.5",
      iconSize: 11,
      gap: "gap-1"
    },
    md: {
      container: "px-3 py-1 text-xs rounded-xl border",
      dot: "w-2 h-2",
      iconSize: 13,
      gap: "gap-1.5"
    },
    lg: {
      container: "px-4 py-1.5 text-sm rounded-2xl border font-bold",
      dot: "w-2.5 h-2.5",
      iconSize: 16,
      gap: "gap-2"
    }
  };

  const currentSize = sizeClasses[size];

  // Clone icon with custom size
  const iconWithSize = React.cloneElement(config.icon as React.ReactElement, {
    size: currentSize.iconSize
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`inline-flex items-center font-semibold tracking-tight transition-all duration-300 ${currentSize.gap} ${config.bgClass} ${className}`}
      id={`status-badge-${status}`}
    >
      {/* Animated Pulse Dot */}
      <div className="relative flex items-center justify-center shrink-0">
        <motion.span
          animate={{
            scale: [1, 2.2, 1],
            opacity: [0.6, 0, 0.6]
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut"
          }}
          className="absolute inline-flex h-full w-full rounded-full"
          style={{ backgroundColor: config.rippleColor }}
        />
        <span className={`relative inline-flex rounded-full ${currentSize.dot} ${config.dotColor}`} />
      </div>

      {/* Icon with motion overlay */}
      {iconWithSize}

      {/* Text label */}
      <span className="capitalize">{config.label}</span>
    </motion.div>
  );
};
