import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">梦之源</h1>
          <Button onClick={() => (window.location.href = getLoginUrl())}>
            登录
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <section className="py-20 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            梦之源创业投资平台
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            通过九级代理分润系统，实现财富增长。加入我们的创业投资生态，参与创新项目，获得可持续的被动收入。
          </p>
          <Button
            size="lg"
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg"
          >
            立即开始
          </Button>
        </section>

        {/* Features */}
        <section className="py-16">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            平台特色
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-8 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">💰</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                九级代理分润
              </h4>
              <p className="text-gray-600">
                最高20%的一级佣金，自动计算9层上级分润，让您的团队为您创造财富。
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🚀</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                创业项目投资
              </h4>
              <p className="text-gray-600">
                参与精选创业项目，获得投资回报和项目成长红利。
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">❤️</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                慈善公益
              </h4>
              <p className="text-gray-600">
                每笔入金的3%进入慈善基金，参与社会责任，实现财富与价值的统一。
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            如何开始
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-indigo-100 text-indigo-600 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">注册账户</h4>
              <p className="text-sm text-gray-600">
                使用邀请码注册，建立您的代理链
              </p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 text-indigo-600 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">入金激活</h4>
              <p className="text-sm text-gray-600">
                提交300 USD入金申请激活账户
              </p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 text-indigo-600 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">邀请推广</h4>
              <p className="text-sm text-gray-600">
                分享您的邀请码，建立您的团队
              </p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 text-indigo-600 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                4
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">获得收益</h4>
              <p className="text-sm text-gray-600">
                自动获得分润和投资回报
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 text-center">
          <div className="bg-indigo-600 rounded-lg p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">准备好开始了吗？</h3>
            <p className="text-lg mb-8 opacity-90">
              加入梦之源，与数千名成功的代理商一起实现财富梦想
            </p>
            <Button
              size="lg"
              onClick={() => (window.location.href = getLoginUrl())}
              className="bg-white text-indigo-600 hover:bg-gray-100"
            >
              立即登录
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2026 梦之源创业投资平台。保留所有权利。</p>
        </div>
      </footer>
    </div>
  );
}
