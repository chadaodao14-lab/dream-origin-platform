import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

function CommissionConfigSection() {
  const [levels, setLevels] = useState(7);
  const [percentages, setPercentages] = useState([20, 8, 8, 6, 5, 5, 5]);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  const { data: config } = trpc.admin.getCommissionConfig.useQuery();
  const updateMutation = trpc.admin.updateCommissionConfig.useMutation();

  useEffect(() => {
    if (config) {
      setLevels(config.levels);
      setPercentages(config.percentages);
    }
  }, [config]);

  const handlePercentageChange = (index: number, value: string) => {
    const newPercentages = [...percentages];
    newPercentages[index] = parseInt(value) || 0;
    setPercentages(newPercentages);
  };

  const handleLevelsChange = (value: string) => {
    const newLevels = parseInt(value) || 1;
    setLevels(newLevels);
    if (newLevels < percentages.length) {
      setPercentages(percentages.slice(0, newLevels));
    } else if (newLevels > percentages.length) {
      const newPercentages = [...percentages];
      while (newPercentages.length < newLevels) {
        newPercentages.push(0);
      }
      setPercentages(newPercentages);
    }
  };

  const handleSave = async () => {
    const totalPercentage = percentages.reduce((a, b) => a + b, 0);
    if (totalPercentage > 100) {
      toast.error("总分润比例不能超过100%");
      return;
    }

    setLoading(true);
    try {
      await updateMutation.mutateAsync({
        levels,
        percentages,
        reason: reason || undefined,
      });
      toast.success("分润配置已更新");
      setReason("");
    } catch (error) {
      toast.error("更新失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const totalPercentage = percentages.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          分润层级数
        </label>
        <Input
          type="number"
          min="1"
          max="20"
          value={levels}
          onChange={(e) => handleLevelsChange(e.target.value)}
          className="max-w-xs"
        />
        <p className="text-xs text-gray-500 mt-1">设置分润的层级数（1-20层）</p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          各层级分润比例 (%)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {percentages.map((percentage, index) => (
            <div key={index} className="space-y-1">
              <label className="text-xs text-gray-600">第 {index + 1} 层</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={percentage}
                onChange={(e) => handlePercentageChange(index, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          修改原因（可选）
        </label>
        <Input
          type="text"
          placeholder="输入修改原因，便于审计"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">总分润比例：</span>
          <span className={`text-lg font-bold ${totalPercentage > 100 ? "text-red-600" : "text-green-600"}`}>
            {totalPercentage}%
          </span>
        </div>
        {totalPercentage > 100 && (
          <p className="text-xs text-red-600 mt-2">⚠️ 总分润比例超过100%，请调整</p>
        )}
      </div>

      <Button onClick={handleSave} disabled={loading || totalPercentage > 100}>
        {loading ? "保存中..." : "保存配置"}
      </Button>
    </div>
  );
}

function ConfigurationHistorySection() {
  const [page, setPage] = useState(1);
  const { data: historyData } = trpc.admin.getConfigurationHistory.useQuery({
    page,
    pageSize: 20,
  });

  if (!historyData) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">配置项</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">旧值</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">新值</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">修改者</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">修改原因</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">修改时间</th>
            </tr>
          </thead>
          <tbody>
            {historyData.list.map((record: any) => (
              <tr key={record.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-900">{record.configKey}</td>
                <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                  {record.oldValue || "N/A"}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                  {record.newValue}
                </td>
                <td className="py-3 px-4 text-sm text-gray-900">管理员 #{record.changedBy}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{record.changeReason}</td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {new Date(record.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {historyData.list.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          暂无修改历史记录
        </div>
      )}

      {historyData.total > 20 && (
        <div className="flex justify-between items-center pt-4">
          <span className="text-sm text-gray-600">
            共 {historyData.total} 条记录，第 {page} 页
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page * 20 >= historyData.total}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SystemSettings() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("settings");
  const [settings, setSettings] = useState({
    platformName: "梦之源创业投资平台",
    platformEmail: "admin@dreamsource.com",
    platformPhone: "+86 10-1234-5678",
    depositAmount: "300",
    maxDirectCount: "5",
    maxLevels: "9",
    commissionRate1: "20",
    charityRate: "3",
  });

  const [logs, setLogs] = useState([
    {
      id: 1,
      admin: "管理员",
      action: "确认入金",
      target: "用户 #123",
      timestamp: "2026-02-11 15:30:45",
      status: "成功",
    },
    {
      id: 2,
      admin: "管理员",
      action: "处理提现",
      target: "提现申请 #45",
      timestamp: "2026-02-11 14:15:20",
      status: "成功",
    },
    {
      id: 3,
      admin: "管理员",
      action: "批准项目",
      target: "项目 #12",
      timestamp: "2026-02-11 13:45:10",
      status: "成功",
    },
    {
      id: 4,
      admin: "管理员",
      action: "创建捐赠",
      target: "希望小学基金",
      timestamp: "2026-02-11 12:20:30",
      status: "成功",
    },
    {
      id: 5,
      admin: "管理员",
      action: "拒绝入金",
      target: "用户 #456",
      timestamp: "2026-02-11 11:05:15",
      status: "成功",
    },
  ]);

  const handleSettingChange = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSaveSettings = () => {
    toast.success("系统设置已保存");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setLocation("/admin/logs")}
              className="gap-2"
            >
              查看完整日志
            </Button>
            <Button variant="outline" onClick={() => setLocation("/admin")}>
              返回
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings">平台设置</TabsTrigger>
            <TabsTrigger value="parameters">参数配置</TabsTrigger>
            <TabsTrigger value="history">配置历史</TabsTrigger>
            <TabsTrigger value="logs">操作日志</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>平台基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    平台名称
                  </label>
                  <Input
                    value={settings.platformName}
                    onChange={(e) => handleSettingChange("platformName", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    平台邮箱
                  </label>
                  <Input
                    type="email"
                    value={settings.platformEmail}
                    onChange={(e) => handleSettingChange("platformEmail", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    平台电话
                  </label>
                  <Input
                    value={settings.platformPhone}
                    onChange={(e) => handleSettingChange("platformPhone", e.target.value)}
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={handleSaveSettings}>保存设置</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>系统参数配置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      固定入金金额 (USD)
                    </label>
                    <Input
                      type="number"
                      value={settings.depositAmount}
                      onChange={(e) => handleSettingChange("depositAmount", e.target.value)}
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">固定值，不可修改</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      直推人数上限
                    </label>
                    <Input
                      type="number"
                      value={settings.maxDirectCount}
                      onChange={(e) => handleSettingChange("maxDirectCount", e.target.value)}
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">固定值，不可修改</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      邀请层级上限
                    </label>
                    <Input
                      type="number"
                      value={settings.maxLevels}
                      onChange={(e) => handleSettingChange("maxLevels", e.target.value)}
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">固定值，不可修改</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      一级分润比例 (%)
                    </label>
                    <Input
                      type="number"
                      value={settings.commissionRate1}
                      onChange={(e) => handleSettingChange("commissionRate1", e.target.value)}
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">固定值，不可修改</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      慈善基金比例 (%)
                    </label>
                    <Input
                      type="number"
                      value={settings.charityRate}
                      onChange={(e) => handleSettingChange("charityRate", e.target.value)}
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">固定值，不可修改</p>
                  </div>
                </div>

                <div className="pt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>分润比例设置：</strong> 20% / 8% / 8% / 6% / 5% / 5% / 5%
                  </p>
                  <table className="text-xs text-blue-700 w-full">
                    <thead>
                      <tr className="border-b border-blue-300">
                        <th className="text-left py-1">层级</th>
                        <th className="text-left py-1">比例</th>
                        <th className="text-left py-1">说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>1级</td>
                        <td>20%</td>
                        <td>直接上级</td>
                      </tr>
                      <tr>
                        <td>2级</td>
                        <td>8%</td>
                        <td>间接上级</td>
                      </tr>
                      <tr>
                        <td>3级</td>
                        <td>8%</td>
                        <td>三级上级</td>
                      </tr>
                      <tr>
                        <td>4级</td>
                        <td>6%</td>
                        <td>四级上级</td>
                      </tr>
                      <tr>
                        <td>5级</td>
                        <td>5%</td>
                        <td>五级上级</td>
                      </tr>
                      <tr>
                        <td>6级</td>
                        <td>5%</td>
                        <td>六级上级</td>
                      </tr>
                      <tr>
                        <td>7级</td>
                        <td>5%</td>
                        <td>七级上级</td>
                      </tr>
                      <tr className="border-t border-blue-300 font-semibold">
                        <td colSpan={2}>合计</td>
                        <td>57%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>分润配置管理</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <CommissionConfigSection />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>配置修改历史</CardTitle>
              </CardHeader>
              <CardContent>
                <ConfigurationHistorySection />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>操作日志</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ID</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">操作员</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">操作</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">操作对象</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">时间</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900">{log.id}</td>
                          <td className="py-3 px-4 text-sm text-gray-900">{log.admin}</td>
                          <td className="py-3 px-4 text-sm text-gray-900">{log.action}</td>
                          <td className="py-3 px-4 text-sm text-gray-900">{log.target}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{log.timestamp}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
