import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Clock,
  Settings,
  BellRing,
  RefreshCw,
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Eye,
  EyeOff,
  Save,
  Shield,
  Key
} from 'lucide-react';

// ===== Landseed CIS 色彩定義 =====
const CIS = {
  primary: '#00843D',       // 聯新深綠
  primaryLight: '#4CAF50',  // 亮綠
  primaryBg: '#E8F5E9',     // 淺綠底
  primaryHover: '#006B31',  // 深綠 hover
  accent: '#2E7D32',        // 強調綠
  headerBg: '#00843D',      // 頂部標題背景
  cardBorder: '#C8E6C9',    // 卡片邊框
};

// --- 價格表 (每百萬 tokens 的美元價格) ---
const MODEL_PRICING = {
  'claude-opus-4-20250514': { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.50, name: 'Claude Opus 4' },
  'claude-sonnet-4-20250514': { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.30, name: 'Claude Sonnet 4' },
  'claude-haiku-3-5-20241022': { input: 0.80, output: 4, cacheWrite: 1.00, cacheRead: 0.08, name: 'Claude 3.5 Haiku' },
  'claude-3-5-sonnet-20241022': { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.30, name: 'Claude 3.5 Sonnet' },
};

const DEFAULT_SETTINGS = {
  apiKey: '',
  refreshInterval: 60,
  alertThresholds: {
    dailyCost: 10,
    dailyTokens: 1000000,
    monthlyCost: 200,
    monthlyTokens: 20000000,
  },
  enableAlerts: true,
  enableSound: false,
};

// --- 格式化工具 ---
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

function formatCost(cost) {
  return '$' + cost.toFixed(4);
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return `${seconds} 秒前`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分鐘前`;
  return `${Math.floor(seconds / 3600)} 小時前`;
}

// --- 模擬數據 ---
function generateDemoData() {
  const now = new Date();
  const models = Object.keys(MODEL_PRICING);
  const logs = [];
  for (let i = 0; i < 50; i++) {
    const model = models[Math.floor(Math.random() * models.length)];
    const inputTokens = Math.floor(Math.random() * 5000) + 200;
    const outputTokens = Math.floor(Math.random() * 2000) + 100;
    const cacheRead = Math.random() > 0.5 ? Math.floor(Math.random() * 3000) : 0;
    const cacheWrite = Math.random() > 0.7 ? Math.floor(Math.random() * 1000) : 0;
    const pricing = MODEL_PRICING[model];
    const cost = (inputTokens * pricing.input + outputTokens * pricing.output +
      cacheRead * pricing.cacheRead + cacheWrite * pricing.cacheWrite) / 1000000;
    const timestamp = new Date(now.getTime() - Math.random() * 7 * 86400000);
    logs.push({
      id: `req-${i}`, timestamp, model, modelName: pricing.name,
      inputTokens, outputTokens, cacheReadTokens: cacheRead, cacheWriteTokens: cacheWrite,
      totalTokens: inputTokens + outputTokens + cacheRead + cacheWrite,
      cost, latency: Math.floor(Math.random() * 5000) + 500,
    });
  }
  return logs.sort((a, b) => b.timestamp - a.timestamp);
}

// ===== 告警橫幅 =====
function AlertBanner({ alerts, onDismiss }) {
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2 mb-4">
      {alerts.map((alert, idx) => (
        <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${
          alert.level === 'critical'
            ? 'bg-red-50 border-red-300 text-red-800'
            : alert.level === 'warning'
            ? 'bg-amber-50 border-amber-300 text-amber-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            {alert.level === 'critical' ? (
              <BellRing size={18} className="text-red-500 animate-pulse" />
            ) : (
              <AlertTriangle size={18} className={alert.level === 'warning' ? 'text-amber-500' : 'text-blue-500'} />
            )}
            <span className="text-sm font-medium">{alert.message}</span>
          </div>
          <button onClick={() => onDismiss(idx)} className="text-current opacity-50 hover:opacity-100"><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}

// ===== 用量進度條 =====
function UsageBar({ label, current, limit, unit }) {
  const percentage = Math.min((current / limit) * 100, 100);
  const isCritical = percentage >= 90;
  const isWarning = percentage >= 70;
  const barColor = isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-600';
  const bgColor = isCritical ? 'bg-red-100' : isWarning ? 'bg-amber-100' : 'bg-green-100';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className={`font-mono font-medium ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-800'}`}>
          {unit === '$' ? formatCost(current) : formatNumber(current)} / {unit === '$' ? formatCost(limit) : formatNumber(limit)}
        </span>
      </div>
      <div className={`h-2.5 rounded-full ${bgColor} overflow-hidden`}>
        <div className={`h-full rounded-full ${barColor} transition-all duration-500 ease-out`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="text-right text-xs text-slate-400">{percentage.toFixed(1)}%</div>
    </div>
  );
}

// ===== 統計卡片 =====
function StatCard({ icon: IconComp, label, value, subValue, trend, bgClass }) {
  return (
    <div className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow" style={{ borderColor: CIS.cardBorder }}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${bgClass}`}>
          <IconComp size={18} className="text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center text-xs font-medium ${trend >= 0 ? 'text-red-500' : 'text-green-600'}`}>
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
      {subValue && <div className="text-xs text-slate-400 mt-0.5">{subValue}</div>}
    </div>
  );
}

// ===== 設定面板 =====
function SettingsPanel({ settings, onUpdate, onClose }) {
  const [local, setLocal] = useState({ ...settings });
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => { onUpdate(local); onClose(); };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: CIS.cardBorder }}>
          <h3 className="text-lg font-bold" style={{ color: CIS.primary }}>監控設定</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Key size={14} className="inline mr-1" />Anthropic API 金鑰
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={local.apiKey}
                onChange={(e) => setLocal(p => ({ ...p, apiKey: e.target.value }))}
                placeholder="sk-ant-..."
                className="w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:border-transparent"
                style={{ borderColor: CIS.cardBorder, '--tw-ring-color': CIS.primary }}
              />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">留空則使用模擬數據展示</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">自動更新頻率（秒）</label>
            <input type="number" value={local.refreshInterval}
              onChange={(e) => setLocal(p => ({ ...p, refreshInterval: Math.max(10, parseInt(e.target.value) || 60) }))}
              min={10} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:border-transparent"
              style={{ borderColor: CIS.cardBorder }}
            />
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-3">告警閾值設定</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'dailyCost', label: '每日花費上限（美元）', type: 'float' },
                { key: 'dailyTokens', label: '每日 Token 上限', type: 'int' },
                { key: 'monthlyCost', label: '每月花費上限（美元）', type: 'float' },
                { key: 'monthlyTokens', label: '每月 Token 上限', type: 'int' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs text-slate-500 mb-1">{label}</label>
                  <input type="number" value={local.alertThresholds[key]}
                    onChange={(e) => setLocal(p => ({
                      ...p, alertThresholds: { ...p.alertThresholds, [key]: type === 'float' ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:border-transparent"
                    style={{ borderColor: CIS.cardBorder }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {[
              { key: 'enableAlerts', label: '啟用告警通知' },
              { key: 'enableSound', label: '聲音提醒' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{label}</span>
                <button onClick={() => setLocal(p => ({ ...p, [key]: !p[key] }))}
                  className="relative w-11 h-6 rounded-full transition-colors"
                  style={{ backgroundColor: local[key] ? CIS.primary : '#CBD5E1' }}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${local[key] ? 'translate-x-5' : ''}`} />
                </button>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t" style={{ borderColor: CIS.cardBorder }}>
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">取消</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm text-white rounded-lg transition-colors flex items-center gap-1"
            style={{ backgroundColor: CIS.primary }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = CIS.primaryHover}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = CIS.primary}>
            <Save size={14} /> 儲存設定
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== 簡易長條圖 =====
function SimpleBarChart({ data, valueKey, color, height = 120 }) {
  const maxVal = Math.max(...data.map(d => d[valueKey]), 0.001);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className={`w-full rounded-t ${color} transition-all duration-300 min-h-[2px]`}
            style={{ height: `${(d[valueKey] / maxVal) * (height - 20)}px` }}
            title={`${d.label}: ${valueKey === 'cost' ? formatCost(d[valueKey]) : formatNumber(d[valueKey])}`} />
          <span className="text-[10px] text-slate-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ===== 主元件 =====
export default function TokenUsageMonitor() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('claude-token-monitor-settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  const [usageLogs, setUsageLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [activeView, setActiveView] = useState('overview');
  const intervalRef = useRef(null);

  const saveSettings = useCallback((s) => {
    setSettings(s);
    localStorage.setItem('claude-token-monitor-settings', JSON.stringify(s));
  }, []);

  const checkAlerts = useCallback((logs) => {
    if (!settings.enableAlerts) return;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayLogs = logs.filter(l => new Date(l.timestamp) >= todayStart);
    const monthLogs = logs.filter(l => new Date(l.timestamp) >= monthStart);

    const todayCost = todayLogs.reduce((s, l) => s + l.cost, 0);
    const todayTokens = todayLogs.reduce((s, l) => s + l.totalTokens, 0);
    const monthCost = monthLogs.reduce((s, l) => s + l.cost, 0);
    const monthTokens = monthLogs.reduce((s, l) => s + l.totalTokens, 0);
    const t = settings.alertThresholds;
    const newAlerts = [];

    if (todayCost >= t.dailyCost) {
      newAlerts.push({ level: 'critical', message: `警告：今日花費已達 ${formatCost(todayCost)}，超過每日上限 ${formatCost(t.dailyCost)}！請立即檢視用量。` });
    } else if (todayCost >= t.dailyCost * 0.8) {
      newAlerts.push({ level: 'warning', message: `提醒：今日花費 ${formatCost(todayCost)} 已達每日上限的 80%，請注意控制用量。` });
    }
    if (todayTokens >= t.dailyTokens) {
      newAlerts.push({ level: 'critical', message: `警告：今日 Token 用量 ${formatNumber(todayTokens)} 已超過每日上限 ${formatNumber(t.dailyTokens)}！` });
    } else if (todayTokens >= t.dailyTokens * 0.8) {
      newAlerts.push({ level: 'warning', message: `提醒：今日 Token 用量 ${formatNumber(todayTokens)} 已達每日上限的 80%。` });
    }
    if (monthCost >= t.monthlyCost) {
      newAlerts.push({ level: 'critical', message: `警告：本月花費已達 ${formatCost(monthCost)}，超過每月上限 ${formatCost(t.monthlyCost)}！` });
    } else if (monthCost >= t.monthlyCost * 0.7) {
      newAlerts.push({ level: 'warning', message: `提醒：本月花費 ${formatCost(monthCost)} 已達每月上限的 70%，請留意。` });
    }
    if (monthTokens >= t.monthlyTokens) {
      newAlerts.push({ level: 'critical', message: `警告：本月 Token 用量 ${formatNumber(monthTokens)} 已超過每月上限！` });
    }
    setAlerts(newAlerts);
  }, [settings]);

  const fetchUsageData = useCallback(async () => {
    setLoading(true);
    try {
      if (!settings.apiKey) {
        const data = generateDemoData();
        setUsageLogs(data);
        setLastRefresh(new Date());
        checkAlerts(data);
        return;
      }
      const savedLogs = localStorage.getItem('claude-usage-logs');
      const logs = savedLogs ? JSON.parse(savedLogs) : [];
      setUsageLogs(logs);
      setLastRefresh(new Date());
      checkAlerts(logs);
    } catch (error) {
      console.error('取得用量數據失敗:', error);
    } finally {
      setLoading(false);
    }
  }, [settings.apiKey, checkAlerts]);

  useEffect(() => { fetchUsageData(); }, [fetchUsageData]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchUsageData, settings.refreshInterval * 1000);
    return () => clearInterval(intervalRef.current);
  }, [settings.refreshInterval, fetchUsageData]);

  // --- 統計計算 ---
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now.getTime() - 7 * 86400000);

    const todayLogs = usageLogs.filter(l => new Date(l.timestamp) >= todayStart);
    const yesterdayLogs = usageLogs.filter(l => { const t = new Date(l.timestamp); return t >= yesterdayStart && t < todayStart; });
    const monthLogs = usageLogs.filter(l => new Date(l.timestamp) >= monthStart);
    const weekLogs = usageLogs.filter(l => new Date(l.timestamp) >= weekStart);

    const todayCost = todayLogs.reduce((s, l) => s + l.cost, 0);
    const yesterdayCost = yesterdayLogs.reduce((s, l) => s + l.cost, 0);
    const monthCost = monthLogs.reduce((s, l) => s + l.cost, 0);
    const todayTokens = todayLogs.reduce((s, l) => s + l.totalTokens, 0);
    const monthTokens = monthLogs.reduce((s, l) => s + l.totalTokens, 0);
    const todayRequests = todayLogs.length;
    const weekRequests = weekLogs.length;
    const costTrend = yesterdayCost > 0 ? ((todayCost - yesterdayCost) / yesterdayCost) * 100 : 0;

    const byModel = {};
    monthLogs.forEach(l => {
      if (!byModel[l.model]) byModel[l.model] = { name: l.modelName, tokens: 0, cost: 0, count: 0, input: 0, output: 0 };
      byModel[l.model].tokens += l.totalTokens;
      byModel[l.model].cost += l.cost;
      byModel[l.model].count += 1;
      byModel[l.model].input += l.inputTokens;
      byModel[l.model].output += l.outputTokens;
    });

    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart.getTime() - i * 86400000);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayLogs = usageLogs.filter(l => { const t = new Date(l.timestamp); return t >= dayStart && t < dayEnd; });
      dailyData.push({
        label: `${dayStart.getMonth() + 1}/${dayStart.getDate()}`,
        cost: dayLogs.reduce((s, l) => s + l.cost, 0),
        tokens: dayLogs.reduce((s, l) => s + l.totalTokens, 0),
        requests: dayLogs.length,
      });
    }

    const hourlyData = [];
    for (let h = 0; h < 24; h++) {
      const hourStart = new Date(todayStart.getTime() + h * 3600000);
      const hourEnd = new Date(hourStart.getTime() + 3600000);
      const hourLogs = todayLogs.filter(l => { const t = new Date(l.timestamp); return t >= hourStart && t < hourEnd; });
      hourlyData.push({
        label: `${h}:00`,
        cost: hourLogs.reduce((s, l) => s + l.cost, 0),
        tokens: hourLogs.reduce((s, l) => s + l.totalTokens, 0),
        requests: hourLogs.length,
      });
    }

    return {
      todayCost, monthCost, todayTokens, monthTokens,
      todayRequests, weekRequests, costTrend, byModel,
      dailyData, hourlyData,
      avgCostPerRequest: todayRequests > 0 ? todayCost / todayRequests : 0,
    };
  }, [usageLogs]);

  const dismissAlert = (idx) => setAlerts(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      {/* ===== 頂部標題列 (Landseed CIS 綠色) ===== */}
      <div className="rounded-xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${CIS.primary}, ${CIS.accent})` }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Zap size={22} className="text-yellow-300" />
              Claude Token 用量監控儀表板
            </h2>
            <p className="text-sm text-green-100 mt-1">
              {!settings.apiKey && (
                <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-xs font-medium mr-2">
                  展示模式
                </span>
              )}
              {lastRefresh && <>最後更新：{getTimeAgo(lastRefresh)} · 每 {settings.refreshInterval} 秒自動更新</>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchUsageData} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50 text-white">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />重新整理
            </button>
            <button onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white">
              <Settings size={14} />設定
            </button>
          </div>
        </div>
      </div>

      {/* 告警橫幅 */}
      <AlertBanner alerts={alerts} onDismiss={dismissAlert} />

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="今日花費" value={formatCost(stats.todayCost)}
          subValue={`本月累計 ${formatCost(stats.monthCost)}`} trend={stats.costTrend} bgClass="bg-green-600" />
        <StatCard icon={Zap} label="今日 Token 用量" value={formatNumber(stats.todayTokens)}
          subValue={`本月累計 ${formatNumber(stats.monthTokens)}`} bgClass="bg-emerald-600" />
        <StatCard icon={Activity} label="今日請求次數" value={stats.todayRequests.toLocaleString()}
          subValue={`本週共 ${stats.weekRequests.toLocaleString()} 次`} bgClass="bg-teal-600" />
        <StatCard icon={TrendingUp} label="平均每次花費" value={formatCost(stats.avgCostPerRequest)}
          subValue="今日平均值" bgClass="bg-lime-700" />
      </div>

      {/* 用量限額監控 */}
      <div className="bg-white rounded-xl border p-4" style={{ borderColor: CIS.cardBorder }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: CIS.primary }}>
          <Shield size={15} />用量限額監控
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <UsageBar label="每日花費" current={stats.todayCost} limit={settings.alertThresholds.dailyCost} unit="$" />
          <UsageBar label="每日 Token" current={stats.todayTokens} limit={settings.alertThresholds.dailyTokens} unit="tokens" />
          <UsageBar label="每月花費" current={stats.monthCost} limit={settings.alertThresholds.monthlyCost} unit="$" />
          <UsageBar label="每月 Token" current={stats.monthTokens} limit={settings.alertThresholds.monthlyTokens} unit="tokens" />
        </div>
      </div>

      {/* 檢視切換 */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ backgroundColor: CIS.primaryBg }}>
        {[
          { key: 'overview', label: '總覽圖表', icon: BarChart3 },
          { key: 'models', label: '模型分析', icon: Zap },
          { key: 'logs', label: '詳細記錄', icon: Clock },
        ].map(({ key, label, icon: Ic }) => (
          <button key={key} onClick={() => setActiveView(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              activeView === key ? 'bg-white shadow-sm font-medium' : 'hover:bg-white/50'
            }`}
            style={activeView === key ? { color: CIS.primary } : { color: '#64748B' }}>
            <Ic size={14} />{label}
          </button>
        ))}
      </div>

      {/* 總覽圖表 */}
      {activeView === 'overview' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: CIS.cardBorder }}>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">每日花費趨勢（近 7 天）</h4>
            <SimpleBarChart data={stats.dailyData} valueKey="cost" color="bg-green-500" />
          </div>
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: CIS.cardBorder }}>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">每日 Token 用量（近 7 天）</h4>
            <SimpleBarChart data={stats.dailyData} valueKey="tokens" color="bg-emerald-500" />
          </div>
          <div className="bg-white rounded-xl border p-4 md:col-span-2" style={{ borderColor: CIS.cardBorder }}>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">今日每小時使用分佈</h4>
            <SimpleBarChart data={stats.hourlyData} valueKey="tokens" color="bg-teal-500" height={100} />
          </div>
        </div>
      )}

      {/* 模型分析 */}
      {activeView === 'models' && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: CIS.cardBorder }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: CIS.primaryBg }}>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">模型名稱</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">請求次數</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">輸入 Tokens</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">輸出 Tokens</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">總計 Tokens</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">花費金額</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.byModel).map(([modelId, data]) => (
                  <tr key={modelId} className="border-b last:border-0 hover:bg-green-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{data.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{modelId}</div>
                    </td>
                    <td className="text-right px-4 py-3 text-slate-600">{data.count}</td>
                    <td className="text-right px-4 py-3 font-mono text-slate-600">{formatNumber(data.input)}</td>
                    <td className="text-right px-4 py-3 font-mono text-slate-600">{formatNumber(data.output)}</td>
                    <td className="text-right px-4 py-3 font-mono font-medium text-slate-800">{formatNumber(data.tokens)}</td>
                    <td className="text-right px-4 py-3 font-mono font-medium" style={{ color: CIS.primary }}>{formatCost(data.cost)}</td>
                  </tr>
                ))}
                {Object.keys(stats.byModel).length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400">目前尚無使用數據</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 詳細記錄 */}
      {activeView === 'logs' && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: CIS.cardBorder }}>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr style={{ backgroundColor: CIS.primaryBg }}>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">時間</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">模型</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">輸入</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">輸出</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">快取</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">花費</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">延遲</th>
                </tr>
              </thead>
              <tbody>
                {usageLogs.slice(0, 100).map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-green-50/30 transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap text-xs">
                      {new Date(log.timestamp).toLocaleString('zh-TW')}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: CIS.primaryBg, color: CIS.primary }}>{log.modelName}</span>
                    </td>
                    <td className="text-right px-4 py-2.5 font-mono text-xs text-slate-600">{formatNumber(log.inputTokens)}</td>
                    <td className="text-right px-4 py-2.5 font-mono text-xs text-slate-600">{formatNumber(log.outputTokens)}</td>
                    <td className="text-right px-4 py-2.5 font-mono text-xs text-slate-400">
                      {log.cacheReadTokens > 0 || log.cacheWriteTokens > 0
                        ? `讀:${formatNumber(log.cacheReadTokens)} 寫:${formatNumber(log.cacheWriteTokens)}`
                        : '-'}
                    </td>
                    <td className="text-right px-4 py-2.5 font-mono text-xs font-medium" style={{ color: CIS.primary }}>{formatCost(log.cost)}</td>
                    <td className="text-right px-4 py-2.5 font-mono text-xs text-slate-400">{log.latency}毫秒</td>
                  </tr>
                ))}
                {usageLogs.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">目前尚無使用記錄</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {usageLogs.length > 100 && (
            <div className="text-center py-2 text-xs text-slate-400 border-t" style={{ backgroundColor: CIS.primaryBg, borderColor: CIS.cardBorder }}>
              顯示最近 100 筆紀錄，共 {usageLogs.length} 筆
            </div>
          )}
        </div>
      )}

      {/* 設定面板 */}
      {showSettings && <SettingsPanel settings={settings} onUpdate={saveSettings} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
