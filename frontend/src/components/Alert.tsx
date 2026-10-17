import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

interface Props {
  type?: "info" | "success" | "warning" | "error";
  children: React.ReactNode;
  className?: string;
}

const icons = {
  info: <Info className="w-5 h-5 text-sky-700 dark:text-cosmic-400" />,
  success: <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />,
  warning: <AlertCircle className="w-5 h-5 text-amber-700 dark:text-star-400" />,
  error: <XCircle className="w-5 h-5 text-red-700 dark:text-red-400" />,
};

const styles = {
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-cosmic-500/20 dark:bg-cosmic-500/10 dark:text-cosmic-100",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100",
  warning: "border-amber-200 bg-amber-50 text-amber-950 dark:border-star-500/20 dark:bg-star-500/10 dark:text-star-100",
  error: "border-red-200 bg-red-50 text-red-950 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100",
};

// API errors can be structured objects (zod fieldErrors) - rendering those as
// React children crashes the app, so normalize to a string.
function normalizeChildren(children: React.ReactNode): React.ReactNode {
  if (typeof children === "object" && children !== null && !Array.isArray(children)) {
    const err = children as { error?: unknown; message?: string };
    if (typeof err.message === "string") return err.message;
    try {
      return JSON.stringify(children);
    } catch {
      return "Error";
    }
  }
  return children;
}

export default function Alert({ type = "info", children, className = "" }: Props) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border ${styles[type]} ${className}`}>
      {icons[type]}
      <div className="text-sm leading-relaxed">{normalizeChildren(children)}</div>
    </div>
  );
}
