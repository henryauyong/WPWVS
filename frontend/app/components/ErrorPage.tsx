import { isRouteErrorResponse, Link } from "react-router";

export function ErrorPage({ error }: { error: unknown }) {
  // 1. 處理「路由錯誤」 (如 404, 401, 500)
  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 404:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
            <h1 className="text-3xl font-bold mb-4">404 頁面不見了</h1>
            <p className="text-zinc-400 mb-8">找不到您要求的路徑。</p>
            <Link
              to="/"
              className="bg-white text-black px-6 py-2 rounded-md font-medium hover:bg-zinc-200 transition-colors"
            >
              回首頁
            </Link>
          </div>
        );
      case 500:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
            <h1 className="text-3xl font-bold mb-4">伺服器冒煙了</h1>
            <p className="text-zinc-400 mb-8">請稍後再試。</p>
            <Link
              to="/"
              className="bg-white text-black px-6 py-2 rounded-md font-medium hover:bg-zinc-200 transition-colors"
            >
              回首頁
            </Link>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
            <h1 className="text-3xl font-bold mb-4">發生了錯誤</h1>
            <p className="text-zinc-400 mb-8">
              {error.statusText || "未知的路由錯誤"}
            </p>
            <Link
              to="/"
              className="bg-white text-black px-6 py-2 rounded-md font-medium hover:bg-zinc-200 transition-colors"
            >
              回首頁
            </Link>
          </div>
        );
    }
  }

  // 2. 處理「程式碼錯誤」 (一般的 JS Error)
  const errorMessage = error instanceof Error ? error.message : "未知錯誤";
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <h1 className="text-3xl font-bold text-red-500 mb-4">程式發生崩潰</h1>
      <pre className="bg-zinc-900 p-4 rounded-md text-left overflow-auto max-w-full md:max-w-2xl mb-8 text-sm font-mono text-red-400 border border-zinc-800">
        {errorMessage}
      </pre>
      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="bg-white text-black px-6 py-2 rounded-md font-medium hover:bg-zinc-200 transition-colors"
        >
          重新整理
        </button>
        <Link
          to="/"
          className="bg-zinc-800 text-white px-6 py-2 rounded-md font-medium hover:bg-zinc-700 transition-colors"
        >
          回首頁
        </Link>
      </div>
    </div>
  );
}
