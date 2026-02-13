import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, X, CheckCircle } from "lucide-react";

export default function Deposit() {
  const [, setLocation] = useLocation();
  const [txHash, setTxHash] = useState("");
  const [remark, setRemark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{
    file: File;
    preview: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if wallet is bound
  const { data: wallet, isLoading: walletLoading } = trpc.wallet.getWallet.useQuery();

  const submitMutation = trpc.deposit.submit.useMutation({
    onSuccess: () => {
      toast.success("入金申请已提交，请等待管理员审核");
      setTxHash("");
      setRemark("");
      setUploadedImage(null);
      setTimeout(() => setLocation("/mine"), 2000);
    },
    onError: (error) => {
      toast.error(error.message || "提交失败");
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片大小不能超过5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage({
        file,
        preview: e.target?.result as string,
      });
      toast.success("图片已上传");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if wallet is bound
    if (!wallet) {
      toast.error("请先绑定钱包地址");
      setLocation("/wallet-binding");
      return;
    }

    if (!txHash.trim()) {
      toast.error("请输入交易哈希");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        txHash,
        remark,
        // Image upload would be handled by the backend
        // In a real implementation, you'd upload the image to S3 first
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">入金充值</h1>
          <Button variant="outline" onClick={() => setLocation("/mine")}>
            返回
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">$300</div>
                <div className="text-sm text-gray-600">固定入金金额</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">57%</div>
                <div className="text-sm text-gray-600">分润总比例</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">3%</div>
                <div className="text-sm text-gray-600">慈善基金</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>提交入金申请</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Transaction Hash */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  交易哈希 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="输入支付交易哈希"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  请输入您的支付交易哈希，用于核实支付记录
                </p>
              </div>

              {/* Remark */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注（可选）
                </label>
                <textarea
                  placeholder="输入任何额外信息或备注"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  上传支付成功图 <span className="text-gray-500">(可选)</span>
                </label>

                {!uploadedImage ? (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      点击上传或拖拽图片
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      支持 JPG、PNG 等格式，大小不超过 5MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative inline-block w-full">
                      <img
                        src={uploadedImage.preview}
                        alt="Payment proof"
                        className="w-full max-h-64 object-contain rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>图片已上传: {uploadedImage.file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      更换图片
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Important Notes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">重要提示</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>✓ 请确保交易哈希准确无误</li>
                  <li>✓ 支付成功图应清晰显示支付金额和时间</li>
                  <li>✓ 管理员将在24小时内审核您的申请</li>
                  <li>✓ 审核通过后，佣金将自动分配到您的账户</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting || !txHash.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? "提交中..." : "提交申请"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/mine")}
                >
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">常见问题</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Q: 入金后多久可以获得佣金？
              </h4>
              <p className="text-sm text-gray-600">
                A: 管理员审核通过后，佣金将立即分配。通常在24小时内完成审核。
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Q: 支付成功图必须上传吗？
              </h4>
              <p className="text-sm text-gray-600">
                A: 不是必须的，但上传支付成功图可以加快审核速度。
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Q: 如何查看入金状态？
              </h4>
              <p className="text-sm text-gray-600">
                A: 您可以在"我的账户"页面查看入金记录和状态。
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Q: 入金金额是固定的吗？
              </h4>
              <p className="text-sm text-gray-600">
                A: 是的，入金金额固定为 $300 USD。
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
