import { ProductCard } from "@/components/product-card";
import { ProductsPagination } from "./products-pagination";

/**
 * @file products-list-with-pagination.tsx
 * @description 페이지네이션을 포함한 상품 목록 컴포넌트 (Server Component)
 *
 * 페이지네이션 정보와 함께 상품 목록을 렌더링하는 컴포넌트입니다.
 */

interface ProductsListWithPaginationProps {
  products: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string | null;
    stock_quantity: number;
  }>;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  category?: string | null;
  itemsPerPage?: number;
  search?: string | null;
}

export function ProductsListWithPagination({
  products,
  totalCount,
  currentPage,
  totalPages,
  category,
  itemsPerPage,
  search,
}: ProductsListWithPaginationProps) {
  if (products.length === 0) {
    // 빈 상태 메시지 구성
    let emptyMessage = "현재 등록된 상품이 없습니다. 나중에 다시 확인해주세요.";
    if (search && category) {
      emptyMessage = `"${search}" 검색어와 "${category}" 카테고리에 해당하는 상품을 찾을 수 없습니다. 다른 검색어나 카테고리를 시도해보세요.`;
    } else if (search) {
      emptyMessage = `"${search}" 검색어에 해당하는 상품을 찾을 수 없습니다. 다른 검색어를 시도해보세요.`;
    } else if (category) {
      emptyMessage = `현재 선택한 카테고리에 등록된 상품이 없습니다. 다른 카테고리를 선택해보세요.`;
    }

    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* 상품 목록 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            description={product.description}
            price={product.price}
            category={product.category}
            stockQuantity={product.stock_quantity}
          />
        ))}
      </div>

      {/* 페이지네이션 */}
      <ProductsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        category={category}
        itemsPerPage={itemsPerPage}
      />
    </>
  );
}
