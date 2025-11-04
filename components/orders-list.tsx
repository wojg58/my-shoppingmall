import { getOrders } from "@/actions/order";
import { OrderCard } from "@/components/order-card";
import { AlertCircle, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * @file components/orders-list.tsx
 * @description 주문 목록 컴포넌트
 *
 * 사용자의 주문 목록을 표시하는 Server Component입니다.
 *
 * 주요 기능:
 * 1. Server Component로 주문 데이터 페칭
 * 2. 주문 목록 표시 (최신순)
 * 3. 빈 상태 처리 (주문 내역 없음)
 * 4. 에러 상태 처리
 *
 * @dependencies
 * - @/actions/order: 주문 조회 Server Actions
 * - @/components/order-card: 주문 카드 컴포넌트
 */

/**
 * 주문 목록 컴포넌트 (Server Component)
 */
export async function OrdersList() {
  console.group("📦 주문 목록 컴포넌트 렌더링");

  // 주문 목록 조회
  const result = await getOrders();

  if (!result.success) {
    console.error("❌ 주문 목록 조회 실패:", result.error);
    console.groupEnd();
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          주문 목록을 불러올 수 없습니다
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{result.error}</p>
        <Button asChild>
          <Link href="/">홈으로 가기</Link>
        </Button>
      </div>
    );
  }

  const orders = result.data;

  if (orders.length === 0) {
    console.log("⚠️ 주문 목록이 비어있음");
    console.groupEnd();
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          주문 내역이 없습니다
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          아직 주문한 상품이 없습니다.
        </p>
        <Button asChild>
          <Link href="/products">쇼핑하러 가기</Link>
        </Button>
      </div>
    );
  }

  console.log("✅ 주문 목록 표시:", {
    주문개수: orders.length,
  });
  console.groupEnd();

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

