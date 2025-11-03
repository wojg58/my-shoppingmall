/**
 * @file constants/categories.ts
 * @description 카테고리 상수 및 매핑 정의
 *
 * 상품 카테고리 코드와 한글 라벨 매핑을 중앙에서 관리합니다.
 * 여러 컴포넌트에서 일관된 카테고리 표시를 위해 사용됩니다.
 */

/**
 * 카테고리 코드 타입
 */
export type CategoryCode =
  | "electronics"
  | "clothing"
  | "books"
  | "food"
  | "sports"
  | "beauty"
  | "home";

/**
 * 카테고리 한글 라벨 매핑
 */
export const CATEGORY_LABELS: Record<CategoryCode, string> = {
  electronics: "전자제품",
  clothing: "의류",
  books: "도서",
  food: "식품",
  sports: "스포츠",
  beauty: "뷰티",
  home: "생활용품",
} as const;

/**
 * 모든 카테고리 코드 목록
 */
export const ALL_CATEGORIES: CategoryCode[] = Object.keys(
  CATEGORY_LABELS,
) as CategoryCode[];

/**
 * 카테고리 코드로 한글 라벨 조회
 * @param category 카테고리 코드 또는 null
 * @returns 한글 라벨 또는 "기타"
 */
export function getCategoryLabel(category: string | null): string {
  if (!category) return "기타";
  return CATEGORY_LABELS[category as CategoryCode] || category;
}

/**
 * 카테고리 코드 유효성 검증
 * @param category 검증할 카테고리 코드
 * @returns 유효한 카테고리 코드인지 여부
 */
export function isValidCategory(
  category: string | null,
): category is CategoryCode {
  if (!category) return false;
  return category in CATEGORY_LABELS;
}
