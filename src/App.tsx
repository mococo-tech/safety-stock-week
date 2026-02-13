import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";

const WEEKS = 12;

function NumberControl({
  label,
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  unit = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <div className="flex items-center gap-1">
        <button
          className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-lg font-bold text-gray-600 transition-colors cursor-pointer"
          onClick={() => onChange(clamp(value - step * 10))}
        >
          ⏪
        </button>
        <button
          className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-lg font-bold text-gray-600 transition-colors cursor-pointer"
          onClick={() => onChange(clamp(value - step))}
        >
          −
        </button>
        <span className="w-20 text-center text-lg font-bold tabular-nums">
          {value}
          {unit && <span className="text-xs text-gray-400 ml-0.5">{unit}</span>}
        </span>
        <button
          className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-lg font-bold text-gray-600 transition-colors cursor-pointer"
          onClick={() => onChange(clamp(value + step))}
        >
          +
        </button>
        <button
          className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-lg font-bold text-gray-600 transition-colors cursor-pointer"
          onClick={() => onChange(clamp(value + step * 10))}
        >
          ⏩
        </button>
      </div>
    </div>
  );
}

function WeeklyReceivingControl({
  weeklyReceiving,
  onChange,
}: {
  weeklyReceiving: number[];
  onChange: (week: number, value: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {weeklyReceiving.map((_, i) => (
              <th key={i} className="px-1 py-1 text-center text-xs text-gray-500 font-medium">
                {i + 1}週
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {weeklyReceiving.map((val, i) => (
              <td key={i} className="px-1 py-1 text-center">
                <div className="flex flex-col items-center gap-0.5">
                  <button
                    className="w-7 h-6 rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-xs font-bold text-gray-600 transition-colors cursor-pointer"
                    onClick={() => onChange(i, Math.min(9999, val + 10))}
                  >
                    +10
                  </button>
                  <button
                    className="w-7 h-6 rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-xs font-bold text-gray-600 transition-colors cursor-pointer"
                    onClick={() => onChange(i, Math.min(9999, val + 1))}
                  >
                    +
                  </button>
                  <span className="text-sm font-bold tabular-nums w-8 text-center">{val}</span>
                  <button
                    className="w-7 h-6 rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-xs font-bold text-gray-600 transition-colors cursor-pointer"
                    onClick={() => onChange(i, Math.max(0, val - 1))}
                  >
                    −
                  </button>
                  <button
                    className="w-7 h-6 rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-xs font-bold text-gray-600 transition-colors cursor-pointer"
                    onClick={() => onChange(i, Math.max(0, val - 10))}
                  >
                    -10
                  </button>
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [weeklyDemand, setWeeklyDemand] = useState(100);
  const [safetyStockWeeks, setSafetyStockWeeks] = useState(2);
  const [initialStock, setInitialStock] = useState(500);
  const [weeklyReceiving, setWeeklyReceiving] = useState<number[]>(
    () => Array.from({ length: WEEKS }, () => 100)
  );
  const [yAxisFixed, setYAxisFixed] = useState(false);
  const [yAxisMax, setYAxisMax] = useState(1000);

  const safetyStock = weeklyDemand * safetyStockWeeks;

  const chartData = useMemo(() => {
    const data: {
      week: string;
      在庫数: number;
      入庫数: number;
      出庫数: number;
      安全在庫: number;
    }[] = [];
    let stock = initialStock;

    for (let i = 0; i < WEEKS; i++) {
      const receiving = weeklyReceiving[i];
      const demand = weeklyDemand;

      if (i > 0) {
        stock = stock + receiving - demand;
      }

      data.push({
        week: `${i + 1}週`,
        在庫数: Math.max(0, stock),
        入庫数: receiving,
        出庫数: demand,
        安全在庫: safetyStock,
      });
    }
    return data;
  }, [weeklyDemand, safetyStockWeeks, initialStock, weeklyReceiving, safetyStock]);

  const handleReceivingChange = (week: number, value: number) => {
    setWeeklyReceiving((prev) => {
      const next = [...prev];
      next[week] = value;
      return next;
    });
  };

  const setAllReceiving = (value: number) => {
    setWeeklyReceiving(Array.from({ length: WEEKS }, () => value));
  };

  const minStock = Math.min(...chartData.map((d) => d.在庫数));
  const stockStatus =
    minStock <= 0
      ? { label: "欠品発生", color: "text-red-600", bg: "bg-red-50 border-red-200" }
      : minStock <= safetyStock
        ? { label: "安全在庫割れ", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" }
        : { label: "適正", color: "text-green-600", bg: "bg-green-50 border-green-200" };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            安全在庫週シミュレーター
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            入庫数・出庫数・安全在庫週を操作して在庫推移を確認できます
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-xs text-gray-500">安全在庫数</div>
            <div className="text-2xl font-bold text-blue-600 tabular-nums">
              {safetyStock}
            </div>
            <div className="text-xs text-gray-400">
              = {weeklyDemand} × {safetyStockWeeks}週
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-xs text-gray-500">初期在庫</div>
            <div className="text-2xl font-bold text-gray-700 tabular-nums">
              {initialStock}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-xs text-gray-500">週間出庫数</div>
            <div className="text-2xl font-bold text-orange-600 tabular-nums">
              {weeklyDemand}
            </div>
          </div>
          <div className={`rounded-xl border p-4 text-center ${stockStatus.bg}`}>
            <div className="text-xs text-gray-500">在庫状態</div>
            <div className={`text-xl font-bold ${stockStatus.color}`}>
              {stockStatus.label}
            </div>
            <div className="text-xs text-gray-400">
              最低在庫: {minStock}
            </div>
          </div>
        </div>

        {/* Concept Explanation */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-700">安全在庫週とは</h2>
          <p className="text-sm text-gray-600">
            入庫が完全に止まった場合に、何週間分の需要を在庫だけでまかなえるかを表す指標です。
          </p>

          {/* Formula */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-xs text-blue-500 mb-1">計算式</div>
            <div className="text-base font-bold text-blue-800">
              安全在庫数 = 週間出庫数 × 安全在庫週
            </div>
            <div className="text-sm text-blue-600 mt-1 tabular-nums">
              {safetyStock} = {weeklyDemand} × {safetyStockWeeks}
            </div>
          </div>

          {/* Visual: weekly demand blocks */}
          <div className="space-y-2">
            <div className="text-xs text-gray-500 font-medium">
              安全在庫 = 週間出庫数 {safetyStockWeeks}週分のバッファ
            </div>
            <div className="flex items-end gap-1">
              {Array.from({ length: Math.max(safetyStockWeeks, 1) }, (_, i) => (
                <div key={i} className="flex-1 max-w-28">
                  <div className="text-center text-[10px] text-gray-400 mb-0.5">
                    {i + 1}週分
                  </div>
                  <div
                    className="bg-red-100 border border-red-300 rounded text-center py-2 text-xs font-bold text-red-700 tabular-nums"
                  >
                    {weeklyDemand}
                  </div>
                </div>
              ))}
              <div className="text-sm font-bold text-gray-500 px-2 pb-2">=</div>
              <div className="flex-1 max-w-32">
                <div className="text-center text-[10px] text-red-500 mb-0.5">
                  安全在庫数
                </div>
                <div className="bg-red-500 rounded text-center py-2 text-xs font-bold text-white tabular-nums">
                  {safetyStock}
                </div>
              </div>
            </div>
          </div>

          {/* Visual: stock bar with safety stock zone */}
          <div className="space-y-2">
            <div className="text-xs text-gray-500 font-medium">
              現在の初期在庫における安全在庫の位置
            </div>
            <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
              {initialStock > 0 && (
                <>
                  {/* Safety stock zone */}
                  <div
                    className="absolute left-0 top-0 h-full bg-red-200 border-r-2 border-red-400 border-dashed"
                    style={{
                      width: `${Math.min((safetyStock / initialStock) * 100, 100)}%`,
                    }}
                  />
                  {/* Current stock bar */}
                  <div
                    className="absolute left-0 top-0 h-full bg-blue-400/50 rounded-lg"
                    style={{ width: "100%" }}
                  />
                </>
              )}
              {/* Labels */}
              <div className="absolute inset-0 flex items-center justify-between px-3">
                <span className="text-[10px] font-bold text-red-700 bg-white/70 px-1 rounded">
                  安全在庫: {safetyStock}
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-white/70 px-1 rounded">
                  初期在庫: {initialStock}
                </span>
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 px-1">
              <span>0</span>
              <span>
                入庫なしで耐えられる期間: 約{" "}
                <span className="font-bold text-gray-600">
                  {weeklyDemand > 0
                    ? (initialStock / weeklyDemand).toFixed(1)
                    : "-"}
                </span>
                {" "}週
              </span>
              <span>{initialStock}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
          <h2 className="text-sm font-bold text-gray-700">基本パラメータ</h2>
          <div className="flex flex-wrap justify-center gap-6">
            <NumberControl
              label="週間出庫数（需要）"
              value={weeklyDemand}
              onChange={setWeeklyDemand}
              min={0}
              max={9999}
              step={10}
              unit="個"
            />
            <NumberControl
              label="安全在庫週"
              value={safetyStockWeeks}
              onChange={setSafetyStockWeeks}
              min={0}
              max={12}
              step={1}
              unit="週"
            />
            <NumberControl
              label="初期在庫数"
              value={initialStock}
              onChange={setInitialStock}
              min={0}
              max={9999}
              step={50}
              unit="個"
            />
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700">在庫推移グラフ</h2>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={yAxisFixed}
                  onChange={(e) => setYAxisFixed(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                />
                <span className="text-xs text-gray-600">縦軸を固定</span>
              </label>
              {yAxisFixed && (
                <NumberControl
                  label="上限値"
                  value={yAxisMax}
                  onChange={setYAxisMax}
                  min={100}
                  max={99999}
                  step={100}
                />
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                domain={yAxisFixed ? [0, yAxisMax] : ["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "13px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "13px" }} />
              <Area
                type="monotone"
                dataKey="在庫数"
                stroke="#3b82f6"
                fill="#dbeafe"
                strokeWidth={2}
                dot={{ r: 4, fill: "#3b82f6" }}
              />
              <Area
                type="monotone"
                dataKey="入庫数"
                stroke="#22c55e"
                fill="#dcfce7"
                strokeWidth={2}
                dot={{ r: 3, fill: "#22c55e" }}
              />
              <Area
                type="monotone"
                dataKey="出庫数"
                stroke="#f97316"
                fill="#ffedd5"
                strokeWidth={2}
                dot={{ r: 3, fill: "#f97316" }}
              />
              <ReferenceLine
                y={safetyStock}
                stroke="#ef4444"
                strokeDasharray="8 4"
                strokeWidth={2}
                label={{
                  value: `安全在庫: ${safetyStock}`,
                  position: "right",
                  fill: "#ef4444",
                  fontSize: 12,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Receiving Control */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700">週別入庫数</h2>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 text-xs rounded-lg bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 transition-colors cursor-pointer"
                onClick={() => setAllReceiving(weeklyDemand)}
              >
                出庫数と同じ
              </button>
              <button
                className="px-3 py-1 text-xs rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors cursor-pointer"
                onClick={() => setAllReceiving(0)}
              >
                全てリセット
              </button>
            </div>
          </div>
          <WeeklyReceivingControl
            weeklyReceiving={weeklyReceiving}
            onChange={handleReceivingChange}
          />
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-3">週別データ</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium">週</th>
                  <th className="px-3 py-2 text-right text-xs text-gray-500 font-medium">入庫数</th>
                  <th className="px-3 py-2 text-right text-xs text-gray-500 font-medium">出庫数</th>
                  <th className="px-3 py-2 text-right text-xs text-gray-500 font-medium">在庫数</th>
                  <th className="px-3 py-2 text-right text-xs text-gray-500 font-medium">安全在庫</th>
                  <th className="px-3 py-2 text-center text-xs text-gray-500 font-medium">状態</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, i) => {
                  const isDanger = row.在庫数 <= 0;
                  const isWarning = !isDanger && row.在庫数 <= safetyStock;
                  return (
                    <tr
                      key={i}
                      className={`border-b border-gray-100 ${isDanger ? "bg-red-50" : isWarning ? "bg-amber-50" : ""}`}
                    >
                      <td className="px-3 py-2 font-medium">{row.week}</td>
                      <td className="px-3 py-2 text-right text-green-600 tabular-nums">
                        {row.入庫数}
                      </td>
                      <td className="px-3 py-2 text-right text-orange-600 tabular-nums">
                        {row.出庫数}
                      </td>
                      <td className={`px-3 py-2 text-right font-bold tabular-nums ${isDanger ? "text-red-600" : isWarning ? "text-amber-600" : "text-blue-600"}`}>
                        {row.在庫数}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-400 tabular-nums">
                        {row.安全在庫}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {isDanger ? (
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                            欠品
                          </span>
                        ) : isWarning ? (
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">
                            注意
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                            適正
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
