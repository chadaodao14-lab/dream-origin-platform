import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Loader2, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.admin.getStats.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">管理员后台</h1>
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>
            返回用户中心
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">总用户数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">总入金数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.totalDeposits || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">入金总额</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                ${stats?.totalDepositAmount?.toFixed(2) || "0.00"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">待审核</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats?.pendingDeposits || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Management Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Deposit Management */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                入金管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                审核用户入金申请，确认后自动触发分润计算和资金拆分。
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setLocation("/admin/deposits")}
                  className="flex-1"
                >
                  管理入金
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                用户管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                查看所有用户信息，管理用户激活状态和角色权限。
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setLocation("/admin/users")}
                  className="flex-1"
                >
                  管理用户
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Project Management */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                项目管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                审批创业项目，管理项目状态和里程碑进度。
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setLocation("/admin/projects")}
                  className="flex-1"
                >
                  管理项目
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Management */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🏧</span>
                提现管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                处理用户提现申请，生成交易哈希或拒绝提现。
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setLocation("/admin/withdrawals")}
                  className="flex-1"
                >
                  管理提现
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Charity Management */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">❤️</span>
                慈善基金
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                管理慈善基金余额，创建捐赠记录和统计报表。
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setLocation("/admin/charity")}
                  className="flex-1"
                >
                  管理慈善
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics & Reports */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📈</span>
                数据统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                查看平台数据统计、分润统计和收入报表。
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setLocation("/admin/reports")}
                  className="flex-1"
                >
                  查看报表
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Fund Pool Monitoring */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                资金池监控
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                监控资金分布、流动趋势、来源去向分析。
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setLocation("/admin/funds")}
                  className="flex-1"
                >
                  查看资金池
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⚙️</span>
                系统设置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                配置平台参数、查看操作日志、管理系统设置。
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setLocation("/admin/settings")}
                  className="flex-1"
                >
                  系统设置
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Permission Management */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🔐</span>
                权限管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                管理用户角色权限、编辑权限矩阵、创建新角色。
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setLocation("/admin/permissions")}
                  className="flex-1"
                >
                  权限管理
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
                <div>
                  <p className="font-semibold text-gray-900">待审核入金</p>
                  <p className="text-sm text-gray-600">{stats?.pendingDeposits || 0} 个待处理</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setLocation("/admin/deposits")}
                >
                  立即处理
                </Button>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
                <div>
                  <p className="font-semibold text-gray-900">平台概览</p>
                  <p className="text-sm text-gray-600">
                    用户: {stats?.totalUsers || 0} | 入金: ${stats?.totalDepositAmount?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                >
                  查看详情
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
