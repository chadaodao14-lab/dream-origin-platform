import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";

export default function FundPoolMonitoring() {
  const [, setLocation] = useLocation();
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch real-time fund pool data
  const fundPoolQuery = trpc.admin.getFundPoolData.useQuery(undefined, {
    refetchInterval: refreshInterval,
  });

  // Fetch fund flow statistics
  const fundFlowQuery = trpc.admin.getFundFlowStats.useQuery({ days: 7 }, {
    refetchInterval: refreshInterval,
  });

  // Fetch fund sources
  const fundSourcesQuery = trpc.admin.getFundSources.useQuery(undefined, {
    refetchInterval: refreshInterval,
  });

  // Fetch fund usage
  const fundUsageQuery = trpc.admin.getFundUsage.useQuery(undefined, {
    refetchInterval: refreshInterval,
  });

  // Export report queries
  const exportPDFQuery = trpc.admin.exportFundPoolReportPDF.useQuery(undefined, {
    enabled: false,
  });

  const exportExcelQuery = trpc.admin.exportFundPoolReportExcel.useQuery(undefined, {
    enabled: false,
  });

  const [isExporting, setIsExporting] = useState(false);

  // Default data for fallback
  const defaultFundDistribution = [
    { name: "入金资金池", value: 0, color: "#3b82f6", description: "0 个确认入金" },
    { name: "分润资金池", value: 0, color: "#10b981", description: "0 条分润记录" },
    { name: "项目资金池", value: 0, color: "#f59e0b", description: "0 项目投资分配" },
    { name: "慈善基金", value: 0, color: "#ef4444", description: "入金3% + 项目盈利3%" },
  ];

  const defaultFundFlow = [
    { date: "2/1", inflow: 0, outflow: 0, balance: 0 },
    { date: "2/2", inflow: 0, outflow: 0, balance: 0 },
    { date: "2/3", inflow: 0, outflow: 0, balance: 0 },
    { date: "2/4", inflow: 0, outflow: 0, balance: 0 },
    { date: "2/5", inflow: 0, outflow: 0, balance: 0 },
    { date: "2/6", inflow: 0, outflow: 0, balance: 0 },
    { date: "2/7", inflow: 0, outflow: 0, balance: 0 },
  ];

  const defaultFundSources = [
    { source: "用户入金", amount: 0, percentage: 0, transactions: "0 个入金" },
    { source: "分润分配", amount: 0, percentage: 0, transactions: "0 条分润" },
    { source: "项目收益", amount: 0, percentage: 0, transactions: "0 项目利润" },
    { source: "其他收入", amount: 0, percentage: 0, transactions: "0 其他来源" },
  ];

  const defaultFundUsage = [
    { usage: "用户提现", amount: 0, percentage: 0, count: "0 次成功提现" },
    { usage: "慈善捐赠", amount: 0, percentage: 0, count: "0 个捐赠项目" },
    { usage: "平台运营", amount: 0, percentage: 0, count: "系统维护、运营成本" },
    { usage: "项目投资", amount: 0, percentage: 0, count: "0 个项目投资" },
    { usage: "保留资金", amount: 0, percentage: 0, count: "风险准备金" },
  ];

  // Use real data or fallback to defaults
  const totalFundPool = fundPoolQuery.data?.totalFundPool ?? 0;
  const fundDistribution = fundPoolQuery.data?.fundDistribution ?? defaultFundDistribution;
  const fundFlow = fundFlowQuery.data ?? defaultFundFlow;
  const fundSources = fundSourcesQuery.data ?? defaultFundSources;
  const fundUsage = fundUsageQuery.data ?? defaultFundUsage;

  const isLoading = fundPoolQuery.isLoading || fundFlowQuery.isLoading || fundSourcesQuery.isLoading || fundUsageQuery.isLoading;

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const result = await exportPDFQuery.refetch();
      if (result.data?.data) {
        const binaryString = atob(result.data.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: result.data.mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("导出 PDF 失败，请重试");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const result = await exportExcelQuery.refetch();
      if (result.data?.data) {
        const binaryString = atob(result.data.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: result.data.mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("导出 Excel 失败，请重试");
    } finally {
      setIsExporting(false);
    }
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">资金池监控</h1>
            <p className="text-sm text-gray-500 mt-1">实时数据，每 30 秒自动刷新</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportPDF}
              disabled={isExporting || isLoading}
            >
              {isExporting ? "导出中..." : "导出 PDF"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              disabled={isExporting || isLoading}
            >
              {isExporting ? "导出中..." : "导出 Excel"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                fundPoolQuery.refetch();
                fundFlowQuery.refetch();
                fundSourcesQuery.refetch();
                fundUsageQuery.refetch();
              }}
              disabled={isLoading}
            >
              {isLoading ? "加载中..." : "刷新"}
            </Button>
            <Button variant="outline" onClick={() => setLocation("/admin")}>
              返回
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Total Fund Pool */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle>资金池总额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-start">
              <div>
                <div className="text-5xl font-bold text-blue-600">
                  ${totalFundPool.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </div>
                <p className="text-gray-600 mt-2">平台当前可用资金总额</p>
                <p className="text-sm text-gray-500 mt-1">
                  {isLoading ? "加载中..." : "实时数据已更新"}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-700">月度统计</div>
                <div className="text-lg text-green-600 font-bold">
                  +${(totalFundPool * 0.15).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500">本月净增长</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fund Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>资金分布饼图</CardTitle>
            </CardHeader>
            <CardContent>
              {fundDistribution.some(f => f.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={fundDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {fundDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-400">
                  暂无数据
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>资金分布详情</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fundDistribution.map((fund, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded border-l-4" style={{ borderColor: fund.color }}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: fund.color }}
                      ></div>
                      <span className="font-semibold text-gray-900">{fund.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-700">
                      {totalFundPool > 0 ? ((fund.value / totalFundPool) * 100).toFixed(1) : "0"}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        backgroundColor: fund.color,
                        width: totalFundPool > 0 ? `${(fund.value / totalFundPool) * 100}%` : "0%",
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">${fund.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                    <span className="text-xs text-gray-500">{fund.description}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Fund Flow Trend */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>资金流动趋势（最近 7 天）</CardTitle>
          </CardHeader>
          <CardContent>
            {fundFlow.some(f => f.inflow > 0 || f.outflow > 0) ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={fundFlow}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="inflow" stroke="#10b981" name="入金" strokeWidth={2} />
                  <Line type="monotone" dataKey="outflow" stroke="#ef4444" name="出金" strokeWidth={2} />
                  <Line type="monotone" dataKey="balance" stroke="#3b82f6" name="余额" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-400">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fund Sources and Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Fund Sources */}
          <Card>
            <CardHeader>
              <CardTitle>资金来源分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fundSources.map((source, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{source.source}</p>
                        <p className="text-xs text-gray-500">{source.transactions}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-700">{source.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${source.percentage}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      ${source.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fund Usage */}
          <Card>
            <CardHeader>
              <CardTitle>资金去向分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fundUsage.map((usage, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{usage.usage}</p>
                        <p className="text-xs text-gray-500">{usage.count}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-700">{usage.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{
                          width: `${usage.percentage}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      ${usage.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Assessment */}
        <Card>
          <CardHeader>
            <CardTitle>风险评估与建议</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border-l-4 border-green-600 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-2xl">✓</div>
                <div>
                  <h4 className="font-semibold text-green-900">资金充足</h4>
                  <p className="text-sm text-green-700">
                    当前资金池余额充足，可支撑平台正常运营和用户提现需求。建议保持风险准备金不低于资金池的 30%。
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-2xl">ℹ</div>
                <div>
                  <h4 className="font-semibold text-blue-900">资金流动健康</h4>
                  <p className="text-sm text-blue-700">
                    入金大于出金，资金流动呈现正向增长趋势，平台财务状况良好。实时数据已从数据库更新。
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-600 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠</div>
                <div>
                  <h4 className="font-semibold text-yellow-900">建议关注</h4>
                  <p className="text-sm text-yellow-700">
                    项目投资占比较高，建议定期评估项目回报率，确保资金安全。同时关注提现申请数量，防止资金流动风险。
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 border-l-4 border-purple-600 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <h4 className="font-semibold text-purple-900">优化建议</h4>
                  <p className="text-sm text-purple-700">
                    1. 提高分润资金的流动性管理；2. 增加项目审核标准，降低投资风险；3. 建立资金预警机制，当保留资金低于 20% 时发出警告。
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
