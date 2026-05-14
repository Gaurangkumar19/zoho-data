import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { classifyStatus, fmtCurrency, type Deal } from "@/lib/deals";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  TrendingUp, TrendingDown, Clock, DollarSign, 
  Target, Search as SearchIcon 
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from "recharts";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Dashboard — ZOHO DATA" }] }),
});

function DashboardPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      let allData: Deal[] = [];
      let from = 0;
      const limit = 1000;
      
      try {
        while (true) {
          const { data, error } = await supabase
            .from("deals")
            .select("*")
            .order("created_at", { ascending: false })
            .range(from, from + limit - 1);
          if (error) {
            console.warn("Supabase query limit reached, stopping at", allData.length);
            break;
          }
          if (!data || data.length === 0) break;
          allData = [...allData, ...data];
          if (data.length < limit) break;
          from += limit;
        }
      } catch (e) {
        console.warn("Error fetching all deals:", e);
      }
      return allData;
    },
  });

  const total = deals.length;
  const won = deals.filter((d) => classifyStatus(d) === "won");
  const lost = deals.filter((d) => classifyStatus(d) === "lost");
  const open = deals.filter((d) => classifyStatus(d) === "open");

  // Calculate avg probability (placeholder since we don't have actual probability data)
  const avgProbability = 36.6;

  // Calculate revenue (won deals)
  const totalRevenue = won.reduce((sum, d) => sum + (d.amount ?? 0), 0);

  // Deal status data for pie chart (Won, Lost, Open are the main ones)
  const pieData = [
    { name: "Won", value: won.length },
    { name: "Lost", value: lost.length },
    { name: "Open", value: open.length }
  ];

  // Colors for pie chart - bright and distinct!
  const COLORS = ['#00D4FF', '#FF6B6B', '#4ADE80'];

  // Pipeline distribution data
  const pipelineData = [
    { name: "DevIT", value: 13500 },
    { name: "Protaiga", value: 3200 },
    { name: "Deshwal", value: 1800 }
  ];

  // Monthly revenue data (placeholder) categorized by DevIT, Deshwal, and Protaiga
  const monthlyData = [
    { month: "Jan", DevIT: 500000, Deshwal: 400000, Protaiga: 300000 },
    { month: "Feb", DevIT: 350000, Deshwal: 250000, Protaiga: 200000 },
    { month: "Mar", DevIT: 650000, Deshwal: 500000, Protaiga: 350000 },
    { month: "Apr", DevIT: 450000, Deshwal: 400000, Protaiga: 250000 },
    { month: "May", DevIT: 400000, Deshwal: 300000, Protaiga: 200000 },
    { month: "Jun", DevIT: 550000, Deshwal: 450000, Protaiga: 300000 },
    { month: "Jul", DevIT: 600000, Deshwal: 500000, Protaiga: 300000 },
    { month: "Aug", DevIT: 700000, Deshwal: 550000, Protaiga: 350000 },
    { month: "Sep", DevIT: 500000, Deshwal: 450000, Protaiga: 300000 },
    { month: "Oct", DevIT: 750000, Deshwal: 600000, Protaiga: 350000 },
    { month: "Nov", DevIT: 600000, Deshwal: 500000, Protaiga: 350000 },
    { month: "Dec", DevIT: 850000, Deshwal: 650000, Protaiga: 400000 }
  ];

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="max-w-xl mx-auto">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400" />
          <Input
            placeholder="Search Account or Deal Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                navigate({ to: "/search", search: { q: searchQuery.trim() } });
              }
            }}
            className="pl-12 py-6 text-base bg-slate-900/70 border-cyan-500/30 text-cyan-100 placeholder:text-cyan-200/40 rounded-full shadow-lg shadow-cyan-500/10"
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: TrendingUp, label: "Total Deals", value: total.toLocaleString(), color: "cyan" as const, delay: 0 },
          { icon: TrendingUp, label: "Won Deals", value: won.length.toLocaleString(), color: "green" as const, delay: 100 },
          { icon: TrendingDown, label: "Lost Deals", value: lost.length.toLocaleString(), color: "red" as const, delay: 200 },
          { icon: Clock, label: "Pending", value: open.length.toLocaleString(), color: "yellow" as const, delay: 300 },
          { icon: DollarSign, label: "Revenue", value: `₹${totalRevenue.toLocaleString()}`, color: "cyan" as const, delay: 400 },
          { icon: Target, label: "Avg Probability", value: `${avgProbability}%`, color: "cyan" as const, delay: 500 }
        ].map((stat, index) => (
          <StatCard
            key={index}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            color={stat.color}
            delay={stat.delay}
          />
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Status */}
        <Card className="glass-card p-6 lg:col-span-1">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-cyan-100">Deal Status</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: "rgba(246, 250, 253, 0.95)", 
                    border: "1px solid rgba(0, 212, 255, 0.3)",
                    borderRadius: "8px",
                    color: "#A0E9FF"
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                />
                <span className="text-cyan-100 font-medium">
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Monthly Revenue */}
        <Card className="glass-card p-6 lg:col-span-1">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-cyan-100">Monthly Revenue</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorDevIT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDeshwal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProtaiga" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4ADE80" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a365d" />
                <XAxis 
                  dataKey="month" 
                  stroke="#A0E9FF" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#A0E9FF" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${(value/100000).toFixed(0)}L`}
                />
                <Tooltip 
                  formatter={(value, name) => [`₹${Number(value).toLocaleString()}`, name]}
                  contentStyle={{ 
                    background: "rgba(5, 18, 26, 0.95)", 
                    border: "1px solid rgba(0, 212, 255, 0.3)",
                    borderRadius: "8px",
                    color: "#A0E9FF"
                  }} 
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }} 
                  formatter={(value) => <span className="text-cyan-100">{value}</span>}
                />
                <Area 
                  type="monotone" 
                  dataKey="DevIT" 
                  stroke="#00D4FF" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorDevIT)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="Deshwal" 
                  stroke="#FF6B6B" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorDeshwal)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="Protaiga" 
                  stroke="#4ADE80" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorProtaiga)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pipeline Distribution */}
        <Card className="glass-card p-6 lg:col-span-1">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-cyan-100">Pipeline Distribution</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a365d" />
                <XAxis 
                  dataKey="name" 
                  stroke="#A0E9FF" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  stroke="#A0E9FF" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value/1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Value"]}
                  contentStyle={{ 
                    background: "rgba(5, 18, 26, 0.95)", 
                    border: "1px solid rgba(0, 212, 255, 0.3)",
                    borderRadius: "8px",
                    color: "#A0E9FF"
                  }} 
                />
                <Bar 
                  dataKey="value" 
                  fill="#00D4FF" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* All Deals Table */}
      <Card className="glass-card">
        <div className="px-6 py-4 border-b border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-100">All Deals ({total.toLocaleString()})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/50">
              <tr className="border-b border-cyan-500/20">
                <th className="px-6 py-3 text-left text-xs font-semibold text-cyan-200 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-cyan-200 uppercase tracking-wider">Deal Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-cyan-200 uppercase tracking-wider">Closing Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-cyan-200 uppercase tracking-wider">Account Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-cyan-200 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-cyan-200 uppercase tracking-wider">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/10">
              {deals.slice(0, 5).map((deal) => (
                <tr key={deal.id} className="hover:bg-cyan-500/5">
                  <td className="px-6 py-4 whitespace-nowrap text-cyan-100 font-medium">
                    {fmtCurrency(deal.amount, deal.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-cyan-100">
                    {deal.deal_name || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-cyan-200/70">
                    {deal.close_date || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-teal-glow">
                    {deal.account_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-cyan-200/70">
                    {deal.stage || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-cyan-200/70">
                    {classifyStatus(deal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  delay 
}: { 
  icon: any, 
  label: string, 
  value: string, 
  color: "cyan" | "green" | "red" | "yellow", 
  delay: number 
}) {
  const colorStyles = {
    cyan: "text-cyan-400 border-cyan-500/30 shadow-cyan-500/10",
    green: "text-green-400 border-green-500/30 shadow-green-500/10",
    red: "text-rose-400 border-rose-500/30 shadow-rose-500/10",
    yellow: "text-yellow-400 border-yellow-500/30 shadow-yellow-500/10"
  };

  const bgColors = {
    cyan: "bg-cyan-500/10",
    green: "bg-green-500/10",
    red: "bg-rose-500/10",
    yellow: "bg-yellow-500/10"
  };

  return (
    <Card 
      className="glass-card p-4 hover:scale-105 transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`h-10 w-10 rounded-full ${bgColors[color]} flex items-center justify-center ${colorStyles[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className={`text-3xl font-bold ${color === "red" ? "text-rose-400" : color === "green" ? "text-green-400" : "text-teal-glow"}`}>
        {value}
      </p>
      <p className="text-xs text-cyan-200/70 mt-1 uppercase tracking-wider">
        {label}
      </p>
    </Card>
  );
}
