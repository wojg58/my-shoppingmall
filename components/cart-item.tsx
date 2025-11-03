"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Minus, Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CartItem } from "@/actions/cart";
import { updateCartItemQuantity, removeFromCart } from "@/actions/cart";
import { getCategoryLabel } from "@/constants/categories";

/**
 * @file components/cart-item.tsx
 * @description 장바구니 아이템 컴포넌트
 *
 * 장바구니에 담긴 상품 하나를 표시하는 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 상품 정보 표시 (이미지, 이름, 가격, 카테고리)
 * 2. 수량 변경 UI (증가/감소 버튼, 직접 입력)
 * 3. 소계 계산 및 표시 (단가 × 수량)
 * 4. 삭제 버튼
 * 5. 재고 확인 및 제한
 *
 * 핵심 구현 로직:
 * - Server Actions 사용 (updateCartItemQuantity, removeFromCart)
 * - 수량 변경 시 재고 검증
 * - 에러 처리 및 피드백 표시
 * - 장바구니 갱신 후 이벤트 발생 (GNB 아이콘 갱신)
 *
 * @dependencies
 * - @/actions/cart: 장바구니 Server Actions
 * - @/components/ui: shadcn/ui 컴포넌트
 * - lucide-react: 아이콘
 */

interface CartItemProps {
  item: CartItem;
  onUpdate?: () => void;
}

/**
 * 가격 포맷팅 함수
 */
function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}

/**
 * 장바구니 아이템 컴포넌트
 *
 * @param item 장바구니 아이템 데이터
 * @param onUpdate 장바구니 업데이트 후 콜백
 */
export function CartItemComponent({ item, onUpdate }: CartItemProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const product = item.products;
  const unitPrice = product.price;
  const subtotal = unitPrice * quantity;
  const stockQuantity = product.stock_quantity;
  const isLowStock = stockQuantity > 0 && stockQuantity < 10;
  const isOutOfStock = stockQuantity === 0;

  // 수량 증가
  const handleIncrease = async () => {
    if (quantity >= stockQuantity) {
      setError(`재고가 부족합니다. (현재 재고: ${stockQuantity}개)`);
      return;
    }

    const newQuantity = quantity + 1;
    await updateQuantity(newQuantity);
  };

  // 수량 감소
  const handleDecrease = async () => {
    if (quantity <= 1) return;

    const newQuantity = quantity - 1;
    await updateQuantity(newQuantity);
  };

  // 수량 직접 입력
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
      return;
    }
    if (value > stockQuantity) {
      setQuantity(stockQuantity);
      setError(`재고가 부족합니다. (현재 재고: ${stockQuantity}개)`);
      return;
    }
    setQuantity(value);
    setError(null);
  };

  // 수량 입력 후 blur (실제 업데이트)
  const handleInputBlur = async () => {
    if (quantity !== item.quantity) {
      await updateQuantity(quantity);
    }
  };

  // 수량 업데이트
  const updateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > stockQuantity) {
      setError(`수량은 1개 이상 ${stockQuantity}개 이하여야 합니다.`);
      return;
    }

    setIsUpdating(true);
    setError(null);

    const result = await updateCartItemQuantity(item.id, newQuantity);

    if (result.success) {
      setQuantity(result.data.quantity);
      // GNB 장바구니 아이콘 갱신을 위한 이벤트 발생
      window.dispatchEvent(new Event("cart-updated"));
      onUpdate?.();
    } else {
      setError(result.error);
      setQuantity(item.quantity); // 원래 수량으로 복원
    }

    setIsUpdating(false);
  };

  // 삭제
  const handleDelete = async () => {
    if (!confirm("정말 이 상품을 장바구니에서 삭제하시겠습니까?")) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    const result = await removeFromCart(item.id);

    if (result.success) {
      // GNB 장바구니 아이콘 갱신을 위한 이벤트 발생
      window.dispatchEvent(new Event("cart-updated"));
      onUpdate?.();
    } else {
      setError(result.error);
    }

    setIsDeleting(false);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
      {/* 상품 이미지 */}
      <Link
        href={`/products/${product.id}`}
        className="relative w-full sm:w-32 h-32 sm:h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center shrink-0"
      >
        <Package className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        {isOutOfStock && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
            품절
          </div>
        )}
        {isLowStock && !isOutOfStock && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded">
            재고부족
          </div>
        )}
      </Link>

      {/* 상품 정보 */}
      <div className="flex-1 flex flex-col gap-2">
        {/* 상품명 및 카테고리 */}
        <div>
          <Link
            href={`/products/${product.id}`}
            className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-primary transition-colors"
          >
            {product.name}
          </Link>
          {product.category && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
              {getCategoryLabel(product.category)}
            </span>
          )}
        </div>

        {/* 단가 */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          단가: <span className="font-semibold">{formatPrice(unitPrice)}</span>
        </p>

        {/* 재고 정보 */}
        {isOutOfStock ? (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>품절된 상품입니다</span>
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            재고: {stockQuantity}개
            {isLowStock && (
              <span className="ml-2 text-orange-600 dark:text-orange-400 font-medium">
                (재고 부족)
              </span>
            )}
          </p>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        {/* 수량 변경 UI */}
        <div className="flex items-center gap-4 mt-auto">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleDecrease}
              disabled={
                isUpdating || isDeleting || quantity <= 1 || isOutOfStock
              }
              className="h-8 w-8 shrink-0"
              aria-label="수량 감소"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <Input
              type="number"
              min={1}
              max={stockQuantity}
              value={quantity}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              disabled={isUpdating || isDeleting || isOutOfStock}
              className="w-16 text-center font-semibold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="상품 수량"
            />

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleIncrease}
              disabled={
                isUpdating ||
                isDeleting ||
                quantity >= stockQuantity ||
                isOutOfStock
              }
              className="h-8 w-8 shrink-0"
              aria-label="수량 증가"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* 삭제 버튼 */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isUpdating || isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label="장바구니에서 삭제"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            삭제
          </Button>
        </div>
      </div>

      {/* 소계 */}
      <div className="sm:w-32 flex sm:flex-col items-end sm:items-start justify-between sm:justify-start gap-2 shrink-0">
        <div className="text-right sm:text-left">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">소계</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatPrice(subtotal)}
          </p>
        </div>
      </div>
    </div>
  );
}
