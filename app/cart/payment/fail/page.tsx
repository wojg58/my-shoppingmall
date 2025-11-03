"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

/**
 * @file app/cart/payment/fail/page.tsx
 * @description 장바구니 결제 실패 페이지 (임시)
 *
 * 장바구니에서 직접 결제한 경우의 실패 페이지입니다.
 *
 * 주요 기능:
 * 1. URL 파라미터에서 실패 정보 추출 (code, message)
 * 2. 실패 메시지 표시
 * 3. 재시도 옵션 제공
 *
 * @dependencies
 * - next/navigation: useSearchParams
 */

/**
 * 에러 코드를 사용자 친화적인 메시지로 변환
 */
function getErrorMessage(code: string | null, message: string | null): string {
  if (message) {
    return message;
  }

  const errorMessages: Record<string, string> = {
    USER_CANCEL: "결제가 취소되었습니다.",
    PAY_PROCESS_CANCELED: "결제가 취소되었습니다.",
    PAY_PROCESS_ABORTED: "결제가 중단되었습니다.",
    INVALID_CARD: "유효하지 않은 카드 정보입니다.",
    CARD_INSTALLMENT_PLAN_DISABLED: "할부가 지원되지 않는 카드입니다.",
    INSUFFICIENT_BALANCE: "잔액이 부족합니다.",
    EXCEED_MAX_CARD_INSTALLMENT_PLAN: "할부 개월 수가 최대치를 초과했습니다.",
    NOT_ALLOWED_POINT_USE: "포인트 사용이 불가능합니다.",
    EXCEED_MAX_POINT_USE_AMOUNT: "포인트 사용 한도를 초과했습니다.",
    INVALID_PAYMENT_AMOUNT: "결제 금액이 올바르지 않습니다.",
    NOT_ALLOWED_PAYMENT_METHOD: "사용할 수 없는 결제 수단입니다.",
    REJECT_CARD_PAYMENT: "카드 결제가 거부되었습니다.",
    REJECT_ACCOUNT_PAYMENT: "계좌 이체가 거부되었습니다.",
    REJECT_GENERAL_PAYMENT: "결제가 거부되었습니다.",
  };

  if (code && errorMessages[code]) {
    return errorMessages[code];
  }

  return "결제 중 오류가 발생했습니다. 다시 시도해주세요.";
}

/**
 * 로딩 폴백 컴포넌트
 */
function PaymentFailLoading() {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <Skeleton className="h-16 w-16 mx-auto mb-4 rounded-full" />
        <Skeleton className="h-8 w-64 mx-auto mb-2" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  );
}

/**
 * 결제 실패 컨텐츠 컴포넌트
 */
function PaymentFailContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const errorMessage = getErrorMessage(code, message);

  useEffect(() => {
    console.group("💳 장바구니 결제 실패 콜백 처리");
    console.log("에러 코드:", code);
    console.log("에러 메시지:", message);
    console.log("사용자 메시지:", errorMessage);
    console.groupEnd();
  }, [code, message, errorMessage]);

  return (
    <div className="space-y-6">
      {/* 실패 메시지 */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          결제에 실패했습니다
        </h1>
        <p className="text-red-600 dark:text-red-400 mb-2">{errorMessage}</p>
        {code && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            오류 코드: {code}
          </p>
        )}
      </div>

      {/* 안내 메시지 */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-1">결제가 완료되지 않았습니다</p>
            <p>
              결제 중 오류가 발생했습니다. 아래 버튼을 눌러 다시 결제하시거나
              장바구니로 돌아가 주문을 확인해주세요.
            </p>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-4">
        <Button asChild variant="outline" className="flex-1">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            홈으로
          </Link>
        </Button>
        <Button asChild className="flex-1">
          <Link href="/cart">
            <RefreshCw className="w-4 h-4 mr-2" />
            장바구니로 돌아가기
          </Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * 결제 실패 페이지
 */
export default function CartPaymentFailPage() {
  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-16">
      <div className="w-full max-w-4xl mx-auto">
        <Suspense fallback={<PaymentFailLoading />}>
          <PaymentFailContent />
        </Suspense>
      </div>
    </main>
  );
}

