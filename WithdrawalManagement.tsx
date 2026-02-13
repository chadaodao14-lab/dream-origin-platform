import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState } from "react";
import { Loader2, CheckCircle, Clock, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function WithdrawalManagement() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<string>("pending");
  const [page, setPage] = useState(1);
  const [txHash, setTxHash] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<number | null>(null);

  const { data: withdrawals, isLoading, refetch } = trpc.admin.getWithdrawalList.useQuery({
    status: status || undefined,
    page,
    pageSize: 10,
  });

  const processMutation = trpc.admin.processWithdrawal.useMutation({
    onSuccess: () => {
      toast.success("提现已处理");
      setTxHash("");
      setSelectedWithdrawal(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "处理失败");
    },
  });

  const rejectMutation = trpc.admin.rejectWithdrawal.useMutation({
    onSuccess: () => {
      toast.success("提现已拒绝");
      setSelectedWithdrawal(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "拒绝失败");
    },
  });

  const handleProcess = (withdrawalId: number) => {
    if (!txHash.trim()) {
      toast.error("请输入交易哈希");
      return;
    }
    processMutation.mutate({ withdrawalId, txHash });
  };

  const handleReject = (withdrawalId: number) => {
    const remark = prompt("请输入拒绝原因：");
    if (remark !== null) {
      rejectMutation.mutate({ withdrawalId, remark });
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
          <h1 className="text-2xl font-bold text-gray-900">提现管理</h1>
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
              <CardTitle className="text-sm font-medium text-gray-600">待处理</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {withdrawals?.list?.filter((w: any) => w.status === "pending").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">已处理</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {withdrawals?.list?.filter((w: any) => w.status === "completed").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">已拒绝</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {withdrawals?.list?.filter((w: any) => w.status === "rejected").length || 0}
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
                  withdrawals?.list
                    ?.reduce((sum: number, w: any) => sum + parseFloat((w.amount || "0").toString()), 0)
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
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              <option value="pending">待处理</option>
              <option value="completed">已处理</option>
              <option value="rejected">已拒绝</option>
            </select>
          </CardContent>
        </Card>

        {/* Withdrawals Table */}
        <Card>
          <CardHeader>
            <CardTitle>提现列表</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals?.list && withdrawals.list.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">用户</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">金额</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">钱包地址</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">状态</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">申请时间</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.list.map((withdrawal: any) => (
                      <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">#{withdrawal.id}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">用户 #{withdrawal.userId}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-green-600">
                          ${parseFloat((withdrawal.amount || "0").toString()).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono text-gray-600">
                          {withdrawal.walletAddress?.substring(0, 20)}...
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {withdrawal.status === "pending" && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                              待处理
                            </span>
                          )}
                          {withdrawal.status === "completed" && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                              已处理
                            </span>
                          )}
                          {withdrawal.status === "rejected" && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                              已拒绝
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(withdrawal.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {withdrawal.status === "pending" && (
                            <div className="flex gap-2">
                              {selectedWithdrawal === withdrawal.id ? (
                                <div className="flex gap-2 items-center">
                                  <Input
                                    placeholder="交易哈希"
                                    value={txHash}
                                    onChange={(e) => setTxHash(e.target.value)}
                                    className="w-40 h-8"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleProcess(withdrawal.id)}
                                    disabled={processMutation.isPending}
                                  >
                                    确认
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => setSelectedWithdrawal(withdrawal.id)}
                                  >
                                    处理
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReject(withdrawal.id)}
                                    disabled={rejectMutation.isPending}
                                  >
                                    拒绝
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                          {withdrawal.status !== "pending" && (
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
                <p>暂无提现记录</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {withdrawals && withdrawals.total > 0 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              上一页
            </Button>
            <span className="px-4 py-2 text-gray-600">
              第 {page} 页，共 {Math.ceil((withdrawals.total || 0) / 10)} 页
            </span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil((withdrawals.total || 0) / 10)}
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
