"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  initializeTossPayments,
  createPaymentWidget,
} from "@/lib/tosspayments/client";
import { Loader2, AlertCircle } from "lucide-react";

/**
 * @file components/payment-widget.tsx
 * @description Toss Payments 결제위젯 컴포넌트
 *
 * 주문 페이지에 결제위젯을 렌더링하고 결제 요청을 처리하는 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 결제위젯 UI 렌더링
 * 2. 결제 금액 설정
 * 3. 결제 요청 처리
 * 4. 로딩 및 에러 상태 관리
 *
 * @dependencies
 * - @/lib/tosspayments/client: Toss Payments 클라이언트 유틸리티
 */

interface PaymentWidgetProps {
  /** 결제 금액 (원 단위) */
  amount: number;
  /** 주문 ID */
  orderId: string;
  /** 주문명 */
  orderName: string;
  /** 결제 성공 시 리다이렉트 URL */
  successUrl: string;
  /** 결제 실패 시 리다이렉트 URL */
  failUrl: string;
  /** 고객 이메일 */
  customerEmail?: string;
  /** 고객 이름 */
  customerName?: string;
  /** 고객 전화번호 */
  customerMobilePhone?: string;
  /** 결제위젯 인스턴스를 외부로 전달하는 콜백 */
  onWidgetsReady?: (widgets: any) => void;
}

/**
 * PaymentWidget이 노출하는 메서드
 */
export interface PaymentWidgetHandle {
  /** 결제 요청 */
  requestPayment: () => Promise<void>;
  /** 결제위젯 인스턴스 */
  widgets: any | null;
}

/**
 * 결제위젯 컴포넌트
 */
export const PaymentWidget = forwardRef<PaymentWidgetHandle, PaymentWidgetProps>(
  function PaymentWidget(
    {
      amount,
      orderId,
      orderName,
      successUrl,
      failUrl,
      customerEmail,
      customerName,
      customerMobilePhone,
      onWidgetsReady,
    },
    ref,
  ) {
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const widgetsRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Toss Payments 클라이언트 키
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

  useEffect(() => {
    if (!clientKey) {
      setError("Toss Payments 클라이언트 키가 설정되지 않았습니다.");
      setIsLoading(false);
      return;
    }

    if (!userId) {
      setError("로그인이 필요합니다.");
      setIsLoading(false);
      return;
    }

    // 이미 초기화되었으면 스킵
    if (isInitializedRef.current) {
      return;
    }

    const initializeWidget = async () => {
      console.group("💳 결제위젯 초기화 시작");
      console.log("주문 ID:", orderId);
      console.log("결제 금액:", amount);

      try {
        setIsLoading(true);
        setError(null);

        // 1. Toss Payments 초기화
        const tossPayments = await initializeTossPayments(clientKey);

        // 2. 결제위젯 인스턴스 생성 (customerKey는 Clerk user ID 사용)
        const widgets = createPaymentWidget(tossPayments, userId);
        widgetsRef.current = widgets;

        // 3. 결제 금액 설정
        console.log("💰 결제 금액 설정 중...");
        await widgets.setAmount({
          currency: "KRW",
          value: amount,
        });

        // 4. 결제 UI 렌더링
        console.log("🎨 결제 UI 렌더링 중...");
        await widgets.renderPaymentMethods({
          selector: "#payment-method",
          variantKey: "DEFAULT",
        });

        // 5. 약관 UI 렌더링
        console.log("📋 약관 UI 렌더링 중...");
        await widgets.renderAgreement({
          selector: "#agreement",
          variantKey: "AGREEMENT",
        });

        console.log("✅ 결제위젯 초기화 완료");
        console.groupEnd();

        isInitializedRef.current = true;
        setIsLoading(false);

        // 외부로 widgets 인스턴스 전달
        if (onWidgetsReady) {
          onWidgetsReady(widgets);
        }
      } catch (err) {
        console.error("❌ 결제위젯 초기화 실패:", err);
        console.groupEnd();
        setError(
          err instanceof Error
            ? err.message
            : "결제위젯을 초기화할 수 없습니다.",
        );
        setIsLoading(false);
      }
    };

    initializeWidget();

    // 클린업 함수
    return () => {
      // 컴포넌트 언마운트 시 정리 작업은 필요하지 않음
      // (Toss Payments SDK는 전역적으로 관리됨)
    };
  }, [clientKey, userId, orderId, amount]);

  /**
   * 결제 요청 처리
   */
  const requestPayment = async () => {
    if (!widgetsRef.current) {
      throw new Error("결제위젯이 아직 초기화되지 않았습니다.");
    }

    console.group("💳 결제 요청 시작");
    console.log("주문 ID:", orderId);
    console.log("결제 금액:", amount);

    try {
      // 결제 요청
      await widgetsRef.current.requestPayment({
        orderId,
        orderName,
        successUrl,
        failUrl,
        customerEmail,
        customerName,
        customerMobilePhone,
      });

      console.log("✅ 결제 요청 완료");
      console.groupEnd();
    } catch (err) {
      console.error("❌ 결제 요청 실패:", err);
      console.groupEnd();

      // 사용자가 결제를 취소한 경우는 에러를 던지지 않음
      if (
        err instanceof Error &&
        (err.message.includes("PAY_PROCESS_CANCELED") ||
          err.message.includes("사용자가 결제를 취소"))
      ) {
        console.log("ℹ️ 사용자가 결제를 취소했습니다.");
        return;
      }

      throw err;
    }
  };

  // 외부에서 사용할 수 있도록 ref 노출
  useImperativeHandle(
    ref,
    () => ({
      requestPayment,
      widgets: widgetsRef.current,
    }),
    [orderId, orderName, successUrl, failUrl, customerEmail, customerName, customerMobilePhone],
  );

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              결제위젯 오류
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            결제위젯을 불러오는 중...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 결제 UI */}
      <div id="payment-method" className="border border-gray-200 dark:border-gray-700 rounded-lg p-4" />

      {/* 약관 UI */}
      <div id="agreement" className="border border-gray-200 dark:border-gray-700 rounded-lg p-4" />

      {/* 결제하기 버튼은 외부에서 제공 */}
    </div>
  );
  },
);

