/**
 * @file lib/tosspayments/client.ts
 * @description Toss Payments v1 결제창 클라이언트 유틸리티
 *
 * Toss Payments v1 결제창 SDK를 초기화하고 관리하는 유틸리티입니다.
 *
 * 주요 기능:
 * 1. Toss Payments v1 결제창 SDK 로드 (npm 패키지 또는 스크립트)
 * 2. 클라이언트 키를 사용한 SDK 초기화
 * 3. 결제창 호출 메서드 제공
 *
 * @dependencies
 * - @tosspayments/payment-sdk: npm 패키지 (v1)
 * - Toss Payments SDK v1 스크립트: https://js.tosspayments.com/v1/payment
 */

/**
 * Toss Payments v1 결제창 SDK 로드 함수
 *
 * npm 패키지(@tosspayments/payment-sdk)를 우선 사용하고,
 * 없을 경우 스크립트 태그 방식으로 폴백합니다.
 *
 * @returns loadTossPayments 함수 (클라이언트 키를 받아 초기화 함수 반환)
 */
export async function loadTossPayments() {
  // 브라우저 환경 확인
  if (typeof window === "undefined") {
    throw new Error("TossPayments는 브라우저 환경에서만 사용할 수 있습니다.");
  }

  // npm 패키지 방식 우선 시도
  try {
    const { loadTossPayments: loadFromPackage } = await import(
      "@tosspayments/payment-sdk"
    );
    console.log("✅ Toss Payments v1 SDK (npm 패키지) 로드 성공");
    return loadFromPackage;
  } catch {
    console.log("⚠️ npm 패키지 로드 실패, 스크립트 태그 방식으로 폴백");
  }

  // 스크립트 태그 방식 폴백
  // SDK가 이미 로드되어 있으면 반환
  if (window.TossPayments) {
    console.log("✅ Toss Payments v1 SDK (스크립트) 이미 로드됨");
    return window.TossPayments;
  }

  // SDK 스크립트가 이미 추가되어 있는지 확인
  if (
    document.querySelector(
      'script[src="https://js.tosspayments.com/v1/payment"]',
    )
  ) {
    // 스크립트가 로드될 때까지 대기
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (window.TossPayments) {
          clearInterval(checkInterval);
          console.log("✅ Toss Payments v1 SDK (스크립트) 로드 완료");
          resolve(window.TossPayments);
        }
      }, 100);

      // 최대 10초 대기
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error("TossPayments v1 SDK 로드 시간 초과"));
      }, 10000);
    });
  }

  // SDK 스크립트 동적 로드
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v1/payment";
    script.async = true;
    script.onload = () => {
      if (window.TossPayments) {
        console.log("✅ Toss Payments v1 SDK (스크립트) 로드 완료");
        resolve(window.TossPayments);
      } else {
        reject(new Error("TossPayments v1 SDK 로드 실패"));
      }
    };
    script.onerror = () => {
      reject(new Error("TossPayments v1 SDK 스크립트 로드 실패"));
    };
    document.head.appendChild(script);
  });
}

/**
 * Toss Payments v1 결제창 클라이언트 초기화
 *
 * v1 결제창 SDK를 사용하여 결제창 객체를 초기화합니다.
 * npm 패키지 또는 스크립트 태그 방식 모두 지원합니다.
 *
 * @param clientKey Toss Payments 클라이언트 키 (v1 API 개별 연동 키)
 * @returns TossPayments 인스턴스 (결제창 호출 메서드 포함)
 */
export async function initializeTossPayments(clientKey: string) {
  console.group("💳 Toss Payments v1 결제창 초기화 시작");
  console.log("클라이언트 키:", clientKey.substring(0, 10) + "...");

  try {
    const loadTossPaymentsFn = await loadTossPayments();

    // npm 패키지의 loadTossPayments는 Promise를 반환
    // 스크립트의 TossPayments는 직접 객체를 반환
    const tossPayments = await loadTossPaymentsFn(clientKey);

    console.log("✅ Toss Payments v1 결제창 초기화 완료");
    console.groupEnd();

    return tossPayments;
  } catch (error) {
    console.error("❌ Toss Payments v1 결제창 초기화 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 결제위젯 인스턴스 생성
 *
 * @param tossPayments TossPayments 인스턴스
 * @param customerKey 고객 키 (Clerk user ID)
 * @returns 결제위젯 인스턴스
 */
export function createPaymentWidget(tossPayments: any, customerKey: string) {
  console.log("🎨 결제위젯 인스턴스 생성:", {
    customerKey: customerKey.substring(0, 10) + "...",
  });

  // TossPayments 인스턴스에서 결제위젯 생성
  return tossPayments;
}

// TypeScript 전역 타입 선언
declare global {
  interface Window {
    TossPayments?: (clientKey: string) => Promise<any> | any;
  }
}
