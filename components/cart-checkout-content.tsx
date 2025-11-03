"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShippingForm } from "@/components/shipping-form";
import { OrderSummary } from "@/components/order-summary";
import { orderFormSchema, type OrderForm } from "@/lib/schemas/order";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, AlertCircle } from "lucide-react";
import { initializeTossPayments } from "@/lib/tosspayments/client";
import type { CartItem } from "@/actions/cart";

/**
 * @file components/cart-checkout-content.tsx
 * @description 장바구니 체크아웃 컨텐츠 컴포넌트
 *
 * 장바구니 체크아웃 페이지의 메인 컨텐츠를 관리하는 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 배송지 정보 입력 폼 표시
 * 2. 주문 요약 정보 표시
 * 3. 결제하기 버튼 및 결제창 호출
 *
 * 핵심 구현 로직:
 * - react-hook-form으로 배송지 정보 관리
 * - 배송지 정보 입력 후 결제창 열기
 * - 배송지 정보를 결제 승인 시 전달 (로컬 스토리지 또는 쿼리 파라미터)
 *
 * @dependencies
 * - @/components/shipping-form: 배송지 정보 폼
 * - @/components/order-summary: 주문 요약 컴포넌트
 * - @/lib/tosspayments/client: v1 결제창 초기화
 */

interface CartCheckoutContentProps {
  /** 장바구니 아이템 목록 */
  items: CartItem[];
  /** 총 결제 금액 */
  totalAmount: number;
}

/**
 * 주문명 생성 함수
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
 */
function generateTempOrderId(): string {
  return `temp_${crypto.randomUUID()}`;
}

/**
 * 장바구니 체크아웃 컨텐츠 컴포넌트
 */
export function CartCheckoutContent({
  items,
  totalAmount,
}: CartCheckoutContentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<OrderForm>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      shippingAddress: {
        customerName: "",
        address: "",
        postalCode: "",
        addressDetail: "",
        phoneNumber: "",
      },
      orderNote: "",
    },
    mode: "onChange",
  });

  /**
   * 결제하기 버튼 클릭 처리
   */
  const handlePayment = async (formData: OrderForm) => {
    console.group("💳 체크아웃 결제창 호출 시작");

    // 1. 폼 유효성 검사
    if (!form.formState.isValid) {
      console.error("❌ 폼 유효성 검사 실패");
      setError("모든 필수 항목을 올바르게 입력해주세요.");
      console.groupEnd();
      return;
    }

    // 2. 결제 정보 구성
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!clientKey) {
      console.error("❌ Toss Payments 클라이언트 키가 설정되지 않음");
      setError("결제 시스템 설정 오류입니다. 관리자에게 문의해주세요.");
      console.groupEnd();
      return;
    }

    // 3. 품절 상품 확인
    const outOfStockItems = items.filter(
      (item) => item.products.stock_quantity === 0,
    );
    if (outOfStockItems.length > 0) {
      console.error("❌ 품절 상품 포함");
      setError("품절된 상품이 포함되어 있습니다.");
      console.groupEnd();
      return;
    }

    const orderId = generateTempOrderId();
    const orderName = generateOrderName(items);
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const successUrl = `${baseUrl}/cart/payment/success`;
    const failUrl = `${baseUrl}/cart/payment/fail`;

    // 4. 배송지 정보를 세션 스토리지에 저장 (결제 승인 시 사용)
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        `checkout_${orderId}`,
        JSON.stringify({
          shippingAddress: formData.shippingAddress,
          orderNote: formData.orderNote,
        }),
      );
    }

    console.log("결제 정보:", {
      주문ID: orderId,
      주문명: orderName,
      결제금액: totalAmount,
      상품개수: items.length,
      받는사람: formData.shippingAddress.customerName,
    });

    setIsProcessing(true);
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
        customerName: formData.shippingAddress.customerName,
        successUrl: `${successUrl}?orderId=${orderId}`,
        failUrl: `${failUrl}?orderId=${orderId}`,
        currency: "KRW",
      });

      console.log("✅ 결제창 호출 완료");
      console.groupEnd();
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
        setIsProcessing(false);
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "결제창을 열 수 없습니다. 잠시 후 다시 시도해주세요.",
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 주문 요약 (왼쪽 - 1/3) */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 sticky top-8">
          <OrderSummary items={items} totalAmount={totalAmount} />
        </div>
      </div>

      {/* 배송지 정보 입력 폼 (오른쪽 - 2/3) */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <ShippingForm form={form} isSubmitting={isProcessing} />

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
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

          {/* 결제하기 버튼 */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={form.handleSubmit(handlePayment)}
              disabled={
                isProcessing ||
                !form.formState.isValid ||
                items.some((item) => item.products.stock_quantity === 0) ||
                totalAmount === 0
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  결제창 열기 중...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  결제하기
                </>
              )}
            </Button>
            {!form.formState.isValid && form.formState.isSubmitted && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2 text-center">
                모든 필수 항목을 올바르게 입력해주세요.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

