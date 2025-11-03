"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getOrder } from "@/actions/order";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CheckCircle2,
  Package,
  Home,
  ShoppingBag,
  AlertCircle,
  Loader2,
} from "lucide-react";

/**
 * @file app/orders/[id]/payment/success/page.tsx
 * @description 결제 성공 페이지
 *
 * Toss Payments 결제가 성공한 후 리다이렉트되는 페이지입니다.
 *
 * 주요 기능:
 * 1. URL 파라미터에서 결제 정보 추출 (paymentKey, orderId, amount)
 * 2. 주문 금액과 결제 금액 검증
 * 3. 결제 성공 메시지 표시
 * 4. 다음 액션 제공 (홈으로, 주문 내역 보기 등)
 *
 * 핵심 구현 로직:
 * - URL 파라미터에서 paymentKey, orderId, amount 추출
 * - 주문 조회 및 금액 검증
 * - 결제 승인은 4단계에서 Server Action으로 처리
 * - 클라이언트 컴포넌트로 URL 파라미터 처리
 *
 * @dependencies
 * - @/actions/order: 주문 Server Actions
 */

/**
 * 가격 포맷팅 함수
 */
function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}

/**
 * 로딩 폴백 컴포넌트 (스켈레톤)
 */
function PaymentSuccessLoading() {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <Skeleton className="h-16 w-16 mx-auto mb-4 rounded-full" />
        <Skeleton className="h-8 w-64 mx-auto mb-2" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

/**
 * 결제 성공 컨텐츠 컴포넌트
 */
function PaymentSuccessContent({
  orderId,
  paymentKey,
  amount,
}: {
  orderId: string;
  paymentKey: string;
  amount: string;
}) {
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validatePayment = async () => {
      console.group("💳 결제 성공 콜백 처리 시작");
      console.log("주문 ID:", orderId);
      console.log("결제 키:", paymentKey.substring(0, 20) + "...");
      console.log("결제 금액:", amount);

      try {
        setIsLoading(true);
        setError(null);

        // 1. 주문 조회
        console.log("📦 주문 정보 조회 중...");
        const orderResult = await getOrder(orderId);

        if (!orderResult.success) {
          console.error("❌ 주문 조회 실패:", orderResult.error);
          console.groupEnd();
          setError(orderResult.error || "주문 정보를 불러올 수 없습니다.");
          setIsLoading(false);
          setIsValidating(false);
          return;
        }

        const orderData = orderResult.data;
        console.log("✅ 주문 조회 완료:", {
          주문ID: orderData.id,
          주문총액: orderData.total_amount,
          주문상태: orderData.status,
        });

        // 2. 금액 검증
        const paymentAmount = Number(amount);
        const orderAmount = Number(orderData.total_amount);

        console.log("💰 결제 금액 검증 중...");
        console.log("  - 주문 총액:", orderAmount);
        console.log("  - 결제 금액:", paymentAmount);

        if (Math.abs(paymentAmount - orderAmount) > 0.01) {
          console.error("❌ 결제 금액 불일치:", {
            주문총액: orderAmount,
            결제금액: paymentAmount,
            차이: Math.abs(paymentAmount - orderAmount),
          });
          console.groupEnd();
          setError(
            `결제 금액이 주문 금액과 일치하지 않습니다. (주문: ${formatPrice(orderAmount)}, 결제: ${formatPrice(paymentAmount)})`,
          );
          setIsLoading(false);
          setIsValidating(false);
          return;
        }

        console.log("✅ 결제 금액 검증 완료");
        console.log("✅ 결제 성공 콜백 처리 완료");
        console.groupEnd();

        setOrder(orderData);
        setIsValidating(false);
      } catch (err) {
        console.error("❌ 예상치 못한 오류 발생:", err);
        console.groupEnd();
        setError("결제 정보를 확인하는 중 오류가 발생했습니다.");
        setIsValidating(false);
      } finally {
        setIsLoading(false);
      }
    };

    validatePayment();
  }, [orderId, paymentKey, amount]);

  if (isLoading || isValidating) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <Loader2 className="w-8 h-8 text-green-600 dark:text-green-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            결제 확인 중...
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            결제 정보를 확인하고 있습니다.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            결제 확인 실패
          </h1>
          <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/">홈으로</Link>
            </Button>
            <Button asChild>
              <Link href="/orders">주문 내역</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

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
          주문이 성공적으로 처리되었습니다.
        </p>
      </div>

      {/* 주문 정보 */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Package className="w-5 h-5" />
          주문 정보
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">주문 번호</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {order.id.substring(0, 8)}...
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">결제 금액</span>
            <span className="font-bold text-green-600 dark:text-green-400">
              {formatPrice(order.total_amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">주문 상태</span>
            <span className="font-medium text-gray-900 dark:text-white">
              결제 완료
            </span>
          </div>
        </div>
      </div>

      {/* 주문 상품 목록 */}
      {order.order_items && order.order_items.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            주문 상품
          </h2>
          <div className="space-y-3">
            {order.order_items.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.product_name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    수량: {item.quantity}개
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatPrice(Number(item.price) * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                총 결제금액
              </span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-4">
        <Button asChild variant="outline" className="flex-1">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            홈으로
          </Link>
        </Button>
        <Button asChild className="flex-1">
          <Link href="/orders">
            <ShoppingBag className="w-4 h-4 mr-2" />
            주문 내역
          </Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * 결제 성공 페이지 (Client Component)
 */
interface PaymentSuccessPageProps {
  params: Promise<{ id: string }>;
}

export default function PaymentSuccessPage(props: PaymentSuccessPageProps) {
  const [mounted, setMounted] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await props.params;
      setOrderId(resolvedParams.id);
      setMounted(true);
    };
    init();
  }, [props.params]);

  if (!mounted || !orderId) {
    return <PaymentSuccessLoading />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Suspense fallback={<PaymentSuccessLoading />}>
        <PaymentSuccessPageContent orderId={orderId} />
      </Suspense>
    </div>
  );
}

/**
 * URL 파라미터를 처리하는 내부 컴포넌트
 */
function PaymentSuccessPageContent({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  const paymentKey = searchParams.get("paymentKey");
  const amount = searchParams.get("amount");

  if (!paymentKey || !amount) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          결제 정보가 없습니다
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          결제 정보를 확인할 수 없습니다. 주문 내역에서 확인해주세요.
        </p>
        <Button asChild>
          <Link href="/">홈으로</Link>
        </Button>
      </div>
    );
  }

  return (
    <PaymentSuccessContent
      orderId={orderId}
      paymentKey={paymentKey}
      amount={amount}
    />
  );
}

