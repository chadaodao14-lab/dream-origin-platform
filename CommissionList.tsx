import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function CommissionList() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const { data: commissions, isLoading } = trpc.commission.getList.useQuery({ page, pageSize: 10 });

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
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">分润记录</h1>
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>
            返回
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>分润统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">总分润数</p>
                <p className="text-2xl font-bold text-blue-600">{commissions?.total || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">总分润金额</p>
                <p className="text-2xl font-bold text-green-600">
                  ${
                    commissions?.list
                      ?.reduce((sum: number, c: any) => sum + parseFloat((c.amount || "0").toString()), 0)
                      .toFixed(2) || "0.00"
                  }
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">当前页数</p>
                <p className="text-2xl font-bold text-purple-600">{page}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission List */}
        <Card>
          <CardHeader>
            <CardTitle>分润明细</CardTitle>
          </CardHeader>
          <CardContent>
            {commissions?.list && commissions.list.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">来源用户</th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">层级</th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">金额</th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">状态</th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.list.map((commission: any) => (
                      <tr key={commission.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">用户 #{commission.sourceUserId}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                            第{commission.level}层
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-green-600">
                          ${parseFloat((commission.amount || "0").toString()).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              commission.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : commission.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {commission.status === "confirmed"
                              ? "已确认"
                              : commission.status === "pending"
                                ? "待确认"
                                : "已拒绝"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(commission.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>暂无分润记录</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {commissions && commissions.total > 0 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              上一页
            </Button>
            <span className="px-4 py-2 text-gray-600">
              第 {page} 页，共 {Math.ceil((commissions.total || 0) / 10)} 页
            </span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil((commissions.total || 0) / 10)}
              onClick={() => setPage(page + 1)}
            >
              下一页
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
