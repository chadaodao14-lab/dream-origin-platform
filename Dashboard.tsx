import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: asset, isLoading: assetLoading } = trpc.asset.getAsset.useQuery();
  const { data: agentSummary, isLoading: agentLoading } = trpc.agent.getSummary.useQuery();

  if (assetLoading || agentLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">梦之源平台</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{user?.name}</span>
            <Button
              variant="outline"
              onClick={() => {
                logout();
                setLocation("/login");
              }}
            >
              退出登录
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">欢迎回来，{user?.name}！</h2>
          <p className="text-gray-600">管理您的资产、代理团队和投资项目</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">可用余额</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                ${asset?.availableBalance?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-gray-500 mt-1">USD</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">累计佣金</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${asset?.totalCommission?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-gray-500 mt-1">USD</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">直推人数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{agentSummary?.directCount}</div>
              <p className="text-xs text-gray-500 mt-1">最多5人</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">团队总人数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{agentSummary?.teamTotal || 0}</div>
              <p className="text-xs text-gray-500 mt-1">人</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/deposit")}>
            <CardHeader>
              <CardTitle className="text-lg">入金充值</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">提交300 USD入金申请，激活账户并获得分润</p>
              <Button className="mt-4 w-full">去充值</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/agent")}>
            <CardHeader>
              <CardTitle className="text-lg">代理中心</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">查看您的邀请码、团队信息和推广海报</p>
              <Button className="mt-4 w-full">进入中心</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/commission")}>
            <CardHeader>
              <CardTitle className="text-lg">分润记录</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">查看详细的分润记录和佣金明细</p>
              <Button className="mt-4 w-full">查看记录</Button>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/mine")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">我的账户</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600">资产管理</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/projects")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">创业项目</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600">投资机会</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/charity")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">慈善公益</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600">社会责任</p>
            </CardContent>
          </Card>

          {user?.role === "admin" && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/admin")}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">管理后台</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">平台管理</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
