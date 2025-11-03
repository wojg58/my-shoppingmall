import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getOrder } from "@/actions/order";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CheckCircle2,
  Package,
  Home,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";

/**
 * @file app/orders/[id]/success/page.tsx
 * @description 주문 성공 페이지
 *
 * 주문이 성공적으로 생성된 후 표시되는 페이지입니다.
 *
 * 주요 기능:
 * 1. 주문 정보 표시 (주문 번호, 총액, 배송지 등)
 * 2. 주문 상품 목록 표시
 * 3. 다음 액션 제공 (홈으로, 주문 내역 보기 등)
 *
 * 핵심 구현 로직:
 * - Server Component로 주문 데이터 페칭
 * - Clerk 인증 확인
 * - Suspense를 활용한 로딩 상태 처리
 * - 에러 상태 처리
 *
 * @dependencies
 * - @/actions/order: 주문 Server Actions
 */

/**
 * 가격 포맷팅 함수
 */
function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}

/**
 * 주문 상태 한글 표시
 */
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "결제 대기",
    confirmed: "확인됨",
    shipped: "배송 중",
    delivered: "배송 완료",
    cancelled: "취소됨",
  };
  return statusMap[status] || status;
}

/**
 * 로딩 폴백 컴포넌트 (스켈레톤)
 */
function OrderSuccessLoading() {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <Skeleton className="h-16 w-16 mx-auto mb-4 rounded-full" />
        <Skeleton className="h-8 w-64 mx-auto mb-2" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * 주문 성공 컨텐츠 컴포넌트 (Server Component)
 */
async function OrderSuccessContent({ orderId }: { orderId: string }) {
  console.group("📦 주문 성공 페이지 데이터 페칭 시작");
  console.log("주문 ID:", orderId);

  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.log("⚠️ 로그인하지 않은 사용자, 로그인 페이지로 리다이렉트");
      console.groupEnd();
      redirect("/sign-in");
    }
    console.log("✅ 사용자 인증 확인 완료:", userId);

    // 2. 주문 정보 조회
    console.log("📦 주문 정보 조회 중...");
    const result = await getOrder(orderId);

    if (!result.success) {
      console.error("❌ 주문 조회 실패:", result.error);
      console.groupEnd();

      if (result.error === "주문을 찾을 수 없습니다.") {
        notFound();
      }

      throw new Error(result.error);
    }

    const order = result.data;

    console.log("✅ 주문 정보 조회 완료:", {
      주문ID: order.id,
      총액: order.total_amount,
      상품개수: order.order_items.length,
    });
    console.groupEnd();

    const totalQuantity = order.order_items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    return (
      <div className="space-y-6">
        {/* 성공 메시지 */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            주문이 완료되었습니다
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            주문이 성공적으로 접수되었습니다. 감사합니다.
          </p>
        </div>

        {/* 주문 정보 */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            주문 정보
          </h2>

          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                주문 번호
              </span>
              <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                {order.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                주문 상태
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {getStatusLabel(order.status)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                총 상품 개수
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {totalQuantity}개
              </span>
            </div>
            <div className="flex items-center justify-between text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                총 주문 금액
              </span>
              <span className="text-2xl font-bold text-primary">
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>

          {/* 배송지 정보 */}
          {order.shipping_address && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                배송지 정보
              </h3>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  {order.shipping_address.address}{" "}
                  {order.shipping_address.addressDetail || ""}
                </p>
                <p>우편번호: {order.shipping_address.postalCode}</p>
                <p>연락처: {order.shipping_address.phoneNumber}</p>
              </div>
            </div>
          )}

          {/* 주문 메모 */}
          {order.order_note && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                주문 메모
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {order.order_note}
              </p>
            </div>
          )}
        </div>

        {/* 주문 상품 목록 */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            주문 상품
          </h2>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {order.order_items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="relative w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
                  <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.product_id}`}
                    className="text-base font-semibold text-gray-900 dark:text-gray-100 hover:text-primary transition-colors block"
                  >
                    {item.product_name}
                  </Link>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">
                      {formatPrice(item.price)}
                    </span>
                    {" × "}
                    <span className="font-medium">{item.quantity}개</span>
                    {" = "}
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full" size="lg">
              <Home className="w-5 h-5 mr-2" />
              홈으로 가기
            </Button>
          </Link>
          <Link href="/products" className="flex-1">
            <Button className="w-full" size="lg">
              <ShoppingBag className="w-5 h-5 mr-2" />
              쇼핑 계속하기
            </Button>
          </Link>
        </div>
      </div>
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

    // 에러 상태 UI
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          주문 정보를 불러올 수 없습니다
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error instanceof Error
            ? error.message
            : "오류가 발생했습니다. 잠시 후 다시 시도해주세요."}
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button variant="outline">홈으로 가기</Button>
          </Link>
          <Link href="/products">
            <Button>상품 목록으로</Button>
          </Link>
        </div>
      </div>
    );
  }
}

/**
 * 주문 성공 페이지 (메인 컴포넌트)
 */
interface OrderSuccessPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderSuccessPage(props: OrderSuccessPageProps) {
  // Next.js 15: params를 async로 처리
  const params = await props.params;
  const orderId = params.id;

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
      <div className="w-full max-w-4xl mx-auto">
        <Suspense fallback={<OrderSuccessLoading />}>
          <OrderSuccessContent orderId={orderId} />
        </Suspense>
      </div>
    </main>
  );
}
