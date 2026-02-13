import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function StatisticsReports() {
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState("month");

  // Mock data for charts
  const dailyData = [
    { date: "2/1", users: 45, deposits: 12, commissions: 3600 },
    { date: "2/2", users: 52, deposits: 15, commissions: 4500 },
    { date: "2/3", users: 48, deposits: 10, commissions: 3000 },
    { date: "2/4", users: 61, deposits: 18, commissions: 5400 },
    { date: "2/5", users: 55, deposits: 14, commissions: 4200 },
    { date: "2/6", users: 67, deposits: 20, commissions: 6000 },
    { date: "2/7", users: 72, deposits: 22, commissions: 6600 },
  ];

  const commissionByLevel = [
    { level: "1级", amount: 45000 },
    { level: "2级", amount: 18000 },
    { level: "3级", amount: 15750 },
    { level: "4级", amount: 13500 },
    { level: "5级", amount: 11250 },
    { level: "6级", amount: 9000 },
    { level: "7级", amount: 7875 },
    { level: "8级", amount: 6750 },
    { level: "9级", amount: 5625 },
  ];

  const revenueBreakdown = [
    { name: "入金", value: 90000 },
    { name: "分润", value: 132750 },
    { name: "项目收益", value: 45000 },
    { name: "慈善基金", value: 15234 },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  const userStats = {
    totalUsers: 342,
    newUsers: 45,
    activeUsers: 298,
    inactiveUsers: 44,
    churnRate: "12.8%",
  };

  const incomeStats = {
    totalDeposits: 90000,
    totalCommissions: 132750,
    projectIncome: 45000,
    charityFund: 15234,
    totalIncome: 283000,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">数据统计报表</h1>
          <Button variant="outline" onClick={() => setLocation("/admin")}>
            返回
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Time Range Selector */}
        <div className="mb-8 flex gap-2">
          <Button
            variant={timeRange === "week" ? "default" : "outline"}
            onClick={() => setTimeRange("week")}
          >
            周统计
          </Button>
          <Button
            variant={timeRange === "month" ? "default" : "outline"}
            onClick={() => setTimeRange("month")}
          >
            月统计
          </Button>
          <Button
            variant={timeRange === "year" ? "default" : "outline"}
            onClick={() => setTimeRange("year")}
          >
            年统计
          </Button>
        </div>

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">总用户数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{userStats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">新增用户</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{userStats.newUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">活跃用户</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{userStats.activeUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">不活跃用户</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{userStats.inactiveUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">流失率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{userStats.churnRate}</div>
            </CardContent>
          </Card>
        </div>

        {/* Income Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">总入金</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">${incomeStats.totalDeposits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">总分润</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${incomeStats.totalCommissions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">项目收益</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">${incomeStats.projectIncome}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">慈善基金</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">${incomeStats.charityFund}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">总收入</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${incomeStats.totalIncome}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Trend */}
          <Card>
            <CardHeader>
              <CardTitle>每日趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#3b82f6" name="新增用户" />
                  <Line type="monotone" dataKey="deposits" stroke="#10b981" name="入金笔数" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>收入分布</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: $${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Commission by Level */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>各层级分润统计</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={commissionByLevel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#3b82f6" name="分润金额" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Growth Table */}
          <Card>
            <CardHeader>
              <CardTitle>用户增长统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">日均新增用户</span>
                  <span className="font-semibold">6.4</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">周增长率</span>
                  <span className="font-semibold text-green-600">+18.5%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">月增长率</span>
                  <span className="font-semibold text-green-600">+42.3%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">活跃度</span>
                  <span className="font-semibold text-blue-600">87.1%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Income Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>收入汇总统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">平均入金金额</span>
                  <span className="font-semibold">$300.00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">平均分润/用户</span>
                  <span className="font-semibold">$388.01</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">分润占比</span>
                  <span className="font-semibold text-green-600">46.9%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">慈善占比</span>
                  <span className="font-semibold text-red-600">5.4%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
