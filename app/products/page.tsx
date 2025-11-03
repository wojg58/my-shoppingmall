import { Suspense } from "react";
import { ProductsList } from "@/components/products-list";
import { ProductCardSkeleton } from "@/components/product-card-skeleton";
import { CategoryFilter } from "@/components/category-filter";
import { ProductsSort } from "@/components/products-sort";
import { ProductsSearch } from "@/components/products-search";
import { AlertCircle } from "lucide-react";

/**
 * @file app/products/page.tsx
 * @description 상품 목록 페이지 - 전체 상품 조회 및 필터링
 *
 * 모든 활성화된 상품을 조회하고 필터링/정렬할 수 있는 전용 페이지입니다.
 *
 * 주요 기능:
 * 1. Suspense를 활용한 로딩 상태 처리
 * 2. Supabase에서 활성화된 상품 데이터 페칭 (정렬 옵션 지원)
 * 3. 카테고리별 필터링 기능 (URL 쿼리 파라미터 기반)
 * 4. 정렬 기능 (최신순, 가격 낮은순, 가격 높은순, 인기순)
 * 5. 반응형 그리드 레이아웃으로 상품 카드 표시
 * 6. 에러/빈 상태 처리
 *
 * @dependencies
 * - @/components/products-list: 상품 목록 데이터 페칭 컴포넌트
 * - @/components/category-filter: 카테고리 필터 버튼 컴포넌트
 * - @/components/products-sort: 정렬 옵션 버튼 컴포넌트
 * - @/components/product-card-skeleton: 로딩 스켈레톤 컴포넌트
 */

/**
 * 로딩 폴백 컴포넌트 (스켈레톤 로더) - 상품 목록 페이지용
 */
function ProductsLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 20 }).map((_, index) => (
        <ProductCardSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
}

/**
 * 에러 상태 컴포넌트 (데이터 로드 실패 시)
 */
function ProductsError({ error }: { error: string }) {
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

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    page?: string;
    search?: string;
  }>;
}

export default async function ProductsPage(props: ProductsPageProps) {
  // Next.js 15: searchParams를 async로 처리
  const searchParams = await props.searchParams;
  const category = searchParams.category || null;
  const sort = searchParams.sort || null;
  const pageParam = searchParams.page || null;
  const search = searchParams.search || null;

  // 페이지 번호 파싱 (1부터 시작, 기본값: 1)
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const validPage = page > 0 ? page : 1;

  console.group("📦 상품 목록 페이지 렌더링");
  console.log("URL 쿼리 파라미터:", {
    category,
    sort,
    page: validPage,
    search,
  });
  console.groupEnd();

  // 환경변수 확인 (에러 발생 시 즉시 처리)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseKey) missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    return (
      <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-16">
        <div className="w-full max-w-7xl mx-auto">
          <ProductsError
            error={`환경변수가 설정되지 않았습니다: ${missingVars.join(
              ", ",
            )}. .env.local 파일을 확인해주세요.`}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-16">
      <div className="w-full max-w-7xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8 lg:mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            전체 상품
          </h1>
          <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400">
            다양한 상품을 둘러보고 마음에 드는 상품을 찾아보세요
          </p>
        </div>

        {/* 카테고리 필터 */}
        <CategoryFilter />

        {/* 검색 */}
        <ProductsSearch />

        {/* 정렬 옵션 */}
        <ProductsSort />

        {/* 상품 목록 (Suspense로 로딩 상태 처리) */}
        <Suspense
          fallback={<ProductsLoading />}
          key={`${category || "all"}-${sort || "newest"}-${
            search || ""
          }-${validPage}`}
        >
          <ProductsList
            category={category}
            page={validPage}
            sort={sort || "newest"}
            search={search}
          />
        </Suspense>
      </div>
    </main>
  );
}
