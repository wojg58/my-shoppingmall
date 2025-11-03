import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createPublicSupabaseClient } from "@/lib/supabase/server";
import { getCategoryLabel } from "@/constants/categories";
import { Button } from "@/components/ui/button";
import { AlertCircle, Package } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCartActions } from "@/components/product-cart-actions";

/**
 * @file app/products/[id]/page.tsx
 * @description 상품 상세 페이지
 *
 * 특정 상품의 상세 정보를 표시하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 상품 정보 표시 (이름, 설명, 가격, 재고)
 * 2. 카테고리 표시
 * 3. 장바구니 담기 버튼 (UI만, 기능은 Phase 3에서 구현)
 * 4. 재고 부족 시 알림 표시
 * 5. 로딩/에러 상태 처리
 *
 * @dependencies
 * - @/lib/supabase/server: Supabase 클라이언트
 * - @/constants/categories: 카테고리 라벨 매핑
 * - @/components/ui/button: shadcn/ui 버튼 컴포넌트
 * - lucide-react: 아이콘
 */

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

// 가격 포맷팅 함수
function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}

/**
 * 로딩 폴백 컴포넌트 (스켈레톤)
 */
function ProductDetailLoading() {
  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-16">
      <div className="w-full max-w-6xl mx-auto">
        <div className="mb-6">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* 이미지 영역 스켈레톤 */}
          <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Skeleton className="w-full h-full" />
          </div>
          {/* 정보 영역 스켈레톤 */}
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-12 w-full mt-auto" />
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * 상품 상세 정보 컴포넌트 (Server Component)
 */
async function ProductDetail({ productId }: { productId: string }) {
  console.group("📦 상품 상세 데이터 페칭 시작");
  console.log("상품 ID:", productId);

  try {
    const supabase = createPublicSupabaseClient();
    console.log("✅ Supabase 클라이언트 생성 완료");

    // 상품 정보 조회
    console.log("📦 상품 정보 조회 중...");
    const { data: product, error } = await supabase
      .from("products")
      .select(
        "id, name, description, price, category, stock_quantity, is_active",
      )
      .eq("id", productId)
      .single();

    if (error) {
      console.error("❌ 상품 데이터 조회 실패:");
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 에러 세부사항:", error.details);
      console.groupEnd();

      // 상품을 찾을 수 없으면 404 페이지로 이동
      if (error.code === "PGRST116") {
        notFound();
      }

      throw new Error(error.message || "상품 정보를 불러올 수 없습니다.");
    }

    if (!product) {
      console.log("⚠️ 상품을 찾을 수 없습니다.");
      console.groupEnd();
      notFound();
    }

    // 비활성화된 상품인 경우
    if (!product.is_active) {
      console.log("⚠️ 비활성화된 상품입니다.");
      console.groupEnd();
      notFound();
    }

    const formattedPrice = formatPrice(product.price);
    const categoryLabel = getCategoryLabel(product.category);
    const isInStock = product.stock_quantity > 0;
    const isLowStock =
      product.stock_quantity > 0 && product.stock_quantity < 10;
    const isOutOfStock = product.stock_quantity === 0;

    console.log("✅ 상품 정보 조회 성공:", {
      이름: product.name,
      가격: formattedPrice,
      카테고리: categoryLabel,
      재고: product.stock_quantity,
      재고상태: isOutOfStock ? "품절" : isLowStock ? "재고부족" : "정상",
    });
    console.groupEnd();

    return (
      <>
        {/* 뒤로 가기 버튼 */}
        <div className="mb-6">
          <Link
            href="/products"
            className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-2"
          >
            ← 상품 목록으로 돌아가기
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* 상품 이미지 영역 */}
          <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
            <Package className="w-32 h-32 text-gray-400 dark:text-gray-500" />

            {/* 재고 상태 뱃지 */}
            {isOutOfStock && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-semibold px-3 py-1.5 rounded">
                품절
              </div>
            )}
            {isLowStock && (
              <div className="absolute top-4 right-4 bg-orange-500 text-white text-sm font-semibold px-3 py-1.5 rounded">
                재고부족
              </div>
            )}
          </div>

          {/* 상품 정보 영역 */}
          <div className="flex flex-col">
            {/* 카테고리 */}
            {product.category && (
              <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded w-fit mb-4">
                {categoryLabel}
              </span>
            )}

            {/* 상품명 */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {product.name}
            </h1>

            {/* 가격 */}
            <div className="mb-6">
              <p className="text-4xl font-bold text-primary">
                {formattedPrice}
              </p>
            </div>

            {/* 재고 정보 */}
            <div className="mb-6">
              {isInStock ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  재고:{" "}
                  <span className="font-semibold">
                    {product.stock_quantity}개
                  </span>
                  {isLowStock && (
                    <span className="ml-2 text-orange-600 dark:text-orange-400 font-medium">
                      (재고가 부족합니다)
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  품절된 상품입니다
                </p>
              )}
            </div>

            {/* 상품 설명 */}
            {product.description && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  상품 설명
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            {/* 수량 선택 및 장바구니 담기 */}
            <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
              {isOutOfStock ? (
                <div className="space-y-4">
                  {/* 수량 선택 컴포넌트 (품절 시 비활성화) */}
                  <ProductCartActions
                    productId={product.id}
                    productName={product.name}
                    price={product.price}
                    stockQuantity={0}
                  />
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-900 dark:text-red-100">
                          재고 부족
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          현재 이 상품은 품절 상태입니다. 나중에 다시
                          확인해주세요.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <ProductCartActions
                  productId={product.id}
                  productName={product.name}
                  price={product.price}
                  stockQuantity={product.stock_quantity}
                />
              )}
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error("❌ 예상치 못한 오류 발생:");
    if (error instanceof Error) {
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 스택 트레이스:", error.stack);
    } else {
      console.error("  - 에러 객체:", JSON.stringify(error, null, 2));
    }
    console.groupEnd();

    // notFound()가 호출된 경우 처리되지 않음
    throw error;
  }
}

export default async function ProductDetailPage(props: ProductDetailPageProps) {
  // Next.js 15: params를 async로 처리
  const params = await props.params;
  const productId = params.id;

  // 환경변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseKey) missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    return (
      <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-16">
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              데이터를 불러올 수 없습니다
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              환경변수가 설정되지 않았습니다: {missingVars.join(", ")}.
              .env.local 파일을 확인해주세요.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-16">
      <div className="w-full max-w-6xl mx-auto">
        <Suspense fallback={<ProductDetailLoading />}>
          <ProductDetail productId={productId} />
        </Suspense>
      </div>
    </main>
  );
}
