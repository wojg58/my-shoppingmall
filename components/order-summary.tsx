import Link from "next/link";
import { Package } from "lucide-react";
import { CartItem } from "@/actions/cart";
import { getCategoryLabel } from "@/constants/categories";

/**
 * @file components/order-summary.tsx
 * @description 주문 요약 정보 컴포넌트
 *
 * 주문 페이지에서 주문할 상품들의 요약 정보를 표시하는 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 장바구니 아이템 목록 표시 (간소화된 형태)
 * 2. 상품별 소계 표시 (단가 × 수량)
 * 3. 총 상품 개수 및 총액 표시
 * 4. 가격 포맷팅
 *
 * 핵심 구현 로직:
 * - Server Component로 사용 (데이터만 표시)
 * - 간소화된 UI (장바구니 페이지보다 단순)
 * - 총액 계산 및 표시
 *
 * @dependencies
 * - @/actions/cart: CartItem 타입
 * - @/constants/categories: 카테고리 라벨 매핑
 */

interface OrderSummaryProps {
  items: CartItem[];
  totalAmount: number;
}

/**
 * 가격 포맷팅 함수
 */
function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}

/**
 * 주문 요약 정보 컴포넌트
 *
 * @param items 장바구니 아이템 목록
 * @param totalAmount 총 주문 금액
 */
export function OrderSummary({ items, totalAmount }: OrderSummaryProps) {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* 제목 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          주문 상품
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          주문할 상품을 확인해주세요.
        </p>
      </div>

      {/* 상품 목록 */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
        {items.map((item) => {
          const product = item.products;
          const subtotal = product.price * item.quantity;

          return (
            <div
              key={item.id}
              className="flex gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {/* 상품 이미지 */}
              <Link
                href={`/products/${product.id}`}
                className="relative w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center shrink-0"
              >
                <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </Link>

              {/* 상품 정보 */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${product.id}`}
                  className="text-base font-semibold text-gray-900 dark:text-gray-100 hover:text-primary transition-colors block"
                >
                  {product.name}
                </Link>
                {product.category && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded mt-1">
                    {getCategoryLabel(product.category)}
                  </span>
                )}
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">
                    {formatPrice(product.price)}
                  </span>
                  {" × "}
                  <span className="font-medium">{item.quantity}개</span>
                  {" = "}
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {formatPrice(subtotal)}
                  </span>
                </div>
              </div>

              {/* 소계 */}
              <div className="text-right shrink-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  소계
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formatPrice(subtotal)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 총액 요약 */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">총 상품 개수</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {totalQuantity}개
          </span>
        </div>
        <div className="flex items-center justify-between text-base">
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            총 주문 금액
          </span>
          <span className="text-2xl font-bold text-primary">
            {formatPrice(totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}
