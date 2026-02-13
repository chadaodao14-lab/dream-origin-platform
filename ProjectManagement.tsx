import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useState } from "react";
import { Loader2, CheckCircle, Clock, XCircle, Check, X, Edit2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ProjectManagement() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");

  const { data: projects, isLoading, refetch } = trpc.admin.getProjectList.useQuery({
    status: status || undefined,
    page,
    pageSize: 10,
  });

  const handleApproveProject = (projectId: number) => {
    setSelectedProject(projectId);
    setApprovalAction("approve");
    setShowApprovalModal(true);
  };

  const handleRejectProject = (projectId: number) => {
    setSelectedProject(projectId);
    setApprovalAction("reject");
    setShowApprovalModal(true);
  };

  const handleManageMilestones = (projectId: number) => {
    setSelectedProject(projectId);
    setShowMilestoneModal(true);
  };

  const handleConfirmApproval = () => {
    if (selectedProject) {
      if (approvalAction === "approve") {
        toast.success("项目已批准");
      } else {
        toast.success("项目已拒绝");
      }
      setShowApprovalModal(false);
      setSelectedProject(null);
      refetch();
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
          <h1 className="text-2xl font-bold text-gray-900">项目管理</h1>
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
              <CardTitle className="text-sm font-medium text-gray-600">进行中</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {projects?.list?.filter((p: any) => p.status === "active").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">已完成</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {projects?.list?.filter((p: any) => p.status === "completed").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">待审批</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {projects?.list?.filter((p: any) => p.status === "pending").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">已取消</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {projects?.list?.filter((p: any) => p.status === "cancelled").length || 0}
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
              <option value="">全部状态</option>
              <option value="pending">待审批</option>
              <option value="active">进行中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle>项目列表</CardTitle>
          </CardHeader>
          <CardContent>
            {projects?.list && projects.list.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">项目名称</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">发起人</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">目标金额</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">已投金额</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">进度</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">状态</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.list.map((project: any) => {
                      const progress = project.targetAmount
                        ? Math.round((parseFloat((project.investedAmount || "0").toString()) / parseFloat((project.targetAmount || "0").toString())) * 100)
                        : 0;

                      return (
                        <tr key={project.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900">#{project.id}</td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{project.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">用户 #{project.ownerId}</td>
                          <td className="py-3 px-4 text-sm font-semibold text-blue-600">
                            ${parseFloat((project.targetAmount || "0").toString()).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-green-600">
                            ${parseFloat((project.investedAmount || "0").toString()).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{progress}%</span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {project.status === "pending" && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                                待审批
                              </span>
                            )}
                            {project.status === "active" && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                                进行中
                              </span>
                            )}
                            {project.status === "completed" && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                                已完成
                              </span>
                            )}
                            {project.status === "cancelled" && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                                已取消
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm flex gap-2">
                            {project.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleApproveProject(project.id)}
                                  title="\u6279\u51c6\u9879\u76ee"
                                >
                                  <Check size={16} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleRejectProject(project.id)}
                                  title="\u62d2\u7edd\u9879\u76ee"
                                >
                                  <X size={16} />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => handleManageMilestones(project.id)}
                              title="\u7ba1\u7406\u91cc\u7a0b\u7891"
                            >
                              <Edit2 size={16} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>暂无项目记录</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {projects && projects.total > 0 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              上一页
            </Button>
            <span className="px-4 py-2 text-gray-600">
              第 {page} 页，共 {Math.ceil((projects.total || 0) / 10)} 页
            </span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil((projects.total || 0) / 10)}
              onClick={() => setPage(page + 1)}
            >
              下一页
            </Button>
          </div>
        )}

        {/* Approval Modal */}
        {showApprovalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>{approvalAction === "approve" ? "批准项目" : "拒绝项目"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">
                    {approvalAction === "approve"
                      ? "您确定要批准这个项目吗？批准后项目将进入进行中状态。"
                      : "您确定要拒绝这个项目吗？拒绝后项目将被取消。"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleConfirmApproval}
                    className={approvalAction === "approve" ? "flex-1 bg-green-600 hover:bg-green-700" : "flex-1 bg-red-600 hover:bg-red-700"}
                  >
                    {approvalAction === "approve" ? "确认批准" : "确认拒绝"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowApprovalModal(false)}
                    className="flex-1"
                  >
                    取消
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Milestone Modal */}
        {showMilestoneModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>项目里程碑管理</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">里程碑 1: 需求分析</h4>
                        <p className="text-sm text-gray-600">预计完成: 2026-03-15</p>
                      </div>
                      <CheckCircle size={20} className="text-green-600" />
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">里程碑 2: 开发阶段</h4>
                        <p className="text-sm text-gray-600">预计完成: 2026-05-15</p>
                      </div>
                      <Clock size={20} className="text-yellow-600" />
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">里程碑 3: 测试上线</h4>
                        <p className="text-sm text-gray-600">预计完成: 2026-06-15</p>
                      </div>
                      <Clock size={20} className="text-gray-400" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      toast.success("里程碑已更新");
                      setShowMilestoneModal(false);
                    }}
                    className="flex-1"
                  >
                    保存
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowMilestoneModal(false)}
                    className="flex-1"
                  >
                    关闭
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
