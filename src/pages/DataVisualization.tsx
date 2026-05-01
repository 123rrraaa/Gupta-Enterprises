import React, { useMemo, useState } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, ResponsiveContainer, Legend, CartesianGrid,
  Area, AreaChart, ComposedChart
} from "recharts";
import SalesChatbot from "../components/SalesChatbot";

// ─── Color Palette ───────────────────────────────────────────────────────────
const COLORS = [
  "#3b82f6", "#10b981", "#f59e42", "#ef4444", "#a78bfa",
  "#fbbf24", "#6366f1", "#ec4899", "#14b8a6", "#f97316"
];

const TIME_RANGES = [
  { label: "1 Month", value: 1 },
  { label: "3 Months", value: 3 },
  { label: "6 Months", value: 6 },
  { label: "1 Year", value: 12 },
];

// ─── AI/ML Prediction Utilities ──────────────────────────────────────────────

/** Simple Linear Regression: returns { slope, intercept } */
function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y || 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/** Exponential Smoothing (Simple / SES) */
function exponentialSmoothing(data: number[], alpha = 0.3): number {
  if (data.length === 0) return 0;
  if (data.length === 1) return data[0];

  let forecast = data[0];
  for (let i = 1; i < data.length; i++) {
    forecast = alpha * data[i] + (1 - alpha) * forecast;
  }
  // Next period forecast
  return alpha * data[data.length - 1] + (1 - alpha) * forecast;
}

/** Weighted Ensemble Prediction combining linear regression and exponential smoothing */
function predictNextMonth(monthlyRevenues: number[]): {
  predictedSales: number;
  growthRate: number;
  confidence: number;
  method: string;
} {
  if (monthlyRevenues.length === 0) {
    return { predictedSales: 0, growthRate: 0, confidence: 0, method: "No data available" };
  }

  if (monthlyRevenues.length === 1) {
    const val = monthlyRevenues[0];
    return {
      predictedSales: Math.round(val),
      growthRate: 0,
      confidence: 15,
      method: "Single data point — insufficient for prediction"
    };
  }

  // Linear regression prediction
  const points = monthlyRevenues.map((y, i) => ({ x: i, y }));
  const { slope, intercept } = linearRegression(points);
  const lrPrediction = Math.max(0, slope * monthlyRevenues.length + intercept);

  // Exponential smoothing prediction
  const esPrediction = Math.max(0, exponentialSmoothing(monthlyRevenues, 0.3));

  // Weighted ensemble (60% LR, 40% ES for trend-sensitive prediction)
  const ensemblePrediction = 0.6 * lrPrediction + 0.4 * esPrediction;

  // Confidence score (0-100) based on data quantity and consistency
  const n = monthlyRevenues.length;
  const dataConfidence = Math.min(n / 6, 1) * 50; // Max 50 from data quantity

  // Prediction consistency — how close are the two models
  const maxPred = Math.max(lrPrediction, esPrediction, 1);
  const consistency = 1 - Math.abs(lrPrediction - esPrediction) / maxPred;
  const consistencyConfidence = consistency * 50; // Max 50 from consistency

  const confidence = Math.round(dataConfidence + consistencyConfidence);

  // Growth rate vs last month
  const lastMonth = monthlyRevenues[monthlyRevenues.length - 1] || 1;
  const growthRate = ((ensemblePrediction - lastMonth) / lastMonth) * 100;

  const method = n >= 4
    ? "Ensemble: Linear Regression (60%) + Exponential Smoothing (40%)"
    : n >= 2
      ? "Limited data: Weighted average of LR and ES models"
      : "Insufficient data for reliable prediction";

  return {
    predictedSales: Math.round(ensemblePrediction),
    growthRate: parseFloat(growthRate.toFixed(1)),
    confidence,
    method
  };
}

/** Generate multi-month predictions by iteratively forecasting */
function predictMultipleMonths(monthlyRevenues: number[], monthsAhead: number): number[] {
  if (monthlyRevenues.length === 0) return Array(monthsAhead).fill(0);
  
  const predictions: number[] = [];
  const data = [...monthlyRevenues];
  
  for (let i = 0; i < monthsAhead; i++) {
    const result = predictNextMonth(data);
    predictions.push(result.predictedSales);
    data.push(result.predictedSales); // Feed prediction back for next iteration
  }
  
  return predictions;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (n: number) => "₹" + n.toLocaleString("en-IN");

const TrendArrow: React.FC<{ current: number; previous: number }> = ({ current, previous }) => {
  if (previous === 0 && current === 0) return <span className="text-gray-400 text-xs">—</span>;
  if (previous === 0) return <span className="text-green-600 text-xs font-semibold">↑ 100%</span>;
  const pct = ((current - previous) / previous * 100).toFixed(1);
  const isUp = current >= previous;
  return (
    <span className={`text-xs font-semibold ${isUp ? "text-green-600" : "text-red-500"}`}>
      {isUp ? "↑" : "↓"} {Math.abs(parseFloat(pct))}%
    </span>
  );
};

const NoDataMessage: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
    <svg className="w-12 h-12 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
    <p className="text-sm">{message || "No data available for selected range"}</p>
  </div>
);


// ─── Main Component ──────────────────────────────────────────────────────────

const DataVisualization: React.FC<{ orders?: any[]; users?: any[]; products?: any[] }> = ({ orders = [], users = [], products = [] }) => {
  const [months, setMonths] = useState(1);
  const now = useMemo(() => new Date(), []);

  const startDate = useMemo(() => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - months);
    return d;
  }, [months, now]);

  // Previous period: compare selected range vs same duration before it
  const prevStartDate = useMemo(() => {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() - months);
    return d;
  }, [months, startDate]);

  // ─── Filtered Orders ─────────────────────────────────────────────────────
  const filteredOrders = useMemo(() =>
    orders.filter(o => new Date(o.createdAt) >= startDate),
    [orders, startDate]
  );

  const prevFilteredOrders = useMemo(() =>
    orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= prevStartDate && d < startDate;
    }),
    [orders, prevStartDate, startDate]
  );

  // ─── Category Pie Data ────────────────────────────────────────────────────
  const categoryPieData = useMemo(() => {
    const map: Record<string, { name: string; value: number; revenue: number }> = {};
    filteredOrders.forEach(order => {
      order.items.forEach((item: any) => {
        const cat = item.product.category || "other";
        if (!map[cat]) map[cat] = { name: cat, value: 0, revenue: 0 };
        map[cat].value += item.quantity;
        map[cat].revenue += item.product.price * item.quantity;
      });
    });
    return Object.values(map).filter(d => d.name.toLowerCase() !== "other").sort((a, b) => b.value - a.value);
  }, [filteredOrders]);

  // ─── Brand Pie Data (grouped by brand from MongoDB products) ───────────────
  const brandPieData = useMemo(() => {
    // Build a product-name → brand lookup from the products list
    const nameToBrand: Record<string, string> = {};
    products.forEach((p: any) => {
      if (p.name && p.brand) {
        nameToBrand[p.name.toLowerCase()] = p.brand;
      }
    });

    const map: Record<string, { name: string; value: number; revenue: number }> = {};
    filteredOrders.forEach(order => {
      order.items.forEach((item: any) => {
        // Try: embedded brand → lookup by product name → "Unknown"
        const rawBrand = item.product.brand
          || nameToBrand[(item.product.name || "").toLowerCase()]
          || "unknown";
        const brand = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1);
        if (!map[brand]) map[brand] = { name: brand, value: 0, revenue: 0 };
        map[brand].value += item.quantity;
        map[brand].revenue += item.product.price * item.quantity;
      });
    });
    return Object.values(map).filter(d => d.name.toLowerCase() !== "unknown").sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders, products]);

  // ─── Value Cards ──────────────────────────────────────────────────────────
  const numCustomers = useMemo(() => {
    const set = new Set(filteredOrders.map(o => o.address?.phone || o.userId || o.userEmail));
    return set.size;
  }, [filteredOrders]);
  const prevNumCustomers = useMemo(() => {
    const set = new Set(prevFilteredOrders.map(o => o.address?.phone || o.userId || o.userEmail));
    return set.size;
  }, [prevFilteredOrders]);

  const numOrders = filteredOrders.length;
  const prevNumOrders = prevFilteredOrders.length;

  const numItems = useMemo(() =>
    filteredOrders.reduce((sum, o) => sum + o.items.reduce((s: number, i: any) => s + i.quantity, 0), 0),
    [filteredOrders]
  );
  const prevNumItems = useMemo(() =>
    prevFilteredOrders.reduce((sum, o) => sum + o.items.reduce((s: number, i: any) => s + i.quantity, 0), 0),
    [prevFilteredOrders]
  );

  const totalSales = useMemo(() =>
    filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    [filteredOrders]
  );
  const prevTotalSales = useMemo(() =>
    prevFilteredOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    [prevFilteredOrders]
  );

  const avgOrderValue = numOrders > 0 ? Math.round(totalSales / numOrders) : 0;
  const prevAvgOrderValue = prevNumOrders > 0 ? Math.round(prevTotalSales / prevNumOrders) : 0;

  // ─── Daily Order Growth ───────────────────────────────────────────────────
  const dailyGrowth = useMemo(() => {
    const map: Record<string, { date: string; orders: number; revenue: number; items: number }> = {};
    filteredOrders.forEach(order => {
      const d = new Date(order.createdAt).toLocaleDateString("en-IN");
      if (!map[d]) map[d] = { date: d, orders: 0, revenue: 0, items: 0 };
      map[d].orders += 1;
      map[d].revenue += order.total || 0;
      map[d].items += order.items.reduce((s: number, i: any) => s + i.quantity, 0);
    });
    return Object.values(map).sort((a, b) => {
      const [da, ma, ya] = a.date.split("/").map(Number);
      const [db, mb, yb] = b.date.split("/").map(Number);
      return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
    });
  }, [filteredOrders]);

  // ─── Monthly Revenue (for bar chart & AI prediction) ──────────────────────
  const monthlyRevenue = useMemo(() => {
    const map: Record<string, { month: string; revenue: number; orders: number; sortKey: number }> = {};
    // Use ALL orders for AI prediction training data (not just filtered)
    orders.forEach(order => {
      const d = new Date(order.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      if (!map[key]) map[key] = { month: label, revenue: 0, orders: 0, sortKey: d.getFullYear() * 12 + d.getMonth() };
      map[key].revenue += order.total || 0;
      map[key].orders += 1;
    });
    return Object.values(map).sort((a, b) => a.sortKey - b.sortKey);
  }, [orders]);

  // Monthly revenue for the selected time range only (for the bar chart display)
  const filteredMonthlyRevenue = useMemo(() => {
    const map: Record<string, { month: string; revenue: number; orders: number; sortKey: number }> = {};
    filteredOrders.forEach(order => {
      const d = new Date(order.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      if (!map[key]) map[key] = { month: label, revenue: 0, orders: 0, sortKey: d.getFullYear() * 12 + d.getMonth() };
      map[key].revenue += order.total || 0;
      map[key].orders += 1;
    });
    return Object.values(map).sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredOrders]);

  // ─── Most Selling Category ────────────────────────────────────────────────
  const mostSellingCategory = useMemo(() => {
    if (!categoryPieData.length) return "-";
    return categoryPieData[0].name;
  }, [categoryPieData]);

  // ─── Most Selling Brand ───────────────────────────────────────────────────
  const mostSellingBrand = useMemo(() => {
    if (!brandPieData.length) return "-";
    return brandPieData[0].name;
  }, [brandPieData]);

  // ─── AI/ML Prediction ─────────────────────────────────────────────────────
  const aiPrediction = useMemo(() => {
    const revenues = monthlyRevenue.map(m => m.revenue);
    return predictNextMonth(revenues);
  }, [monthlyRevenue]);

  // Future prediction chart data (show historical months + predicted future months based on selected range)
  const predictionChartData = useMemo(() => {
    // Show historical data matching the selected time range
    const historical = filteredMonthlyRevenue.map(m => ({
      month: m.month,
      revenue: m.revenue,
      predicted: null as number | null,
    }));
    
    const revenues = monthlyRevenue.map(m => m.revenue);
    // Predict exactly as many months as the selected time range
    const futurePredictions = predictMultipleMonths(revenues, months);
    
    if (futurePredictions.length > 0) {
      for (let i = 0; i < futurePredictions.length; i++) {
        const nextDate = new Date(now);
        nextDate.setMonth(nextDate.getMonth() + i + 1);
        historical.push({
          month: nextDate.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
          revenue: null as any,
          predicted: futurePredictions[i],
        });
      }
    }
    return historical;
  }, [monthlyRevenue, filteredMonthlyRevenue, months, now]);


  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm space-y-6 sm:space-y-8 overflow-x-hidden">
      {/* Header + Time Range Toggle */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📊 Sales Data Visualization</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">AI-powered analytics & predictions</p>
        </div>
        <div className="sm:ml-auto flex flex-wrap gap-2">
          {TIME_RANGES.map(r => (
            <button
              key={r.value}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border transition-all duration-200 ${months === r.value
                ? "bg-blue-500 text-white shadow-md border-blue-500"
                : "bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                }`}
              onClick={() => setMonths(r.value)}
              aria-pressed={months === r.value}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Value Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Customers */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-5 rounded-xl shadow-sm text-center cursor-pointer group transition-transform duration-200 hover:scale-105 border border-blue-100">
          <div className="text-xl sm:text-3xl font-bold text-blue-700">{numCustomers}</div>
          <div className="text-gray-600 text-xs sm:text-sm mt-1">Customers</div>
        </div>

        {/* Orders */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-5 rounded-xl shadow-sm text-center cursor-pointer group transition-transform duration-200 hover:scale-105 border border-green-100">
          <div className="text-xl sm:text-3xl font-bold text-green-700">{numOrders}</div>
          <div className="text-gray-600 text-xs sm:text-sm mt-1">Orders</div>
        </div>

        {/* Items Sold */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 p-3 sm:p-5 rounded-xl shadow-sm text-center cursor-pointer group transition-transform duration-200 hover:scale-105 border border-amber-100">
          <div className="text-xl sm:text-3xl font-bold text-amber-700">{numItems}</div>
          <div className="text-gray-600 text-xs sm:text-sm mt-1">Items Sold</div>
        </div>

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-5 rounded-xl shadow-sm text-center cursor-pointer group transition-transform duration-200 hover:scale-105 border border-purple-100">
          <div className="text-lg sm:text-3xl font-bold text-purple-700">{formatCurrency(totalSales)}</div>
          <div className="text-gray-600 text-xs sm:text-sm mt-1">Total Revenue</div>
        </div>

        {/* Avg Order Value */}
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-3 sm:p-5 rounded-xl shadow-sm text-center cursor-pointer group transition-transform duration-200 hover:scale-105 border border-pink-100">
          <div className="text-lg sm:text-3xl font-bold text-pink-700">{formatCurrency(avgOrderValue)}</div>
          <div className="text-gray-600 text-xs sm:text-sm mt-1">Avg Order Value</div>
        </div>
      </div>

      {/* ─── Pie Charts Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Sales Pie */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Sales by Category</h3>
          {categoryPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={40}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    isAnimationActive={true}
                  >
                    {categoryPieData.map((_, idx) => (
                      <Cell key={`cat-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any, name: string) => [`${value} units`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                  🏆 Top Category: {mostSellingCategory}
                </span>
              </div>
            </>
          ) : (
            <NoDataMessage message="No category data for selected range" />
          )}
        </div>

        {/* Brand Sales Pie */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Sales by Brand</h3>
          {brandPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={brandPieData}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={40}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    isAnimationActive={true}
                  >
                    {brandPieData.map((_, idx) => (
                      <Cell key={`brand-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any, name: string) => [formatCurrency(value), name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-2">
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                  🏆 Top Brand: {mostSellingBrand}
                </span>
              </div>
            </>
          ) : (
            <NoDataMessage message="No brand data for selected range" />
          )}
        </div>
      </div>

      {/* ─── Daily Order Growth Chart ────────────────────────────────────── */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">📈 Daily Order Growth & Revenue</h3>
        {dailyGrowth.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={dailyGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId={0} tick={{ fontSize: 11 }} />
              <YAxis yAxisId={1} orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: any, name: string) =>
                  name === "Revenue" ? [formatCurrency(value), name] : [value, name]
                }
              />
              <Legend />
              <Bar dataKey="orders" fill="#3b82f6" name="Orders" yAxisId={0} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue" yAxisId={1} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <NoDataMessage message="No daily data for selected range" />
        )}
      </div>

      {/* ─── Monthly Revenue Bar Chart ───────────────────────────────────── */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">📊 Monthly Revenue</h3>
        {filteredMonthlyRevenue.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredMonthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: any, name: string) => name === "Revenue" ? [formatCurrency(value), name] : [value, name]} />
              <Legend />
              <Bar dataKey="revenue" fill="#6366f1" name="Revenue" radius={[6, 6, 0, 0]} />
              <Bar dataKey="orders" fill="#a78bfa" name="Orders" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <NoDataMessage message="No monthly data for selected range" />
        )}
      </div>

      {/* ─── Brand Revenue Breakdown ─────────────────────────────────────── */}
      {brandPieData.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">🏷️ Brand Revenue Ranking</h3>
          <ResponsiveContainer width="100%" height={Math.max(200, brandPieData.length * 50)}>
            <BarChart data={brandPieData} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={(value: any) => [formatCurrency(value), "Revenue"]} />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[0, 6, 6, 0]}>
                {brandPieData.map((_, idx) => (
                  <Cell key={`bar-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ─── AI/ML Prediction Section ─────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-2xl">🤖</span>
          <h3 className="font-bold text-lg text-gray-900">AI Sales Prediction</h3>
          <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
            ML-Powered
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          {/* Predicted Sales */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm text-center border border-indigo-100 transition-transform duration-200 hover:scale-105">
            <div className="text-xs sm:text-sm text-gray-500 mb-2">Predicted Next Month Sales</div>
            <div className="text-xl sm:text-3xl font-bold text-indigo-700">{formatCurrency(aiPrediction.predictedSales)}</div>
          </div>

          {/* Growth Rate */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm text-center border border-indigo-100 transition-transform duration-200 hover:scale-105">
            <div className="text-xs sm:text-sm text-gray-500 mb-2">Predicted Growth Rate</div>
            <div className={`text-xl sm:text-3xl font-bold ${aiPrediction.growthRate >= 0 ? "text-green-600" : "text-red-500"}`}>
              {aiPrediction.growthRate >= 0 ? "↑" : "↓"} {Math.abs(aiPrediction.growthRate)}%
            </div>
          </div>

          {/* Confidence */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm text-center border border-indigo-100 transition-transform duration-200 hover:scale-105">
            <div className="text-xs sm:text-sm text-gray-500 mb-2">Prediction Confidence</div>
            <div className="text-xl sm:text-3xl font-bold text-amber-600">{aiPrediction.confidence}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${aiPrediction.confidence >= 70 ? "bg-green-500" :
                  aiPrediction.confidence >= 40 ? "bg-amber-500" : "bg-red-400"
                  }`}
                style={{ width: `${aiPrediction.confidence}%` }}
              />
            </div>
          </div>
        </div>

        {/* Prediction vs Actual Chart */}
        {predictionChartData.length > 1 && (
          <div className="bg-white rounded-xl p-4 border border-indigo-100 mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Revenue Trend & Future Prediction</h4>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={predictionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any, name: string) => [value ? formatCurrency(value) : "—", name]} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#e0e7ff" name="Actual Revenue" strokeWidth={2} />
                <Area type="monotone" dataKey="predicted" stroke="#ec4899" fill="#fce7f3" name="AI Prediction" strokeWidth={2} strokeDasharray="8 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Info Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 shadow-sm text-center border border-green-100">
            <div className="text-lg font-bold text-green-700">{formatCurrency(totalSales)}</div>
            <div className="text-gray-600 text-sm">Revenue (Selected Range)</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm text-center border border-blue-100">
            <div className="text-lg font-bold text-blue-700 capitalize">{mostSellingCategory}</div>
            <div className="text-gray-600 text-sm">Most Selling Category</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm text-center border border-purple-100">
            <div className="text-lg font-bold text-purple-700">{mostSellingBrand}</div>
            <div className="text-gray-600 text-sm">Most Selling Brand</div>
          </div>
        </div>

        <div className="text-xs text-gray-400 text-center mt-3">
          <span className="font-medium">Model:</span> {aiPrediction.method}
        </div>
      </div>

      {/* ─── AI Chatbot ──────────────────────────────────────────────── */}
      <SalesChatbot
        salesData={{
          totalOrders: numOrders,
          totalRevenue: totalSales,
          totalItems: numItems,
          totalCustomers: numCustomers,
          avgOrderValue,
          monthlyRevenue: monthlyRevenue.map(m => ({ month: m.month, revenue: m.revenue, orders: m.orders })),
          categoryBreakdown: categoryPieData,
          productBreakdown: brandPieData,
          dailyGrowth: dailyGrowth.map(d => ({ date: d.date, orders: d.orders, revenue: d.revenue })),
        }}
        allOrders={orders}
      />
    </div>
  );
};

export default DataVisualization;
