import React, { useState, useEffect, useMemo, useRef } from 'react';
import TokenUsageMonitor from './TokenUsageMonitor.jsx';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Activity, 
  Building2, 
  Hammer, 
  FileText,
  MoreVertical,
  Plus,
  Search,
  Filter,
  X,
  ShieldAlert,
  Calculator,
  Sparkles,
  PenTool,
  ScrollText,
  Paperclip,
  UploadCloud,
  Trash2,
  Edit3,
  FolderLock,
  ExternalLink,
  ListChecks,
  User,
  UserCheck,
  Mail,
  BellRing,
  Users,
  HardDrive,
  Wifi,
  WifiOff,
  Loader2,
  Info,
  Briefcase,
  Phone,
  CreditCard,
  PieChart,
  TrendingUp,
  DollarSign,
  FileSignature,
  Save,
  MessageSquare, 
  Send,
  Check,
  XCircle,
  Timer,
  Menu,
  Settings,
  Eye,
  FilterX,
  Link as LinkIcon, 
  Stethoscope,
  Truck,
  Database,
  MessageCircle,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';
// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query
} from 'firebase/firestore';

// --- Firebase Initialization ---
// Detect if we have a real Firebase config or should run in demo/offline mode
const firebaseConfig = (() => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (apiKey && apiKey !== 'demo-api-key') {
    return {
      apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }
  if (typeof __firebase_config !== 'undefined') {
    try { return JSON.parse(__firebase_config); } catch { return null; }
  }
  return null;
})();

const IS_DEMO_MODE = !firebaseConfig;

let app, auth, db;
if (!IS_DEMO_MODE) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

const appId = import.meta.env.VITE_APP_ID || (typeof __app_id !== 'undefined' ? __app_id : 'default-app-id');

// --- Icon Wrapper System ---
const ICON_MAP = {
  "activity": Activity,
  "alert-triangle": AlertTriangle,
  "arrow-up-right": ArrowUpRight,
  "arrow-down-right": ArrowDownRight,
  "bell-ring": BellRing,
  "briefcase": Briefcase,
  "building-2": Building2,
  "calendar": Calendar,
  "calculator": Calculator,
  "check": Check,
  "check-circle-2": CheckCircle2,
  "clock": Clock,
  "credit-card": CreditCard,
  "database": Database,
  "dollar-sign": DollarSign,
  "edit-3": Edit3,
  "external-link": ExternalLink,
  "eye": Eye,
  "file-signature": FileSignature,
  "file-text": FileText,
  "filter": Filter,
  "filter-x": FilterX,
  "folder-lock": FolderLock,
  "hammer": Hammer,
  "hard-drive": HardDrive,
  "info": Info,
  "link": LinkIcon,
  "list-checks": ListChecks,
  "loader-2": Loader2,
  "mail": Mail,
  "menu": Menu,
  "message-square": MessageSquare,
  "message-circle": MessageCircle,
  "more-vertical": MoreVertical,
  "paperclip": Paperclip,
  "pen-tool": PenTool,
  "phone": Phone,
  "pie-chart": PieChart,
  "plus": Plus,
  "save": Save,
  "scroll-text": ScrollText,
  "search": Search,
  "send": Send,
  "settings": Settings,
  "shield-alert": ShieldAlert,
  "sparkles": Sparkles,
  "stethoscope": Stethoscope,
  "timer": Timer,
  "trash-2": Trash2,
  "trending-up": TrendingUp,
  "truck": Truck,
  "upload-cloud": UploadCloud,
  "user": User,
  "user-check": UserCheck,
  "users": Users,
  "wifi": Wifi,
  "wifi-off": WifiOff,
  "x": X,
  "x-circle": XCircle,
  "zap": Zap
};

const Icon = ({ name, size = 24, className = "" }) => {
  const LucideIcon = ICON_MAP[name];
  if (!LucideIcon) return null;
  return <LucideIcon size={size} className={className} />;
};

// --- Task Templates ---
const TASK_TEMPLATES = {
  "規劃設計": [
    { name: "專案啟動與需求確認 (Kickoff & URS)", defaultImpact: "需單位簽核" },
    { name: "現況測繪與法規檢討", defaultImpact: "需現場查勘" },
    { name: "平面配置 (Layout) 與動線規劃", defaultImpact: "無" },
    { name: "機電空調與醫氣系統整合 (CSD)", defaultImpact: "需調閱圖資" },
    { name: "輻射/特殊設備防護規劃", defaultImpact: "需設備商配合" },
    { name: "細部施工圖繪製 (Detailed Design)", defaultImpact: "無" },
    { name: "工程預算書與規範編制", defaultImpact: "無" },
    { name: "院內審查 (工務/感控/職安)", defaultImpact: "行政流程" },
    { name: "外部主管機關送審 (室裝/消防)", defaultImpact: "外部行政" },
    { name: "招標文件準備與發包", defaultImpact: "無" }
  ],
  "工程發包施工管理": [
    { name: "施工圍籬與保護設施設置", defaultImpact: "動線調整" },
    { name: "既有裝修拆除與清運", defaultImpact: "高噪音/粉塵" },
    { name: "隔間骨架與封板", defaultImpact: "中噪音" },
    { name: "機電管線佈設", defaultImpact: "需斷電/斷水" },
    { name: "表面飾材施作", defaultImpact: "異味" },
    { name: "完工清潔與自主檢查", defaultImpact: "無" },
    { name: "正式驗收", defaultImpact: "行政流程" }
  ],
  "專案工程管理": [
    { name: "專案啟動會議", defaultImpact: "會議" },
    { name: "設計成果審查", defaultImpact: "行政流程" },
    { name: "施工廠商遴選", defaultImpact: "行政流程" },
    { name: "施工階段監造", defaultImpact: "現場巡檢" },
    { name: "結案報告", defaultImpact: "無" }
  ],
  "監造": [
    { name: "施工計畫書審查", defaultImpact: "行政流程" },
    { name: "材料設備進場查驗", defaultImpact: "現場作業" },
    { name: "重要節點停留檢驗 (Hold Point)", defaultImpact: "需暫停施工" },
    { name: "施工品質查核 (督導)", defaultImpact: "現場巡檢" },
    { name: "竣工圖說與結算審查", defaultImpact: "行政流程" }
  ],
  "顧問諮詢服務": [
    { name: "現況診斷與評估", defaultImpact: "需現場查勘" },
    { name: "法規適用性分析", defaultImpact: "無" },
    { name: "改善策略建議報告", defaultImpact: "會議" },
    { name: "預算概估與期程規劃", defaultImpact: "無" }
  ],
  "default": [
    { name: "一般作業", defaultImpact: "無" }
  ]
};

// --- Initial Seed Data ---
const SEED_PROJECTS = [
  {
    id: "proj_demo_01",
    name: "第三醫療大樓 6F 負壓隔離病房改建工程",
    manager: "張工務",
    status: "In Progress", 
    progress: 66,
    budget: 12000000,
    spent: 4200000,
    startDate: "2025-10-15",
    endDate: "2026-03-31",
    icraLevel: "IV", 
    zone: "急重症/手術區 (管制)",
    projectType: "工程發包施工管理",
    driveLink: "https://drive.google.com/folders/demo-iso-ward",
    contractNo: "CT-2025-088",
    contractStatus: "Signed",
    risk: "High", 
    tasks: [
      { id: 101, name: "ICRA 防護牆架設與前室設置", start: "2025-10-15", end: "2025-10-20", status: "Completed", type: "Night", impact: "動線封閉", assignee: "陳工頭", supervisor: "張工務", vendor: "大順營造", description: "包含HEPA負壓機安裝測試。", files: [], dailyUpdates: [{id: 1, date: "2025-10-15", content: "防護牆骨架完成，負壓機進場。", author: "陳工頭", supervisorComment: "請務必拍照記錄壓差計讀數。"}] },
      { id: 102, name: "既有隔間與天花板拆除", start: "2025-10-21", end: "2025-11-05", status: "Completed", type: "Night", impact: "高噪音/粉塵", assignee: "大順營造", supervisor: "張工務", vendor: "大順營造", description: "需注意廢棄物清運路線。", files: [] },
      { id: 103, name: "醫療氣體管路更新 (O2/Vac/Air)", start: "2025-11-06", end: "2025-12-20", status: "In Progress", type: "Day", impact: "動火/斷氣", assignee: "德安醫氣", supervisor: "李主任", vendor: "德安醫氣", description: "需配合呼吸治療科確認切換時間。", files: [], dailyUpdates: [{id: 2, date: "2025-11-10", content: "氣體銅管焊接完成50%，預計下週試壓。", author: "吳廠長"}] },
    ]
  },
  {
    id: "proj_demo_02",
    name: "急診室檢傷分類區動線優化設計案",
    manager: "林處長",
    status: "Planning", 
    progress: 33,
    budget: 1500000,
    spent: 0,
    startDate: "2025-11-01",
    endDate: "2026-01-31",
    icraLevel: "N/A", 
    zone: "急診區",
    projectType: "規劃設計",
    driveLink: "https://drive.google.com/folders/demo-lobby",
    contractNo: "CT-2025-090",
    contractStatus: "Reviewing",
    risk: "Medium", 
    tasks: [
      { id: 201, name: "急診護理部需求訪談", start: "2025-11-01", end: "2025-11-10", status: "Completed", type: "Day", impact: "會議", assignee: "張設計師", supervisor: "林處長", description: "確認檢傷櫃台高度與隱私需求。", files: [] },
      { id: 202, name: "現況動線觀測與分析", start: "2025-11-11", end: "2025-11-15", status: "Pending", type: "Day", impact: "現場拍照", assignee: "張設計師", supervisor: "林處長", description: "紀錄尖峰時段病患流向。", files: [] },
      { id: 203, name: "平面配置方案 (Layout) 繪製", start: "2025-11-16", end: "2025-12-15", status: "Pending", type: "Day", impact: "無", assignee: "極光室裝", supervisor: "林處長", vendor: "極光室裝", description: "需提供3D模擬圖。", files: [] },
    ]
  }
];

const SEED_PERSONNEL = [
  { id: "p1", name: "張工務", title: "資深工程師", phone: "0912-345-678", email: "chang@dexin.com", role: "Supervisor", status: "Active" },
  { id: "p2", name: "李主任", title: "專案經理", phone: "0922-888-999", email: "lee@dexin.com", role: "Manager", status: "Active" },
  { id: "p3", name: "陳專員", title: "工程助理", phone: "0933-777-666", email: "chen@dexin.com", role: "Staff", status: "Active" },
  { id: "p4", name: "林處長", title: "處長", phone: "0911-000-111", email: "lin_director@dexin.com", role: "Director", status: "Active" },
  { id: "p5", name: "張設計師", title: "設計師", phone: "0955-666-777", email: "design_chang@dexin.com", role: "Staff", status: "Active" },
  { id: "p6", name: "王工頭", title: "工地主任", phone: "0988-555-444", email: "wang_foreman@external.com", role: "External", status: "Active" }
];

const SEED_VENDORS = [
  { id: "v1", name: "大順營造", type: "綜合營造", contact: "王老闆", phone: "02-2345-6789", rating: "A" },
  { id: "v2", name: "永安機電", type: "機電空調", contact: "陳經理", phone: "02-8765-4321", rating: "B+" },
  { id: "v3", name: "全能防水", type: "防水工程", contact: "林師傅", phone: "0910-123-456", rating: "A+" },
  { id: "v4", name: "德安醫氣", type: "醫療氣體", contact: "吳廠長", phone: "0988-111-222", rating: "A" },
  { id: "v5", name: "極光室裝", type: "室內裝修", contact: "劉設計", phone: "02-6666-8888", rating: "A" }
];

// --- Components ---
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "確認", isDangerous = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-full ${isDangerous ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
            <Icon name={isDangerous ? "trash-2" : "info"} size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        </div>
        <p className="text-slate-600 mb-6 whitespace-pre-wrap leading-relaxed text-sm">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">取消</button>
          <button 
            onClick={onConfirm} 
            className={`px-4 py-2 text-white rounded-lg font-medium text-sm shadow-sm transition-colors ${isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const AlertDialog = ({ isOpen, title, message, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Icon name="bell-ring" className="text-indigo-500" size={20}/>
          {title}
        </h3>
        <p className="text-slate-600 mb-6 whitespace-pre-wrap text-sm leading-relaxed">{message}</p>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium text-sm transition-colors">關閉</button>
        </div>
      </div>
    </div>
  );
};

const ResourceModal = ({ isOpen, onClose, onSave, title, fields, initialData, onShowAlert }) => {
  const [formData, setFormData] = useState({});
  useEffect(() => { 
      if (isOpen) {
          setFormData(initialData || {}); 
      }
  }, [isOpen, initialData?.id]); 
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-slate-800 text-white flex justify-between items-center"><h3 className="text-lg font-bold">{initialData ? `編輯${title}` : `新增${title}`}</h3><button onClick={onClose} className="text-slate-400 hover:text-white"><Icon name="x" size={20}/></button></div>
        <div className="p-6 space-y-4 overflow-y-auto">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
              {field.type === 'select' ? (
                <select 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                  value={formData[field.key] || ""}
                >
                  <option value="" disabled>請選擇</option>
                  {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input 
                  type={field.type || 'text'}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData[field.key] || ""}
                  onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                />
              )}
            </div>
          ))}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-200 rounded-lg font-medium">取消</button>
          <button onClick={() => { if(!formData.name) return onShowAlert("請輸入名稱與必要資訊"); onSave(formData); onClose(); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">{initialData ? "儲存變更" : "新增"}</button>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---
const StatusBadge = ({ status }) => {
    const styles = { "In Progress": "bg-blue-100 text-blue-800 border-blue-200", "Completed": "bg-green-100 text-green-800 border-green-200", "Delayed": "bg-red-100 text-red-800 border-red-200", "Planning": "bg-gray-100 text-gray-800 border-gray-200", "Pending": "bg-gray-50 text-gray-500 border-gray-200" };
    const labels = { "In Progress": "進行中", "Completed": "已完工", "Delayed": "進度落後", "Planning": "規劃中", "Pending": "待啟動" };
    return (<span className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${styles[status] || styles["Pending"]}`}>{labels[status] || status}</span>);
};

const ICRABadge = ({ level }) => {
    const styles = { "I": "bg-green-50 text-green-700 border-green-200", "II": "bg-yellow-50 text-yellow-700 border-yellow-200", "III": "bg-orange-50 text-orange-700 border-orange-200", "IV": "bg-red-50 text-red-700 border-red-200 font-bold" };
    if (level === 'N/A' || level === 'Design') return (<div className="flex items-center gap-1 px-2 py-0.5 rounded border text-xs bg-slate-50 text-slate-500 border-slate-200 whitespace-nowrap"><Icon name="pen-tool" size={10} /> 免除</div>);
    return (<div className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs whitespace-nowrap ${styles[level]}`}><Icon name="activity" size={10} /> ICRA: {level}</div>);
};

const ProgressBar = ({ value, status }) => {
    let color = "bg-blue-600"; if (status === "Delayed") color = "bg-red-500"; if (status === "Completed") color = "bg-green-500";
    const safeValue = Math.max(0, Math.min(value || 0, 100));
    return (<div className="w-full bg-gray-200 rounded-full h-2.5"><div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${safeValue}%` }}></div></div>);
};

const DonutChart = ({ data }) => {
    const total = data.reduce((a, b) => a + b.value, 0);
    if (total === 0) {
        return (
            <div className="relative w-32 h-32 rounded-full" style={{ background: '#e2e8f0' }}>
                <div className="absolute inset-0 m-auto w-20 h-20 bg-white rounded-full flex items-center justify-center flex-col shadow-inner">
                     <span className="text-xs text-slate-400">專案數</span>
                     <span className="text-xl font-bold text-slate-700">0</span>
                </div>
            </div>
        );
    }
    let currentAngle = 0;
    const gradient = data.map(item => {
        const percentage = (item.value / total) * 100;
        const start = currentAngle;
        const end = currentAngle + percentage;
        currentAngle = end;
        return `${item.color} ${start}% ${end}%`;
    }).join(', ');
    return (
        <div className="relative w-32 h-32 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
            <div className="absolute inset-0 m-auto w-20 h-20 bg-white rounded-full flex items-center justify-center flex-col shadow-inner">
                 <span className="text-xs text-slate-400">專案數</span>
                 <span className="text-xl font-bold text-slate-700">{total}</span>
            </div>
        </div>
    );
};

// --- Contract Edit Modal ---
const ContractEditModal = ({ isOpen, onClose, onSave, contract }) => {
    const [formData, setFormData] = useState({ contractNo: "", budget: 0, spent: 0, contractStatus: "Draft", driveLink: "" });
    useEffect(() => { 
        if (isOpen && contract) { 
            setFormData({ contractNo: contract.contractNo || "", budget: contract.budget || 0, spent: contract.spent || 0, contractStatus: contract.contractStatus || "Draft", driveLink: contract.driveLink || "" }); 
        } 
    }, [isOpen, contract?.id]);
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[75] p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
           <div className="px-6 py-4 bg-blue-900 text-white flex justify-between items-center"><h3 className="text-lg font-bold flex items-center gap-2"><Icon name="file-signature" size={20}/> 合約與預算編輯</h3><button onClick={onClose} className="text-blue-200 hover:text-white"><Icon name="x" size={20}/></button></div>
           <div className="p-6 space-y-4 overflow-y-auto">
             <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-4"><span className="font-bold">專案：</span> {contract?.name}</div>
             <div><label className="block text-sm font-medium text-slate-700 mb-1">合約編號</label><input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={formData.contractNo} onChange={(e) => setFormData({...formData, contractNo: e.target.value})} placeholder="例如：CT-2025-001"/></div>
             <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">承攬金額 (Revenue)</label><input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={formData.budget} onChange={(e) => setFormData({...formData, budget: parseInt(e.target.value) || 0})}/></div><div><label className="block text-sm font-medium text-slate-700 mb-1">已請款金額 (Invoiced)</label><input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={formData.spent} onChange={(e) => setFormData({...formData, spent: parseInt(e.target.value) || 0})}/></div></div>
             <div><label className="block text-sm font-medium text-slate-700 mb-1">合約狀態</label><select className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={formData.contractStatus} onChange={(e) => setFormData({...formData, contractStatus: e.target.value})}><option value="Draft">草案 (Draft)</option><option value="Reviewing">用印中 (Reviewing)</option><option value="Signed">已簽約 (Signed)</option><option value="Closed">已結案/保固中 (Closed)</option></select></div>
             <div><label className="block text-sm font-medium text-slate-700 mb-1">合約文件連結 (Drive)</label><input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={formData.driveLink} onChange={(e) => setFormData({...formData, driveLink: e.target.value})} placeholder="https://drive.google.com/..."/></div>
           </div>
           <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-200 rounded-lg font-medium">取消</button><button onClick={() => onSave(formData)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"><Icon name="save" size={18}/> 儲存變更</button></div>
        </div>
      </div>
    );
};

// --- Task Detail & Edit Modal ---
const TaskDetailModal = ({ isOpen, onClose, onSave, onDeleteRequest, task, projectType, personnel, vendors, onShowAlert, onShowConfirm }) => {
    const [formData, setFormData] = useState({ name: "", start: "", end: "", type: "Day", impact: "", description: "", files: [], assignee: "", supervisor: "", vendor: "", hospitalContact: "", dailyUpdates: [], taskDriveLink: "", status: "Pending" });
    const [newDailyNote, setNewDailyNote] = useState(""); 
    const [editingNoteId, setEditingNoteId] = useState(null); 
    const [editingNoteContent, setEditingNoteContent] = useState("");
    
    const [commentingNoteId, setCommentingNoteId] = useState(null);
    const [commentContent, setCommentContent] = useState("");
    const templates = TASK_TEMPLATES[projectType] || TASK_TEMPLATES["default"];
    const fileInputRef = useRef(null);
    const isDesignProject = projectType === "規劃設計" || projectType === "專案工程管理";
    useEffect(() => {
      if (isOpen) {
          if (task) { 
              setFormData({ 
                  ...task, 
                  dailyUpdates: task.dailyUpdates || [], 
                  taskDriveLink: task.taskDriveLink || "", 
                  hospitalContact: task.hospitalContact || "", 
                  status: task.status || "Pending",
                  vendor: task.vendor || "" 
                }); 
            } else { 
                setFormData({ name: "", start: new Date().toISOString().split('T')[0], end: "", type: "Day", impact: "", description: "", files: [], assignee: "", supervisor: "", vendor: "", hospitalContact: "", dailyUpdates: [], taskDriveLink: "", status: "Pending" }); 
            }
          setNewDailyNote(""); setEditingNoteId(null); setEditingNoteContent("");
          setCommentingNoteId(null); setCommentContent("");
      }
    }, [isOpen, task?.id]);
    const handleTemplateSelect = (e) => { const selectedName = e.target.value; if (!selectedName) return; const template = templates.find(t => t.name === selectedName); if (template) { setFormData(prev => ({ ...prev, name: template.name, impact: template.defaultImpact, description: prev.description || `標準作業程序：${template.name}` })); } };
    
    const handleFileUpload = () => { fileInputRef.current.click(); };
    const handleRealFileUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 500 * 1024) { onShowAlert("檔案過大！請上傳 500KB 以內的圖片或文件。"); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newFile = { name: file.name, type: file.type, data: ev.target.result, date: new Date().toISOString().split('T')[0] };
        setFormData(prev => ({ ...prev, files: [...(prev.files || []), newFile] }));
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    };
    const handleRemoveFile = (index) => { setFormData(prev => ({ ...prev, files: (prev.files || []).filter((_, i) => i !== index) })); };
    
    const handleOpenFile = (file) => { 
        if (file.data) { 
            const newWindow = window.open(); 
            if (newWindow) { 
                newWindow.document.body.innerHTML = '';
                const iframe = newWindow.document.createElement('iframe');
                iframe.sandbox = 'allow-same-origin';
                iframe.src = file.data;
                iframe.style.border = '0';
                iframe.style.width = '100%';
                iframe.style.height = '100vh';
                newWindow.document.body.appendChild(iframe);
            } 
        } else { 
            onShowAlert(`這是模擬檔案，無法預覽: ${file.name}`); 
        } 
    };
    const handleAddDailyNote = () => { if (!newDailyNote.trim()) return; const note = { id: Date.now(), date: new Date().toISOString().split('T')[0], content: newDailyNote, author: formData.assignee || "專案成員" }; setFormData(prev => ({ ...prev, dailyUpdates: [...(prev.dailyUpdates || []), note] })); setNewDailyNote(""); };
    const handleStartEditNote = (note) => { setEditingNoteId(note.id); setEditingNoteContent(note.content); };
    const handleSaveEditNote = () => { if (!editingNoteContent.trim()) return; setFormData(prev => ({ ...prev, dailyUpdates: (prev.dailyUpdates || []).map(n => n.id === editingNoteId ? { ...n, content: editingNoteContent } : n) })); setEditingNoteId(null); };
    const handleCancelEditNote = () => { setEditingNoteId(null); setEditingNoteContent(""); };
    const handleDeleteDailyNote = (noteId) => { 
        onShowConfirm({
            isOpen: true,
            title: "刪除回報",
            message: "確定刪除此則回報紀錄？",
            isDangerous: true,
            onConfirm: () => {
                setFormData(prev => ({ ...prev, dailyUpdates: (prev.dailyUpdates || []).filter(n => n.id !== noteId) }));
                onShowConfirm(prev => ({...prev, isOpen: false}));
            }
        });
    };
    
    const handleStartComment = (note) => {
        setCommentingNoteId(note.id);
        setCommentContent(note.supervisorComment || "");
        setEditingNoteId(null); 
    };
    const handleSaveComment = () => {
        setFormData(prev => ({
            ...prev,
            dailyUpdates: (prev.dailyUpdates || []).map(n => 
                n.id === commentingNoteId ? { ...n, supervisorComment: commentContent } : n
            )
        }));
        setCommentingNoteId(null);
        setCommentContent("");
    };
    const handleCancelComment = () => {
        setCommentingNoteId(null);
        setCommentContent("");
    };
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="px-6 py-4 bg-slate-800 text-white flex justify-between items-center"><h3 className="text-lg font-bold flex items-center gap-2"><Icon name="file-text" size={20}/>{task ? "編輯工作排程" : "新增工作排程"}</h3><button onClick={onClose} className="text-slate-400 hover:text-white"><Icon name="x" size={20}/></button></div>
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {!task && (<div className="bg-blue-50 p-4 rounded-lg border border-blue-100"><label className="block text-sm font-medium text-blue-800 mb-2 flex items-center gap-2"><Icon name="list-checks" size={16}/> 快速選擇標準工項</label><select className="w-full border border-blue-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700" onChange={handleTemplateSelect} defaultValue=""><option value="" disabled>-- 請選擇 ({projectType}) --</option>{templates.map((t, idx) => (<option key={idx} value={t.name}>{t.name}</option>))}</select></div>)}
            <div className="grid grid-cols-1 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">工項名稱</label><input type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}/></div></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">開始日期</label><input type="date" className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={formData.start} onChange={(e) => setFormData({...formData, start: e.target.value})}/></div><div><label className="block text-sm font-medium text-slate-700 mb-1">結束日期</label><input type="date" className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={formData.end} onChange={(e) => setFormData({...formData, end: e.target.value})}/></div></div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Icon name="user" size={14} /> 專責人員 (Assignee)</label>
                    <select className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={formData.assignee} onChange={(e) => setFormData({...formData, assignee: e.target.value})}>
                        <option value="">請選擇人員</option>
                        {personnel.map(p => <option key={p.id} value={p.name}>{p.name} ({p.title})</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Icon name="user-check" size={14} /> 督導人員 (Supervisor)</label>
                    <select className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={formData.supervisor} onChange={(e) => setFormData({...formData, supervisor: e.target.value})}>
                         <option value="">請選擇人員</option>
                         {personnel.map(p => <option key={p.id} value={p.name}>{p.name} ({p.title})</option>)}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Icon name="mail" size={10}/> 自動寄送通知</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div><label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Icon name="truck" size={14} /> 負責廠商 (Vendor)</label><select className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={formData.vendor} onChange={(e) => setFormData({...formData, vendor: e.target.value})}><option value="">請選擇廠商</option>{(vendors || []).map(v => <option key={v.id} value={v.name}>{v.name} ({v.type})</option>)}</select></div>
                 <div><label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Icon name="stethoscope" size={14} /> 醫院窗口 (Hospital)</label><input type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="例如：急診室 王護理長 / 09xx-xxx-xxx" value={formData.hospitalContact} onChange={(e) => setFormData({...formData, hospitalContact: e.target.value})}/></div>
            </div>
            <div className={isDesignProject ? "" : "grid grid-cols-2 gap-4"}>{!isDesignProject && (<div><label className="block text-sm font-medium text-slate-700 mb-1">施工時段</label><select className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}><option value="Day">日間 (Day)</option><option value="Night">夜間/假日 (Night/Holiday)</option></select></div>)}<div><label className="block text-sm font-medium text-slate-700 mb-1">預期衝擊</label><input type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none bg-slate-50" value={formData.impact} onChange={(e) => setFormData({...formData, impact: e.target.value})}/></div></div>
            
            <div><label className="block text-sm font-medium text-slate-700 mb-1">目前狀態 (Status)</label><select className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none bg-white" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}><option value="Pending">待啟動 (Pending)</option><option value="In Progress">進行中 (In Progress)</option><option value="Completed">已完工 (Completed)</option><option value="Delayed">進度落後 (Delayed)</option></select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Icon name="edit-3" size={14} /> 工作內容說明</label><textarea className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}/></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Icon name="external-link" size={14} /> 相關雲端連結</label><input type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." value={formData.taskDriveLink} onChange={(e) => setFormData({...formData, taskDriveLink: e.target.value})}/></div>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><div className="flex justify-between items-center mb-3"><label className="block text-sm font-medium text-slate-700 flex items-center gap-2"><Icon name="paperclip" size={14} /> 過程檔案 (最大500KB)</label><input type="file" ref={fileInputRef} className="hidden" onChange={handleRealFileUpload} accept="image/*,.pdf" /><button onClick={handleFileUpload} className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1 bg-white border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 transition-colors"><Icon name="upload-cloud" size={12} /> 上傳</button></div>{(formData.files || []).length > 0 && (<div className="space-y-2">{(formData.files || []).map((file, idx) => (<div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200 text-sm group"><button onClick={() => handleOpenFile(file)} className="flex items-center gap-2 text-slate-700 hover:text-blue-600 truncate text-left flex-1"><Icon name="file-text" size={14} className="shrink-0"/><span className="truncate">{file.name}</span>{file.data && <Icon name="eye" size={12} className="shrink-0 opacity-50"/>}</button><button onClick={() => handleRemoveFile(idx)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"><Icon name="trash-2" size={14} /></button></div>))}</div>)}</div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200"><div className="flex justify-between items-center mb-3"><label className="block text-sm font-medium text-green-800 flex items-center gap-2"><Icon name="message-square" size={14} /> 進度回報 (Daily Log)</label></div>{editingNoteId === null && (<div className="flex gap-2 mb-4"><input type="text" className="flex-1 border border-green-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" placeholder="輸入今日回報..." value={newDailyNote} onChange={(e) => setNewDailyNote(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddDailyNote()}/><button onClick={handleAddDailyNote} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"><Icon name="send" size={14}/> 新增</button></div>)}<div className="space-y-2 max-h-60 overflow-y-auto">{(formData.dailyUpdates || []).length > 0 ? ([...(formData.dailyUpdates || [])].reverse().map((note) => (<div key={note.id} className="bg-white p-2 rounded border border-green-100 text-sm shadow-sm">
                <div className="flex justify-between text-xs text-slate-400 mb-1"><span>{note.date} - {note.author}</span>
                     {editingNoteId === null && commentingNoteId === null && (
                         <button onClick={() => handleStartComment(note)} className="text-slate-400 hover:text-blue-600 p-0.5" title="督導回覆"><Icon name="message-circle" size={14}/></button>
                     )}
                </div>
                {editingNoteId === note.id ? (<div className="flex gap-2"><input type="text" className="flex-1 border border-blue-300 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={editingNoteContent} onChange={(e) => setEditingNoteContent(e.target.value)} autoFocus /><button onClick={handleSaveEditNote} className="text-green-600 hover:bg-green-50 p-1 rounded"><Icon name="check" size={16}/></button><button onClick={handleCancelEditNote} className="text-red-500 hover:bg-red-50 p-1 rounded"><Icon name="x-circle" size={16}/></button></div>) : (<div className="group flex justify-between items-start"><div className="text-slate-700 break-words">{note.content}</div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleStartEditNote(note)} className="text-slate-400 hover:text-blue-600 p-0.5"><Icon name="edit-3" size={14}/></button><button onClick={() => handleDeleteDailyNote(note.id)} className="text-slate-400 hover:text-red-600 p-0.5"><Icon name="trash-2" size={14}/></button></div></div>)}
                 
                 {note.supervisorComment && (
                     <div className="mt-2 ml-2 pl-2 border-l-2 border-blue-400 bg-blue-50 p-2 rounded text-xs text-slate-700">
                         <div className="font-bold text-blue-700 mb-1 flex items-center gap-1"><Icon name="user-check" size={10}/> 督導回覆:</div>
                         {note.supervisorComment}
                     </div>
                 )}
                 
                 {commentingNoteId === note.id && (
                     <div className="mt-2 ml-2 pl-2 border-l-2 border-blue-400 p-2">
                          <label className="block text-xs font-bold text-blue-700 mb-1">撰寫督導評語:</label>
                          <div className="flex gap-2">
                             <input type="text" className="flex-1 border border-blue-300 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={commentContent} onChange={(e) => setCommentContent(e.target.value)} autoFocus placeholder="請輸入指導意見..."/>
                             <button onClick={handleSaveComment} className="text-green-600 hover:bg-green-50 p-1 rounded"><Icon name="check" size={16}/></button>
                             <button onClick={handleCancelComment} className="text-red-500 hover:bg-red-50 p-1 rounded"><Icon name="x-circle" size={16}/></button>
                         </div>
                     </div>
                 )}
            </div>))) : (<div className="text-center py-2 text-xs text-green-600/50 italic">尚無回報</div>)}</div></div>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t flex justify-between items-center">
             <div>{task && (<button onClick={() => onDeleteRequest(task)} className="text-red-500 hover:text-red-700 font-medium flex items-center gap-2 px-3 py-2 rounded"><Icon name="trash-2" size={18}/> 刪除</button>)}</div>
             <div className="flex gap-3"><button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-200 rounded-lg font-medium transition-colors">取消</button><button onClick={() => { if(!formData.name) return onShowAlert("請輸入工項名稱"); onSave(formData); onClose(); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"><Icon name="check-circle-2" size={18}/> 儲存</button></div>
          </div>
        </div>
      </div>
    );
};

// --- New Project Wizard Modal ---
const NewProjectModal = ({ isOpen, onClose, onSave, onShowAlert }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ name: "", zone: "普通門診區", projectType: "專案工程管理", budget: "", constructionType: "Type A", patientRisk: "Group 1", nightShift: false, driveLink: "", durationMonths: 3 });
    
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setFormData({ name: "", zone: "普通門診區", projectType: "專案工程管理", budget: "", constructionType: "Type A", patientRisk: "Group 1", nightShift: false, driveLink: "", durationMonths: 3 });
        }
    }, [isOpen]);
    const icraLevel = useMemo(() => { 
        const { constructionType, patientRisk, zone, projectType } = formData; 
        if (projectType === "規劃設計") return 'N/A'; 
        if (zone === '院外區域') return 'I'; 
        if (constructionType === 'Type D' || patientRisk === 'Group 4') return 'IV'; 
        if (constructionType === 'Type C' && patientRisk === 'Group 3') return 'IV'; 
        if (constructionType === 'Type C' || patientRisk === 'Group 3') return 'III'; 
        if (constructionType === 'Type B' && patientRisk === 'Group 2') return 'II'; 
        return 'I'; 
    }, [formData.constructionType, formData.patientRisk, formData.zone, formData.projectType]);
    
    const icraCostDetails = useMemo(() => {
        const reqsMap = {
            'IV': "負壓隔離區 / 前室設置 / HEPA過濾 / 每日壓差監測",
            'III': "實體防塵屏障 / 施工區域封閉 / 黏塵墊",
            'II': "移動式防塵屏 / 濕式施工 / 覆蓋及密封",
            'I': "良善作業管理 / 完工後清潔"
        };
        if (icraLevel === 'N/A') return { total: 0, breakdown: "設計案無須防護", req: "" };
        const RATES = { 'IV': { setup: 80000, monthly: 30000 }, 'III': { setup: 40000, monthly: 15000 }, 'II': { setup: 10000, monthly: 2000 }, 'I': { setup: 2000, monthly: 0 } };
        const rate = RATES[icraLevel] || RATES['I'];
        const baseCost = rate.setup + (rate.monthly * formData.durationMonths);
        const budgetVal = parseInt((formData.budget || "0").toString().replace(/,/g, '')) || 0;
        const scaleFactor = budgetVal > 5000000 ? 1.5 : 1.0;
        const total = Math.round(baseCost * scaleFactor);
        return { total, breakdown: `基礎 $${rate.setup} + (維護 $${rate.monthly}/月 × ${formData.durationMonths}月)${scaleFactor > 1 ? ' × 大規模係數 1.5' : ''}`, req: reqsMap[icraLevel] || "" };
    }, [icraLevel, formData.durationMonths, formData.budget]);
    
    const estimatedCost = useMemo(() => { const base = parseInt((formData.budget || "0").toString().replace(/,/g, '')) || 0; if (formData.projectType === "規劃設計") return base; const multiplier = formData.nightShift ? 1.3 : 1.05; return Math.round(base * multiplier); }, [formData.budget, formData.nightShift, formData.projectType]);
  
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center"><h3 className="text-lg font-bold flex items-center gap-2"><Icon name="shield-alert" size={20} className="text-blue-400"/> 專案啟動</h3><button onClick={onClose} className="text-slate-400 hover:text-white"><Icon name="x" size={20}/></button></div>
          <div className="p-8 overflow-y-auto flex-1">
            {step === 1 && (<div className="space-y-6"><h4 className="text-xl font-bold text-slate-800 border-b pb-2">Step 1: 基礎資訊</h4><div className="space-y-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">專案名稱</label><input type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}/></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">專案類型</label><select className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none" value={formData.projectType} onChange={(e) => setFormData({...formData, projectType: e.target.value})}><option value="專案工程管理">專案工程管理</option><option value="規劃設計">規劃設計</option><option value="監造">監造</option><option value="工程發包施工管理">工程發包施工管理</option><option value="顧問諮詢服務">顧問諮詢服務</option></select></div><div><label className="block text-sm font-medium text-slate-700 mb-1">區域</label><select className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none" value={formData.zone} onChange={(e) => setFormData({...formData, zone: e.target.value})}><option>行政辦公區</option><option>普通門診區</option><option>一般病房區</option><option>急重症/手術區 (管制)</option><option>院外區域</option></select></div></div><div><label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Icon name="hard-drive" size={16} className="text-blue-600"/> Google Drive 資料夾連結</label><input type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none" placeholder="https://drive.google.com/drive/folders/..." value={formData.driveLink} onChange={(e) => setFormData({...formData, driveLink: e.target.value})}/></div><div><label className="block text-sm font-medium text-slate-700 mb-1">預算 (未稅)</label><input type="number" className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})}/></div></div></div>)}
            {step === 2 && (<div className="space-y-6"><h4 className="text-xl font-bold text-slate-800 border-b pb-2">Step 2: ICRA 風險評估</h4><div className="grid grid-cols-2 gap-6"><div className="space-y-3"><label className="font-medium text-slate-700">施工行為類型</label><div className="space-y-2">{['Type A', 'Type B', 'Type C', 'Type D'].map((type) => (<label key={type} className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-colors ${formData.constructionType === type ? 'border-blue-500 bg-blue-50' : 'hover:bg-slate-50'}`}><div className="flex items-center mb-1"><input type="radio" checked={formData.constructionType === type} onChange={() => setFormData({...formData, constructionType: type})} className="mr-2"/><div className="text-sm font-bold">{type}</div></div><div className="text-xs text-slate-500 pl-6">{type === 'Type A' && '僅檢視/查修 (無粉塵)'}{type === 'Type B' && '小規模/短時間 (如佈線)'}{type === 'Type C' && '產生粉塵/拆除固定構件'}{type === 'Type D' && '大規模破壞/連續性拆除'}</div></label>))}</div></div><div className="space-y-3"><label className="font-medium text-slate-700">病患風險群組</label><div className="space-y-2">{['Group 1', 'Group 2', 'Group 3', 'Group 4'].map((group) => (<label key={group} className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-colors ${formData.patientRisk === group ? 'border-red-500 bg-red-50' : 'hover:bg-slate-50'}`}><div className="flex items-center mb-1"><input type="radio" checked={formData.patientRisk === group} onChange={() => setFormData({...formData, patientRisk: group})} className="mr-2"/><div className="text-sm font-bold">{group}</div></div><div className="text-xs text-slate-500 pl-6">{group === 'Group 1' && '低 (辦公室/走道)'}{group === 'Group 2' && '中 (門診/復健/核醫)'}{group === 'Group 3' && '高 (急診/一般病房)'}{group === 'Group 4' && '極高 (ICU/OR/燒燙傷)'}</div></label>))}</div></div></div><div className="bg-slate-100 p-4 rounded-lg border-l-4 border-slate-800"><div className="flex items-center justify-between mb-2"><div className="text-sm text-slate-600">判定等級：</div><div className="text-2xl font-bold flex items-center gap-2">{icraLevel === 'IV' ? <span className="text-red-600">Class IV (最高戒備)</span> : icraLevel === 'III' ? <span className="text-orange-600">Class III (高度戒備)</span> : icraLevel === 'II' ? <span className="text-yellow-600">Class II (中度戒備)</span> : <span className="text-green-600">Class I (一般管制)</span>}</div></div>{icraCostDetails.req && (<div className="text-xs text-slate-500 bg-white p-2 rounded border border-slate-200"><strong>防護要求：</strong>{icraCostDetails.req}</div>)}</div></div>)}
            {step === 3 && (<div className="space-y-6"><h4 className="text-xl font-bold text-slate-800 border-b pb-2">Step 3: 成本分析</h4><div className="bg-blue-50 p-4 rounded-lg border border-blue-100"><label className="block text-sm font-medium text-blue-800 mb-2">預計工期: {formData.durationMonths} 個月</label><input type="range" min="1" max="12" step="0.5" className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer" value={formData.durationMonths} onChange={(e) => setFormData({...formData, durationMonths: parseFloat(e.target.value)})}/></div><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"><h5 className="font-bold text-yellow-800 mb-2">公司獲利分析</h5><div className="space-y-2 text-sm text-yellow-800"><div className="flex justify-between"><span>原始預算:</span><span>${parseInt((formData.budget || "0").toString().replace(/,/g, '')).toLocaleString()}</span></div>{icraLevel !== 'N/A' && (<div className="flex flex-col border-b border-yellow-200 pb-2 mb-2"><div className="flex justify-between font-medium text-red-700"><span>ICRA 防護成本 ({icraLevel}):</span><span>+ ${icraCostDetails.total.toLocaleString()}</span></div><div className="text-[10px] text-red-500 text-right">{icraCostDetails.breakdown}</div></div>)}{formData.projectType !== "規劃設計" && (<div className="flex justify-between text-red-600"><span>工時加成:</span><span>+ ${(estimatedCost - parseInt((formData.budget || "0").toString().replace(/,/g, ''))).toLocaleString()}</span></div>)}<div className="border-t border-yellow-200 pt-2 mt-2 flex justify-between font-bold text-lg"><span>建議報價:</span><span>${(estimatedCost + icraCostDetails.total).toLocaleString()}</span></div></div></div></div>)}
          </div>
          <div className="px-6 py-4 border-t bg-slate-50 flex justify-between items-center">
             {step > 1 ? (<button onClick={() => step === 3 && formData.projectType === "規劃設計" ? setStep(1) : setStep(step - 1)} className="text-slate-500 font-medium px-4 py-2">上一步</button>) : <div></div>}
             {step < 3 ? (<button onClick={() => step === 1 && formData.projectType === "規劃設計" ? setStep(3) : setStep(step + 1)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium">下一步</button>) : (<button onClick={() => { if(!formData.name) return onShowAlert("請輸入專案名稱"); onSave({...formData, icraLevel}); onClose(); }} className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"><Icon name="check-circle-2" size={18}/> 建立專案</button>)}
          </div>
        </div>
      </div>
    );
};

// --- Main App Component ---
export default function DeXinProjectManager() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [statusFilter, setStatusFilter] = useState("All"); 
  
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [resourceType, setResourceType] = useState(null); 
  const [editingResource, setEditingResource] = useState(null);
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDangerous: false });
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });
  
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- Auth: Demo mode uses fake user, Firebase mode uses anonymous auth ---
  useEffect(() => {
    if (IS_DEMO_MODE) {
      setUser({ uid: 'demo-user' });
      setProjects([...SEED_PROJECTS]);
      setPersonnel([...SEED_PERSONNEL]);
      setVendors([...SEED_VENDORS]);
      setAuthLoading(false);
      return;
    }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) { console.error("Auth Error:", error); } finally { setAuthLoading(false); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- Data Sync: Demo mode uses local state, Firebase mode uses Firestore ---
  useEffect(() => {
    if (IS_DEMO_MODE || !user) return;
    const projectsRef = collection(db, 'artifacts', appId, 'public', 'data', 'projects');
    const personnelRef = collection(db, 'artifacts', appId, 'public', 'data', 'personnel');
    const vendorsRef = collection(db, 'artifacts', appId, 'public', 'data', 'vendors');
    const unsubProjects = onSnapshot(query(projectsRef), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (fetched.length === 0 && snapshot.metadata.fromCache === false) {
          Promise.all(SEED_PROJECTS.map(d => setDoc(doc(projectsRef, d.id), d)))
            .then(() => setProjects(SEED_PROJECTS));
      } else { setProjects(fetched); }
    });

    const unsubPersonnel = onSnapshot(query(personnelRef), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (fetched.length === 0 && snapshot.metadata.fromCache === false) {
          Promise.all(SEED_PERSONNEL.map(d => setDoc(doc(personnelRef, d.id), d)))
            .then(() => setPersonnel(SEED_PERSONNEL));
      } else { setPersonnel(fetched); }
    });

    const unsubVendors = onSnapshot(query(vendorsRef), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (fetched.length === 0 && snapshot.metadata.fromCache === false) {
          Promise.all(SEED_VENDORS.map(d => setDoc(doc(vendorsRef, d.id), d)))
            .then(() => setVendors(SEED_VENDORS));
      } else { setVendors(fetched); }
    });
    return () => { unsubProjects(); unsubPersonnel(); unsubVendors(); };
  }, [user]);

  useEffect(() => {
      if (!selectedProject) return;
      const updated = projects.find(p => p.id === selectedProject.id);
      if (updated) setSelectedProject(updated);
  }, [projects]);

  const filteredProjects = useMemo(() => {
      return projects.filter(p => {
          const matchesSearch = (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (p.manager || "").toLowerCase().includes(searchTerm.toLowerCase());
          const matchesStatus = statusFilter === "All" || p.status === statusFilter;
          return matchesSearch && matchesStatus;
      });
  }, [projects, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = projects.length;
    const delayed = projects.filter(p => p.status === "Delayed").length;
    const budgetTotal = projects.reduce((acc, curr) => acc + (curr.budget || 0), 0);
    const spentTotal = projects.reduce((acc, curr) => acc + (curr.spent || 0), 0);
    return { total, delayed, budgetTotal, spentTotal };
  }, [projects]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(val);
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setActiveTab('detail');
  };

  const handleCreateProject = async (data) => {
    if (!user) return;
    const newProjectId = `proj_${Date.now()}`;
    const newProject = {
      id: newProjectId, name: data.name, manager: "待指派", status: "Planning", progress: 0, 
      budget: parseInt((data.budget || "0").toString().replace(/,/g, '')) || 0, spent: 0, 
      startDate: new Date().toISOString().split('T')[0], endDate: "", 
      icraLevel: data.icraLevel || "I", zone: data.zone, projectType: data.projectType, 
      driveLink: data.driveLink, risk: data.nightShift ? "High" : "Medium", tasks: []
    };
    if (IS_DEMO_MODE) {
        setProjects(prev => [...prev, newProject]);
        setAlertModal({ isOpen: true, title: "系統提示", message: "新專案已建立 (Demo模式)" });
        return;
    }
    try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', newProjectId), newProject);
        setAlertModal({ isOpen: true, title: "系統提示", message: "新專案已建立" });
    } catch (e) {
        setAlertModal({ isOpen: true, title: "錯誤", message: "建立專案失敗" });
    }
  };

  const handleDeleteProjectRequest = (targetProject) => {
    const projectToDelete = targetProject || selectedProject;
    if (!projectToDelete || !user) return;
    setConfirmModal({ 
        isOpen: true, title: "刪除專案", 
        message: `確定刪除「${projectToDelete.name}」？\n此動作將永久移除資料，且無法復原。`, 
        isDangerous: true, confirmText: "刪除", 
        onConfirm: async () => {
            if (IS_DEMO_MODE) {
                setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
                setSelectedProject(null); setEditingContract(null); setIsContractModalOpen(false);
                setActiveTab('dashboard'); setConfirmModal(prev => ({ ...prev, isOpen: false }));
                return;
            }
            try {
                await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectToDelete.id));
                setSelectedProject(null); setEditingContract(null); setIsContractModalOpen(false);
                setActiveTab('dashboard'); setConfirmModal(prev => ({ ...prev, isOpen: false }));
            } catch (error) {
                setAlertModal({ isOpen: true, title: "錯誤", message: "刪除專案失敗" });
            }
        }
    });
  };
  
  const handleSaveTask = async (taskData) => {
    if (!selectedProject || !user) return;
    let updatedTasks = [...(selectedProject.tasks || [])];
    let taskToSave = { ...taskData }; 
    let shouldSendEmail = false;
    if (editingTask) {
        if (taskData.supervisor && taskData.supervisor !== editingTask.supervisor) {
             shouldSendEmail = true; taskToSave.emailSent = true; 
        }
        updatedTasks = updatedTasks.map(t => t.id === editingTask.id ? { ...t, ...taskToSave } : t);
    } else {
        taskToSave.id = Date.now();
        taskToSave.status = taskData.status || "Pending";
        taskToSave.files = taskData.files || [];
        if (taskData.supervisor) { shouldSendEmail = true; taskToSave.emailSent = true; }
        updatedTasks.push(taskToSave);
    }
    updatedTasks.sort((a, b) => new Date(a.start) - new Date(b.start));
    
    const totalTasks = updatedTasks.length;
    const completedTasks = updatedTasks.filter(t => t.status === 'Completed').length;
    const newProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    
    let newStatus = selectedProject.status;
    if (totalTasks > 0 && completedTasks === totalTasks) { newStatus = "Completed"; }
    else if (updatedTasks.some(t => t.status === "Delayed")) { newStatus = "Delayed"; }
    else if (updatedTasks.some(t => t.status === "In Progress")) { newStatus = "In Progress"; }
    else if (newStatus === "Completed" && completedTasks < totalTasks) { newStatus = "In Progress"; }
    
    const updatedProjectData = { tasks: updatedTasks, progress: newProgress, status: newStatus };

    if (IS_DEMO_MODE) {
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, ...updatedProjectData } : p));
      setEditingTask(null); setTaskModalOpen(false);
      return;
    }
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', selectedProject.id), updatedProjectData);

      if (shouldSendEmail) {
          const supervisorPerson = personnel.find(p => p.name === taskData.supervisor);
          const email = supervisorPerson?.email;
          if (email) {
              const subject = encodeURIComponent(`[德新物業] 任務指派: ${taskData.name}`);
              const body = encodeURIComponent(`您好 ${taskData.supervisor},\n\n您已被指派為以下工項的督導人員：\n專案：${selectedProject.name}\n工項：${taskData.name}\n日期：${taskData.start} ~ ${taskData.end}\n衝擊：${taskData.impact}\n\n請協助監督執行。(系統自動發送)`);
              const link = document.createElement('a');
              link.href = `mailto:${email}?subject=${subject}&body=${body}`;
              link.target = '_blank';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setAlertModal({ isOpen: true, title: "任務指派通知", message: `已呼叫郵件軟體。\n收件者: ${email}` });
          } else {
              setAlertModal({ isOpen: true, title: "無法發送郵件", message: `已指派督導 (${taskData.supervisor})，但系統找不到 Email 資料。` });
          }
      }
      setEditingTask(null); setTaskModalOpen(false);
    } catch (e) {
      console.error(e);
      setAlertModal({ isOpen: true, title: "錯誤", message: "儲存工項失敗" });
    }
  };

  const handleDeleteTaskRequest = (task) => {
      setConfirmModal({ 
          isOpen: true, title: "刪除工項", message: "確定刪除？", confirmText: "刪除", isDangerous: true, 
          onConfirm: async () => {
              const newTasks = (selectedProject.tasks || []).filter(t => t.id !== task.id);
              const totalTasks = newTasks.length;
              const completedTasks = newTasks.filter(t => t.status === 'Completed').length;
              const newProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
              let newStatus = selectedProject.status;
              if (totalTasks > 0 && completedTasks === totalTasks) newStatus = "Completed";
              else if (newTasks.some(t => t.status === "Delayed")) newStatus = "Delayed";
              else if (newTasks.some(t => t.status === "In Progress")) newStatus = "In Progress";
              else if (newStatus === "Completed" && completedTasks < totalTasks) newStatus = "In Progress";
              const updateData = { tasks: newTasks, progress: newProgress, status: newStatus };
              if (IS_DEMO_MODE) {
                  setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, ...updateData } : p));
                  setTaskModalOpen(false); setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  return;
              }
              try {
                  await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', selectedProject.id), updateData);
                  setTaskModalOpen(false); setConfirmModal(prev => ({ ...prev, isOpen: false }));
              } catch (e) { setAlertModal({ isOpen: true, title: "錯誤", message: "刪除工項失敗" }); }
          }
      });
  };
  
  const handleSaveResource = async (data) => {
    if (!user || !resourceType) return;
    const collectionName = resourceType === 'personnel' ? 'personnel' : 'vendors';
    const id = editingResource?.id || `${resourceType === 'personnel' ? 'p' : 'v'}_${Date.now()}`;
    const payload = { ...(editingResource || {}), ...data, id };
    if (resourceType === 'personnel') { payload.status = payload.status || 'Active'; }
    Object.keys(payload).forEach(key => { if (payload[key] === undefined) { delete payload[key]; } });
    if (IS_DEMO_MODE) {
        const setter = collectionName === 'personnel' ? setPersonnel : setVendors;
        setter(prev => {
            const exists = prev.find(item => item.id === id);
            if (exists) return prev.map(item => item.id === id ? payload : item);
            return [...prev, payload];
        });
        setIsResourceModalOpen(false); setEditingResource(null);
        return;
    }
    try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, id), payload);
        setIsResourceModalOpen(false); setEditingResource(null);
    } catch (e) {
        console.error("Save Resource Error:", e);
        setAlertModal({ isOpen: true, title: "錯誤", message: "儲存失敗" });
    }
  };
  
  const handleDeleteResource = (type, item) => {
    setConfirmModal({ 
        isOpen: true, title: `刪除${type === 'personnel' ? '人員' : '廠商'}`, 
        message: `確定刪除 ${item.name} 嗎？`, confirmText: "刪除", isDangerous: true, 
        onConfirm: async () => {
            if (IS_DEMO_MODE) {
                const setter = type === 'personnel' ? setPersonnel : setVendors;
                setter(prev => prev.filter(r => r.id !== item.id));
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                return;
            }
            try {
                const collectionName = type === 'personnel' ? 'personnel' : 'vendors';
                await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, item.id));
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            } catch (e) { setAlertModal({ isOpen: true, title: "錯誤", message: "刪除失敗" }); }
        } 
    });
  };
  
  const handleSaveContract = async (contractData) => {
      if (!editingContract) return;
      if (IS_DEMO_MODE) {
          setProjects(prev => prev.map(p => p.id === editingContract.id ? { ...p, ...contractData } : p));
          setIsContractModalOpen(false); setEditingContract(null);
          return;
      }
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', editingContract.id), contractData);
          setIsContractModalOpen(false); setEditingContract(null);
      } catch (error) { setAlertModal({ isOpen: true, title: "錯誤", message: "儲存合約失敗" }); }
  };

  const openNewTaskModal = () => { setEditingTask(null); setTaskModalOpen(true); };
  const openEditTaskModal = (task) => { setEditingTask(task); setTaskModalOpen(true); };
  const openResourceModal = (type, data = null) => { setResourceType(type); setEditingResource(data); setIsResourceModalOpen(true); };
  
  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 flex-col md:flex-row">
      <ConfirmDialog {...confirmModal} onCancel={() => setConfirmModal(prev => ({...prev, isOpen: false}))} />
      <AlertDialog {...alertModal} onClose={() => setAlertModal(prev => ({...prev, isOpen: false}))} />
      
      <NewProjectModal isOpen={isNewProjectModalOpen} onClose={() => setIsNewProjectModalOpen(false)} onSave={handleCreateProject} onShowAlert={(msg) => setAlertModal({isOpen: true, title: "系統提示", message: msg})}/>
      <ContractEditModal isOpen={isContractModalOpen} onClose={() => setIsContractModalOpen(false)} onSave={handleSaveContract} contract={editingContract} />
      <TaskDetailModal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} onSave={handleSaveTask} onDeleteRequest={handleDeleteTaskRequest} task={editingTask} projectType={selectedProject?.projectType || "一般工程"} personnel={personnel} vendors={vendors} onShowAlert={(msg) => setAlertModal({isOpen: true, title: "系統提示", message: msg})} onShowConfirm={(config) => setConfirmModal({ ...config, onCancel: () => setConfirmModal(prev => ({...prev, isOpen: false})) })}/>
      <ResourceModal isOpen={isResourceModalOpen} onClose={() => setIsResourceModalOpen(false)} onSave={handleSaveResource} title={resourceType === 'personnel' ? "人員" : "廠商"} initialData={editingResource} fields={resourceType === 'personnel' ? [{key:'name', label:'姓名'}, {key:'title', label:'職稱'}, {key:'phone', label:'電話'}, {key:'email', label:'Email', type:'email'}, {key:'role', label:'系統權限', type:'select', options:['Director', 'Manager', 'Supervisor', 'Staff']}] : [{key:'name', label:'廠商名稱'}, {key:'type', label:'工種類別'}, {key:'contact', label:'聯絡人'}, {key:'phone', label:'電話'}, {key:'rating', label:'評鑑等級', type:'select', options:['A+', 'A', 'B', 'C']}]} onShowAlert={(msg) => setAlertModal({isOpen: true, title: "系統提示", message: msg})}/>

      {/* Sidebar */}
      <div className="hidden md:flex w-64 bg-slate-900 text-white flex-col shadow-xl z-10">
        <div className="p-6 border-b border-slate-700"><div className="flex items-center gap-3"><div className="p-2 bg-blue-600 rounded-lg"><Icon name="building-2" size={24} /></div><div><h1 className="text-lg font-bold tracking-wide">德新物業</h1><p className="text-xs text-slate-400">專案工程管控系統 V6.10</p></div></div></div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => { setActiveTab('dashboard'); setSelectedProject(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Icon name="activity" size={20} /><span className="font-medium">總控戰情室</span></button>
          <button onClick={() => setActiveTab('budget')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'budget' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Icon name="file-text" size={20} /><span className="font-medium">合約與預算</span></button>
           <button onClick={() => setActiveTab('vendor')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'vendor' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Icon name="hammer" size={20} /><span className="font-medium">廠商管理</span></button>
          <button onClick={() => setActiveTab('personnel')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'personnel' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Icon name="users" size={20} /><span className="font-medium">人員管理</span></button>
          <button onClick={() => setActiveTab('tokenMonitor')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'tokenMonitor' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Icon name="zap" size={20} /><span className="font-medium">Token 監控</span></button>
        </nav>
        <div className="p-4 border-t border-slate-800"><div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400"><p className="font-bold text-slate-300 mb-1">系統狀態</p>{IS_DEMO_MODE ? (<><div className="flex items-center gap-2 mb-1"><Icon name="wifi-off" size={10} className="text-orange-400"/><span>Demo 模式 (本機資料)</span></div><p className="mt-2 text-orange-400 flex items-center gap-1"><Icon name="info" size={10} /> 資料不會儲存至雲端</p></>) : (<><div className="flex items-center gap-2 mb-1"><Icon name="database" size={10} className="text-green-400"/><span>連線正常 (Firestore)</span></div><p className="mt-2 text-yellow-500 flex items-center gap-1"><Icon name="alert-triangle" size={10} /> 防護機制運行中</p></>)}</div></div>
      </div>
      
      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around py-3 z-20 shadow-lg">
          <button onClick={() => { setActiveTab('dashboard'); setSelectedProject(null); }} className={`flex flex-col items-center text-xs ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}><Icon name="activity" size={24} /><span className="mt-1">戰情室</span></button>
          <button onClick={() => setActiveTab('budget')} className={`flex flex-col items-center text-xs ${activeTab === 'budget' ? 'text-blue-600' : 'text-slate-400'}`}><Icon name="file-text" size={24} /><span className="mt-1">預算</span></button>
          <button onClick={() => setActiveTab('vendor')} className={`flex flex-col items-center text-xs ${activeTab === 'vendor' ? 'text-blue-600' : 'text-slate-400'}`}><Icon name="hammer" size={24} /><span className="mt-1">廠商</span></button>
          <button onClick={() => setActiveTab('personnel')} className={`flex flex-col items-center text-xs ${activeTab === 'personnel' ? 'text-blue-600' : 'text-slate-400'}`}><Icon name="users" size={24} /><span className="mt-1">人員</span></button>
          <button onClick={() => setActiveTab('tokenMonitor')} className={`flex flex-col items-center text-xs ${activeTab === 'tokenMonitor' ? 'text-blue-600' : 'text-slate-400'}`}><Icon name="zap" size={24} /><span className="mt-1">Token</span></button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 md:px-8 border-b border-slate-200">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate max-w-[200px] md:max-w-none">{activeTab === 'dashboard' ? '德新物業_專案工程處 - 專案總覽' : activeTab === 'personnel' ? '人員管理中心' : activeTab === 'vendor' ? '合格廠商資料庫' : activeTab === 'budget' ? '合約與預算總表' : activeTab === 'tokenMonitor' ? 'Claude Token 用量監控' : selectedProject?.name}</h2>
          <div className="flex items-center gap-4">
            {activeTab === 'dashboard' && (<button onClick={() => setIsNewProjectModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"><Icon name="plus" size={16} /> 新增專案</button>)}
            {activeTab === 'personnel' && (<button onClick={() => openResourceModal('personnel')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"><Icon name="plus" size={16} /> 新增人員</button>)}
            {activeTab === 'vendor' && (<button onClick={() => openResourceModal('vendor')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"><Icon name="plus" size={16} /> 新增廠商</button>)}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
            {/* DASHBOARD VIEW */}
            {activeTab === 'dashboard' && (
                <>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden flex flex-row md:flex-col justify-between items-center">
                        <div><p className="text-slate-500 text-sm font-medium">執行中專案</p><h3 className="text-2xl md:text-3xl font-bold text-slate-800">{stats.total} <span className="text-sm font-normal text-slate-400">件</span></h3></div>
                        <div className="hidden md:block"><DonutChart data={[{value: stats.total - stats.delayed, color: '#10b981'}, {value: stats.delayed, color: '#ef4444'}]} /></div>
                        <div className="mt-4 flex items-center text-xs text-slate-400 md:hidden"><Icon name="activity" size={14} className="mr-1 text-blue-500"/> 運作正常</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="absolute right-0 top-0 h-full w-1 bg-red-500"></div>
                        <p className="text-slate-500 text-sm font-medium mb-2">進度落後 (Critical)</p>
                        <h3 className="text-3xl font-bold text-red-600">{stats.delayed} <span className="text-sm font-normal text-slate-400">件</span></h3>
                        <div className="mt-4 flex items-center text-xs text-red-500 font-medium"><Icon name="alert-triangle" size={14} className="mr-1"/> 需立即介入</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="absolute right-0 top-0 h-full w-1 bg-emerald-500"></div>
                        <p className="text-slate-500 text-sm font-medium mb-2">總工程預算</p>
                        <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(stats.budgetTotal)}</h3>
                        <div className="mt-4 flex items-center text-xs text-slate-400">預算執行率: {Math.round((stats.spentTotal / (stats.budgetTotal || 1)) * 100) || 0}%</div>
                    </div>
                 </div>
                 <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Icon name="calendar" className="text-blue-600" size={20}/> 專案監控列表</h3>
                        <div className="flex items-center gap-2">
                             <div className="relative hidden md:block">
                                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input type="text" placeholder="搜尋專案..." className="pl-9 pr-4 py-1.5 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                             </div>
                             <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                                {['All', 'In Progress', 'Delayed', 'Completed'].map(filter => (
                                    <button key={filter} onClick={() => setStatusFilter(filter)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${statusFilter === filter ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
                                        {filter === 'All' ? '全部' : filter === 'In Progress' ? '進行中' : filter === 'Delayed' ? '延遲' : '已完工'}
                                    </button>
                                ))}
                             </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider"><tr><th className="px-6 py-4">專案名稱</th><th className="px-6 py-4">狀態</th><th className="px-6 py-4">ICRA</th><th className="px-6 py-4 w-1/4">進度</th><th className="px-6 py-4 text-right">操作</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProjects.map((project) => (
                            <tr key={project.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800">{project.name}</div>
                                    <div className="text-xs text-slate-500 mb-1 flex flex-col gap-0.5">
                                        <span>{project.manager} | {project.projectType}</span>
                                        <span className="flex items-center gap-1"><Icon name="calendar" size={10}/> {project.startDate || "未定"} ~ {project.endDate || "未定"}</span>
                                    </div>
                                    <div className="flex gap-1"><span className={`text-[10px] px-1.5 py-0.5 rounded border ${project.contractStatus === 'Signed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{project.contractStatus === 'Signed' ? '已簽約' : '草案/審核中'}</span></div>
                                </td>
                                <td className="px-6 py-4"><StatusBadge status={project.status} /></td>
                                <td className="px-6 py-4"><ICRABadge level={project.icraLevel} /></td>
                                <td className="px-6 py-4"><ProgressBar value={project.progress} status={project.status} /></td>
                                <td className="px-6 py-4 text-right"><button onClick={() => handleProjectClick(project)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">詳情</button></td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                 </div>
                </>
            )}
            
            {/* PERSONNEL VIEW */}
             {activeTab === 'personnel' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {personnel.map(p => {
                        const managedProjects = projects.filter(proj => proj.manager === p.name);
                        return (
                            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">{p.name[0]}</div>
                                        <div><h3 className="font-bold text-lg text-slate-800">{p.name}</h3><span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full mt-1 inline-block">{p.title}</span></div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openResourceModal('personnel', p)} className="text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-slate-50"><Icon name="edit-3" size={16}/></button>
                                        <button onClick={() => handleDeleteResource('personnel', p)} className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-slate-50"><Icon name="trash-2" size={16}/></button>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4 flex-1">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-slate-600"><Icon name="mail" size={14} className="text-slate-400"/> <span className="truncate">{p.email || "未設定"}</span></div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600"><Icon name="phone" size={14} className="text-slate-400"/> <span>{p.phone}</span></div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1"><Icon name="activity" size={12}/> 專案進度與負載</h4>
                                        {managedProjects.length > 0 ? (
                                            <div className="space-y-4">
                                                {managedProjects.map(proj => {
                                                    const taskCount = (proj.tasks || []).filter(t => t.assignee === p.name && t.status === 'In Progress').length;
                                                    return (
                                                        <div key={proj.id} className="group">
                                                            <div className="flex justify-between items-end mb-1">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-slate-700 truncate max-w-[180px]" title={proj.name}>{proj.name}</span>
                                                                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                                                                        {proj.manager === p.name ? <span className="bg-indigo-50 text-indigo-600 px-1.5 rounded border border-indigo-100">PM</span> : null}
                                                                        {taskCount > 0 ? <span className="bg-blue-50 text-blue-600 px-1.5 rounded border border-blue-100">{taskCount} 工項</span> : null}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-600">{proj.progress || 0}%</span>
                                                            </div>
                                                            <ProgressBar value={proj.progress || 0} status={proj.status} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (<div className="text-center py-4 text-slate-400 text-xs bg-slate-50 rounded border border-dashed border-slate-200">目前無負責專案</div>)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <button onClick={() => openResourceModal('personnel')} className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-6 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all hover:bg-slate-100 min-h-[300px] group">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform"><Icon name="plus" size={32} /></div>
                        <span className="font-bold text-lg">新增人員</span><span className="text-xs mt-2">建立新的人員資料卡</span>
                    </button>
                 </div>
            )}

            {/* VENDOR VIEW */}
            {activeTab === 'vendor' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vendors.map(v => {
                         const activeTasks = projects.flatMap(p => 
                            (p.tasks || []).filter(t => t.vendor === v.name && t.status === 'In Progress').map(t => ({ projectName: p.name, taskName: t.name, projectProgress: p.progress }))
                        );
                        return (
                            <div key={v.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                                <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">{v.name}<span className={`text-[10px] px-2 py-0.5 rounded-full border ${v.rating?.includes('A') ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>{v.rating || 'N/A'}</span></h3>
                                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md mt-2 inline-block">{v.type}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openResourceModal('vendor', v)} className="text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-slate-50"><Icon name="edit-3" size={16}/></button>
                                        <button onClick={() => handleDeleteResource('vendor', v)} className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-slate-50"><Icon name="trash-2" size={16}/></button>
                                    </div>
                                </div>
                                <div className="p-5 space-y-4 flex-1">
                                    <div className="space-y-2 text-sm text-slate-600">
                                        <div className="flex items-center gap-2"><Icon name="user" size={14} className="text-slate-400"/> 聯絡人：{v.contact}</div>
                                        <div className="flex items-center gap-2"><Icon name="phone" size={14} className="text-slate-400"/> 電話：{v.phone}</div>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1"><Icon name="activity" size={12}/> 執行中專案 (Active Projects)</h4>
                                        {activeTasks.length > 0 ? (
                                            <div className="space-y-3">
                                                {activeTasks.map((t, idx) => (
                                                    <div key={idx} className="bg-blue-50 p-2 rounded border border-blue-100">
                                                        <div className="text-xs font-bold text-blue-800 mb-1 truncate" title={t.projectName}>{t.projectName}</div>
                                                        <div className="text-xs text-slate-600 flex items-center gap-1 mb-1"><Icon name="hammer" size={10}/> {t.taskName}</div>
                                                        <div className="w-full bg-blue-200 rounded-full h-1.5 mt-1"><div className="bg-blue-500 h-1.5 rounded-full" style={{width: `${Math.min(t.projectProgress || 0, 100)}%`}}></div></div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (<div className="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded border border-dashed border-slate-200">目前無執行中工項</div>)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <button onClick={() => openResourceModal('vendor')} className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-6 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all hover:bg-slate-100 min-h-[300px] group">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform"><Icon name="plus" size={32} /></div>
                        <span className="font-bold text-lg">新增廠商</span>
                    </button>
                 </div>
            )}

            {/* BUDGET VIEW */}
            {activeTab === 'budget' && (
                <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
                     <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-xl shadow-lg text-white">
                        <p className="text-emerald-100 text-sm font-medium mb-1">全公司總承攬金額</p>
                        <h3 className="text-2xl md:text-3xl font-bold">{formatCurrency(stats.budgetTotal)}</h3>
                     </div>
                     <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <p className="text-slate-500 text-sm font-medium mb-1">已計價請款總額</p>
                        <h3 className="text-2xl md:text-3xl font-bold text-slate-800">{formatCurrency(stats.spentTotal)}</h3>
                     </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                                <tr><th className="px-6 py-4">專案名稱</th><th className="px-6 py-4">合約編號</th><th className="px-6 py-4 text-right">承攬金額</th><th className="px-6 py-4 text-right">已請款</th><th className="px-6 py-4 w-1/5">預算執行率</th><th className="px-6 py-4 text-right">操作</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {projects.map(p => {
                                    const percent = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
                                    let barColor = "bg-blue-500";
                                    if (percent > 100) barColor = "bg-red-500";
                                    else if (percent > 80) barColor = "bg-orange-400";
                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-bold text-slate-800">{p.name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{p.contractNo || '-'}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(p.budget)}</td>
                                            <td className="px-6 py-4 text-right text-blue-600 font-medium">{formatCurrency(p.spent)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${barColor}`} style={{ width: `${Math.min(percent, 100)}%` }}></div></div>
                                                    <span className={`text-xs font-bold ${percent > 100 ? 'text-red-600' : 'text-slate-600'}`}>{percent}%</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-1">剩餘: {formatCurrency((p.budget || 0) - (p.spent || 0))}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <button onClick={() => { setEditingContract(p); setIsContractModalOpen(true); }} className="text-blue-600"><Icon name="edit-3" size={16}/></button>
                                                <button onClick={() => handleDeleteProjectRequest(p)} className="text-red-600"><Icon name="trash-2" size={16}/></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                     </div>
                 </div>
                </>
            )}

            {/* TOKEN USAGE MONITOR */}
            {activeTab === 'tokenMonitor' && (
              <TokenUsageMonitor />
            )}

            {/* PROJECT DETAIL VIEW */}
            {activeTab === 'detail' && selectedProject && (
               <>
                <div className="flex justify-between items-center mb-4">
                   <button onClick={() => setActiveTab('dashboard')} className="text-slate-500 flex items-center gap-1 text-sm">← 列表</button>
                   <button onClick={() => handleDeleteProjectRequest(selectedProject)} className="text-red-500 text-sm flex items-center gap-1"><Icon name="trash-2" size={16} /> 刪除</button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                       <h3 className="font-bold text-lg mb-2">{selectedProject.name}</h3>
                       <div className="flex flex-wrap gap-2 mb-4"><StatusBadge status={selectedProject.status} /><ICRABadge level={selectedProject.icraLevel} /></div>
                       <div className="grid grid-cols-2 gap-4 text-sm">
                           <div><div className="text-slate-500">預算</div><div className="font-bold">{formatCurrency(selectedProject.budget)}</div></div>
                           <div><div className="text-slate-500">已用</div><div className="font-bold text-blue-600">{formatCurrency(selectedProject.spent)}</div></div>
                       </div>
                       <div className="flex gap-2 mt-4">
                           <button onClick={() => window.open(selectedProject.driveLink || 'https://drive.google.com', '_blank')} className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium"><Icon name="folder-lock" size={16}/> 開啟圖資雲端</button>
                           <button onClick={() => { setEditingContract(selectedProject); setIsContractModalOpen(true); }} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"><Icon name="settings" size={18}/></button>
                       </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mt-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Icon name="message-square" size={18} className="text-green-600"/> 工地動態牆 (Latest Logs)</h3>
                        {(selectedProject.tasks || []).flatMap(t => (t.dailyUpdates || []).map(u => ({ ...u, taskName: t.name }))).length > 0 ? (
                            <div className="space-y-3">
                                {(selectedProject.tasks || []).flatMap(t => (t.dailyUpdates || []).map(u => ({ ...u, taskName: t.name }))).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map((log, i) => (
                                    <div key={i} className="flex gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                                        <div className="flex-1">
                                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                <span className="font-bold text-slate-700">{log.author || "User"}</span>
                                                <span>{log.date}</span>
                                            </div>
                                            <p className="text-sm text-slate-700 mb-1">{log.content}</p>
                                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">#{log.taskName}</span>
                                            {log.supervisorComment && <div className="mt-1 ml-1 text-xs text-blue-600 bg-blue-50 p-1 rounded">督導: {log.supervisorComment}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (<div className="text-center py-6 text-slate-400 text-sm">尚無施工日誌</div>)}
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">工作排程</h3>
                        <button onClick={openNewTaskModal} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1"><Icon name="plus" size={16} /> 新增</button>
                    </div>
                    <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                        {(selectedProject.tasks || []).map((task) => {
                            const statusColors = { "Pending": "text-slate-400 bg-slate-50 border-slate-200", "In Progress": "text-blue-600 bg-blue-50 border-blue-200", "Completed": "text-green-600 bg-green-50 border-green-200", "Delayed": "text-red-600 bg-red-50 border-red-200" };
                            const statusIcons = { "Pending": "clock", "In Progress": "loader-2", "Completed": "check-circle-2", "Delayed": "alert-triangle" };
                            const statusLabels = { "Pending": "待啟動", "In Progress": "進行中", "Completed": "已完工", "Delayed": "延遲" };
                            return (
                                <div key={task.id} onClick={() => openEditTaskModal(task)} className="bg-white p-3 rounded-lg border border-slate-200 active:scale-[0.98] transition-all shadow-sm hover:shadow-md cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                           <div className="font-bold text-slate-800 truncate">{task.name}</div>
                                           {task.taskDriveLink && <Icon name="link" size={14} className="text-blue-500 shrink-0"/>}
                                        </div>
                                        <span className={`text-[10px] px-2 py-1 rounded-full flex items-center gap-1 border shrink-0 ${statusColors[task.status] || statusColors["Pending"]}`}>
                                           <Icon name={statusIcons[task.status] || "clock"} size={14} />
                                           {statusLabels[task.status] || "待啟動"}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 mb-2 flex items-center gap-2"><Icon name="calendar" size={12}/> {task.start} ~ {task.end}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {(task.assignee) && (<div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100"><Icon name="user" size={12}/> {task.assignee}</div>)}
                                        {(task.vendor) && (<div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100"><Icon name="truck" size={12}/> {task.vendor}</div>)}
                                        {(task.files || []).length > 0 && (<span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 border border-slate-200"><Icon name="paperclip" size={10}/> {task.files.length}</span>)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    </div>
                </div>
                </div>
               </>
            )}
        </main>
      </div>
    </div>
  );
}
