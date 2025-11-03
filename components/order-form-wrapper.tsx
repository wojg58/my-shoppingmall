"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShippingForm } from "@/components/shipping-form";
import { orderFormSchema, type OrderForm } from "@/lib/schemas/order";
import { createOrder } from "@/actions/order";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, AlertCircle } from "lucide-react";

/**
 * @file components/order-form-wrapper.tsx
 * @description 주문 폼 래퍼 컴포넌트
 *
 * 주문 페이지에서 배송지 폼과 제출 버튼을 함께 관리하는 래퍼 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 배송지 폼 렌더링
 * 2. 주문 생성 버튼
 * 3. 폼 제출 처리
 * 4. 로딩 상태 관리
 *
 * @dependencies
 * - @/components/shipping-form: 배송지 정보 폼
 * - @/lib/schemas/order: 주문 스키마
 */

interface OrderFormWrapperProps {
  onSubmit?: (data: OrderForm) => void | Promise<void>;
  disabled?: boolean;
}

/**
 * 주문 폼 래퍼 컴포넌트
 *
 * @param onSubmit 폼 제출 시 호출되는 콜백 함수
 * @param isSubmitting 제출 중 여부
 * @param disabled 버튼 비활성화 여부
 */
export function OrderFormWrapper({
  onSubmit: externalOnSubmit,
  disabled = false,
}: OrderFormWrapperProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    mode: "onChange", // 실시간 검증
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    console.group("📦 주문 제출 시작");
    console.log("주문 데이터:", data);

    setIsSubmitting(true);
    setError(null);

    try {
      // 외부 onSubmit이 있으면 우선 호출
      if (externalOnSubmit) {
        await externalOnSubmit(data);
      }

      // 주문 생성 Server Action 호출
      const result = await createOrder(data);

      if (result.success) {
        console.log("✅ 주문 생성 성공:", {
          주문ID: result.data.orderId,
          총액: result.data.totalAmount,
        });
        console.groupEnd();

        // 주문 성공 페이지로 리다이렉트
        router.push(`/orders/${result.data.orderId}/success`);
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
  });

  return (
    <div className="space-y-6">
      <ShippingForm form={form} isSubmitting={isSubmitting} />

      {/* 주문하기 버튼 */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={handleSubmit}
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
