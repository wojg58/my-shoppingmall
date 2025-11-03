import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

/**
 * @file app/products/[id]/not-found.tsx
 * @description 상품 상세 페이지 404 에러 페이지
 *
 * 존재하지 않는 상품 ID로 접근했을 때 표시되는 페이지입니다.
 */

export default function ProductNotFound() {
  return (
    <main className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          상품을 찾을 수 없습니다
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          요청하신 상품이 존재하지 않거나 삭제되었습니다.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild variant="default">
            <Link href="/products">상품 목록으로 이동</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">홈으로 가기</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
