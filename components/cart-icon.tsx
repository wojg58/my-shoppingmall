"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartCount } from "@/hooks/use-cart-count";
import { cn } from "@/lib/utils";

/**
 * @file components/cart-icon.tsx
 * @description 장바구니 아이콘 컴포넌트
 *
 * GNB에 표시되는 장바구니 아이콘 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 장바구니 아이콘 표시
 * 2. 장바구니 개수 뱃지 표시 (개수 > 0일 때만)
 * 3. 호버 효과
 * 4. 클릭 시 장바구니 페이지로 이동
 *
 * 핵심 구현 로직:
 * - useCartCount Hook으로 장바구니 개수 조회
 * - 개수가 0보다 클 때만 뱃지 표시
 * - Link 컴포넌트로 페이지 이동 처리
 *
 * @dependencies
 * - @/hooks/use-cart-count: 장바구니 개수 조회 Hook
 * - lucide-react: ShoppingCart 아이콘
 * - next/link: 페이지 이동
 */

interface CartIconProps {
  className?: string;
}

/**
 * 장바구니 아이콘 컴포넌트
 *
 * @param className 추가 CSS 클래스
 */
export function CartIcon({ className }: CartIconProps) {
  const { count, isLoading } = useCartCount();

  return (
    <Link
      href="/cart"
      className={cn(
        "relative flex items-center justify-center w-10 h-10 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
        className,
      )}
      aria-label={`장바구니${count > 0 ? ` (${count}개)` : ""}`}
    >
      <ShoppingCart className="w-6 h-6 text-gray-700 dark:text-gray-300" />

      {/* 장바구니 개수 뱃지 */}
      {!isLoading && count > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-primary text-white text-xs font-bold rounded-full">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
