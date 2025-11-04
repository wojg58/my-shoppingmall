"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { getOrder, cancelOrder, type Order } from "@/actions/order";
import { getOrderStatusLabel } from "@/constants/order-status";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Package, MapPin, X } from "lucide-react";
import Link from "next/link";

/**
 * @file components/order-detail-accordion.tsx
 * @description 주문 상세 아코디언 컴포넌트
 *
 * 주문 카드에서 펼쳐지는 주문 상세 정보를 표시하는 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 주문 상세 정보 표시 (주문 번호, 날짜, 총액, 상태)
 * 2. 주문 상품 목록 표시
 * 3. 배송지 정보 표시
 * 4. 주문 취소 기능 (pending 상태일 때만)
 *
 * @dependencies
 * - @/actions/order: 주문 조회 및 취소 Server Actions
 * - @/constants/order-status: 주문 상태 한글 라벨
 */

interface OrderDetailAccordionProps {
  orderId: string;
  orderStatus: string;
  isOpen?: boolean;
}

/**
 * 가격 포맷팅 함수
 */
function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}

/**
 * 주문 상세 아코디언 컴포넌트
 *
 * @param orderId 주문 ID
 * @param orderStatus 주문 상태
 */
export function OrderDetailAccordion({
  orderId,
  orderStatus,
  isOpen = false,
}: OrderDetailAccordionProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  /**
   * 주문 상세 정보 로드
   */
  const loadOrderDetail = React.useCallback(async () => {
    if (order || isLoading) return; // 이미 로드된 경우 또는 로딩 중

    setIsLoading(true);
    setError(null);

    console.group("📦 주문 상세 정보 로드");
    console.log("주문 ID:", orderId);

    try {
      const result = await getOrder(orderId);

      if (!result.success) {
        console.error("❌ 주문 조회 실패:", result.error);
        setError(result.error);
        console.groupEnd();
        return;
      }

      console.log("✅ 주문 조회 완료:", {
        주문ID: result.data.id,
        총액: result.data.total_amount,
        상품개수: result.data.order_items.length,
      });
      console.groupEnd();

      setOrder(result.data);
    } catch (err) {
      console.error("❌ 예상치 못한 오류:", err);
      setError("주문 정보를 불러올 수 없습니다.");
      console.groupEnd();
    } finally {
      setIsLoading(false);
    }
  }, [orderId, order, isLoading]);

  /**
   * 주문 취소 처리
   */
  const handleCancelOrder = async () => {
    if (!confirm("정말 주문을 취소하시겠습니까?")) {
      return;
    }

    setIsCancelling(true);
    setError(null);

    console.group("❌ 주문 취소 처리");
    console.log("주문 ID:", orderId);

    try {
      const result = await cancelOrder(orderId);

      if (!result.success) {
        console.error("❌ 주문 취소 실패:", result.error);
        setError(result.error);
        console.groupEnd();
        return;
      }

      console.log("✅ 주문 취소 완료");
      console.groupEnd();

      // 주문 목록 새로고침
      router.refresh();
    } catch (err) {
      console.error("❌ 예상치 못한 오류:", err);
      setError("주문 취소 중 오류가 발생했습니다.");
      console.groupEnd();
    } finally {
      setIsCancelling(false);
    }
  };

  // 아코디언이 열릴 때만 주문 상세 정보 로드
  useEffect(() => {
    if (isOpen && !order && !isLoading) {
      loadOrderDetail();
    }
  }, [isOpen, order, isLoading, loadOrderDetail]);

  return (
    <div>

      {/* 주문 상세 정보 */}
      <div className="p-6 bg-gray-50 dark:bg-gray-900/50">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {order && !isLoading && !error && (
          <div className="space-y-6">
            {/* 주문 정보 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                주문 정보
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    주문 번호
                  </span>
                  <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {order.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    주문 상태
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {getOrderStatusLabel(order.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    주문일시
                  </span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(order.created_at).toLocaleString("ko-KR")}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    총 주문 금액
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* 주문 상품 목록 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                주문 상품
              </h3>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="relative w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.product_id}`}
                        className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-primary transition-colors block"
                      >
                        {item.product_name}
                      </Link>
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium">
                          {formatPrice(item.price)}
                        </span>
                        {" × "}
                        <span className="font-medium">{item.quantity}개</span>
                        {" = "}
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 배송지 정보 */}
            {order.shipping_address && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  배송지 정보
                </h3>

                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    {order.shipping_address.address}{" "}
                    {order.shipping_address.addressDetail || ""}
                  </p>
                  <p>우편번호: {order.shipping_address.postalCode}</p>
                  <p>연락처: {order.shipping_address.phoneNumber}</p>
                </div>
              </div>
            )}

            {/* 주문 메모 */}
            {order.order_note && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  주문 메모
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {order.order_note}
                </p>
              </div>
            )}

            {/* 주문 취소 버튼 (pending 상태일 때만) */}
            {orderStatus === "pending" && (
              <div className="pt-4">
                <Button
                  variant="destructive"
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  {isCancelling ? "취소 중..." : "주문 취소"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

