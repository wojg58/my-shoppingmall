import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { OrdersList } from "@/components/orders-list";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

/**
 * @file app/my-orders/page.tsx
 * @description 주문 내역 목록 페이지
 *
 * 사용자의 모든 주문 내역을 조회하는 페이지입니다.
 *
 * 주요 기능:
 * 1. Server Component로 데이터 페칭
 * 2. Clerk 인증 확인 (미로그인 시 리다이렉트)
 * 3. Suspense를 활용한 로딩 상태 처리
 * 4. 에러 상태 처리
 *
 * @dependencies
 * - @/components/orders-list: 주문 목록 컴포넌트
 * - @clerk/nextjs/server: Clerk 인증 확인
 */

/**
 * 로딩 폴백 컴포넌트 (스켈레톤)
 */
function OrdersLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 에러 상태 컴포넌트
 */
function OrdersError({ error }: { error: string }) {
  return (
    <div className="text-center py-12">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        데이터를 불러올 수 없습니다
      </h2>
      <p className="text-gray-600 dark:text-gray-400">{error}</p>
    </div>
  );
}

/**
 * 주문 내역 목록 페이지
 */
export default async function MyOrdersPage() {
  console.group("📦 주문 내역 목록 페이지 렌더링");

  // 로그인 상태 확인
  const { userId } = await auth();

  if (!userId) {
    console.log("⚠️ 로그인하지 않은 사용자, 로그인 페이지로 리다이렉트");
    console.groupEnd();
    redirect("/sign-in");
  }

  console.log("✅ 사용자 인증 확인 완료:", userId);

  // 환경변수 확인 (에러 발생 시 즉시 처리)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseKey) missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    console.error("❌ 환경변수 누락:", missingVars);
    console.groupEnd();

    return (
      <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-16">
        <div className="w-full max-w-7xl mx-auto">
          <OrdersError
            error={`환경변수가 설정되지 않았습니다: ${missingVars.join(", ")}`}
          />
        </div>
      </main>
    );
  }

  console.groupEnd();

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-16">
      <div className="w-full max-w-7xl mx-auto">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            주문 내역
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            주문한 상품의 내역을 확인하실 수 있습니다.
          </p>
        </div>

        {/* 주문 목록 (Suspense로 로딩 처리) */}
        <Suspense fallback={<OrdersLoading />}>
          <OrdersList />
        </Suspense>
      </div>
    </main>
  );
}

