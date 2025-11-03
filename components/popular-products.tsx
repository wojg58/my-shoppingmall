import { createPublicSupabaseClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";

/**
 * @file popular-products.tsx
 * @description 인기 상품 목록 컴포넌트 (Server Component)
 *
 * Supabase에서 최신순으로 인기 상품 데이터를 가져와서 목록으로 표시하는 컴포넌트입니다.
 * Suspense와 함께 사용하여 로딩 상태를 처리합니다.
 *
 * 주요 기능:
 * - 최신순 정렬 (created_at DESC)
 * - 활성화된 상품만 표시 (is_active=true)
 * - 최대 8개 제한
 */

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  stock_quantity: number;
}

const MAX_POPULAR_PRODUCTS = 8;

export async function PopularProducts() {
  console.group("🔥 인기 상품 데이터 페칭 시작");

  try {
    const supabase = createPublicSupabaseClient();
    console.log("✅ Supabase 클라이언트 생성 완료");

    console.log(
      "📦 인기 상품 데이터 조회 중... (is_active=true, 최신순, 최대",
      MAX_POPULAR_PRODUCTS,
      "개)",
    );

    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, description, price, category, stock_quantity")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(MAX_POPULAR_PRODUCTS);

    if (error) {
      console.error("❌ 인기 상품 데이터 조회 실패:");
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

    const productCount = products?.length || 0;
    console.log("✅ 인기 상품 데이터 조회 성공:", productCount, "개");

    if (!products || products.length === 0) {
      console.log("⚠️ 표시할 인기 상품이 없습니다.");
      console.groupEnd();
      return (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            현재 인기 상품이 없습니다. 나중에 다시 확인해주세요.
          </p>
        </div>
      );
    }

    // 카테고리별 통계 로그
    const categoryStats = products.reduce((acc, p) => {
      const cat = p.category || "기타";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("📊 인기 상품 카테고리별 개수:", categoryStats);
    console.log("✅ 인기 상품 목록 준비 완료:", productCount, "개");
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
