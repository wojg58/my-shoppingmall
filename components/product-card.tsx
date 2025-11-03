"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { getCategoryLabel } from "@/constants/categories";

/**
 * @file product-card.tsx
 * @description 상품 카드 컴포넌트
 *
 * 홈페이지와 상품 목록 페이지에서 사용되는 재사용 가능한 상품 카드 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 상품 정보 표시 (이름, 가격, 카테고리, 재고 상태)
 * 2. 상품 이미지 영역 (현재는 placeholder)
 * 3. 클릭 시 상품 상세 페이지로 이동
 *
 * @dependencies
 * - next/link: 클라이언트 사이드 네비게이션
 * - lucide-react: 아이콘
 * - @/constants/categories: 카테고리 라벨 매핑
 */

interface ProductCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  stockQuantity: number;
}

// 가격 포맷팅 함수 (서버와 클라이언트 간 일관성 보장)
function formatPrice(price: number): string {
  // 숫자를 문자열로 변환 후 천 단위 쉼표 추가
  return `${price.toLocaleString("ko-KR")}원`;
}

export function ProductCard({
  id,
  name,
  description,
  price,
  category,
  stockQuantity,
}: ProductCardProps) {
  // 가격 포맷팅 (예: 89,000원)
  const formattedPrice = formatPrice(price);

  // 카테고리 라벨 (상수에서 가져오기)
  const categoryLabel = getCategoryLabel(category);

  // 재고 상태
  const isInStock = stockQuantity > 0;
  const isLowStock = stockQuantity > 0 && stockQuantity < 10;

  return (
    <Link
      href={`/products/${id}`}
      className="group flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary"
    >
      {/* 상품 이미지 영역 (Placeholder) */}
      <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
        <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 group-hover:text-primary transition-colors" />
        {/* 재고 상태 뱃지 */}
        {!isInStock && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
            품절
          </div>
        )}
        {isLowStock && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded">
            재고부족
          </div>
        )}
      </div>

      {/* 상품 정보 */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* 카테고리 뱃지 */}
        {category && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded w-fit">
            {categoryLabel}
          </span>
        )}

        {/* 상품명 */}
        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* 상품 설명 (선택적) */}
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 flex-1">
            {description}
          </p>
        )}

        {/* 가격 및 재고 정보 */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xl font-bold text-primary">
            {formattedPrice}
          </span>
          {isInStock && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              재고 {stockQuantity}개
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
