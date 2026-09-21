import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Save, Trash2, Plus, X, FileText } from "lucide-react";
import { templatesApi, type UserTemplate } from "../lib/api";

export default function TemplatesPage() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data } = await templatesApi.list();
      setTemplates(data.templates);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await templatesApi.update(editingId, title, content);
      } else {
        await templatesApi.create(title, content);
      }
      setTitle("");
      setContent("");
      setEditingId(null);
      await loadTemplates();
    } catch {
      setError(t("common.error"));
    }
  };

  const handleEdit = (template: UserTemplate) => {
    setEditingId(template.id);
    setTitle(template.title);
    setContent(template.content);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("templates.confirmDelete"))) return;
    try {
      await templatesApi.delete(id);
      await loadTemplates();
    } catch {
      setError(t("common.error"));
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
  };

  return (
    <div className="min-h-screen pb-24 px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-gradient">{t("templates.title")}</h1>
      <p className="text-gray-400 mb-6">{t("templates.subtitle")}</p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card p-4 mb-6">
        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("templates.titlePlaceholder")}
            className="input-field"
            maxLength={100}
            required
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("templates.contentPlaceholder")}
            className="input-field min-h-[120px] resize-none"
            maxLength={2000}
            required
          />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">
              <Save className="w-4 h-4" />
              {editingId ? t("common.update") : t("common.save")}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="btn-secondary">
                <X className="w-4 h-4" />
                {t("common.cancel")}
              </button>
            )}
          </div>
        </div>
      </form>

      {loading ? (
        <div className="text-center text-gray-400 py-8">{t("common.loading")}</div>
      ) : templates.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t("templates.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="card p-4 group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white mb-1 truncate">{template.title}</h3>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">{template.content}</p>
                </div>
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
                    aria-label={t("common.edit")}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition"
                    aria-label={t("common.delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
