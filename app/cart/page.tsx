import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCartItems } from "@/actions/cart";
import { CartActions } from "@/components/cart-actions";
import { EmptyCart } from "@/components/empty-cart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ShoppingCart, AlertCircle } from "lucide-react";

/**
 * @file app/cart/page.tsx
 * @description 장바구니 페이지
 *
 * 사용자의 장바구니 아이템을 표시하고 관리하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 장바구니 아이템 목록 표시
 * 2. 수량 변경 및 삭제
 * 3. 총액 계산 및 표시
 * 4. 주문하기 버튼
 * 5. 빈 장바구니 상태 처리
 *
 * 핵심 구현 로직:
 * - Server Component로 데이터 페칭 (getCartItems)
 * - Clerk 인증 확인
 * - Suspense를 활용한 로딩 상태 처리
 * - 에러 상태 처리
 *
 * @dependencies
 * - @/actions/cart: 장바구니 Server Actions
 * - @/components/cart-item: 장바구니 아이템 컴포넌트
 * - @/components/empty-cart: 빈 장바구니 상태 컴포넌트
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
function CartLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <Skeleton className="w-32 h-32 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="w-32 h-32 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/**
 * 장바구니 컨텐츠 컴포넌트 (Server Component)
 */
async function CartContent() {
  console.group("🛒 장바구니 페이지 데이터 페칭 시작");

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

    if (!result.success) {
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

    // 빈 장바구니 처리
    if (cartItems.length === 0) {
      return <EmptyCart />;
    }

    return (
      <div className="space-y-6">
        {/* 장바구니 아이템 목록 */}
        <CartActions items={cartItems} />

        {/* 총액 및 주문하기 */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                총 상품 개수
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}개
              </p>
            </div>
            <div className="text-right sm:text-left">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                총 주문 금액
              </p>
              <p className="text-3xl font-bold text-primary">
                {formatPrice(totalAmount)}
              </p>
            </div>
          </div>

          {/* 주문하기 버튼 */}
          <Link href="/cart/checkout" className="block">
            <Button
              size="lg"
              className="w-full sm:w-auto min-w-[200px]"
              disabled={
                cartItems.some((item) => item.products.stock_quantity === 0) ||
                totalAmount === 0
              }
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              주문하기
            </Button>
          </Link>

          {/* 품절 상품 알림 */}
          {cartItems.some((item) => item.products.stock_quantity === 0) && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
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
          장바구니를 불러올 수 없습니다
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error instanceof Error
            ? error.message
            : "오류가 발생했습니다. 잠시 후 다시 시도해주세요."}
        </p>
        <Link href="/products">
          <Button variant="outline">상품 목록으로 돌아가기</Button>
        </Link>
      </div>
    );
  }
}

/**
 * 장바구니 페이지 (메인 컴포넌트)
 */
export default async function CartPage() {
  // 환경변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseKey) missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    return (
      <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-16">
        <div className="w-full max-w-4xl mx-auto">
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
            장바구니
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            주문할 상품을 확인하고 수량을 조절해주세요.
          </p>
        </div>

        {/* 장바구니 컨텐츠 */}
        <Suspense fallback={<CartLoading />}>
          <CartContent />
        </Suspense>
      </div>
    </main>
  );
}
