import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Mine() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: asset, isLoading: assetLoading } = trpc.asset.getAsset.useQuery();
  const { data: profile, isLoading: profileLoading } = trpc.user.getProfile.useQuery();

  if (assetLoading || profileLoading) {
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
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">我的账户</h1>
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
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* User Info Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle>账户信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">用户名</p>
                <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">邮箱</p>
                <p className="text-lg font-semibold text-gray-900">{user?.email || "未设置"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">邀请码</p>
                <p className="text-lg font-semibold text-gray-900">{profile?.inviteCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">账户状态</p>
                <p className={`text-lg font-semibold ${profile?.isActivated ? "text-green-600" : "text-yellow-600"}`}>
                  {profile?.isActivated ? "已激活" : "未激活"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asset Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">可用余额</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                ${asset?.availableBalance?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-gray-500 mt-1">USD</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">冻结余额</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                ${asset?.frozenBalance?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-gray-500 mt-1">USD</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">累计佣金</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${asset?.totalCommission?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-gray-500 mt-1">USD</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">本月收入</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                ${asset?.monthlyIncome?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-gray-500 mt-1">USD</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                className="w-full"
                onClick={() => setLocation("/deposit")}
                disabled={profile?.isActivated ?? false}
              >
                {profile?.isActivated ? "已激活" : "入金激活"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/mine")}
              >
                提现
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/mine")}
              >
                转账
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-8">
              <p>暂无活动记录</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
