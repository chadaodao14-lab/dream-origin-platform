import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState } from "react";
import { Loader2, Search, CheckCircle, XCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function DepositManagement() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<string>("pending");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: deposits, isLoading, refetch } = trpc.admin.getDepositList.useQuery({
    status: status || undefined,
    page,
    pageSize: 10,
  });

  const confirmMutation = trpc.deposit.confirm.useMutation({
    onSuccess: () => {
      toast.success("入金已确认，分润已生成");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "确认失败");
    },
  });

  const rejectMutation = trpc.deposit.reject.useMutation({
    onSuccess: () => {
      toast.success("入金已拒绝");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "拒绝失败");
    },
  });

  const handleConfirm = (depositId: number) => {
    if (confirm("确认此入金申请？确认后将触发分润计算和资金拆分。")) {
      confirmMutation.mutate({ depositId });
    }
  };

  const handleReject = (depositId: number) => {
    const remark = prompt("请输入拒绝原因：");
    if (remark !== null) {
      rejectMutation.mutate({ depositId, remark });
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">入金管理</h1>
          <Button variant="outline" onClick={() => setLocation("/admin")}>
            返回
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">待审核</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {deposits?.list?.filter((d: any) => d.status === "pending").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">已确认</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {deposits?.list?.filter((d: any) => d.status === "confirmed").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">已拒绝</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {deposits?.list?.filter((d: any) => d.status === "rejected").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">总金额</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                ${
                  deposits?.list
                    ?.reduce((sum: number, d: any) => sum + parseFloat((d.amount || "0").toString()), 0)
                    .toFixed(2) || "0.00"
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>筛选</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部</option>
                  <option value="pending">待审核</option>
                  <option value="confirmed">已确认</option>
                  <option value="rejected">已拒绝</option>
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">搜索</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <Input
                    placeholder="搜索用户或交易哈希"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposits Table */}
        <Card>
          <CardHeader>
            <CardTitle>入金列表</CardTitle>
          </CardHeader>
          <CardContent>
            {deposits?.list && deposits.list.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">用户</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">金额</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">交易哈希</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">状态</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">提交时间</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.list.map((deposit: any) => (
                      <tr key={deposit.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">#{deposit.id}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          <div className="font-medium">用户 #{deposit.userId}</div>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-green-600">
                          ${parseFloat((deposit.amount || "0").toString()).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                          {deposit.txHash?.substring(0, 20)}...
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-2">
                            {deposit.status === "pending" && (
                              <>
                                <Clock size={16} className="text-yellow-600" />
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                                  待审核
                                </span>
                              </>
                            )}
                            {deposit.status === "confirmed" && (
                              <>
                                <CheckCircle size={16} className="text-green-600" />
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                                  已确认
                                </span>
                              </>
                            )}
                            {deposit.status === "rejected" && (
                              <>
                                <XCircle size={16} className="text-red-600" />
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                                  已拒绝
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(deposit.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {deposit.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleConfirm(deposit.id)}
                                disabled={confirmMutation.isPending}
                              >
                                确认
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(deposit.id)}
                                disabled={rejectMutation.isPending}
                              >
                                拒绝
                              </Button>
                            </div>
                          )}
                          {deposit.status !== "pending" && (
                            <span className="text-gray-500 text-xs">已处理</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>暂无入金记录</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {deposits && deposits.total > 0 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              上一页
            </Button>
            <span className="px-4 py-2 text-gray-600">
              第 {page} 页，共 {Math.ceil((deposits.total || 0) / 10)} 页
            </span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil((deposits.total || 0) / 10)}
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
