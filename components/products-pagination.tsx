"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * @file products-pagination.tsx
 * @description 상품 목록 페이지네이션 컴포넌트
 *
 * 상품 목록 페이지에서 사용하는 페이지네이션 UI 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 이전/다음 페이지 버튼
 * 2. 페이지 번호 표시 (현재 페이지 중심으로 앞뒤 몇 개만 표시)
 * 3. 총 페이지 수 및 상품 개수 표시
 * 4. URL 쿼리 파라미터 기반 페이지 이동
 *
 * @dependencies
 * - next/navigation: URL 파라미터 관리
 * - @/components/ui/button: shadcn/ui 버튼 컴포넌트
 * - lucide-react: 아이콘
 */

interface ProductsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  category?: string | null;
  itemsPerPage?: number; // 한 페이지당 상품 개수 (기본값: 20)
}

// 현재 페이지 중심으로 표시할 페이지 번호 개수
const PAGES_TO_SHOW = 5;

// 한 페이지당 기본 상품 개수
const DEFAULT_ITEMS_PER_PAGE = 20;

export function ProductsPagination({
  currentPage,
  totalPages,
  totalCount,
  category,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
}: ProductsPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 페이지 번호 클릭 핸들러
  const handlePageClick = (page: number) => {
    console.group("📄 페이지 이동");
    console.log("이동할 페이지:", page);
    console.log("현재 경로:", pathname);

    const params = new URLSearchParams(searchParams.toString());

    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }

    // 카테고리 파라미터 유지
    if (category) {
      params.set("category", category);
    }

    const finalUrl = params.toString()
      ? `${pathname || "/products"}?${params.toString()}`
      : pathname || "/products";

    router.push(finalUrl, { scroll: false });
    console.log("최종 URL:", finalUrl);
    console.groupEnd();
  };

  // 표시할 페이지 번호 계산
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const halfPages = Math.floor(PAGES_TO_SHOW / 2);

    if (totalPages <= PAGES_TO_SHOW) {
      // 전체 페이지가 적으면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 시작 페이지
      let startPage = Math.max(1, currentPage - halfPages);
      let endPage = Math.min(totalPages, currentPage + halfPages);

      // 앞쪽이 부족하면 뒤로 밀기
      if (currentPage <= halfPages) {
        endPage = Math.min(PAGES_TO_SHOW, totalPages);
      }

      // 뒤쪽이 부족하면 앞으로 당기기
      if (currentPage >= totalPages - halfPages) {
        startPage = Math.max(1, totalPages - PAGES_TO_SHOW + 1);
      }

      // 첫 페이지
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push("...");
        }
      }

      // 중간 페이지들
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // 마지막 페이지
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push("...");
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // 상품 범위 계산 (현재 페이지에 표시된 상품)
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      {/* 상품 개수 정보 */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        전체 {totalCount.toLocaleString()}개 중 {startItem.toLocaleString()}-
        {endItem.toLocaleString()}개 표시
      </p>

      {/* 페이지네이션 버튼 그룹 */}
      <div className="flex items-center gap-2">
        {/* 이전 페이지 버튼 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={!hasPrevious}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          이전
        </Button>

        {/* 페이지 번호 버튼들 */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-gray-500 dark:text-gray-400"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <Button
                key={pageNum}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageClick(pageNum)}
                className="min-w-[40px]"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        {/* 다음 페이지 버튼 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={!hasNext}
          className="gap-1"
        >
          다음
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* 페이지 정보 */}
      <p className="text-xs text-gray-500 dark:text-gray-500">
        {currentPage} / {totalPages} 페이지
      </p>
    </div>
  );
}
