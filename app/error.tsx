"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * @file app/error.tsx
 * @description 전역 에러 바운더리
 *
 * 홈페이지 및 하위 컴포넌트에서 발생하는 에러를 처리합니다.
 */

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("❌ 페이지 에러 발생:", error);
  }, [error]);

  return (
    <main className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          오류가 발생했습니다
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error.message || "예상치 못한 오류가 발생했습니다."}
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} variant="default">
            다시 시도
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
          >
            홈으로 가기
          </Button>
        </div>
      </div>
    </main>
  );
}
