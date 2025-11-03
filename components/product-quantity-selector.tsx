"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";

/**
 * @file components/product-quantity-selector.tsx
 * @description 상품 수량 선택 컴포넌트
 *
 * 사용자가 상품의 수량을 선택하고 총 금액을 확인할 수 있는 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 수량 증가/감소 버튼
 * 2. 수량 직접 입력
 * 3. 재고 개수에 따른 최대 수량 제한
 * 4. 총 금액 자동 계산 및 표시
 *
 * @dependencies
 * - @/components/ui/button: shadcn/ui 버튼 컴포넌트
 * - @/components/ui/input: shadcn/ui 입력 컴포넌트
 * - lucide-react: 아이콘
 */

interface ProductQuantitySelectorProps {
  /**
   * 상품 단가
   */
  price: number;
  /**
   * 재고 개수 (최대 수량 제한용)
   */
  stockQuantity: number;
  /**
   * 초기 수량 (기본값: 1)
   */
  initialQuantity?: number;
  /**
   * 수량 변경 시 콜백 함수
   */
  onQuantityChange?: (quantity: number) => void;
}

/**
 * 가격 포맷팅 함수
 */
function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}

export function ProductQuantitySelector({
  price,
  stockQuantity,
  initialQuantity = 1,
  onQuantityChange,
}: ProductQuantitySelectorProps) {
  const [quantity, setQuantity] = useState<number>(
    Math.min(initialQuantity, stockQuantity),
  );

  // 총 금액 계산
  const totalPrice = price * quantity;

  // 수량이 변경될 때마다 콜백 호출
  useEffect(() => {
    if (onQuantityChange) {
      console.log("📊 수량 변경:", { 수량: quantity, 총금액: totalPrice });
      onQuantityChange(quantity);
    }
  }, [quantity, totalPrice, onQuantityChange]);

  // 수량 증가
  const handleIncrease = () => {
    console.group("➕ 수량 증가 시도");
    console.log("현재 수량:", quantity);
    console.log("재고 개수:", stockQuantity);

    if (quantity < stockQuantity) {
      const newQuantity = quantity + 1;
      console.log("✅ 수량 증가 성공:", newQuantity);
      setQuantity(newQuantity);
    } else {
      console.log("⚠️ 재고 부족으로 수량 증가 불가");
    }
    console.groupEnd();
  };

  // 수량 감소
  const handleDecrease = () => {
    console.group("➖ 수량 감소 시도");
    console.log("현재 수량:", quantity);

    if (quantity > 1) {
      const newQuantity = quantity - 1;
      console.log("✅ 수량 감소 성공:", newQuantity);
      setQuantity(newQuantity);
    } else {
      console.log("⚠️ 최소 수량은 1개입니다");
    }
    console.groupEnd();
  };

  // 수량 직접 입력 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.group("⌨️ 수량 직접 입력");
    const inputValue = e.target.value;

    // 빈 값이면 1로 설정
    if (inputValue === "") {
      console.log("빈 값 입력, 1로 설정");
      setQuantity(1);
      console.groupEnd();
      return;
    }

    const numValue = parseInt(inputValue, 10);

    // 숫자가 아니면 무시
    if (isNaN(numValue)) {
      console.log("⚠️ 숫자가 아닌 값 입력, 무시");
      console.groupEnd();
      return;
    }

    // 1보다 작으면 1로 설정
    if (numValue < 1) {
      console.log("⚠️ 1보다 작은 값 입력, 1로 설정");
      setQuantity(1);
      console.groupEnd();
      return;
    }

    // 재고보다 많으면 재고 개수로 제한
    if (numValue > stockQuantity) {
      console.log(
        "⚠️ 재고 개수보다 큰 값 입력, 재고 개수로 제한:",
        stockQuantity,
      );
      setQuantity(stockQuantity);
      console.groupEnd();
      return;
    }

    console.log("✅ 수량 입력 성공:", numValue);
    setQuantity(numValue);
    console.groupEnd();
  };

  // 수량 입력 필드에서 포커스 아웃 시 검증
  const handleInputBlur = () => {
    console.group("🔍 수량 입력 검증");
    // 입력 필드가 비어있거나 1보다 작으면 1로 설정
    if (quantity < 1) {
      console.log("⚠️ 수량이 1보다 작음, 1로 설정");
      setQuantity(1);
    }
    console.groupEnd();
  };

  // 재고 부족 여부 확인
  const isOutOfStock = stockQuantity === 0;
  const canIncrease = quantity < stockQuantity && !isOutOfStock;
  const canDecrease = quantity > 1;

  return (
    <div className="space-y-4">
      {/* 수량 선택 섹션 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          수량
        </label>
        <div className="flex items-center gap-2">
          {/* 감소 버튼 */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleDecrease}
            disabled={!canDecrease || isOutOfStock}
            className="h-10 w-10 shrink-0"
            aria-label="수량 감소"
          >
            <Minus className="h-4 w-4" />
          </Button>

          {/* 수량 입력 필드 */}
          <Input
            type="number"
            min={1}
            max={stockQuantity}
            value={quantity}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            disabled={isOutOfStock}
            className="w-20 text-center font-semibold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            aria-label="상품 수량"
          />

          {/* 증가 버튼 */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleIncrease}
            disabled={!canIncrease || isOutOfStock}
            className="h-10 w-10 shrink-0"
            aria-label="수량 증가"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 총 금액 섹션 */}
      <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          총 금액
        </span>
        <span className="text-2xl font-bold text-primary">
          {formatPrice(totalPrice)}
        </span>
      </div>
    </div>
  );
}
