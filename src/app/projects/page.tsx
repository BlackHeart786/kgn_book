"use client";
import { useMemo, useState, type FC } from "react";
import {
  Search,
  Plus,
  Briefcase,
  MapPin,
  Calendar,
  CircleDollarSign,
  Download,
  RefreshCcw,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";

// TYPES
export type ProjectStatus = "Planned" | "In Progress" | "On Hold" | "Completed";
export type ProjectPhase =
  | "Pre construction"
  | "Excavation"
  | "Foundation"
  | "Structure"
  | "Finishing"
  | "Payment Received";

export type Project = {
  id: number;
  name: string;
  site: string;
  client: string; // simple free-text, no manager UI
  status: ProjectStatus;
  phase: ProjectPhase;
  startDate: string;
  endDate: string;
  progress: number;
  budget: { total: number; used: number };
  notes?: string;
};

// MOCK DATA
const seed: Project[] = [
  {
    id: 101,
    name: "Highway Expansion",
    site: "KM 12-18, National Highway",
    client: "NHAI",
    status: "In Progress",
    phase: "Structure",
    startDate: "2025-06-01",
    endDate: "2026-02-28",
    progress: 58,
    budget: { total: 12_000_000, used: 6_900_000 },
    notes: "Box girder casting in progress; land Payment Receive for km 16 pending.",
  },
  {
    id: 102,
    name: "Bridge Construction",
    site: "River Crossing, District Road",
    client: "PWD",
    status: "Planned",
    phase: "Pre construction",
    startDate: "2025-10-01",
    endDate: "2026-06-30",
    progress: 5,
    budget: { total: 8_500_000, used: 150_000 },
    notes: "DPR approved; geotech mobilization scheduled for Oct 15.",
  },
  {
    id: 103,
    name: "Residential Complex",
    site: "Sector 45, Urban Area",
    client: "DLF",
    status: "In Progress",
    phase: "Finishing",
    startDate: "2025-02-10",
    endDate: "2025-12-15",
    progress: 75,
    budget: { total: 5_200_000, used: 4_200_000 },
    notes: "Tower B snag list started; facade vendor change approved.",
  },
];

// STYLE MAPS
const STATUS_TONE: Record<ProjectStatus, string> = {
  Planned: "bg-gray-500",
  "In Progress": "bg-blue-600",
  "On Hold": "bg-rose-600",
  Completed: "bg-emerald-600",
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

// UTILITIES
const pct = (used: number, total: number) => (total > 0 ? Math.min(100, (used / total) * 100) : 0);
const ddmmyyyy = (iso: string) => new Date(iso).toLocaleDateString("en-GB");

// ===== Progress Graph =====
const ProgressGraph: FC<{ progress: number; status: ProjectStatus }> = ({ progress, status }) => {
  const segments = 20;
  const activeSegments = Math.round((progress / 100) * segments);

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>0%</span>
        <span className="font-medium">{progress}%</span>
        <span>100%</span>
      </div>
      <div className="flex h-3 bg-neutral-800 rounded-full overflow-hidden">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 border-r border-neutral-900 ${i < activeSegments ? STATUS_TONE[status] : "bg-neutral-900"}`}
          />
        ))}
      </div>
    </div>
  );
};

// ===== Editor Modal =====
const emptyProject = (): Project => ({
  id: Date.now(),
  name: "",
  site: "",
  client: "",
  status: "Planned",
  phase: "Pre construction",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  progress: 0,
  budget: { total: 0, used: 0 },
  notes: "",
});

type EditorProps = {
  open: boolean;
  onClose: () => void;
  onSave: (p: Project) => void;
  draft: Project | null;
  setDraft: (p: Project) => void;
};

const FieldRow: FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-gray-300">{label}</span>
    {children}
  </label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`h-11 w-full px-3 py-2 rounded-md border border-neutral-800 bg-neutral-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 ${props.className ?? ""}`}
  />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={`h-11 w-full px-3 py-2 rounded-md border border-neutral-800 bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 ${props.className ?? ""}`}
  />
);

const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`w-full min-h-[110px] px-3 py-2 rounded-md border border-neutral-800 bg-neutral-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 ${props.className ?? ""}`}
  />
);

const EditorModal: FC<EditorProps> = ({ open, onClose, onSave, draft, setDraft }) => {
  if (!open || !draft) return null;

  const set = <K extends keyof Project>(k: K, v: Project[K]) => setDraft({ ...draft, [k]: v });
  const setBudget = (k: keyof Project["budget"], v: number) => setDraft({ ...draft, budget: { ...draft.budget, [k]: v } });

  // validation
  const errors: string[] = [];
  if (!draft.name.trim()) errors.push("Name is required");
  if (new Date(draft.endDate) < new Date(draft.startDate)) errors.push("End date cannot be before start date");
  if (draft.progress < 0 || draft.progress > 100) errors.push("Progress must be between 0 and 100");
  if (draft.budget.used > draft.budget.total) errors.push("Used budget cannot exceed total budget");

  const canSave = errors.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-900 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{draft?.id ? "Edit Project" : "New Project"}</h3>
          <button className="p-2 rounded-md hover:bg-neutral-900" onClick={onClose} aria-label="Close">
            <X size={18} className="text-gray-300" />
          </button>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="Project Name">
            <Input value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g., Coastal Highway" />
          </FieldRow>
          <FieldRow label="Client (optional)">
            <Input value={draft.client} onChange={(e) => set("client", e.target.value)} placeholder="e.g., PWD" />
          </FieldRow>

          <FieldRow label="Site">
            <Input value={draft.site} onChange={(e) => set("site", e.target.value)} placeholder="Location / description" />
          </FieldRow>

          <FieldRow label="Status">
            <Select value={draft.status} onChange={(e) => set("status", e.target.value as ProjectStatus)}>
              {(["Planned", "In Progress", "On Hold", "Completed"] as ProjectStatus[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </FieldRow>

          <FieldRow label="Phase">
            <Select value={draft.phase} onChange={(e) => set("phase", e.target.value as ProjectPhase)}>
              {(["Pre construction", "Excavation", "Foundation", "Structure", "Finishing", "Payment Receive"] as ProjectPhase[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </FieldRow>

          <FieldRow label="Progress (%)">
            <Input type="number" min={0} max={100} value={draft.progress} onChange={(e) => set("progress", Number(e.target.value))} />
          </FieldRow>

          <FieldRow label="Start Date">
            <Input type="date" value={draft.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </FieldRow>
          <FieldRow label="End Date">
            <Input type="date" value={draft.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </FieldRow>

          <FieldRow label="Budget Total (₹)">
            <Input type="number" min={0} value={draft.budget.total} onChange={(e) => setBudget("total", Number(e.target.value))} />
          </FieldRow>
          <FieldRow label="Budget Used (₹)">
            <Input type="number" min={0} value={draft.budget.used} onChange={(e) => setBudget("used", Number(e.target.value))} />
          </FieldRow>

          <div className="md:col-span-2">
            <FieldRow label="Notes / Memo (internal)">
              <TextArea placeholder="Key updates, blockers, approvals, vendor notes, etc." value={draft.notes ?? ""} onChange={(e)=>set("notes", e.target.value)} />
            </FieldRow>
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mt-4 text-sm text-rose-300 bg-rose-700/20 border border-rose-900 rounded-lg p-3">
            <ul className="list-disc list-inside space-y-1">
              {errors.map((e) => (<li key={e}>{e}</li>))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button className="h-11 px-4 rounded-md bg-neutral-900 text-gray-100 border border-neutral-800 hover:bg-neutral-800" onClick={onClose}>Cancel</button>
          <button className={`h-11 px-4 rounded-md text-white font-semibold flex items-center gap-2 ${canSave ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-600/40 cursor-not-allowed"}`} onClick={() => canSave && onSave(draft)} disabled={!canSave}>
            <Save size={16} /> Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== Project Card =====
const ProjectCard: FC<{ project: Project; onEdit: (p: Project) => void; onDelete: (id: number) => void; }> = ({ project: p, onEdit, onDelete }) => {
  const budgetUsedPercent = pct(p.budget.used, p.budget.total);

  return (
    <div className="bg-neutral-800 rounded-xl border border-neutral-900 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-100">{p.name}</h2>
          <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-1"><MapPin size={14} /> {p.site}</p>
          {p.client && (
            <p className="text-sm text-gray-400 flex items-center gap-1.5"><Briefcase size={14} /> {p.client}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full text-white ${STATUS_TONE[p.status]}`}>{p.status}</span>
          <button className="p-2 rounded-md hover:bg-neutral-900" onClick={() => onEdit(p)} title="Edit" aria-label="Edit"><Pencil size={16} className="text-gray-200" /></button>
          <button className="p-2 rounded-md hover:bg-rose-900/30" onClick={() => onDelete(p.id)} title="Delete" aria-label="Delete"><Trash2 size={16} className="text-rose-300" /></button>
        </div>
      </div>

      {/* Progress Graph */}
      <div className="mt-4">
        <div className="flex justify-between text-gray-300 mb-1"><span>Project Progress</span><span className="font-semibold">{p.progress}%</span></div>
        <ProgressGraph progress={p.progress} status={p.status} />
      </div>

      {/* Budget */}
      <div className="mt-4">
        <div className="flex justify-between text-gray-300 mb-1"><span className="flex items-center gap-1.5"><CircleDollarSign size={14} /> Budget</span><span className="font-semibold">{currencyFormatter.format(p.budget.used)}</span></div>
        <div className="w-full bg-neutral-900 rounded-full h-2"><div className="h-2 rounded-full bg-indigo-500" style={{ width: `${budgetUsedPercent}%` }} /></div>
        <div className="text-xs text-gray-400 mt-1 text-right">{currencyFormatter.format(p.budget.total)} total</div>
      </div>

      {/* Timeline */}
      <div className="mt-4 text-xs text-gray-400 flex items-center gap-2"><Calendar size={14} /><span>{ddmmyyyy(p.startDate)} → {ddmmyyyy(p.endDate)}</span></div>

      {/* Phase & Notes */}
      <div className="mt-3 text-sm"><span className="text-gray-300">Current Phase: </span><span className="text-gray-100 font-medium">{p.phase}</span></div>
      {p.notes && (
        <div className="mt-3 text-xs text-gray-300 bg-neutral-900 border border-neutral-800 rounded-md p-3">
          <span className="block font-medium text-gray-200 mb-1">Notes</span>
          <p className="whitespace-pre-wrap">{p.notes}</p>
        </div>
      )}
    </div>
  );
};

// ===== MAIN PAGE =====
export default function ProjectsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | ProjectStatus>("ALL");
  const [projects, setProjects] = useState<Project[]>(seed);

  // editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Project | null>(null);

  const openNew = () => { setDraft(emptyProject()); setIsEditorOpen(true); };
  const openEdit = (p: Project) => { setDraft(JSON.parse(JSON.stringify(p)) as Project); setIsEditorOpen(true); };
  const closeEditor = () => { setIsEditorOpen(false); setDraft(null); };

  const saveProject = (p: Project) => {
    setProjects((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      if (exists) return prev.map((x) => (x.id === p.id ? p : x));
      return [p, ...prev];
    });
    closeEditor();
  };

  const deleteProject = (id: number) => {
    if (!confirm("Delete this project? This action cannot be undone.")) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  // Filter projects based on search and status
  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.site.toLowerCase().includes(q) || p.client.toLowerCase().includes(q) || (p.notes ?? "").toLowerCase().includes(q);
      const matchesStatus = status === "ALL" || p.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [projects, query, status]);

  // Export CSV (includes Notes)
  const exportCsv = () => {
    const rows = [["ID","Name","Site","Client","Status","Phase","Start Date","End Date","Progress","Budget Used","Budget Total","Notes"], ...filteredProjects.map((p) => [p.id, p.name, p.site, p.client, p.status, p.phase, p.startDate, p.endDate, p.progress, p.budget.used, p.budget.total, (p.notes ?? "").replaceAll('\n',' ')])];
    const esc = (v: string | number) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
    const csv = rows.map((r) => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "construction_projects.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const resetFilters = () => { setQuery(""); setStatus("ALL"); };

  return (
    <div className="bg-black min-h-screen font-sans">
      <div className="p-6 max-w-screen-xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold items-center text-white">Construction Projects</h1>
            <p className="text-gray-400 mt-1">Track progress, timeline, and notes</p>
          </div>
          <button onClick={openNew} className="h-11 flex items-center justify-center gap-2 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">
            <Plus size={18} /> <span>New Project</span>
          </button>
        </div>

        {/* Filter bar (aligned heights) */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects (name/site/client/notes)" className="h-11 w-full pl-10 pr-4 rounded-md border border-neutral-800 bg-neutral-900 text-white placeholder-gray-400" />
          </div>

          <select className="h-11 px-3 rounded-md border border-neutral-800 bg-neutral-900 text-white" value={status} onChange={(e) => setStatus(e.target.value as "ALL" | ProjectStatus)}>
            <option value="ALL">All Statuses</option>
            {Object.keys(STATUS_TONE).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <button onClick={exportCsv} className="h-11 w-11 grid place-items-center rounded-md border border-neutral-800 text-gray-200 hover:bg-neutral-900"><Download size={16} /></button>
            <button onClick={resetFilters} className="h-11 w-11 grid place-items-center rounded-md bg-neutral-900 text-white border border-neutral-800 hover:bg-neutral-800"><RefreshCcw size={16} /></button>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((p) => (
              <ProjectCard key={p.id} project={p} onEdit={openEdit} onDelete={deleteProject} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-neutral-950 border border-neutral-900 rounded-lg">
            <h3 className="text-lg font-medium text-gray-200">No Projects Found</h3>
            <p className="mt-1 text-sm text-gray-400">Try adjusting your search query</p>
            <button onClick={resetFilters} className="mt-4 h-11 px-4 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700">Clear Filters</button>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <EditorModal open={isEditorOpen} onClose={closeEditor} onSave={saveProject} draft={draft} setDraft={setDraft} />
    </div>
  );
}

