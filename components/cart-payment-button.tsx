"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2, AlertCircle } from "lucide-react";
import { initializeTossPayments } from "@/lib/tosspayments/client";
import type { CartItem } from "@/actions/cart";

/**
 * @file components/cart-payment-button.tsx
 * @description 장바구니 결제 버튼 컴포넌트
 *
 * 장바구니 페이지에서 Toss Payments v1 결제창을 호출하는 버튼 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 장바구니 데이터를 기반으로 결제 정보 구성
 * 2. v1 결제창 초기화 및 호출
 * 3. 결제 요청 처리
 * 4. 로딩 및 에러 상태 관리
 *
 * 핵심 구현 로직:
 * - Toss Payments v1 결제창 SDK 초기화
 * - requestPayment("카드", {...}) 메서드 호출
 * - 주문 ID는 UUID로 임시 생성 (결제 승인 후 주문 생성 예정)
 * - 주문명은 상품명 기반으로 생성
 *
 * @dependencies
 * - @/lib/tosspayments/client: v1 결제창 초기화
 * - @clerk/nextjs: 사용자 인증
 */

interface CartPaymentButtonProps {
  /** 장바구니 아이템 목록 */
  items: CartItem[];
  /** 총 결제 금액 */
  totalAmount: number;
  /** 비활성화 여부 (예: 품절 상품 포함) */
  disabled?: boolean;
}

/**
 * 주문명 생성 함수
 *
 * @param items 장바구니 아이템 목록
 * @returns 주문명 (예: "상품명 외 2건")
 */
function generateOrderName(items: CartItem[]): string {
  if (items.length === 0) {
    return "주문";
  }

  if (items.length === 1) {
    return items[0].products.name;
  }

  return `${items[0].products.name} 외 ${items.length - 1}건`;
}

/**
 * 고유 주문 ID 생성 (임시)
 *
 * 결제 승인 후 실제 주문을 생성할 때까지 사용하는 임시 ID입니다.
 *
 * @returns UUID 형식의 주문 ID
 */
function generateTempOrderId(): string {
  // UUID v4 형식 생성
  return `temp_${crypto.randomUUID()}`;
}

/**
 * 장바구니 결제 버튼 컴포넌트
 */
export function CartPaymentButton({
  items,
  totalAmount,
  disabled = false,
}: CartPaymentButtonProps) {
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 결제창 호출 처리
   */
  const handlePayment = async () => {
    console.group("💳 장바구니 결제창 호출 시작");

    // 1. 인증 확인
    if (!userId) {
      console.error("❌ 로그인하지 않은 사용자");
      console.groupEnd();
      setError("로그인이 필요합니다. 로그인 후 다시 시도해주세요.");
      return;
    }

    // 2. 결제 정보 검증
    if (items.length === 0) {
      console.error("❌ 장바구니가 비어있음");
      console.groupEnd();
      setError("장바구니가 비어있습니다.");
      return;
    }

    if (totalAmount <= 0) {
      console.error("❌ 결제 금액이 0원 이하");
      console.groupEnd();
      setError("결제 금액이 올바르지 않습니다.");
      return;
    }

    // 3. 품절 상품 확인
    const outOfStockItems = items.filter(
      (item) => item.products.stock_quantity === 0,
    );
    if (outOfStockItems.length > 0) {
      console.error("❌ 품절 상품 포함");
      console.groupEnd();
      setError("품절된 상품이 포함되어 있습니다. 장바구니에서 제거해주세요.");
      return;
    }

    // 4. 결제 정보 구성
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!clientKey) {
      console.error("❌ Toss Payments 클라이언트 키가 설정되지 않음");
      console.groupEnd();
      setError("결제 시스템 설정 오류입니다. 관리자에게 문의해주세요.");
      return;
    }

    const orderId = generateTempOrderId();
    const orderName = generateOrderName(items);
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const successUrl = `${baseUrl}/cart/payment/success`;
    const failUrl = `${baseUrl}/cart/payment/fail`;

    console.log("결제 정보:", {
      주문ID: orderId,
      주문명: orderName,
      결제금액: totalAmount,
      상품개수: items.length,
      성공URL: successUrl,
      실패URL: failUrl,
    });

    setIsLoading(true);
    setError(null);

    try {
      // 5. Toss Payments v1 결제창 초기화
      console.log("📦 Toss Payments v1 결제창 초기화 중...");
      const tossPayments = await initializeTossPayments(clientKey);

      // 6. 결제창 호출
      console.log("🎨 결제창 호출 중...");
      await tossPayments.requestPayment("카드", {
        amount: totalAmount,
        orderId: orderId,
        orderName: orderName,
        customerName: userId, // Clerk user ID 사용 (나중에 사용자 이름으로 변경 가능)
        successUrl: successUrl,
        failUrl: failUrl,
        currency: "KRW",
      });

      console.log("✅ 결제창 호출 완료");
      console.groupEnd();
      // 결제창이 열리면 사용자가 결제 페이지로 이동하므로
      // 여기서는 추가 처리가 필요하지 않음
    } catch (err) {
      console.error("❌ 결제창 호출 실패:", err);
      console.groupEnd();

      // 사용자가 결제를 취소한 경우는 에러로 표시하지 않음
      if (
        err instanceof Error &&
        (err.message.includes("USER_CANCEL") ||
          err.message.includes("사용자가 결제를 취소"))
      ) {
        console.log("ℹ️ 사용자가 결제를 취소했습니다.");
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "결제창을 열 수 없습니다. 잠시 후 다시 시도해주세요.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        size="lg"
        className="w-full sm:w-auto min-w-[200px]"
        onClick={handlePayment}
        disabled={isLoading || disabled || totalAmount === 0}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            결제창 열기 중...
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5 mr-2" />
            결제하기
          </>
        )}
      </Button>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                결제 오류
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

