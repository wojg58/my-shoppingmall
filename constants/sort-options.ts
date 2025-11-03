/**
 * @file constants/sort-options.ts
 * @description 정렬 옵션 상수 및 매핑 정의
 *
 * 상품 정렬 옵션 코드와 한글 라벨 매핑을 중앙에서 관리합니다.
 * 여러 컴포넌트에서 일관된 정렬 옵션 표시를 위해 사용됩니다.
 */

/**
 * 정렬 옵션 코드 타입
 */
export type SortOption =
  | "newest" // 최신순
  | "price_asc" // 가격 낮은순
  | "price_desc" // 가격 높은순
  | "popular"; // 인기순

/**
 * 정렬 옵션 한글 라벨 매핑
 */
export const SORT_LABELS: Record<SortOption, string> = {
  newest: "최신순",
  price_asc: "가격 낮은순",
  price_desc: "가격 높은순",
  popular: "인기순",
} as const;

/**
 * 모든 정렬 옵션 코드 목록
 */
export const ALL_SORT_OPTIONS: SortOption[] = Object.keys(
  SORT_LABELS,
) as SortOption[];

/**
 * 정렬 옵션 코드로 한글 라벨 조회
 * @param sort 정렬 옵션 코드 또는 null
 * @returns 한글 라벨 또는 "최신순" (기본값)
 */
export function getSortLabel(sort: string | null): string {
  if (!sort) return "최신순";
  return SORT_LABELS[sort as SortOption] || "최신순";
}

/**
 * 정렬 옵션 코드 유효성 검증
 * @param sort 검증할 정렬 옵션 코드
 * @returns 유효한 정렬 옵션 코드인지 여부
 */
export function isValidSortOption(sort: string | null): sort is SortOption {
  if (!sort) return false;
  return sort in SORT_LABELS;
}
