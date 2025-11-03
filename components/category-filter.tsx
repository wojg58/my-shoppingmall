"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  isValidCategory,
  type CategoryCode,
} from "@/constants/categories";

/**
 * @file category-filter.tsx
 * @description 카테고리 필터 컴포넌트
 *
 * 홈페이지 및 상품 목록 페이지에서 사용하는 카테고리별 상품 필터링 버튼 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. URL 쿼리 파라미터 (`?category=electronics`) 읽기 및 업데이트
 * 2. "전체" 버튼으로 모든 상품 표시
 * 3. 각 카테고리 버튼으로 필터링된 상품 표시
 * 4. 선택된 카테고리 강조 표시
 * 5. 현재 경로 자동 감지 (홈페이지 `/` 또는 상품 목록 페이지 `/products`)
 *
 * @dependencies
 * - next/navigation: URL 파라미터 관리
 * - @/components/ui/button: shadcn/ui 버튼 컴포넌트
 * - @/constants/categories: 카테고리 상수
 */

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 현재 선택된 카테고리 읽기
  const currentCategory = searchParams.get("category");

  // 카테고리 필터 클릭 핸들러
  const handleCategoryClick = (category: CategoryCode | null) => {
    console.group("🔍 카테고리 필터 클릭");
    console.log("선택된 카테고리:", category || "전체");
    console.log("현재 경로:", pathname);

    const params = new URLSearchParams(searchParams.toString());

    if (category && isValidCategory(category)) {
      params.set("category", category);
      console.log("URL 파라미터 설정:", `?category=${category}`);
    } else {
      params.delete("category");
      console.log("URL 파라미터 제거 (전체 상품 표시)");
    }

    // 현재 경로를 유지하면서 URL 업데이트
    const basePath = pathname || "/";
    const finalUrl = params.toString()
      ? `${basePath}?${params.toString()}`
      : basePath;

    router.push(finalUrl, { scroll: false });
    console.log("최종 URL:", finalUrl);
    console.groupEnd();
  };

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* "전체" 버튼 */}
        <Button
          variant={!currentCategory ? "default" : "outline"}
          size="default"
          onClick={() => handleCategoryClick(null)}
          className="shrink-0"
        >
          전체
        </Button>

        {/* 각 카테고리 버튼 */}
        {ALL_CATEGORIES.map((category) => {
          const isActive = currentCategory === category;
          return (
            <Button
              key={category}
              variant={isActive ? "default" : "outline"}
              size="default"
              onClick={() => handleCategoryClick(category)}
              className="shrink-0"
            >
              {CATEGORY_LABELS[category]}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
