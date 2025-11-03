"use client";

import Script from "next/script";

/**
 * @file components/tosspayments-script.tsx
 * @description Toss Payments v1 결제창 SDK 스크립트 로더
 *
 * Toss Payments SDK v1 결제창 스크립트를 로드하는 컴포넌트입니다.
 * Next.js의 Script 컴포넌트를 사용하여 최적화된 방식으로 로드합니다.
 *
 * @dependencies
 * - next/script: Next.js Script 컴포넌트
 * - Toss Payments SDK v1: https://js.tosspayments.com/v1/payment
 */

/**
 * Toss Payments v1 결제창 SDK 스크립트 로더 컴포넌트
 *
 * 이 컴포넌트는 페이지의 어디에든 배치할 수 있으며,
 * 한 번만 렌더링되면 전역적으로 TossPayments를 사용할 수 있습니다.
 *
 * v1 결제창 SDK는 더 이상 업데이트되지 않지만, 테스트 결제에 사용 가능합니다.
 */
export function TossPaymentsScript() {
  return (
    <Script
      src="https://js.tosspayments.com/v1/payment"
      strategy="afterInteractive"
      onLoad={() => {
        console.log("✅ Toss Payments v1 결제창 SDK 로드 완료");
      }}
      onError={() => {
        console.error("❌ Toss Payments v1 결제창 SDK 로드 실패");
      }}
    />
  );
}
