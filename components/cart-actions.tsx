"use client";

import { useRouter } from "next/navigation";
import { CartItemComponent } from "@/components/cart-item";
import { CartItem } from "@/actions/cart";

/**
 * @file components/cart-actions.tsx
 * @description 장바구니 액션 래퍼 컴포넌트
 *
 * 장바구니 아이템 업데이트 시 페이지를 새로고침하기 위한 래퍼 컴포넌트입니다.
 *
 * @dependencies
 * - next/navigation: router.refresh()
 */

interface CartActionsProps {
  items: CartItem[];
}

/**
 * 장바구니 액션 래퍼 컴포넌트
 *
 * @param items 장바구니 아이템 목록
 */
export function CartActions({ items }: CartActionsProps) {
  const router = useRouter();

  const handleUpdate = () => {
    // 페이지 새로고침하여 최신 데이터 표시
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <CartItemComponent key={item.id} item={item} onUpdate={handleUpdate} />
      ))}
    </div>
  );
}
