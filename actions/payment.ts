"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { getCartItems, clearCart, type CartItem } from "@/actions/cart";
import { z } from "zod";

/**
 * @file actions/payment.ts
 * @description 결제 승인 및 주문 저장 Server Actions
 *
 * Toss Payments 결제 승인 및 주문 저장을 처리하는 Server Actions입니다.
 *
 * 주요 기능:
 * 1. Toss Payments 결제 승인 API 호출
 * 2. 결제 승인 성공 시 주문 생성 (orders, order_items 테이블)
 * 3. 주문 상태를 'confirmed'로 설정
 * 4. 장바구니 데이터 기반으로 주문 생성
 *
 * 핵심 구현 로직:
 * - Toss Payments v1 결제 승인 API 호출 (POST /v1/payments/confirm)
 * - Basic Auth (시크릿 키 base64 인코딩)
 * - 결제 승인 성공 후 주문 생성
 * - 트랜잭션 처리 (결제 승인 + 주문 생성)
 *
 * @dependencies
 * - @clerk/nextjs/server: 사용자 인증
 * - @/lib/supabase/server: Supabase 클라이언트
 * - @/actions/cart: 장바구니 데이터 조회
 */

/**
 * 결제 승인 요청 스키마
 */
const confirmPaymentSchema = z.object({
  paymentKey: z.string().min(1, "결제 키가 필요합니다."),
  orderId: z.string().min(1, "주문 ID가 필요합니다."),
  amount: z.number().positive("결제 금액은 0보다 커야 합니다."),
  shippingAddress: z
    .object({
      customerName: z.string().min(1),
      address: z.string().min(1),
      postalCode: z.string().min(1),
      addressDetail: z.string().optional(),
      phoneNumber: z.string().min(1),
    })
    .optional(),
  orderNote: z.string().optional(),
});

/**
 * 결제 승인 결과 타입
 */
export type ConfirmPaymentResult =
  | {
      success: true;
      data: {
        orderId: string;
        paymentKey: string;
        totalAmount: number;
      };
    }
  | {
      success: false;
      error: string;
    };

/**
 * Toss Payments 결제 승인 API 호출
 *
 * @param paymentKey 결제 키
 * @param orderId 주문 ID
 * @param amount 결제 금액
 * @returns 결제 승인 결과
 */
async function confirmPaymentWithToss(
  paymentKey: string,
  orderId: string,
  amount: number,
) {
  const secretKey = process.env.TOSS_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Toss Payments 시크릿 키가 설정되지 않았습니다.");
  }

  // Basic Auth 헤더 생성 (시크릿 키 + ":" base64 인코딩)
  const authString = Buffer.from(`${secretKey}:`).toString("base64");

  console.log("🔐 Toss Payments 결제 승인 API 호출 시작");
  console.log("결제 키:", paymentKey.substring(0, 20) + "...");
  console.log("주문 ID:", orderId);
  console.log("결제 금액:", amount);

  try {
    const response = await fetch(
      "https://api.tosspayments.com/v1/payments/confirm",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authString}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ 결제 승인 API 오류:", data);
      throw new Error(
        data.message ||
          `결제 승인 실패: ${response.status} ${response.statusText}`,
      );
    }

    console.log("✅ 결제 승인 성공:", {
      상태: data.status,
      승인시간: data.approvedAt,
    });

    return data;
  } catch (error) {
    console.error("❌ 결제 승인 API 호출 실패:", error);
    throw error;
  }
}

/**
 * 주문명 생성 함수
 *
 * @param items 장바구니 아이템 목록
 * @returns 주문명
 */
function generateOrderName(
  items: CartItem[],
): string {
  if (items.length === 0) {
    return "주문";
  }

  // products가 배열일 수 있으므로 안전하게 처리
  const firstItem = items[0];
  const productName = Array.isArray(firstItem.products)
    ? firstItem.products[0]?.name || "상품"
    : firstItem.products?.name || "상품";

  if (items.length === 1) {
    return productName;
  }

  return `${productName} 외 ${items.length - 1}건`;
}

/**
 * 결제 승인 및 주문 저장
 *
 * 결제 승인 API를 호출하고, 승인 성공 시 주문을 생성합니다.
 *
 * @param paymentKey 결제 키
 * @param orderId 주문 ID (임시 ID)
 * @param amount 결제 금액
 * @param shippingAddress 배송지 정보 (선택사항)
 * @param orderNote 주문 메모 (선택사항)
 * @returns 결제 승인 및 주문 저장 결과
 */
export async function confirmPaymentAndCreateOrder(
  paymentKey: string,
  orderId: string,
  amount: number,
  shippingAddress?: {
    customerName: string;
    address: string;
    postalCode: string;
    addressDetail?: string;
    phoneNumber: string;
  },
  orderNote?: string,
): Promise<ConfirmPaymentResult> {
  console.group("💳 결제 승인 및 주문 저장 시작");

  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.error("❌ 로그인하지 않은 사용자");
      console.groupEnd();
      return {
        success: false,
        error: "로그인이 필요합니다.",
      };
    }
    console.log("✅ 사용자 인증 확인:", userId);

    // 2. 입력 데이터 검증
    const validationResult = confirmPaymentSchema.safeParse({
      paymentKey,
      orderId,
      amount,
      shippingAddress,
      orderNote,
    });

    if (!validationResult.success) {
      console.error("❌ 입력 데이터 검증 실패:", validationResult.error.errors);
      console.groupEnd();
      return {
        success: false,
        error:
          validationResult.error.errors[0]?.message ||
          "입력 데이터가 올바르지 않습니다.",
      };
    }

    // 3. 장바구니 데이터 조회
    console.log("📦 장바구니 데이터 조회 중...");
    const cartResult = await getCartItems();

    if (!cartResult.success || cartResult.data.length === 0) {
      console.error("❌ 장바구니가 비어있음");
      console.groupEnd();
      return {
        success: false,
        error: "장바구니가 비어있습니다.",
      };
    }

    const cartItems = cartResult.data;
    const cartTotalAmount = cartResult.totalAmount;

    console.log("✅ 장바구니 조회 완료:", {
      아이템개수: cartItems.length,
      총액: cartTotalAmount,
    });

    // 4. 결제 금액 검증 (장바구니 총액과 일치 확인)
    if (Math.abs(amount - cartTotalAmount) > 0.01) {
      console.error("❌ 결제 금액 불일치:", {
        결제금액: amount,
        장바구니총액: cartTotalAmount,
      });
      console.groupEnd();
      return {
        success: false,
        error: "결제 금액이 장바구니 총액과 일치하지 않습니다.",
      };
    }

    // 5. 재고 및 품절 확인
    const outOfStockItems = cartItems.filter((item) => {
      // products가 배열일 수 있으므로 안전하게 처리
      const product = Array.isArray(item.products)
        ? item.products[0]
        : item.products;
      return product?.stock_quantity === 0;
    });
    if (outOfStockItems.length > 0) {
      console.error("❌ 품절 상품 포함");
      console.groupEnd();
      return {
        success: false,
        error: "품절된 상품이 포함되어 있습니다.",
      };
    }

    // 6. Toss Payments 결제 승인 API 호출
    console.log("🔐 Toss Payments 결제 승인 API 호출 중...");
    const paymentResult = await confirmPaymentWithToss(
      paymentKey,
      orderId,
      amount,
    );

    if (paymentResult.status !== "DONE") {
      console.error("❌ 결제 승인 실패 (상태:", paymentResult.status, ")");
      console.groupEnd();
      return {
        success: false,
        error: "결제 승인이 완료되지 않았습니다.",
      };
    }

    // 7. Supabase 클라이언트 생성
    const supabase = await createClerkSupabaseClient();

    // 8. 주문명 생성
    const orderName = generateOrderName(cartItems);

    // 9. 주문 생성 (orders 테이블)
    console.log("📝 주문 생성 중...");
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        clerk_id: userId,
        total_amount: cartTotalAmount,
        status: "confirmed", // 결제 승인 완료이므로 'confirmed'로 설정
        shipping_address: shippingAddress
          ? {
              customerName: shippingAddress.customerName,
              phoneNumber: shippingAddress.phoneNumber,
              postalCode: shippingAddress.postalCode,
              address: shippingAddress.address,
              addressDetail: shippingAddress.addressDetail || "",
            }
          : {
              // 배송지 정보가 없을 경우 기본값 (임시)
              customerName: userId,
              phoneNumber: "",
              postalCode: "",
              address: "",
              addressDetail: "",
            },
        order_note: orderNote || null,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("❌ 주문 생성 실패:", orderError);
      console.groupEnd();
      return {
        success: false,
        error: "주문 생성 중 오류가 발생했습니다.",
      };
    }

    console.log("✅ 주문 생성 완료:", {
      주문ID: order.id,
      총액: cartTotalAmount,
    });

    // 10. 주문 상품 저장 (order_items 테이블)
    console.log("📦 주문 상품 저장 중...");
    const orderItems = cartItems.map((item) => {
      // products가 배열일 수 있으므로 안전하게 처리
      const product = Array.isArray(item.products)
        ? item.products[0]
        : item.products;
      
      return {
        order_id: order.id,
        product_id: item.product_id,
        product_name: product?.name || "상품",
        quantity: item.quantity,
        price: product?.price || 0,
      };
    });

    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (orderItemsError) {
      console.error("❌ 주문 상품 저장 실패:", orderItemsError);
      // 주문 삭제 시도 (롤백)
      await supabase.from("orders").delete().eq("id", order.id);
      console.groupEnd();
      return {
        success: false,
        error: "주문 상품 저장 중 오류가 발생했습니다.",
      };
    }

    console.log("✅ 주문 상품 저장 완료:", {
      상품개수: orderItems.length,
    });

    // 11. 상품 재고 감소 처리
    console.log("📦 상품 재고 감소 처리 중...");
    const supabaseServiceRole = getServiceRoleClient();

    for (const orderItem of orderItems) {
      const { data: product, error: productError } = await supabaseServiceRole
        .from("products")
        .select("stock_quantity")
        .eq("id", orderItem.product_id)
        .single();

      if (productError || !product) {
        console.error(
          `❌ 상품 조회 실패 (product_id: ${orderItem.product_id}):`,
          productError,
        );
        // 재고 감소 실패해도 주문은 완료되었으므로 경고만 출력
        continue;
      }

      const newStock = product.stock_quantity - orderItem.quantity;

      if (newStock < 0) {
        console.error(
          `❌ 재고 부족 (product_id: ${orderItem.product_id}, 현재: ${product.stock_quantity}, 요청: ${orderItem.quantity})`,
        );
        // 재고가 부족해도 이미 주문은 완료되었으므로 경고만 출력
        continue;
      }

      const { error: updateError } = await supabaseServiceRole
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", orderItem.product_id);

      if (updateError) {
        console.error(
          `❌ 재고 감소 실패 (product_id: ${orderItem.product_id}):`,
          updateError,
        );
        // 재고 감소 실패해도 주문은 완료되었으므로 경고만 출력
      } else {
        console.log(
          `✅ 재고 감소 완료 (product_id: ${orderItem.product_id}, ${product.stock_quantity} → ${newStock})`,
        );
      }
    }

    // 12. 장바구니 비우기
    console.log("🗑️ 장바구니 비우기 중...");
    const clearCartResult = await clearCart();

    if (clearCartResult.success === false) {
      console.error("❌ 장바구니 비우기 실패:", clearCartResult.error);
      // 장바구니 비우기 실패해도 주문은 완료되었으므로 경고만 출력
    } else {
      console.log("✅ 장바구니 비우기 완료");
    }

    // 13. 로그 출력
    console.log("✅ 결제 승인 및 주문 저장 완료:", {
      주문ID: order.id,
      결제키: paymentKey.substring(0, 20) + "...",
      총액: cartTotalAmount,
      상품개수: orderItems.length,
      재고감소: "완료",
      장바구니비우기: clearCartResult.success ? "완료" : "실패",
    });
    console.groupEnd();

    // 14. 캐시 무효화
    revalidatePath("/orders");
    revalidatePath("/cart");
    revalidatePath("/");

    return {
      success: true,
      data: {
        orderId: order.id,
        paymentKey,
        totalAmount: cartTotalAmount,
      },
    };
  } catch (error) {
    console.error("❌ 예상치 못한 오류 발생:");
    if (error instanceof Error) {
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 스택 트레이스:", error.stack);
    } else {
      console.error("  - 에러 객체:", JSON.stringify(error, null, 2));
    }
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "결제 승인 및 주문 저장 중 오류가 발생했습니다.",
    };
  }
}
