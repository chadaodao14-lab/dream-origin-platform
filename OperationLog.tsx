import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useState } from "react";
import { Search, Download, Filter } from "lucide-react";
import { exportToCSV, exportToExcel } from "@/lib/dataExport";

export default function OperationLog() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterAdmin, setFilterAdmin] = useState("all");

  const operationLogs = [
    {
      id: 1,
      timestamp: "2026-02-12 14:30:45",
      admin: "Admin001",
      operation: "入金确认",
      target: "用户 ID: 123",
      details: "确认入金 $300，触发分润计算",
      status: "成功",
      ipAddress: "192.168.1.100",
    },
    {
      id: 2,
      timestamp: "2026-02-12 14:25:30",
      admin: "Admin002",
      operation: "用户禁用",
      target: "用户 ID: 456",
      details: "禁用违规用户账户",
      status: "成功",
      ipAddress: "192.168.1.101",
    },
    {
      id: 3,
      timestamp: "2026-02-12 14:20:15",
      admin: "Admin001",
      operation: "项目审批",
      target: "项目 ID: 789",
      details: "批准创业项目投资申请",
      status: "成功",
      ipAddress: "192.168.1.100",
    },
    {
      id: 4,
      timestamp: "2026-02-12 14:15:00",
      admin: "Admin003",
      operation: "提现处理",
      target: "提现 ID: 1001",
      details: "处理用户提现申请，生成交易哈希",
      status: "成功",
      ipAddress: "192.168.1.102",
    },
    {
      id: 5,
      timestamp: "2026-02-12 14:10:30",
      admin: "Admin002",
      operation: "权限修改",
      target: "用户 ID: 234",
      details: "将用户角色从普通用户升级为代理",
      status: "成功",
      ipAddress: "192.168.1.101",
    },
    {
      id: 6,
      timestamp: "2026-02-12 14:05:15",
      admin: "Admin001",
      operation: "入金拒绝",
      target: "用户 ID: 567",
      details: "拒绝入金申请，返还资金",
      status: "成功",
      ipAddress: "192.168.1.100",
    },
    {
      id: 7,
      timestamp: "2026-02-12 14:00:00",
      admin: "Admin003",
      operation: "系统设置",
      target: "平台参数",
      details: "修改平台手续费参数",
      status: "成功",
      ipAddress: "192.168.1.102",
    },
    {
      id: 8,
      timestamp: "2026-02-12 13:55:45",
      admin: "Admin002",
      operation: "捐赠创建",
      target: "慈善基金",
      details: "创建慈善捐赠记录 $1,000",
      status: "成功",
      ipAddress: "192.168.1.101",
    },
  ];

  const operationTypes = [
    "all",
    "入金确认",
    "入金拒绝",
    "用户禁用",
    "用户激活",
    "项目审批",
    "提现处理",
    "权限修改",
    "系统设置",
    "捐赠创建",
  ];

  const admins = ["all", "Admin001", "Admin002", "Admin003"];

  const filteredLogs = operationLogs.filter((log) => {
    const matchesSearch =
      log.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.operation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || log.operation === filterType;
    const matchesAdmin = filterAdmin === "all" || log.admin === filterAdmin;

    return matchesSearch && matchesType && matchesAdmin;
  });

  const handleExportCSV = () => {
    const columns = [
      { key: "timestamp", label: "时间" },
      { key: "admin", label: "操作员" },
      { key: "operation", label: "操作类型" },
      { key: "target", label: "操作对象" },
      { key: "details", label: "操作详情" },
      { key: "status", label: "状态" },
      { key: "ipAddress", label: "IP 地址" },
    ];
    exportToCSV(filteredLogs, columns, { filename: "operation_logs" });
  };

  const handleExportExcel = () => {
    const columns = [
      { key: "timestamp", label: "时间" },
      { key: "admin", label: "操作员" },
      { key: "operation", label: "操作类型" },
      { key: "target", label: "操作对象" },
      { key: "details", label: "操作详情" },
      { key: "status", label: "状态" },
      { key: "ipAddress", label: "IP 地址" },
    ];
    exportToExcel(filteredLogs, columns, { filename: "operation_logs" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">操作日志</h1>
          <Button variant="outline" onClick={() => setLocation("/admin/settings")}>
            返回
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">总操作数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{operationLogs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">今日操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {operationLogs.filter((log) => log.timestamp.includes("2026-02-12")).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">活跃管理员</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {new Set(operationLogs.map((log) => log.admin)).size}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">成功率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">100%</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>筛选和搜索</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="搜索管理员、操作类型..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Operation Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有操作类型</option>
                {operationTypes.slice(1).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              {/* Admin Filter */}
              <select
                value={filterAdmin}
                onChange={(e) => setFilterAdmin(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有管理员</option>
                {admins.slice(1).map((admin) => (
                  <option key={admin} value={admin}>
                    {admin}
                  </option>
                ))}
              </select>

              {/* Export Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleExportCSV}
                >
                  <Download size={16} />
                  CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleExportExcel}
                >
                  <Download size={16} />
                  Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operation Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>操作日志列表（共 {filteredLogs.length} 条）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">时间</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">操作员</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">操作类型</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">操作对象</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">操作详情</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">状态</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">IP 地址</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{log.timestamp}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 font-medium">{log.admin}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {log.operation}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{log.target}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{log.details}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
