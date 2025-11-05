import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCartItems } from "@/actions/cart";
import { OrderSummary } from "@/components/order-summary";
import { OrderPaymentFlow } from "@/components/order-payment-flow";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

/**
 * @file app/orders/new/page.tsx
 * @description 주문 페이지
 *
 * 장바구니의 상품들을 주문으로 변환하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 장바구니 데이터 페칭 (Server Component)
 * 2. 주문 요약 정보 표시
 * 3. 배송지 정보 입력 폼 (추후 구현)
 * 4. 주문 생성
 *
 * 핵심 구현 로직:
 * - Server Component로 데이터 페칭 (getCartItems)
 * - Clerk 인증 확인
 * - Suspense를 활용한 로딩 상태 처리
 * - 에러 상태 처리
 *
 * @dependencies
 * - @/actions/cart: 장바구니 Server Actions
 * - @/components/order-summary: 주문 요약 컴포넌트
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
function OrderLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 p-4">
            <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="w-24 h-16 rounded shrink-0" />
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}

/**
 * 주문 컨텐츠 컴포넌트 (Server Component)
 */
async function OrderContent() {
  console.group("📦 주문 페이지 데이터 페칭 시작");

  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.log("⚠️ 로그인하지 않은 사용자, 로그인 페이지로 리다이렉트");
      console.groupEnd();
      redirect("/sign-in");
    }
    console.log("✅ 사용자 인증 확인 완료:", userId);

    // 2. 장바구니 아이템 조회
    console.log("📦 장바구니 아이템 조회 중...");
    const result = await getCartItems();

    if (result.success === false) {
      console.error("❌ 장바구니 조회 실패:", result.error);
      console.groupEnd();
      throw new Error(result.error);
    }

    const { data: cartItems, totalAmount } = result;

    console.log("✅ 장바구니 조회 완료:", {
      아이템개수: cartItems.length,
      총액: formatPrice(totalAmount),
    });
    console.groupEnd();

    // 장바구니가 비어있으면 장바구니 페이지로 리다이렉트
    if (cartItems.length === 0) {
      console.log("⚠️ 장바구니가 비어있음, 장바구니 페이지로 리다이렉트");
      redirect("/cart");
    }

    // 총 상품 개수 계산
    const totalQuantity = cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    // 품절 상품 확인
    const hasOutOfStockItems = cartItems.some(
      (item) => item.products.stock_quantity === 0,
    );

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 주문 요약 정보 */}
        <div className="lg:col-span-2">
          <OrderSummary items={cartItems} totalAmount={totalAmount} />
        </div>

        {/* 배송지 정보 입력 폼 및 주문 정보 */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-6">
            {/* 주문 정보 요약 */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                주문 정보
              </h3>

              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    상품 개수
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {totalQuantity}개
                  </span>
                </div>
                <div className="flex items-center justify-between text-base">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    총 주문 금액
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
              </div>

              {/* 품절 상품 알림 */}
              {hasOutOfStockItems && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">
                        품절 상품이 포함되어 있습니다
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        품절된 상품을 장바구니에서 제거한 후 주문해주세요.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 장바구니로 돌아가기 */}
              <Link href="/cart">
                <button className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors text-center py-2">
                  장바구니로 돌아가기
                </button>
              </Link>
            </div>

            {/* 배송지 정보 입력 폼 및 결제위젯 */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
              <OrderPaymentFlow
                totalAmount={totalAmount}
                itemNames={cartItems.map((item) => item.products.name)}
                disabled={hasOutOfStockItems}
              />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("❌ 예상치 못한 오류 발생:");
    if (error instanceof Error) {
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 스택 트레이스:", error.stack);
    } else {
      console.error("  - 에러 객체:", JSON.stringify(error, null, 2));
    }
    console.groupEnd();

    // 에러 상태 UI
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          주문 정보를 불러올 수 없습니다
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error instanceof Error
            ? error.message
            : "오류가 발생했습니다. 잠시 후 다시 시도해주세요."}
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/cart">
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              장바구니로 돌아가기
            </button>
          </Link>
          <Link href="/products">
            <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
              상품 목록으로
            </button>
          </Link>
        </div>
      </div>
    );
  }
}

/**
 * 주문 페이지 (메인 컴포넌트)
 */
export default async function NewOrderPage() {
  // 환경변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseKey) missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    return (
      <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-16">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              데이터를 불러올 수 없습니다
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              환경변수가 설정되지 않았습니다: {missingVars.join(", ")}.
              .env.local 파일을 확인해주세요.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-16">
      <div className="w-full max-w-6xl mx-auto">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            주문하기
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            배송 정보를 입력하고 주문을 완료해주세요.
          </p>
        </div>

        {/* 주문 컨텐츠 */}
        <Suspense fallback={<OrderLoading />}>
          <OrderContent />
        </Suspense>
      </div>
    </main>
  );
}
