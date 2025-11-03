"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ALL_SORT_OPTIONS,
  SORT_LABELS,
  isValidSortOption,
  type SortOption,
} from "@/constants/sort-options";

/**
 * @file products-sort.tsx
 * @description 상품 정렬 컴포넌트
 *
 * 상품 목록 페이지에서 사용하는 정렬 옵션 버튼 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. URL 쿼리 파라미터 (`?sort=newest`) 읽기 및 업데이트
 * 2. 여러 정렬 옵션 버튼 제공 (최신순, 가격 낮은순, 가격 높은순, 인기순)
 * 3. 선택된 정렬 옵션 강조 표시
 * 4. 정렬 변경 시 페이지를 1로 리셋
 *
 * @dependencies
 * - next/navigation: URL 파라미터 관리
 * - @/components/ui/button: shadcn/ui 버튼 컴포넌트
 * - @/constants/sort-options: 정렬 옵션 상수
 */

export function ProductsSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 현재 선택된 정렬 옵션 읽기 (기본값: newest)
  const currentSort = searchParams.get("sort") || "newest";
  const validSort = isValidSortOption(currentSort) ? currentSort : "newest";

  // 정렬 옵션 클릭 핸들러
  const handleSortClick = (sort: SortOption) => {
    console.group("🔀 정렬 옵션 변경");
    console.log("선택된 정렬:", sort);
    console.log("현재 경로:", pathname);

    const params = new URLSearchParams(searchParams.toString());

    // 정렬 변경 시 페이지를 1로 리셋
    params.delete("page");

    if (sort === "newest") {
      // 기본값이므로 파라미터에서 제거
      params.delete("sort");
    } else {
      params.set("sort", sort);
    }

    // 카테고리 파라미터 유지
    const category = searchParams.get("category");
    if (category) {
      params.set("category", category);
    }

    const basePath = pathname || "/products";
    const finalUrl = params.toString()
      ? `${basePath}?${params.toString()}`
      : basePath;

    router.push(finalUrl, { scroll: false });
    console.log("최종 URL:", finalUrl);
    console.groupEnd();
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          정렬:
        </span>
        <div className="flex flex-wrap gap-2">
          {ALL_SORT_OPTIONS.map((sort) => {
            const isActive = validSort === sort;
            return (
              <Button
                key={sort}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handleSortClick(sort)}
                className="shrink-0"
              >
                {SORT_LABELS[sort]}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
