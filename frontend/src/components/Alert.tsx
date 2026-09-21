import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

interface Props {
  type?: "info" | "success" | "warning" | "error";
  children: React.ReactNode;
  className?: string;
}

const icons = {
  info: <Info className="w-5 h-5 text-cosmic-400" />,
  success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
  warning: <AlertCircle className="w-5 h-5 text-star-400" />,
  error: <XCircle className="w-5 h-5 text-red-400" />,
};

const styles = {
  info: "bg-cosmic-500/10 border-cosmic-500/20 text-cosmic-100",
  success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-100",
  warning: "bg-star-500/10 border-star-500/20 text-star-100",
  error: "bg-red-500/10 border-red-500/20 text-red-100",
};

export default function Alert({ type = "info", children, className = "" }: Props) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border ${styles[type]} ${className}`}>
      {icons[type]}
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}
