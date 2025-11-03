import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * @file components/empty-cart.tsx
 * @description 빈 장바구니 상태 컴포넌트
 *
 * 장바구니가 비어있을 때 표시되는 UI 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. "장바구니가 비어있습니다" 메시지 표시
 * 2. ShoppingCart 아이콘 표시
 * 3. "쇼핑 계속하기" 버튼 제공
 *
 * @dependencies
 * - lucide-react: ShoppingCart 아이콘
 * - @/components/ui/button: shadcn/ui 버튼 컴포넌트
 * - next/link: 페이지 이동
 */

/**
 * 빈 장바구니 상태 컴포넌트
 */
export function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-6">
        <ShoppingCart className="w-24 h-24 text-gray-300 dark:text-gray-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        장바구니가 비어있습니다
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
        원하는 상품을 장바구니에 담아보세요.
      </p>
      <Link href="/products">
        <Button size="lg" className="min-w-[200px]">
          쇼핑 계속하기
        </Button>
      </Link>
    </div>
  );
}
