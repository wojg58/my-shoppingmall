"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShippingForm } from "@/components/shipping-form";
import { orderFormSchema, type OrderForm } from "@/lib/schemas/order";
import { createOrder } from "@/actions/order";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, AlertCircle, CreditCard } from "lucide-react";
import { PaymentWidget, type PaymentWidgetHandle } from "@/components/payment-widget";

/**
 * @file components/order-payment-flow.tsx
 * @description 주문 및 결제 플로우 컴포넌트
 *
 * 주문 생성부터 결제까지의 전체 플로우를 관리하는 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 배송지 정보 입력 및 주문 생성
 * 2. 결제위젯 렌더링
 * 3. 결제 요청 처리
 * 4. 결제 성공/실패 처리
 *
 * @dependencies
 * - @/components/shipping-form: 배송지 정보 폼
 * - @/components/payment-widget: 결제위젯 컴포넌트
 * - @/actions/order: 주문 생성 Server Action
 */

interface OrderPaymentFlowProps {
  /** 장바구니 총액 */
  totalAmount: number;
  /** 장바구니 아이템 목록 (주문명 생성용) */
  itemNames: string[];
  /** 비활성화 여부 (예: 품절 상품 포함) */
  disabled?: boolean;
}

/**
 * 주문 및 결제 플로우 컴포넌트
 */
export function OrderPaymentFlow({
  totalAmount,
  itemNames,
  disabled = false,
}: OrderPaymentFlowProps) {
  const router = useRouter();
  const { userId } = useAuth();
  const [step, setStep] = useState<"form" | "payment">("form");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paymentWidgetRef = useRef<PaymentWidgetHandle>(null);

  const form = useForm<OrderForm>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      shippingAddress: {
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
   * 주문 생성
   */
  const handleCreateOrder = async (data: OrderForm) => {
    console.group("📦 주문 생성 시작");
    console.log("주문 데이터:", data);

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createOrder(data);

      if (result.success) {
        console.log("✅ 주문 생성 성공:", {
          주문ID: result.data.orderId,
          총액: result.data.totalAmount,
        });
        console.groupEnd();

        setOrderId(result.data.orderId);
        setStep("payment");
      } else {
        console.error("❌ 주문 생성 실패:", result.error);
        console.groupEnd();
        setError(result.error);
      }
    } catch (err) {
      console.error("❌ 예상치 못한 오류 발생:", err);
      console.groupEnd();
      setError("주문 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 결제 요청 처리
   */
  const handleRequestPayment = async () => {
    if (!paymentWidgetRef.current) {
      setError("결제위젯이 아직 준비되지 않았습니다.");
      return;
    }

    if (!orderId) {
      setError("주문 ID가 없습니다. 주문을 먼저 생성해주세요.");
      return;
    }

    try {
      setError(null);
      await paymentWidgetRef.current.requestPayment();
    } catch (err) {
      // 사용자가 결제를 취소한 경우는 에러로 표시하지 않음
      if (
        err instanceof Error &&
        (err.message.includes("PAY_PROCESS_CANCELED") ||
          err.message.includes("사용자가 결제를 취소"))
      ) {
        console.log("ℹ️ 사용자가 결제를 취소했습니다.");
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "결제 요청 중 오류가 발생했습니다.",
      );
    }
  };

  // 주문명 생성
  const orderName =
    itemNames.length === 1
      ? itemNames[0]
      : `${itemNames[0]} 외 ${itemNames.length - 1}건`;

  // 폼 단계
  if (step === "form") {
    return (
      <div className="space-y-6">
        <ShippingForm form={form} isSubmitting={isSubmitting} />

        {/* 주문하기 버튼 */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={form.handleSubmit(handleCreateOrder)}
            disabled={isSubmitting || disabled || !form.formState.isValid}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                주문 처리 중...
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                주문하기
              </>
            )}
          </Button>
          {!form.formState.isValid && form.formState.isSubmitted && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2 text-center">
              모든 필수 항목을 올바르게 입력해주세요.
            </p>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    주문 실패
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 결제 단계
  if (step === "payment" && orderId) {
    return (
      <div className="space-y-6">
        {/* 주문 생성 성공 메시지 */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                주문이 생성되었습니다
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                아래 결제 수단을 선택하고 결제를 진행해주세요.
              </p>
            </div>
          </div>
        </div>

        {/* 결제위젯 */}
        <PaymentWidget
          ref={paymentWidgetRef}
          amount={totalAmount}
          orderId={orderId}
          orderName={orderName}
          successUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/orders/${orderId}/payment/success`}
          failUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/orders/${orderId}/payment/fail`}
          customerMobilePhone={form.getValues("shippingAddress").phoneNumber}
          onWidgetsReady={(widgets) => {
            // 결제위젯 준비 완료 (추가 처리 필요 시)
          }}
        />

        {/* 결제하기 버튼 */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={handleRequestPayment}
            disabled={!paymentWidgetRef.current?.widgets}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            결제하기
          </Button>
          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    결제 실패
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

