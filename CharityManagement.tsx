import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CharityManagement() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    organization: "",
    amount: "",
    description: "",
    category: "education",
  });

  // Mock data for demonstration
  const charityBalance = 15234.50;
  const donations = [
    {
      id: 1,
      organization: "希望小学基金",
      amount: 5000,
      category: "education",
      date: "2026-02-10",
      source: "入金3%",
    },
    {
      id: 2,
      organization: "儿童医疗援助",
      amount: 3500,
      category: "health",
      date: "2026-02-09",
      source: "项目盈利3%",
    },
    {
      id: 3,
      organization: "环保公益组织",
      amount: 2800,
      category: "environment",
      date: "2026-02-08",
      source: "入金3%",
    },
    {
      id: 4,
      organization: "贫困地区扶贫",
      amount: 4000,
      category: "poverty",
      date: "2026-02-07",
      source: "项目盈利3%",
    },
  ];

  const stats = {
    totalDonations: donations.reduce((sum, d) => sum + d.amount, 0),
    donationCount: donations.length,
    avgDonation: donations.reduce((sum, d) => sum + d.amount, 0) / donations.length,
    byCategory: {
      education: donations.filter((d) => d.category === "education").reduce((sum, d) => sum + d.amount, 0),
      health: donations.filter((d) => d.category === "health").reduce((sum, d) => sum + d.amount, 0),
      environment: donations.filter((d) => d.category === "environment").reduce((sum, d) => sum + d.amount, 0),
      poverty: donations.filter((d) => d.category === "poverty").reduce((sum, d) => sum + d.amount, 0),
    },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organization || !formData.amount) {
      toast.error("请填写所有必填字段");
      return;
    }
    toast.success("捐赠记录已创建");
    setFormData({ organization: "", amount: "", description: "", category: "education" });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">慈善基金管理</h1>
          <Button variant="outline" onClick={() => setLocation("/admin")}>
            返回
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">基金余额</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">${charityBalance.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">累计捐赠</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">${stats.totalDonations.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">捐赠次数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.donationCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">平均捐赠</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">${stats.avgDonation.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Category Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">教育援助</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">${stats.byCategory.education.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">医疗援助</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${stats.byCategory.health.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">环保公益</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats.byCategory.environment.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">扶贫援助</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">${stats.byCategory.poverty.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Create Donation */}
        <Card className="mb-8">
          <CardHeader className="flex justify-between items-center">
            <CardTitle>创建捐赠记录</CardTitle>
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="gap-2"
            >
              <Plus size={16} />
              新建捐赠
            </Button>
          </CardHeader>
          {showForm && (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    受捐机构
                  </label>
                  <Input
                    placeholder="输入机构名称"
                    value={formData.organization}
                    onChange={(e) =>
                      setFormData({ ...formData, organization: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      捐赠金额 (USD)
                    </label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      捐赠类别
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="education">教育援助</option>
                      <option value="health">医疗援助</option>
                      <option value="environment">环保公益</option>
                      <option value="poverty">扶贫援助</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    描述
                  </label>
                  <textarea
                    placeholder="输入捐赠描述"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit">创建捐赠</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    取消
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>

        {/* Donations Table */}
        <Card>
          <CardHeader>
            <CardTitle>捐赠记录</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">受捐机构</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">金额</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">类别</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">来源</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">日期</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation) => (
                    <tr key={donation.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">#{donation.id}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {donation.organization}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-green-600">
                        ${donation.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {donation.category === "education" && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                            教育
                          </span>
                        )}
                        {donation.category === "health" && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                            医疗
                          </span>
                        )}
                        {donation.category === "environment" && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                            环保
                          </span>
                        )}
                        {donation.category === "poverty" && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                            扶贫
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{donation.source}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(donation.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="mt-8 flex justify-center gap-2">
          <Button variant="outline" disabled>
            上一页
          </Button>
          <span className="px-4 py-2 text-gray-600">第 1 页，共 1 页</span>
          <Button variant="outline" disabled>
            下一页
          </Button>
        </div>
      </main>
    </div>
  );
}
