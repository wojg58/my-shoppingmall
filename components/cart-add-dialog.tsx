"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShoppingCart } from "lucide-react";

/**
 * @file components/cart-add-dialog.tsx
 * @description 장바구니 담기 완료 다이얼로그 컴포넌트
 *
 * 장바구니에 상품을 성공적으로 담았을 때 표시되는 다이얼로그입니다.
 *
 * 주요 기능:
 * 1. "장바구니에 담겼습니다" 메시지 표시
 * 2. 담은 상품명과 수량 표시
 * 3. 버튼 2개:
 *    - "장바구니로 이동" → `/cart`로 이동
 *    - "계속 쇼핑하기" → 다이얼로그 닫기
 *
 * @dependencies
 * - @/components/ui/dialog: shadcn/ui 다이얼로그 컴포넌트
 * - @/components/ui/button: shadcn/ui 버튼 컴포넌트
 * - next/navigation: router 사용
 */

interface CartAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  quantity: number;
}

/**
 * 장바구니 담기 완료 다이얼로그 컴포넌트
 *
 * @param open 다이얼로그 열림/닫힘 상태
 * @param onOpenChange 다이얼로그 상태 변경 콜백
 * @param productName 담은 상품명
 * @param quantity 담은 수량
 */
export function CartAddDialog({
  open,
  onOpenChange,
  productName,
  quantity,
}: CartAddDialogProps) {
  const router = useRouter();

  const handleGoToCart = () => {
    onOpenChange(false);
    router.push("/cart");
  };

  const handleContinueShopping = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            <DialogTitle>장바구니에 담겼습니다</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            선택하신 상품이 장바구니에 추가되었습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">상품명</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {productName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              수량
            </p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {quantity}개
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleContinueShopping}
            className="w-full sm:w-auto"
          >
            계속 쇼핑하기
          </Button>
          <Button onClick={handleGoToCart} className="w-full sm:w-auto">
            <ShoppingCart className="w-4 h-4 mr-2" />
            장바구니로 이동
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
