import { createPublicSupabaseClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { isValidCategory } from "@/constants/categories";
import { isValidSortOption, type SortOption } from "@/constants/sort-options";
import { ProductsListWithPagination } from "./products-list-with-pagination";

/**
 * @file products-list.tsx
 * @description 상품 목록 컴포넌트 (Server Component)
 *
 * Supabase에서 상품 데이터를 가져와서 목록으로 표시하는 컴포넌트입니다.
 * Suspense와 함께 사용하여 로딩 상태를 처리합니다.
 * 카테고리 필터링, 정렬, 페이지네이션 기능을 지원합니다.
 */

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  stock_quantity: number;
}

interface ProductsListProps {
  category?: string | null;
  limit?: number | null; // 상품 개수 제한 (null이면 제한 없음, 페이지네이션 미사용 시)
  page?: number | null; // 현재 페이지 번호 (1부터 시작)
  itemsPerPage?: number; // 한 페이지당 상품 개수 (기본값: 20)
  sort?: string | null; // 정렬 옵션 (newest, price_asc, price_desc, popular)
  search?: string | null; // 검색어 (상품명 또는 설명에서 검색)
}

export interface ProductsListResult {
  products: Product[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

// 한 페이지당 기본 상품 개수
const DEFAULT_ITEMS_PER_PAGE = 20;

export async function ProductsList({
  category = null,
  limit = null,
  page = null,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
  sort = null,
  search = null,
}: ProductsListProps) {
  console.group("📦 상품 목록 데이터 페칭 시작");

  try {
    const supabase = createPublicSupabaseClient();
    console.log("✅ Supabase 클라이언트 생성 완료");

    // 카테고리 필터링 로직
    const validCategory =
      category && isValidCategory(category) ? category : null;
    const categoryFilter = validCategory ? `카테고리: ${category}` : "전체";

    // 검색어 정규화 (공백 제거)
    const searchTerm = search?.trim() || null;
    const searchFilter = searchTerm ? `검색: "${searchTerm}"` : "";

    // 정렬 옵션 검증 (기본값: newest)
    const validSort: SortOption =
      sort && isValidSortOption(sort) ? sort : "newest";
    const sortLabel =
      validSort === "newest"
        ? "최신순"
        : validSort === "price_asc"
        ? "가격 낮은순"
        : validSort === "price_desc"
        ? "가격 높은순"
        : "인기순";

    // 페이지네이션 사용 여부 확인
    const usePagination = page !== null && page > 0;
    const currentPage = usePagination ? page : 1;
    const itemsPerPageValue = usePagination
      ? itemsPerPage
      : DEFAULT_ITEMS_PER_PAGE;

    // 페이지네이션 범위 계산
    const from = usePagination ? (currentPage - 1) * itemsPerPageValue : 0;
    const to = usePagination ? from + itemsPerPageValue - 1 : undefined;

    const limitText = usePagination
      ? `페이지 ${currentPage} (${itemsPerPageValue}개씩)`
      : limit
      ? `최대 ${limit}개`
      : "제한 없음";
    const filters = [categoryFilter, searchFilter, sortLabel, limitText]
      .filter(Boolean)
      .join(", ");
    console.log(`📦 상품 데이터 조회 중... (${filters})`);

    // Supabase 쿼리 빌더 생성 (총 개수 조회 포함)
    let countQuery = supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    let dataQuery = supabase
      .from("products")
      .select("id, name, description, price, category, stock_quantity")
      .eq("is_active", true);

    // 카테고리 필터 추가 (있을 경우)
    if (validCategory) {
      countQuery = countQuery.eq("category", validCategory);
      dataQuery = dataQuery.eq("category", validCategory);
      console.log(`🔍 카테고리 필터 적용: ${validCategory}`);
    }

    // 검색 필터 추가 (있을 경우) - 상품명 또는 설명에서 검색
    if (searchTerm) {
      // 상품명 또는 설명에 검색어가 포함된 경우 검색
      // PostgreSQL의 OR 조건과 ilike 사용
      countQuery = countQuery.or(
        `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`,
      );
      dataQuery = dataQuery.or(
        `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`,
      );
      console.log(`🔍 검색 필터 적용: "${searchTerm}"`);
    }

    // 정렬 로직 적용
    switch (validSort) {
      case "price_asc":
        // 가격 오름차순
        dataQuery = dataQuery.order("price", { ascending: true });
        console.log(`🔀 정렬 적용: 가격 낮은순`);
        break;
      case "price_desc":
        // 가격 내림차순
        dataQuery = dataQuery.order("price", { ascending: false });
        console.log(`🔀 정렬 적용: 가격 높은순`);
        break;
      case "popular":
        // 인기순 (임시로 최신순으로 처리, 나중에 주문 횟수 등으로 변경 가능)
        dataQuery = dataQuery.order("created_at", { ascending: false });
        console.log(`🔀 정렬 적용: 인기순 (임시로 최신순)`);
        break;
      case "newest":
      default:
        // 최신순 (기본값)
        dataQuery = dataQuery.order("created_at", { ascending: false });
        console.log(`🔀 정렬 적용: 최신순`);
        break;
    }

    // 페이지네이션 또는 limit 적용
    if (usePagination) {
      // 페이지네이션 사용 시 range() 적용
      dataQuery = dataQuery.range(from, to);
      console.log(`📄 페이지네이션 범위: ${from} ~ ${to}`);
    } else if (limit !== null && limit > 0) {
      // limit 사용 시
      dataQuery = dataQuery.limit(limit);
    }

    // 총 개수와 데이터를 동시에 조회
    const [{ count }, { data: products, error }] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    if (error) {
      console.error("❌ 상품 데이터 조회 실패:");
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 에러 세부사항:", error.details);
      console.error("  - 전체 에러 객체:", JSON.stringify(error, null, 2));
      console.groupEnd();

      let errorMessage = error.message || "알 수 없는 오류가 발생했습니다.";

      if (error.code === "PGRST116") {
        errorMessage =
          "products 테이블을 찾을 수 없습니다. 마이그레이션을 실행했는지 확인해주세요.";
      } else if (error.code === "42501") {
        errorMessage = "권한이 없습니다. RLS 정책을 확인해주세요.";
      } else if (
        error.message.includes("relation") &&
        error.message.includes("does not exist")
      ) {
        errorMessage =
          "products 테이블이 존재하지 않습니다. 마이그레이션을 실행해주세요.";
      }

      throw new Error(errorMessage);
    }

    const totalCount = count ?? 0;
    const productCount = products?.length || 0;
    const totalPages = usePagination
      ? Math.ceil(totalCount / itemsPerPageValue)
      : 1;

    console.log("✅ 상품 데이터 조회 성공:", productCount, "개");
    if (usePagination) {
      console.log("📊 페이지네이션 정보:", {
        현재페이지: currentPage,
        총상품수: totalCount,
        총페이지수: totalPages,
        페이지당상품수: itemsPerPageValue,
      });
    }

    // 페이지네이션 사용 시 ProductsListWithPagination 컴포넌트 사용
    if (usePagination) {
      console.groupEnd();
      return (
        <ProductsListWithPagination
          products={products || []}
          totalCount={totalCount}
          currentPage={currentPage}
          totalPages={totalPages}
          category={category}
          itemsPerPage={itemsPerPageValue}
          search={searchTerm}
        />
      );
    }

    if (!products || products.length === 0) {
      console.log("⚠️ 표시할 상품이 없습니다.");
      if (validCategory) {
        console.log(`💡 카테고리 "${category}"에 해당하는 상품이 없습니다.`);
      }
      if (searchTerm) {
        console.log(`💡 검색어 "${searchTerm}"에 해당하는 상품이 없습니다.`);
      }
      console.groupEnd();

      // 빈 상태 메시지 구성
      let emptyMessage =
        "현재 등록된 상품이 없습니다. 나중에 다시 확인해주세요.";
      if (searchTerm && validCategory) {
        emptyMessage = `"${searchTerm}" 검색어와 "${category}" 카테고리에 해당하는 상품을 찾을 수 없습니다. 다른 검색어나 카테고리를 시도해보세요.`;
      } else if (searchTerm) {
        emptyMessage = `"${searchTerm}" 검색어에 해당하는 상품을 찾을 수 없습니다. 다른 검색어를 시도해보세요.`;
      } else if (validCategory) {
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

    // 카테고리별 통계 로그 (필터링된 경우에도 표시)
    const categoryStats = products.reduce((acc, p) => {
      const cat = p.category || "기타";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("📊 상품 카테고리별 개수:", categoryStats);

    if (validCategory) {
      console.log(
        `✅ 카테고리 "${category}" 필터링 완료: ${productCount}개 상품`,
      );
    }

    console.groupEnd();

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    );
  } catch (error) {
    console.error("❌ 예상치 못한 오류 발생:");
    if (error instanceof Error) {
      console.error("  - 에러 타입: Error");
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 스택 트레이스:", error.stack);
    } else {
      console.error("  - 에러 타입: Unknown");
      console.error("  - 에러 객체:", JSON.stringify(error, null, 2));
    }
    console.groupEnd();
    throw error; // Suspense의 error boundary로 전달
  }
}
