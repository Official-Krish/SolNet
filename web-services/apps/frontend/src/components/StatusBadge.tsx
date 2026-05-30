import { motion } from "motion/react";

interface StatusBadgeProps {
  status:
    | "RUNNING"
    | "TERMINATING"
    | "TERMINATED"
    | "DELETED"
    | "BOOTING"
    | "DEPLOYING"
    | "CREATING";
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const variants = {
    RUNNING: {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-500/20",
      dot: "bg-emerald-500",
    },
    BOOTING: {
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-500/20",
      dot: "bg-amber-500",
    },
    DELETED: {
      bg: "bg-neutral-500/10 dark:bg-neutral-500/20",
      text: "text-neutral-700 dark:text-neutral-300",
      border: "border-neutral-500/20",
      dot: "bg-neutral-500",
    },
    TERMINATING: {
      bg: "bg-red-500/10 dark:bg-red-500/20",
      text: "text-red-700 dark:text-red-300",
      border: "border-red-500/20",
      dot: "bg-red-500",
    },
    TERMINATED: {
      bg: "bg-red-500/10 dark:bg-red-500/20",
      text: "text-red-700 dark:text-red-300",
      border: "border-red-500/20",
      dot: "bg-red-500",
    },
    DEPLOYING: {
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-500/20",
      dot: "bg-blue-500",
    },
    CREATING: {
      bg: "bg-purple-500/10 dark:bg-purple-500/20",
      text: "text-purple-700 dark:text-purple-300",
      border: "border-purple-500/20",
      dot: "bg-purple-500",
    },
  };

  const variant = variants[status];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${variant.bg} ${variant.text} ${variant.border} ${className}`}
    >
      <motion.div
        className={`w-2 h-2 rounded-full ${variant.dot}`}
        animate={status === "BOOTING" ? { opacity: [1, 0.3, 1] } : {}}
        transition={
          status === "BOOTING" ? { repeat: Infinity, duration: 1.5 } : {}
        }
      />
      <span className="capitalize">{status}</span>
    </motion.div>
  );
}
