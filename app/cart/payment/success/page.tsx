"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  CheckCircle2,
  Home,
  ShoppingBag,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { confirmPaymentAndCreateOrder } from "@/actions/payment";

/**
 * @file app/cart/payment/success/page.tsx
 * @description 장바구니 결제 성공 페이지 (임시)
 *
 * 장바구니에서 직접 결제한 경우의 성공 페이지입니다.
 * 결제 승인 후 실제 주문을 생성하는 로직은 추후 구현됩니다.
 *
 * 주요 기능:
 * 1. URL 파라미터에서 결제 정보 추출 (paymentKey, orderId, amount)
 * 2. 결제 성공 메시지 표시
 * 3. 다음 액션 제공
 *
 * @dependencies
 * - next/navigation: useSearchParams
 */

/**
 * 가격 포맷팅 함수
 */
function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}

/**
 * 로딩 폴백 컴포넌트
 */
function PaymentSuccessLoading() {
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
 * 결제 성공 컨텐츠 컴포넌트
 */
function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");

  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<{
    orderId: string;
    totalAmount: number;
  } | null>(null);
  const [shippingInfo, setShippingInfo] = useState<{
    shippingAddress?: {
      customerName: string;
      address: string;
      postalCode: string;
      addressDetail?: string;
      phoneNumber: string;
    };
    orderNote?: string;
  } | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      console.group("💳 장바구니 결제 성공 콜백 처리 시작");

      if (!paymentKey || !orderId || !amount) {
        console.error("❌ 필수 결제 정보 누락");
        setError("결제 정보가 없습니다.");
        setIsProcessing(false);
        console.groupEnd();
        return;
      }

      const paymentAmount = Number(amount);

      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        console.error("❌ 유효하지 않은 결제 금액");
        setError("유효하지 않은 결제 금액입니다.");
        setIsProcessing(false);
        console.groupEnd();
        return;
      }

      console.log("결제 정보:", {
        결제키: paymentKey.substring(0, 20) + "...",
        주문ID: orderId,
        결제금액: paymentAmount,
      });

      // 세션 스토리지에서 배송지 정보 가져오기
      let shippingData: {
        shippingAddress?: {
          customerName: string;
          address: string;
          postalCode: string;
          addressDetail?: string;
          phoneNumber: string;
        };
        orderNote?: string;
      } | null = null;

      if (typeof window !== "undefined") {
        const storedData = sessionStorage.getItem(`checkout_${orderId}`);
        if (storedData) {
          try {
            shippingData = JSON.parse(storedData);
            console.log("✅ 배송지 정보 로드 완료:", shippingData);
          } catch (err) {
            console.error("❌ 배송지 정보 파싱 실패:", err);
          }
        }
      }

      setShippingInfo(shippingData);

      try {
        // 결제 승인 및 주문 저장
        console.log("🔐 결제 승인 및 주문 저장 시작...");
        const result = await confirmPaymentAndCreateOrder(
          paymentKey,
          orderId,
          paymentAmount,
          shippingData?.shippingAddress,
          shippingData?.orderNote,
        );

        // 성공 시 세션 스토리지에서 배송지 정보 삭제
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(`checkout_${orderId}`);
        }

        if (!result.success) {
          console.error("❌ 결제 승인 실패:", result.error);
          setError(result.error);
          setIsProcessing(false);
          console.groupEnd();
          return;
        }

        console.log("✅ 결제 승인 및 주문 저장 완료:", result.data);
        setOrderData({
          orderId: result.data.orderId,
          totalAmount: result.data.totalAmount,
        });
        setIsProcessing(false);

        // 장바구니 페이지 새로고침 (캐시 무효화)
        router.refresh();

        console.groupEnd();
      } catch (err) {
        console.error("❌ 예상치 못한 오류:", err);
        setError(
          err instanceof Error
            ? err.message
            : "결제 처리 중 오류가 발생했습니다.",
        );
        setIsProcessing(false);
        console.groupEnd();
      }
    };

    processPayment();
  }, [paymentKey, orderId, amount, router]);

  // 필수 정보 없음
  if (!paymentKey || !orderId || !amount) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          결제 정보가 없습니다
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          결제 정보를 확인할 수 없습니다.
        </p>
        <Button asChild>
          <Link href="/">홈으로</Link>
        </Button>
      </div>
    );
  }

  // 처리 중
  if (isProcessing) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            결제 처리 중...
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            결제 승인 및 주문 저장을 진행하고 있습니다.
          </p>
        </div>
      </div>
    );
  }

  // 에러 발생
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            결제 처리 실패
          </h1>
          <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/">홈으로</Link>
            </Button>
            <Button asChild>
              <Link href="/cart">장바구니로 돌아가기</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 성공
  if (!orderData) {
    return null;
  }

  const paymentAmount = orderData.totalAmount;

  return (
    <div className="space-y-6">
      {/* 성공 메시지 */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          결제가 완료되었습니다
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          결제가 성공적으로 처리되었습니다.
        </p>
      </div>

      {/* 결제 정보 */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          결제 정보
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">결제 금액</span>
            <span className="font-bold text-green-600 dark:text-green-400">
              {formatPrice(paymentAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">주문 번호</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {orderData.orderId.substring(0, 8)}...
            </span>
          </div>
        </div>
      </div>

      {/* 성공 안내 메시지 */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
          <div className="text-sm text-green-800 dark:text-green-200">
            <p className="font-medium mb-1">결제 및 주문이 완료되었습니다</p>
            <p>
              결제가 승인되었고 주문이 저장되었습니다. 주문 내역은 마이페이지에서
              확인할 수 있습니다.
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
          <Link href="/products">
            <ShoppingBag className="w-4 h-4 mr-2" />
            쇼핑 계속하기
          </Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * 결제 성공 페이지
 */
export default function CartPaymentSuccessPage() {
  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-16">
      <div className="w-full max-w-4xl mx-auto">
        <Suspense fallback={<PaymentSuccessLoading />}>
          <PaymentSuccessContent />
        </Suspense>
      </div>
    </main>
  );
}

