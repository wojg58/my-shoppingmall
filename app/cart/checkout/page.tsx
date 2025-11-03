import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCartItems } from "@/actions/cart";
import { CartCheckoutContent } from "@/components/cart-checkout-content";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

/**
 * @file app/cart/checkout/page.tsx
 * @description 장바구니 체크아웃 페이지
 *
 * 장바구니에서 결제 전 배송지 정보를 입력받는 페이지입니다.
 *
 * 주요 기능:
 * 1. 장바구니 데이터 페칭
 * 2. 배송지 정보 입력 폼 표시
 * 3. 주문 요약 정보 표시
 * 4. 결제하기 버튼 제공
 *
 * 핵심 구현 로직:
 * - Server Component로 장바구니 데이터 페칭
 * - Clerk 인증 확인
 * - Suspense를 활용한 로딩 상태 처리
 * - 에러 상태 처리
 *
 * @dependencies
 * - @/actions/cart: 장바구니 Server Actions
 * - @/components/cart-checkout-content: 체크아웃 컨텐츠 컴포넌트
 */

/**
 * 로딩 폴백 컴포넌트 (스켈레톤)
 */
function CheckoutLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-32" />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * 체크아웃 컨텐츠 컴포넌트 (Server Component)
 */
async function CheckoutContent() {
  console.group("🛒 장바구니 체크아웃 페이지 데이터 페칭 시작");

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
      총액: totalAmount,
    });
    console.groupEnd();

    // 빈 장바구니 처리
    if (cartItems.length === 0) {
      redirect("/cart");
    }

    return (
      <CartCheckoutContent items={cartItems} totalAmount={totalAmount} />
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
          체크아웃 정보를 불러올 수 없습니다
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error instanceof Error
            ? error.message
            : "오류가 발생했습니다. 잠시 후 다시 시도해주세요."}
        </p>
      </div>
    );
  }
}

/**
 * 체크아웃 페이지 (메인 컴포넌트)
 */
export default async function CartCheckoutPage() {
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
              환경변수가 설정되지 않았습니다: {missingVars.join(", ")}. .env.local
              파일을 확인해주세요.
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
            배송지 정보를 입력하고 결제를 진행해주세요.
          </p>
        </div>

        {/* 체크아웃 컨텐츠 */}
        <Suspense fallback={<CheckoutLoading />}>
          <CheckoutContent />
        </Suspense>
      </div>
    </main>
  );
}

