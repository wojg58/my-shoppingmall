"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

/**
 * @file products-search.tsx
 * @description 상품 검색 컴포넌트
 *
 * 상품 목록 페이지에서 사용하는 검색 입력 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 검색어 입력 (debounce 적용으로 실시간 검색)
 * 2. URL 쿼리 파라미터 기반 (`?search=키워드`)
 * 3. 검색어 삭제 버튼
 * 4. 검색 버튼 (Enter 키 또는 클릭)
 * 5. 검색 변경 시 페이지를 1로 리셋
 *
 * @dependencies
 * - next/navigation: URL 파라미터 관리
 * - @/components/ui/input: shadcn/ui 입력 컴포넌트
 * - @/components/ui/button: shadcn/ui 버튼 컴포넌트
 * - lucide-react: 아이콘
 */

// Debounce 지연 시간 (ms)
const DEBOUNCE_DELAY = 500;

export function ProductsSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 현재 검색어 읽기
  const currentSearch = searchParams.get("search") || "";
  const [searchValue, setSearchValue] = useState(currentSearch);

  // 검색어 업데이트 함수
  const updateSearch = useCallback(
    (searchTerm: string) => {
      console.group("🔍 검색어 변경");
      console.log("검색어:", searchTerm || "(삭제)");
      console.log("현재 경로:", pathname);

      const params = new URLSearchParams(searchParams.toString());

      // 검색 변경 시 페이지를 1로 리셋
      params.delete("page");

      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      } else {
        params.delete("search");
      }

      // 다른 파라미터 유지 (category, sort)
      const category = searchParams.get("category");
      if (category) {
        params.set("category", category);
      }

      const sort = searchParams.get("sort");
      if (sort && sort !== "newest") {
        params.set("sort", sort);
      }

      const basePath = pathname || "/products";
      const finalUrl = params.toString()
        ? `${basePath}?${params.toString()}`
        : basePath;

      router.push(finalUrl, { scroll: false });
      console.log("최종 URL:", finalUrl);
      console.groupEnd();
    },
    [router, searchParams, pathname],
  );

  // Debounce를 위한 useEffect
  useEffect(() => {
    const timer = setTimeout(() => {
      // 현재 URL의 검색어와 입력값이 다를 때만 업데이트
      if (searchValue !== currentSearch) {
        updateSearch(searchValue);
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchValue, currentSearch, updateSearch]);

  // 검색어 입력 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  // 검색어 삭제 핸들러
  const handleClear = () => {
    setSearchValue("");
    updateSearch("");
  };

  // 검색 버튼 클릭 핸들러
  const handleSearch = () => {
    updateSearch(searchValue);
  };

  // Enter 키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      updateSearch(searchValue);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex gap-2 items-center max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="상품명 또는 설명으로 검색..."
            value={searchValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10"
          />
          {searchValue && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="검색어 삭제"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          variant="default"
          size="default"
          className="shrink-0"
        >
          검색
        </Button>
      </div>
    </div>
  );
}
