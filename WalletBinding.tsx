import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Wallet, CheckCircle, AlertCircle } from "lucide-react";

export default function WalletBinding() {
  const [, setLocation] = useLocation();
  const [walletAddress, setWalletAddress] = useState("");
  const [walletType, setWalletType] = useState<"trc20" | "eth" | "btc">("trc20");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch existing wallet
  const { data: wallet, isLoading } = trpc.wallet.getWallet.useQuery();

  // Bind wallet mutation
  const bindMutation = trpc.wallet.bindWallet.useMutation({
    onSuccess: () => {
      toast.success("钱包绑定成功！");
      setTimeout(() => setLocation("/mine"), 1500);
    },
    onError: (error) => {
      toast.error(error.message || "绑定失败");
    },
  });

  // Update wallet mutation
  const updateMutation = trpc.wallet.updateWallet.useMutation({
    onSuccess: () => {
      toast.success("钱包已更新！");
      setTimeout(() => setLocation("/mine"), 1500);
    },
    onError: (error) => {
      toast.error(error.message || "更新失败");
    },
  });

  useEffect(() => {
    if (wallet) {
      setWalletAddress(wallet.walletAddress);
      setWalletType(wallet.walletType as "trc20" | "eth" | "btc");
    }
  }, [wallet]);

  const validateAddress = (address: string, type: string): boolean => {
    if (type === "trc20") {
      return address.startsWith("T") && address.length === 34;
    } else if (type === "eth") {
      return address.startsWith("0x") && address.length === 42;
    } else if (type === "btc") {
      return (address.startsWith("1") || address.startsWith("3") || address.startsWith("bc1")) && address.length >= 26;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletAddress.trim()) {
      toast.error("请输入钱包地址");
      return;
    }

    if (!validateAddress(walletAddress, walletType)) {
      toast.error(`请输入有效的 ${walletType.toUpperCase()} 钱包地址`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (wallet) {
        await updateMutation.mutateAsync({
          walletAddress,
          walletType,
        });
      } else {
        await bindMutation.mutateAsync({
          walletAddress,
          walletType,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">绑定钱包地址</h1>
          <Button variant="outline" onClick={() => setLocation("/mine")}>
            返回
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Info Banner */}
        {wallet && wallet.isVerified ? (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">钱包已验证</p>
                  <p className="text-sm text-green-700">您的钱包地址已通过验证，可以正常使用</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : wallet ? (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-900">待验证</p>
                  <p className="text-sm text-yellow-700">您的钱包地址已绑定，但还未通过验证。管理员将尽快审核。</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">需要绑定钱包</p>
                  <p className="text-sm text-blue-700">入金前需要先绑定您的钱包地址，用于接收分润和提现</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              {wallet ? "更新钱包地址" : "绑定钱包地址"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Wallet Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  钱包类型 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["trc20", "eth", "btc"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setWalletType(type)}
                      className={`p-3 border-2 rounded-lg font-medium transition ${
                        walletType === type
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallet Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  钱包地址 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder={
                    walletType === "trc20"
                      ? "输入 TRON (TRC20) 钱包地址，以 T 开头"
                      : walletType === "eth"
                        ? "输入以太坊 (ETH) 钱包地址，以 0x 开头"
                        : "输入比特币 (BTC) 钱包地址"
                  }
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  {walletType === "trc20" && "TRON 地址格式：34 个字符，以 T 开头"}
                  {walletType === "eth" && "以太坊地址格式：42 个字符，以 0x 开头"}
                  {walletType === "btc" && "比特币地址格式：26+ 个字符，以 1、3 或 bc1 开头"}
                </p>
              </div>

              {/* Important Notes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">重要提示</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>✓ 请确保钱包地址准确无误，错误的地址可能导致资金丢失</li>
                  <li>✓ 绑定后，所有分润和提现将发送到此钱包</li>
                  <li>✓ 钱包地址验证后不能更改，请谨慎填写</li>
                  <li>✓ 建议使用您自己控制的钱包地址</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting || !walletAddress.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? "处理中..." : wallet ? "更新钱包" : "绑定钱包"}
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
              <h4 className="font-semibold text-gray-900 mb-1">Q: 为什么必须绑定钱包？</h4>
              <p className="text-sm text-gray-600">
                A: 钱包地址用于接收您的分润佣金和提现资金。绑定钱包是激活账户和入金的前提条件。
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Q: 支持哪些钱包类型？</h4>
              <p className="text-sm text-gray-600">
                A: 目前支持 TRON (TRC20)、以太坊 (ETH) 和比特币 (BTC) 三种钱包类型。
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Q: 绑定后可以更改钱包吗？</h4>
              <p className="text-sm text-gray-600">
                A: 验证前可以更改，验证后不能更改。请确保地址准确无误后再提交验证。
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Q: 钱包验证需要多长时间？</h4>
              <p className="text-sm text-gray-600">
                A: 通常在 24 小时内完成验证。您可以在"我的账户"页面查看验证状态。
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Q: 钱包地址填错了怎么办？</h4>
              <p className="text-sm text-gray-600">
                A: 验证前可以更新地址。验证后如需更改，请联系客服处理。
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
