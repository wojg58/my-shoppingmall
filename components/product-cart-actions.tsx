"use client";

import { useState } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2, AlertCircle } from "lucide-react";
import { ProductQuantitySelector } from "@/components/product-quantity-selector";
import { addToCart } from "@/actions/cart";
import { CartAddDialog } from "@/components/cart-add-dialog";

/**
 * @file components/product-cart-actions.tsx
 * @description 상품 상세 페이지 장바구니 담기 기능 컴포넌트
 *
 * 상품 상세 페이지에서 장바구니에 상품을 담는 기능을 제공하는 클라이언트 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 수량 선택 (ProductQuantitySelector 사용)
 * 2. 장바구니 담기 버튼
 * 3. 장바구니 담기 완료 다이얼로그
 * 4. 재고 검증 및 에러 처리
 * 5. 로딩 상태 처리
 *
 * 핵심 구현 로직:
 * - ProductQuantitySelector로 수량 선택
 * - addToCart Server Action 호출
 * - 성공 시 다이얼로그 표시 및 GNB 아이콘 갱신
 * - 에러 처리 및 사용자 피드백
 *
 * @dependencies
 * - @/actions/cart: addToCart Server Action
 * - @/components/product-quantity-selector: 수량 선택 컴포넌트
 * - @/components/cart-add-dialog: 장바구니 담기 완료 다이얼로그
 */

interface ProductCartActionsProps {
  productId: string;
  productName: string;
  price: number;
  stockQuantity: number;
}

/**
 * 상품 장바구니 액션 컴포넌트
 *
 * @param productId 상품 ID
 * @param productName 상품명
 * @param price 상품 가격
 * @param stockQuantity 재고 개수
 */
export function ProductCartActions({
  productId,
  productName,
  price,
  stockQuantity,
}: ProductCartActionsProps) {
  const { isLoaded, userId } = useAuth();
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState<boolean>(false);

  const isOutOfStock = stockQuantity === 0;
  const isLowStock = stockQuantity > 0 && stockQuantity < 10;
  const isLoggedIn = isLoaded && !!userId;

  // 장바구니 담기
  const handleAddToCart = async () => {
    console.group("🛒 장바구니 담기 버튼 클릭");
    console.log("상품 ID:", productId);
    console.log("수량:", quantity);

    // 로그인 확인
    if (!isLoggedIn) {
      console.error("❌ 로그인하지 않은 사용자");
      console.groupEnd();
      setError("로그인이 필요합니다. 로그인 후 다시 시도해주세요.");
      return;
    }

    // 재고 확인 (클라이언트 사이드 사전 검증)
    if (quantity > stockQuantity) {
      console.error("❌ 재고 부족 (사전 검증 실패):", {
        요청수량: quantity,
        현재재고: stockQuantity,
      });
      setError(
        `재고가 부족합니다. (현재 재고: ${stockQuantity}개, 요청 수량: ${quantity}개)`,
      );
      console.groupEnd();
      return;
    }

    if (quantity < 1) {
      console.error("❌ 잘못된 수량:", quantity);
      setError("수량은 1개 이상이어야 합니다.");
      console.groupEnd();
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const result = await addToCart(productId, quantity);

      if (result.success === false) {
        console.error("❌ 장바구니 추가 실패:", result.error);
        console.groupEnd();
        setError(result.error);
      } else {
        console.log("✅ 장바구니 추가 성공:", {
          아이템ID: result.data.id,
          수량: result.data.quantity,
        });
        console.groupEnd();

        // GNB 장바구니 아이콘 갱신을 위한 이벤트 발생
        window.dispatchEvent(new Event("cart-updated"));

        // 다이얼로그 표시
        setShowDialog(true);
      }
    } catch (err) {
      console.error("❌ 예상치 못한 오류 발생:", err);
      console.groupEnd();
      setError("장바구니 추가 중 오류가 발생했습니다.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* 수량 선택 컴포넌트 */}
        <ProductQuantitySelector
          price={price}
          stockQuantity={stockQuantity}
          initialQuantity={1}
          onQuantityChange={(newQuantity) => {
            setQuantity(newQuantity);
            setError(null); // 수량 변경 시 에러 초기화
          }}
        />

        {/* 장바구니 담기 버튼 */}
        {isLoggedIn ? (
          <Button
            className="w-full"
            size="lg"
            onClick={handleAddToCart}
            disabled={isAdding || isOutOfStock}
          >
            {isAdding ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                담는 중...
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                장바구니에 담기
              </>
            )}
          </Button>
        ) : (
          <SignInButton mode="modal">
            <Button className="w-full" size="lg" variant="outline">
              <ShoppingCart className="w-5 h-5 mr-2" />
              로그인 후 장바구니에 담기
            </Button>
          </SignInButton>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  장바구니 추가 실패
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 재고 부족 알림 */}
        {isLowStock && !error && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  재고 부족 알림
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  남은 재고가 {stockQuantity}개뿐입니다. 빠르게 주문해주세요!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 장바구니 담기 완료 다이얼로그 */}
      <CartAddDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        productName={productName}
        quantity={quantity}
      />
    </>
  );
}
