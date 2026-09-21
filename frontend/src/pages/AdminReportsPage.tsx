import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "../lib/api";
import Alert from "../components/Alert";
import { Loader2, AlertTriangle, CheckCircle2, Clock, XCircle, FileDown, Download } from "lucide-react";

interface Report {
  id: number;
  initiatorId: number;
  targetId: number;
  category: string;
  description: string | null;
  status: string;
  createdAt: string;
  initiator: { id: number; username: string; email: string };
  target: { id: number; username: string; email: string };
}

const statusOptions = ["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"];

export default function AdminReportsPage() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);

  const load = async () => {
    try {
      const { data } = await adminApi.reports();
      setReports(data.reports);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    setUpdating(id);
    try {
      await adminApi.updateReportStatus(id, status);
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("common.error"));
    } finally {
      setUpdating(null);
    }
  };

  const downloadReport = async (id: number) => {
    try {
      const { data } = await adminApi.downloadReportDocx(id);
      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${id}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error(err);
      setError(t("common.error"));
    }
  };

  const exportAll = async () => {
    try {
      const { data } = await adminApi.exportReportsDocx();
      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reports-export-${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error(err);
      setError(t("common.error"));
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case "UNDER_REVIEW":
        return <Clock className="w-4 h-4 text-star-400" />;
      case "RESOLVED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "DISMISSED":
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">{t("admin.reports")}</h1>
          <div className="flex items-center gap-3">
            <button onClick={exportAll} className="btn-secondary text-sm">
              <Download className="w-4 h-4" />
              Export All
            </button>
            <span className="text-sm text-gray-400">{reports.length} reports</span>
          </div>
        </div>

        {error && <Alert type="error" className="mb-5">{error}</Alert>}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            {t("common.loading")}
          </div>
        ) : reports.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">No reports found.</div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {statusIcon(report.status)}
                    <span className="font-semibold text-white">#{report.id} {report.category}</span>
                    <span className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadReport(report.id)}
                      className="btn-ghost text-xs py-1.5 px-2"
                      title="Download report as DOCX"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>
                    <select
                      value={report.status}
                      disabled={updating === report.id}
                      onChange={(e) => updateStatus(report.id, e.target.value)}
                      className="bg-space-800 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-sm mb-4">
                  <div className="bg-white/5 rounded-xl p-3">
                    <span className="text-gray-400">Reported by: </span>
                    <span className="text-white">{report.initiator.username}</span>
                    <div className="text-xs text-gray-500">{report.initiator.email}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <span className="text-gray-400">Target: </span>
                    <span className="text-white">{report.target.username}</span>
                    <div className="text-xs text-gray-500">{report.target.email}</div>
                  </div>
                </div>

                {report.description && (
                  <p className="text-sm text-gray-300 bg-white/5 rounded-xl p-3">{report.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
