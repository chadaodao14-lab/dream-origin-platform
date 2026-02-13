import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AgentCenter() {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading: summaryLoading } = trpc.agent.getSummary.useQuery();
  const { data: teamMembers, isLoading: membersLoading } = trpc.agent.getTeamMembers.useQuery({ page: 1, pageSize: 10 });
  const { data: performance, isLoading: performanceLoading } = trpc.agent.getTeamPerformance.useQuery();

  if (summaryLoading || membersLoading || performanceLoading) {
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
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">代理中心</h1>
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>
            返回
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">邀请码</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 font-mono">{summary?.inviteCode}</div>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(summary?.inviteCode || "");
                }}
              >
                复制
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">直推人数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{summary?.directCount}</div>
              <p className="text-xs text-gray-500 mt-1">最多5人</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">团队总人数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary?.teamTotal || 0}</div>
              <p className="text-xs text-gray-500 mt-1">人</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">团队业绩</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">${summary?.teamPerformance?.toFixed(2) || "0.00"}</div>
              <p className="text-xs text-gray-500 mt-1">USD</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>团队业绩分析</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">一级业绩</p>
                <p className="text-2xl font-bold text-blue-600">${performance?.level1Performance?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">二级业绩</p>
                <p className="text-2xl font-bold text-green-600">${performance?.level2Performance?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">三级业绩</p>
                <p className="text-2xl font-bold text-purple-600">${performance?.level3Performance?.toFixed(2) || "0.00"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upline Info */}
        {summary?.inviterInfo && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>上级信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div>
                  <p className="font-semibold text-gray-900">{summary.inviterInfo.name}</p>
                  <p className="text-sm text-gray-600">ID: {summary.inviterInfo.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>直推成员</CardTitle>
          </CardHeader>
          <CardContent>
            {teamMembers?.list && teamMembers.list.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">用户名</th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">邮箱</th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">邀请码</th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">状态</th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">加入时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.list.map((member: any) => (
                      <tr key={member.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{member.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{member.email}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 font-mono">{member.inviteCode}</td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              member.isActivated ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {member.isActivated ? "已激活" : "未激活"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>暂无直推成员</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
