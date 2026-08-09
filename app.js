const { useState, useEffect, useCallback, useRef } = React;

/* ---------- tiny inline icon set (no external icon package needed) ---------- */
function Icon({ children, size = 16, color = "currentColor", strokeWidth = 2, viewBox = "0 0 24 24" }) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
const PlusIcon = (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;
const XIcon = (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>;
const ChevronLeftIcon = (p) => <Icon {...p}><path d="M15 18l-6-6 6-6" /></Icon>;
const ChevronRightIcon = (p) => <Icon {...p}><path d="M9 18l6-6-6-6" /></Icon>;
const TrashIcon = (p) => <Icon {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" /></Icon>;
const CheckIcon = (p) => <Icon {...p}><path d="M20 6 9 17l-5-5" /></Icon>;
const LeafIcon = (p) => <Icon {...p}><path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 9-11 1 5 3 8 3 12a7 7 0 0 1-5 6Z" /><path d="M4 13c3 0 6 1 8 3" /></Icon>;
const BoneIcon = (p) => <Icon {...p}><path d="M5 9a2.5 2.5 0 0 0-2 4 2.5 2.5 0 0 0 3.5 2.3l7-7A2.5 2.5 0 0 0 17 5a2.5 2.5 0 0 0-4 2L6 14a2.5 2.5 0 0 0-2 4 2.5 2.5 0 0 0 4-2l7-7" /></Icon>;
const BrainIcon = (p) => <Icon {...p}><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3M9 4a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3M9 4v16M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3M15 4a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3M15 4v16" /></Icon>;
const SparklesIcon = (p) => <Icon {...p}><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z" /><path d="M19 15l.7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9Z" /></Icon>;
const SyringeIcon = (p) => <Icon {...p}><path d="m18 2 4 4M17 7l3-3M6 15l-4 4v3h3l4-4M13 5l6 6M8 10l6 6M11 7l6 6" /></Icon>;
const DropletIcon = (p) => <Icon {...p}><path d="M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12Z" /></Icon>;
const BarChartIcon = (p) => <Icon {...p}><path d="M3 3v18h18M8 17V10M13 17V6M18 17v-4" /></Icon>;
const DownloadIcon = (p) => <Icon {...p}><path d="M12 3v12m0 0-4-4m4 4 4-4M4 19h16" /></Icon>;
const CloudIcon = (p) => <Icon {...p}><path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.4 1.5A4 4 0 0 0 6.5 19h11Z" /></Icon>;

/* ---------- constants (unchanged from the in-Claude version) ---------- */
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LETTERS = ["S","M","T","W","T","F","S"];

const CATEGORIES = {
  supplement:  { label: "Supplement", hue: 152, sat: 45, Icon: LeafIcon },
  physical:    { label: "Physical / Pain", hue: 16, sat: 68, Icon: BoneIcon },
  mental:      { label: "Mental / Emotional", hue: 252, sat: 52, Icon: BrainIcon },
  topicalRx:   { label: "Topical – Prescription", hue: 200, sat: 58, Icon: SyringeIcon },
  topicalOtc:  { label: "Topical – Non-Prescription", hue: 328, sat: 50, Icon: DropletIcon },
  misc:        { label: "Misc", hue: 40, sat: 55, Icon: SparklesIcon },
};
const CATEGORY_ORDER = ["supplement", "physical", "mental", "topicalRx", "topicalOtc", "misc"];

function medColor(category, indexInCategory) {
  const cat = CATEGORIES[category] || CATEGORIES.misc;
  const lightness = 58 + (indexInCategory % 4) * 7;
  return `hsl(${cat.hue}, ${cat.sat}%, ${lightness}%)`;
}
function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function monthKey(year, month) { return `${year}-${String(month + 1).padStart(2, "0")}`; }
function startOfWeek(d) { const nd = new Date(d.getFullYear(), d.getMonth(), d.getDate()); nd.setDate(nd.getDate() - nd.getDay()); return nd; }
function addDays(d, n) { const nd = new Date(d.getFullYear(), d.getMonth(), d.getDate()); nd.setDate(nd.getDate() + n); return nd; }
function sameDate(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function fmtWeekRange(weekStart) {
  const end = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  const startStr = `${MONTH_NAMES[weekStart.getMonth()].slice(0, 3)} ${weekStart.getDate()}`;
  const endStr = sameMonth ? `${end.getDate()}` : `${MONTH_NAMES[end.getMonth()].slice(0, 3)} ${end.getDate()}`;
  return `${startStr}–${endStr}, ${end.getFullYear()}`;
}
function lastNMonthKeys(year, month, n) {
  const keys = []; let y = year, m = month;
  for (let i = 0; i < n; i++) { keys.push(monthKey(y, m)); m -= 1; if (m < 0) { m = 11; y -= 1; } }
  return keys;
}
async function fetchRecordsForKeys(keys) {
  const out = {};
  for (const mk of keys) {
    try { const res = await window.storage.get(`records-${mk}`); if (res) out[mk] = JSON.parse(res.value); } catch {}
  }
  return out;
}
async function fetchAllRecords() {
  const out = {};
  const listRes = await window.storage.list("records-");
  const keys = listRes?.keys || [];
  for (const fullKey of keys) {
    try {
      const res = await window.storage.get(fullKey);
      if (res) out[fullKey.replace(/^records-/, "")] = JSON.parse(res.value);
    } catch {}
  }
  return out;
}
function computeStats(meds, aggregated) {
  const perMed = meds.map((med) => {
    let taken = 0, missed = 0;
    for (const mk of Object.keys(aggregated)) {
      const rec = aggregated[mk]?.[med.id];
      if (!rec) continue;
      for (const day of Object.keys(rec)) {
        if (rec[day] === "taken") taken++; else if (rec[day] === "missed") missed++;
      }
    }
    const tracked = taken + missed;
    return { id: med.id, name: med.name, category: med.category, taken, missed, tracked, pct: tracked === 0 ? null : Math.round((taken / tracked) * 100) };
  });
  const totalTaken = perMed.reduce((s, m) => s + m.taken, 0);
  const totalTracked = perMed.reduce((s, m) => s + m.tracked, 0);
  return { perMed, overallPct: totalTracked === 0 ? null : Math.round((totalTaken / totalTracked) * 100), totalTaken, totalTracked };
}
function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function csvEscape(v) { return `"${String(v).replace(/"/g, '""')}"`; }
function toCSV(meds, aggregated) {
  const medMap = Object.fromEntries(meds.map((m) => [m.id, m]));
  const rows = [["Date", "Medication", "Category", "Status"]];
  Object.keys(aggregated).sort().forEach((mk) => {
    const [y, m] = mk.split("-").map(Number);
    const rec = aggregated[mk];
    Object.keys(rec).forEach((medId) => {
      const med = medMap[medId]; if (!med) return;
      const catLabel = CATEGORIES[med.category]?.label || med.category;
      Object.keys(rec[medId]).sort((a, b) => Number(a) - Number(b)).forEach((day) => {
        rows.push([`${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`, med.name, catLabel, rec[medId][day]]);
      });
    });
  });
  return rows.map((r) => r.map(csvEscape).join(",")).join("\n");
}

/* ---------- Google Drive backup (appDataFolder — private, hidden from your visible Drive) ---------- */
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const DRIVE_BACKUP_NAME = "med-grid-backup.json";

function driveClientReady() { return typeof google !== "undefined" && google.accounts; }

async function driveListBackupFile(token) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent("name='" + DRIVE_BACKUP_NAME + "'")}&fields=files(id,modifiedTime)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  return data.files && data.files[0];
}
function collectAllLocalData() {
  const medsRaw = localStorage.getItem("meds-list");
  const meds = medsRaw ? JSON.parse(medsRaw) : [];
  const records = {};
  Object.keys(localStorage).forEach((k) => {
    if (k.startsWith("records-")) records[k.replace(/^records-/, "")] = JSON.parse(localStorage.getItem(k));
  });
  return { meds, records };
}
function writeAllLocalData(data) {
  localStorage.setItem("meds-list", JSON.stringify(data.meds || []));
  Object.keys(localStorage).forEach((k) => { if (k.startsWith("records-")) localStorage.removeItem(k); });
  Object.entries(data.records || {}).forEach(([mk, rec]) => localStorage.setItem(`records-${mk}`, JSON.stringify(rec)));
}
async function driveBackup(token) {
  const payload = JSON.stringify(collectAllLocalData());
  const existing = await driveListBackupFile(token);
  if (existing) {
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: payload,
    });
  } else {
    const boundary = "medgridboundary";
    const metadata = { name: DRIVE_BACKUP_NAME, parents: ["appDataFolder"] };
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${payload}\r\n--${boundary}--`;
    await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    });
  }
}
async function driveRestore(token) {
  const existing = await driveListBackupFile(token);
  if (!existing) return { found: false };
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${existing.id}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  return { found: true, data, modifiedTime: existing.modifiedTime };
}

function useFonts() {
  useEffect(() => {
    if (document.getElementById("mt-fonts")) return;
    const link = document.createElement("link");
    link.id = "mt-fonts"; link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

/* ---------- main component ---------- */
function MedTracker() {
  useFonts();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState("month");
  const [weekStart, setWeekStart] = useState(startOfWeek(today));

  const [meds, setMeds] = useState(null);
  const [recordsByMonth, setRecordsByMonth] = useState({});
  const [recordsLoading, setRecordsLoading] = useState(false);
  const loadedRef = useRef(new Set());

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDose, setNewDose] = useState("");
  const [newCategory, setNewCategory] = useState(null);
  const [error, setError] = useState("");

  const [showReports, setShowReports] = useState(false);
  const [reportRange, setReportRange] = useState("month");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportStats, setReportStats] = useState(null);
  const [reportData, setReportData] = useState(null);

  const [showDrive, setShowDrive] = useState(false);
  const [driveToken, setDriveToken] = useState(null);
  const [driveStatus, setDriveStatus] = useState("");
  const tokenClientRef = useRef(null);

  const mKey = monthKey(year, month);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("meds-list");
        const list = res ? JSON.parse(res.value) : [];
        setMeds(list.map((m) => ({ ...m, category: m.category || "misc" })));
      } catch { setMeds([]); }
    })();
  }, []);

  useEffect(() => {
    if (!window.GOOGLE_CLIENT_ID || window.GOOGLE_CLIENT_ID.includes("PASTE_YOUR")) return;
    const setup = () => {
      if (!driveClientReady()) { setTimeout(setup, 300); return; }
      tokenClientRef.current = google.accounts.oauth2.initTokenClient({
        client_id: window.GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: (resp) => {
          if (resp.access_token) { setDriveToken(resp.access_token); setDriveStatus("Connected."); }
        },
      });
    };
    setup();
  }, []);

  const ensureMonthsLoaded = useCallback(async (keys) => {
    const missing = keys.filter((k) => !loadedRef.current.has(k));
    if (missing.length === 0) return;
    missing.forEach((k) => loadedRef.current.add(k));
    setRecordsLoading(true);
    const updates = {};
    for (const mk of missing) {
      try { const res = await window.storage.get(`records-${mk}`); updates[mk] = res ? JSON.parse(res.value) : {}; }
      catch { updates[mk] = {}; }
    }
    setRecordsByMonth((prev) => ({ ...prev, ...updates }));
    setRecordsLoading(false);
  }, []);

  useEffect(() => { if (viewMode === "month") ensureMonthsLoaded([mKey]); }, [viewMode, mKey, ensureMonthsLoaded]);
  useEffect(() => {
    if (viewMode === "week") {
      const keys = Array.from(new Set(Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((d) => monthKey(d.getFullYear(), d.getMonth()))));
      ensureMonthsLoaded(keys);
    }
  }, [viewMode, weekStart, ensureMonthsLoaded]);

  const persistMeds = useCallback(async (list) => {
    try { await window.storage.set("meds-list", JSON.stringify(list)); } catch { setError("Couldn't save. Try again."); }
  }, []);
  const persistRecords = useCallback(async (key, rec) => {
    try { await window.storage.set(`records-${key}`, JSON.stringify(rec)); } catch { setError("Couldn't save. Try again."); }
  }, []);

  const resetAddForm = () => { setNewName(""); setNewDose(""); setNewCategory(null); setShowAdd(false); };
  const addMed = () => {
    const name = newName.trim();
    if (!name || !newCategory) return;
    const med = { id: `${Date.now()}`, name, dose: newDose.trim(), category: newCategory };
    const list = [...meds, med];
    setMeds(list); persistMeds(list); resetAddForm();
  };
  const deleteMed = (id) => { const list = meds.filter((m) => m.id !== id); setMeds(list); persistMeds(list); };

  const getStatus = (date, medId) => {
    const mk = monthKey(date.getFullYear(), date.getMonth());
    return recordsByMonth[mk]?.[medId]?.[date.getDate()];
  };
  const toggleCell = (date, medId) => {
    const mk = monthKey(date.getFullYear(), date.getMonth());
    const day = date.getDate();
    setRecordsByMonth((prev) => {
      const monthRec = { ...(prev[mk] || {}) };
      const medRec = { ...(monthRec[medId] || {}) };
      const current = medRec[day];
      if (!current) medRec[day] = "taken";
      else if (current === "taken") medRec[day] = "missed";
      else delete medRec[day];
      monthRec[medId] = medRec;
      const next = { ...prev, [mk]: monthRec };
      persistRecords(mk, monthRec);
      return next;
    });
  };
  const adherence = (medId, dateList) => {
    let taken = 0, missed = 0;
    for (const d of dateList) { const s = getStatus(d, medId); if (s === "taken") taken++; else if (s === "missed") missed++; }
    const tracked = taken + missed;
    return tracked === 0 ? null : Math.round((taken / tracked) * 100);
  };

  const shiftMonth = (delta) => {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y -= 1; } if (m > 11) { m = 0; y += 1; }
    setMonth(m); setYear(y);
  };
  const shiftWeek = (delta) => setWeekStart((prev) => addDays(prev, delta * 7));
  const switchToWeek = () => {
    const base = year === today.getFullYear() && month === today.getMonth() ? today : new Date(year, month, 1);
    setWeekStart(startOfWeek(base)); setViewMode("week");
  };
  const switchToMonth = () => {
    const mid = addDays(weekStart, 3);
    setYear(mid.getFullYear()); setMonth(mid.getMonth()); setViewMode("month");
  };

  const loadReport = useCallback(async (range) => {
    setReportLoading(true);
    let aggregated;
    if (range === "month") aggregated = await fetchRecordsForKeys([mKey]);
    else if (range === "quarter") aggregated = await fetchRecordsForKeys(lastNMonthKeys(year, month, 3));
    else aggregated = await fetchAllRecords();
    setReportData(aggregated);
    setReportStats(computeStats(meds || [], aggregated));
    setReportLoading(false);
  }, [mKey, year, month, meds]);
  const openReports = () => { setShowReports(true); loadReport(reportRange); };
  const changeReportRange = (range) => { setReportRange(range); loadReport(range); };
  const exportCSV = () => { if (!reportData) return; downloadFile(`meds-${reportRange}-${mKey}.csv`, toCSV(meds || [], reportData), "text/csv"); };
  const exportJSON = () => { if (!reportData) return; downloadFile(`meds-${reportRange}-${mKey}.json`, JSON.stringify({ meds, records: reportData }, null, 2), "application/json"); };

  const connectDrive = () => {
    if (!window.GOOGLE_CLIENT_ID || window.GOOGLE_CLIENT_ID.includes("PASTE_YOUR")) {
      setDriveStatus("Google Client ID not set up yet — see setup instructions."); return;
    }
    if (!tokenClientRef.current) { setDriveStatus("Still loading Google sign-in, try again in a moment."); return; }
    tokenClientRef.current.requestAccessToken();
  };
  const backupNow = async () => {
    if (!driveToken) return;
    setDriveStatus("Backing up…");
    try { await driveBackup(driveToken); setDriveStatus("Backed up just now."); }
    catch { setDriveStatus("Backup failed — try again."); }
  };
  const restoreNow = async () => {
    if (!driveToken) return;
    setDriveStatus("Checking Drive…");
    try {
      const res = await driveRestore(driveToken);
      if (!res.found) { setDriveStatus("No backup found on Drive yet."); return; }
      writeAllLocalData(res.data);
      loadedRef.current = new Set();
      setRecordsByMonth({});
      const medsRes = await window.storage.get("meds-list");
      setMeds(medsRes ? JSON.parse(medsRes.value).map((m) => ({ ...m, category: m.category || "misc" })) : []);
      ensureMonthsLoaded([mKey]);
      setDriveStatus(`Restored backup from ${new Date(res.modifiedTime).toLocaleString()}.`);
    } catch { setDriveStatus("Restore failed — try again."); }
  };

  const nDays = daysInMonth(year, month);
  const daysList = viewMode === "month"
    ? Array.from({ length: nDays }, (_, i) => new Date(year, month, i + 1))
    : Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const medsByCategory = CATEGORY_ORDER.map((cat) => ({ cat, items: (meds || []).filter((m) => m.category === cat) })).filter((g) => g.items.length > 0);
  const orderedMeds = medsByCategory.flatMap((g) => g.items.map((m, i) => ({ ...m, color: medColor(g.cat, i) })));

  const cellPx = viewMode === "week" ? 46 : 30;
  const iconCheckPx = viewMode === "week" ? 19 : 14;
  const iconXPx = viewMode === "week" ? 17 : 13;
  const labelWidthPx = viewMode === "week" ? 90 : 72;
  const cellGap = viewMode === "week" ? 7 : 0;
  const cellRadius = viewMode === "week" ? 12 : 7;
  const gridMinWidth = viewMode === "month" ? `${labelWidthPx + 2 + nDays * cellPx}px` : "100%";

  return (
    <div style={pageStyle}>
      <AmbientBlobs />
      <div style={{ position: "relative", zIndex: 1, paddingBottom: "5rem" }}>
        <div style={{ padding: "1.5rem 1.1rem 0.75rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div>
              <div style={eyebrowStyle}>Rx Log</div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.7rem", fontWeight: 600, margin: "0.2rem 0 0", color: "#F4F1EC" }}>Medication grid</h1>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => setShowDrive(true)} style={reportsBtnStyle} aria-label="Google Drive backup"><CloudIcon size={16} /></button>
              <button onClick={openReports} style={reportsBtnStyle} aria-label="Reports and export"><BarChartIcon size={16} /></button>
              <button onClick={() => setShowAdd(true)} style={addBtnStyle}><PlusIcon size={16} /> Med</button>
            </div>
          </div>
        </div>

        <div style={{ padding: "0 1.1rem", marginBottom: "0.6rem" }}>
          <div style={{ display: "inline-flex", background: "rgba(244,241,236,0.05)", border: "1px solid rgba(244,241,236,0.1)", borderRadius: "999px", padding: "3px" }}>
            <button onClick={switchToWeek} style={{ padding: "0.4rem 0.9rem", borderRadius: "999px", border: "none", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", background: viewMode === "week" ? "#E8C08A" : "transparent", color: viewMode === "week" ? "#1A1B22" : "#A6A197" }}>Week</button>
            <button onClick={switchToMonth} style={{ padding: "0.4rem 0.9rem", borderRadius: "999px", border: "none", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", background: viewMode === "month" ? "#E8C08A" : "transparent", color: viewMode === "month" ? "#1A1B22" : "#A6A197" }}>Month</button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.4rem 1.1rem 1.1rem" }}>
          <button onClick={() => (viewMode === "month" ? shiftMonth(-1) : shiftWeek(-1))} aria-label="Previous" style={navBtnStyle}><ChevronLeftIcon size={18} /></button>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "0.03em", color: "#F4F1EC" }}>
            {viewMode === "month" ? `${MONTH_NAMES[month]} ${year}` : fmtWeekRange(weekStart)}
          </div>
          <button onClick={() => (viewMode === "month" ? shiftMonth(1) : shiftWeek(1))} aria-label="Next" style={navBtnStyle}><ChevronRightIcon size={18} /></button>
        </div>

        {error && <div style={{ padding: "0 1.1rem 0.5rem", color: "#E9A0A0", fontSize: "0.8rem" }}>{error}</div>}

        {meds === null || recordsLoading ? (
          <div style={{ padding: "2rem 1.1rem", color: "#B8B3AA" }}>Loading…</div>
        ) : orderedMeds.length === 0 ? (
          <div style={{ padding: "2rem 1.25rem", color: "#B8B3AA" }}>
            <p style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>No medications yet. Add one to start — you'll pick a type and it'll get its own color family in the grid.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto", padding: "0 1.1rem" }}>
              <div style={{ minWidth: gridMinWidth }}>
                <div style={{ display: "flex", gap: `${cellGap}px`, marginBottom: "0.45rem" }}>
                  <div style={{ width: `${labelWidthPx}px`, flexShrink: 0 }} />
                  {daysList.map((d, i) => {
                    const dow = d.getDay(); const weekend = dow === 0 || dow === 6; const isToday = sameDate(d, today);
                    const showMonthTag = d.getDate() === 1;
                    return (
                      <div key={i} style={{ width: `${cellPx}px`, flexShrink: 0, textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: viewMode === "week" ? "0.72rem" : "0.65rem", color: isToday ? "#F4F1EC" : weekend ? "#7A756C" : "#A6A197", fontWeight: isToday ? 700 : 500 }}>
                        <div>{DAY_LETTERS[dow]}</div><div>{d.getDate()}</div>
                        {viewMode === "week" && showMonthTag && <div style={{ fontSize: "0.55rem", color: "#8A857B" }}>{MONTH_NAMES[d.getMonth()].slice(0, 3)}</div>}
                      </div>
                    );
                  })}
                </div>

                {medsByCategory.map((group) => {
                  const catInfo = CATEGORIES[group.cat]; const CatIcon = catInfo.Icon;
                  return (
                    <div key={group.cat} style={{ marginBottom: "0.9rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.35rem", opacity: 0.8 }}>
                        <CatIcon size={11} color={`hsl(${catInfo.hue}, ${catInfo.sat}%, 68%)`} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: `hsl(${catInfo.hue}, ${catInfo.sat}%, 72%)` }}>{catInfo.label}</span>
                      </div>
                      {group.items.map((m, i) => {
                        const color = medColor(group.cat, i);
                        const pct = adherence(m.id, daysList);
                        return (
                          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: `${cellGap}px`, marginBottom: viewMode === "week" ? "0.6rem" : "0.5rem" }}>
                            <div style={{ width: `${labelWidthPx}px`, flexShrink: 0, paddingRight: "0.5rem", position: "sticky", left: 0 }}>
                              <div style={{ fontSize: viewMode === "week" ? "0.8rem" : "0.72rem", fontWeight: 600, color: "#F4F1EC", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.name}>{m.name}</div>
                              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", color: "#8A857B" }}>{pct === null ? "—" : `${pct}%`}</div>
                            </div>
                            {daysList.map((d, di) => {
                              const status = getStatus(d, m.id); const isToday = sameDate(d, today);
                              return (
                                <button key={di} onClick={() => toggleCell(d, m.id)} aria-label={`${m.name} ${d.toDateString()}: ${status || "not tracked"}`}
                                  style={{ width: `${cellPx}px`, height: `${cellPx}px`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: isToday ? `1.5px solid ${color}` : "1px solid rgba(244,241,236,0.08)", borderRadius: `${cellRadius}px`, background: status === "taken" ? color : status === "missed" ? "rgba(244,241,236,0.03)" : "rgba(244,241,236,0.045)", boxSizing: "border-box", cursor: "pointer", padding: 0, transition: "background 0.15s ease" }}>
                                  {status === "taken" && <CheckIcon size={iconCheckPx} color="#1A1B22" strokeWidth={3} />}
                                  {status === "missed" && <XIcon size={iconXPx} color={color} strokeWidth={2.5} />}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: "0.5rem 1.1rem 0", display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
              {orderedMeds.map((m) => (
                <button key={m.id} onClick={() => deleteMed(m.id)} style={removeBtnStyle}><TrashIcon size={10} /> {m.name}</button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "1rem", padding: "1.4rem 1.25rem 0", fontSize: "0.7rem", color: "#A6A197", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><span style={{ width: 14, height: 14, borderRadius: 4, background: "#8FBFA0" }} />Taken</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><span style={{ width: 14, height: 14, borderRadius: 4, border: "1px solid #8FBFA0", display: "flex", alignItems: "center", justifyContent: "center" }}><XIcon size={9} color="#8FBFA0" strokeWidth={2.5} /></span>Missed</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><span style={{ width: 14, height: 14, borderRadius: 4, background: "rgba(244,241,236,0.045)", border: "1px solid rgba(244,241,236,0.08)" }} />Not tracked</div>
            </div>
          </>
        )}
      </div>

      {showAdd && (
        <div style={modalOverlayStyle} onClick={resetAddForm}>
          <div onClick={(e) => e.stopPropagation()} style={modalStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.1rem" }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.15rem", fontWeight: 600, margin: 0, color: "#F4F1EC" }}>Add medication</h2>
              <button onClick={resetAddForm} style={{ background: "none", border: "none", color: "#A6A197", cursor: "pointer" }}><XIcon size={20} /></button>
            </div>
            <label style={labelStyle}>What type is it?</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.9rem" }}>
              {CATEGORY_ORDER.map((cat) => {
                const info = CATEGORIES[cat]; const CatIcon = info.Icon; const active = newCategory === cat;
                const hslColor = `hsl(${info.hue}, ${info.sat}%, 65%)`;
                return (
                  <button key={cat} onClick={() => setNewCategory(cat)} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.4rem", padding: "0.7rem 0.75rem", borderRadius: "10px", border: active ? `1.5px solid ${hslColor}` : "1px solid rgba(244,241,236,0.1)", background: active ? `hsla(${info.hue}, ${info.sat}%, 65%, 0.14)` : "rgba(244,241,236,0.03)", cursor: "pointer", textAlign: "left" }}>
                    <CatIcon size={16} color={hslColor} />
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#F4F1EC" }}>{info.label}</span>
                  </button>
                );
              })}
            </div>
            <label style={labelStyle}>Name</label>
            <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Metformin" style={inputStyle} onKeyDown={(e) => e.key === "Enter" && addMed()} />
            <label style={labelStyle}>Dose (optional)</label>
            <input value={newDose} onChange={(e) => setNewDose(e.target.value)} placeholder="e.g. 500mg" style={inputStyle} onKeyDown={(e) => e.key === "Enter" && addMed()} />
            <button onClick={addMed} disabled={!newName.trim() || !newCategory} style={{ width: "100%", marginTop: "0.9rem", background: newName.trim() && newCategory ? "#E8C08A" : "rgba(244,241,236,0.08)", color: newName.trim() && newCategory ? "#1A1B22" : "#6B6760", border: "none", borderRadius: "10px", padding: "0.75rem", fontWeight: 700, fontSize: "0.9rem", cursor: newName.trim() && newCategory ? "pointer" : "not-allowed" }}>Add medication</button>
          </div>
        </div>
      )}

      {showReports && (
        <div style={modalOverlayStyle} onClick={() => setShowReports(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...modalStyle, maxHeight: "82vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.15rem", fontWeight: 600, margin: 0, color: "#F4F1EC" }}>Reports</h2>
              <button onClick={() => setShowReports(false)} style={{ background: "none", border: "none", color: "#A6A197", cursor: "pointer" }}><XIcon size={20} /></button>
            </div>
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.1rem" }}>
              {[{ key: "month", label: "This month" }, { key: "quarter", label: "Last 3 months" }, { key: "all", label: "All time" }].map((r) => (
                <button key={r.key} onClick={() => changeReportRange(r.key)} style={{ flex: 1, padding: "0.5rem 0.4rem", borderRadius: "8px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", border: reportRange === r.key ? "1.5px solid #E8C08A" : "1px solid rgba(244,241,236,0.1)", background: reportRange === r.key ? "rgba(232,192,138,0.14)" : "rgba(244,241,236,0.03)", color: "#F4F1EC" }}>{r.label}</button>
              ))}
            </div>
            {reportLoading ? (
              <div style={{ color: "#A6A197", fontSize: "0.85rem", padding: "1rem 0" }}>Crunching numbers…</div>
            ) : !reportStats || (meds || []).length === 0 ? (
              <div style={{ color: "#A6A197", fontSize: "0.85rem", padding: "1rem 0" }}>Add a medication first to see reports.</div>
            ) : (
              <>
                <div style={{ textAlign: "center", padding: "1.1rem 0", marginBottom: "1rem", borderRadius: "12px", background: "rgba(244,241,236,0.03)", border: "1px solid rgba(244,241,236,0.07)" }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: "2.1rem", fontWeight: 600, color: "#E8C08A" }}>{reportStats.overallPct === null ? "—" : `${reportStats.overallPct}%`}</div>
                  <div style={{ fontSize: "0.7rem", color: "#A6A197", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>Overall adherence</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", marginBottom: "1.2rem" }}>
                  {reportStats.perMed.map((m) => {
                    const cat = CATEGORIES[m.category] || CATEGORIES.misc;
                    return (
                      <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: `hsl(${cat.hue}, ${cat.sat}%, 62%)`, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#F4F1EC", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                          <div style={{ height: "4px", borderRadius: "2px", background: "rgba(244,241,236,0.08)", marginTop: "0.25rem" }}>
                            <div style={{ height: "100%", borderRadius: "2px", width: m.pct === null ? "0%" : `${m.pct}%`, background: `hsl(${cat.hue}, ${cat.sat}%, 62%)` }} />
                          </div>
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: "#A6A197", width: "34px", textAlign: "right" }}>{m.pct === null ? "—" : `${m.pct}%`}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={exportCSV} style={exportBtnStyle}><DownloadIcon size={14} /> CSV</button>
                  <button onClick={exportJSON} style={exportBtnStyle}><DownloadIcon size={14} /> JSON</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showDrive && (
        <div style={modalOverlayStyle} onClick={() => setShowDrive(false)}>
          <div onClick={(e) => e.stopPropagation()} style={modalStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.15rem", fontWeight: 600, margin: 0, color: "#F4F1EC" }}>Google Drive backup</h2>
              <button onClick={() => setShowDrive(false)} style={{ background: "none", border: "none", color: "#A6A197", cursor: "pointer" }}><XIcon size={20} /></button>
            </div>
            <p style={{ fontSize: "0.82rem", color: "#A6A197", lineHeight: 1.55, marginBottom: "1rem" }}>
              Backs up your meds and history to a private, hidden file in your Drive (not visible in your regular Drive folder view). Use this to restore data if you switch phones.
            </p>
            {!driveToken ? (
              <button onClick={connectDrive} style={{ width: "100%", background: "#E8C08A", color: "#1A1B22", border: "none", borderRadius: "10px", padding: "0.75rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>Connect Google Drive</button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <button onClick={backupNow} style={exportBtnStyle}><CloudIcon size={14} /> Back up now</button>
                <button onClick={restoreNow} style={exportBtnStyle}><DownloadIcon size={14} /> Restore from backup</button>
              </div>
            )}
            {driveStatus && <div style={{ marginTop: "0.9rem", fontSize: "0.78rem", color: "#A6A197" }}>{driveStatus}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function AmbientBlobs() {
  const particles = [
    { top: "12%", left: "18%", size: 5, dur: 14, delay: 0, hue: 40 },
    { top: "22%", left: "72%", size: 4, dur: 18, delay: 2, hue: 200 },
    { top: "48%", left: "8%", size: 3, dur: 16, delay: 1, hue: 328 },
    { top: "38%", left: "88%", size: 6, dur: 20, delay: 3, hue: 152 },
    { top: "64%", left: "30%", size: 4, dur: 15, delay: 4, hue: 252 },
    { top: "78%", left: "62%", size: 3, dur: 19, delay: 1.5, hue: 40 },
    { top: "58%", left: "50%", size: 5, dur: 17, delay: 2.5, hue: 16 },
    { top: "10%", left: "45%", size: 3, dur: 22, delay: 0.5, hue: 200 },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0 }}>
      <style>{`
        @keyframes driftA { 0%,100% { transform: translate(0,0) scale(1);} 50% { transform: translate(3%, 4%) scale(1.08);} }
        @keyframes driftB { 0%,100% { transform: translate(0,0) scale(1);} 50% { transform: translate(-4%, -3%) scale(1.05);} }
        @keyframes floatY { 0%,100% { transform: translateY(0) translateX(0); opacity: 0.35;} 50% { transform: translateY(-16px) translateX(6px); opacity: 0.75;} }
      `}</style>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05, mixBlendMode: "overlay" }}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <svg viewBox="0 0 800 1400" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07 }}>
        <g fill="none" stroke="#F4F1EC" strokeWidth="1">
          <path d="M -50 220 C 150 160, 300 280, 500 200 S 750 260, 900 180" />
          <path d="M -50 300 C 180 250, 320 360, 520 290 S 760 340, 900 270" />
          <path d="M -50 380 C 200 340, 340 430, 540 370 S 770 420, 900 360" />
          <path d="M -50 950 C 160 900, 320 1010, 500 940 S 740 990, 900 920" />
          <path d="M -50 1030 C 190 990, 340 1080, 520 1020 S 760 1060, 900 1000" />
          <path d="M -50 1100 C 210 1070, 360 1150, 540 1090 S 780 1130, 900 1070" />
        </g>
      </svg>
      {particles.map((p, i) => (
        <div key={i} style={{ position: "absolute", top: p.top, left: p.left, width: `${p.size}px`, height: `${p.size}px`, borderRadius: "50%", background: `hsl(${p.hue}, 55%, 78%)`, boxShadow: `0 0 ${p.size * 2}px hsla(${p.hue}, 55%, 78%, 0.6)`, animation: `floatY ${p.dur}s ease-in-out infinite`, animationDelay: `${p.delay}s` }} />
      ))}
      <div style={{ position: "absolute", top: "-15%", left: "-10%", width: "60vw", height: "60vw", maxWidth: "480px", maxHeight: "480px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,167,201,0.20) 0%, rgba(139,167,201,0) 70%)", filter: "blur(10px)", animation: "driftA 26s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "-20%", right: "-15%", width: "65vw", height: "65vw", maxWidth: "520px", maxHeight: "520px", borderRadius: "50%", background: "radial-gradient(circle, rgba(157,143,224,0.16) 0%, rgba(157,143,224,0) 70%)", filter: "blur(10px)", animation: "driftB 32s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "35%", right: "5%", width: "40vw", height: "40vw", maxWidth: "360px", maxHeight: "360px", borderRadius: "50%", background: "radial-gradient(circle, rgba(127,191,158,0.13) 0%, rgba(127,191,158,0) 70%)", filter: "blur(10px)", animation: "driftA 38s ease-in-out infinite reverse" }} />
    </div>
  );
}

const pageStyle = { minHeight: "100vh", background: "linear-gradient(165deg, #1B1D2A 0%, #201F2E 35%, #1A1E27 70%, #16181F 100%)", color: "#F4F1EC", fontFamily: "'Space Grotesk', sans-serif", position: "relative", overflow: "hidden" };
const eyebrowStyle = { fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", letterSpacing: "0.15em", color: "#9B8FD9", textTransform: "uppercase" };
const addBtnStyle = { display: "flex", alignItems: "center", gap: "0.35rem", background: "#E8C08A", color: "#1A1B22", border: "none", borderRadius: "999px", padding: "0.5rem 0.9rem", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" };
const reportsBtnStyle = { display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(244,241,236,0.06)", border: "1px solid rgba(244,241,236,0.1)", color: "#F4F1EC", borderRadius: "999px", width: "36px", height: "36px", cursor: "pointer" };
const exportBtnStyle = { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", background: "rgba(244,241,236,0.05)", border: "1px solid rgba(244,241,236,0.12)", borderRadius: "10px", color: "#F4F1EC", fontSize: "0.8rem", fontWeight: 600, padding: "0.65rem", cursor: "pointer" };
const navBtnStyle = { background: "rgba(244,241,236,0.06)", border: "1px solid rgba(244,241,236,0.1)", borderRadius: "8px", color: "#F4F1EC", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
const removeBtnStyle = { display: "flex", alignItems: "center", gap: "0.3rem", background: "rgba(244,241,236,0.04)", border: "1px solid rgba(244,241,236,0.08)", borderRadius: "999px", color: "#8A857B", fontSize: "0.66rem", cursor: "pointer", padding: "0.3rem 0.6rem" };
const modalOverlayStyle = { position: "fixed", inset: 0, background: "rgba(10,10,14,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50, backdropFilter: "blur(2px)" };
const modalStyle = { background: "#20222E", width: "100%", maxWidth: "480px", borderRadius: "18px 18px 0 0", padding: "1.3rem", boxSizing: "border-box", border: "1px solid rgba(244,241,236,0.08)", borderBottom: "none" };
const labelStyle = { display: "block", fontSize: "0.7rem", color: "#A6A197", marginBottom: "0.35rem", marginTop: "0.8rem", fontFamily: "'JetBrains Mono', monospace" };
const inputStyle = { width: "100%", background: "rgba(244,241,236,0.04)", border: "1px solid rgba(244,241,236,0.1)", borderRadius: "8px", padding: "0.65rem 0.75rem", color: "#F4F1EC", fontSize: "0.9rem", boxSizing: "border-box", fontFamily: "'Space Grotesk', sans-serif" };

ReactDOM.createRoot(document.getElementById("root")).render(<MedTracker />);
