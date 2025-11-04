import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

/**
 * @file app/my-page/page.tsx
 * @description 마이페이지
 *
 * 사용자의 개인 정보 및 주문 내역을 확인하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 사용자 정보 표시 (Clerk 연동)
 * 2. 주문 내역 조회 (Phase 5-2에서 구현 예정)
 * 3. 주문 상세 보기 (Phase 5-3에서 구현 예정)
 *
 * 핵심 구현 로직:
 * - Server Component로 구현
 * - Clerk 인증 확인 (미로그인 시 리다이렉트)
 * - Suspense를 활용한 로딩 상태 처리 (추후 추가)
 *
 * @dependencies
 * - @clerk/nextjs/server: Clerk 인증 확인
 */

/**
 * 마이페이지 메인 컴포넌트
 */
export default async function MyPage() {
  // 로그인 상태 확인
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  console.group("📄 마이페이지 접근");
  console.log("✅ 사용자 인증 확인 완료:", userId);
  console.groupEnd();

  return (
    <main className="min-h-[calc(100vh-80px)] max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* 페이지 제목 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            마이페이지
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            주문 내역 및 개인 정보를 확인하실 수 있습니다.
          </p>
        </div>

        {/* 사용자 정보 섹션 (추후 구현) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            사용자 정보
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            사용자 정보 표시 기능은 추후 구현 예정입니다.
          </p>
        </div>

        {/* 주문 내역 섹션 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              주문 내역
            </h2>
            <Link
              href="/my-orders"
              className="text-sm text-primary hover:underline"
            >
              전체 보기 →
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            주문한 상품의 내역을 확인하실 수 있습니다.
          </p>
        </div>
      </div>
    </main>
  );
}

