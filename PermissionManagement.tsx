import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useState } from "react";
import { Loader2, Edit2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function PermissionManagement() {
  const [, setLocation] = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);

  const roles = [
    {
      id: 1,
      name: "普通用户",
      description: "基础用户权限",
      permissions: ["查看个人资产", "查看分润记录", "提交入金申请", "查看项目"],
      userCount: 150,
    },
    {
      id: 2,
      name: "代理",
      description: "代理权限，可管理团队",
      permissions: [
        "查看个人资产",
        "查看分润记录",
        "提交入金申请",
        "查看项目",
        "查看团队信息",
        "生成邀请码",
        "查看团队分润",
      ],
      userCount: 45,
    },
    {
      id: 3,
      name: "管理员",
      description: "完全管理权限",
      permissions: [
        "管理所有用户",
        "审核入金申请",
        "管理项目",
        "管理提现申请",
        "查看统计报表",
        "管理慈善基金",
        "系统设置",
        "权限管理",
      ],
      userCount: 3,
    },
  ];

  const allPermissions = [
    "查看个人资产",
    "查看分润记录",
    "提交入金申请",
    "查看项目",
    "查看团队信息",
    "生成邀请码",
    "查看团队分润",
    "管理所有用户",
    "审核入金申请",
    "管理项目",
    "管理提现申请",
    "查看统计报表",
    "管理慈善基金",
    "系统设置",
    "权限管理",
  ];

  const handleEditRole = (roleId: number) => {
    setSelectedRole(roleId);
    setShowEditModal(true);
  };

  const handleDeleteRole = (roleId: number) => {
    toast.success("角色已删除");
  };

  const handleSavePermissions = () => {
    toast.success("权限已更新");
    setShowEditModal(false);
    setSelectedRole(null);
  };

  const handleAddRole = () => {
    toast.success("角色已创建");
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">权限管理</h1>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus size={16} />
              新增角色
            </Button>
            <Button variant="outline" onClick={() => setLocation("/admin")}>
              返回
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => (
            <Card key={role.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{role.name}</CardTitle>
                <p className="text-sm text-gray-600">{role.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">权限列表：</p>
                  <div className="space-y-1">
                    {role.permissions.slice(0, 3).map((perm, idx) => (
                      <p key={idx} className="text-xs text-gray-600">
                        ✓ {perm}
                      </p>
                    ))}
                    {role.permissions.length > 3 && (
                      <p className="text-xs text-gray-600">
                        + {role.permissions.length - 3} 项权限
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">
                    用户数: <span className="font-semibold">{role.userCount}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => handleEditRole(role.id)}
                  >
                    <Edit2 size={14} />
                    编辑
                  </Button>
                  {role.id !== 3 && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 gap-2"
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      <Trash2 size={14} />
                      删除
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Permission Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>权限矩阵</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">权限</th>
                    {roles.map((role) => (
                      <th
                        key={role.id}
                        className="text-center py-3 px-4 text-sm font-semibold text-gray-600"
                      >
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allPermissions.map((perm, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{perm}</td>
                      {roles.map((role) => (
                        <td key={role.id} className="text-center py-3 px-4">
                          {role.permissions.includes(perm) ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                              <span className="text-green-600 font-bold">✓</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
                              <span className="text-gray-400">-</span>
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>编辑角色权限</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  选择权限
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {allPermissions.map((perm, idx) => (
                    <label key={idx} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={
                          selectedRole
                            ? roles.find((r) => r.id === selectedRole)?.permissions.includes(perm)
                            : false
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSavePermissions} className="flex-1">
                  保存
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Role Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>新增角色</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  角色名称
                </label>
                <input
                  type="text"
                  placeholder="输入角色名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  角色描述
                </label>
                <textarea
                  placeholder="输入角色描述"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddRole} className="flex-1">
                  创建
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
