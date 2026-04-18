// 使用 loader 直接丟出 404 Response
export function clientLoader() {
  throw new Response("Not Found", { status: 404 });
}

// 這裡其實不需要寫 UI，因為 throw 會直接觸發 root.tsx 的 ErrorBoundary
export default function NotFound() {
  return null; 
}