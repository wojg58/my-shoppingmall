import { Skeleton } from "@/components/ui/skeleton";

/**
 * @file product-card-skeleton.tsx
 * @description 상품 카드 스켈레톤 로더 컴포넌트
 *
 * 상품 목록이 로딩 중일 때 표시되는 플레이스홀더 컴포넌트입니다.
 * 실제 ProductCard와 동일한 레이아웃을 가지도록 설계되었습니다.
 */

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* 상품 이미지 영역 스켈레톤 */}
      <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700">
        <Skeleton className="w-full h-full" />
      </div>

      {/* 상품 정보 스켈레톤 */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* 카테고리 뱃지 스켈레톤 */}
        <Skeleton className="h-5 w-20 rounded" />

        {/* 상품명 스켈레톤 */}
        <Skeleton className="h-6 w-full rounded" />
        <Skeleton className="h-6 w-3/4 rounded" />

        {/* 상품 설명 스켈레톤 */}
        <Skeleton className="h-4 w-full rounded mt-2" />
        <Skeleton className="h-4 w-2/3 rounded" />

        {/* 가격 및 재고 정보 스켈레톤 */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-200 dark:border-gray-700">
          <Skeleton className="h-7 w-24 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}
