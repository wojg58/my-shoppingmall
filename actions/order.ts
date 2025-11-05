"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { getCartItems, type CartItem } from "@/actions/cart";
import { revalidatePath } from "next/cache";
import { createOrderSchema, type CreateOrderInput } from "@/lib/schemas/order";

/**
 * @file actions/order.ts
 * @description 주문 관련 Server Actions
 *
 * 주문 생성 및 조회를 위한 Server Actions입니다.
 *
 * 주요 기능:
 * 1. 주문 생성 (장바구니 → 주문 변환)
 * 2. 장바구니 데이터 검증
 * 3. 재고 재확인 (주문 시점 재고 확인)
 * 4. 트랜잭션 처리
 * 5. 주문 합계 검증
 *
 * 핵심 구현 로직:
 * - Clerk 인증을 통한 사용자 확인 (clerk_id 사용)
 * - Supabase Service Role 클라이언트로 RLS 우회하여 데이터 접근
 * - 애플리케이션 레벨에서 clerk_id로 필터링 (보안)
 * - 트랜잭션 처리 (orders + order_items 모두 성공해야 저장)
 * - 재고 검증 및 권한 검증
 * - 상세한 로깅으로 디버깅 지원
 *
 * @dependencies
 * - @clerk/nextjs/server: Clerk 인증
 * - @/lib/supabase/service-role: Supabase Service Role 클라이언트
 * - @/actions/cart: 장바구니 조회
 * - @/lib/schemas/order: 주문 스키마 검증
 * - next/cache: revalidatePath
 */

/**
 * 주문 생성 결과 타입
 */
export type CreateOrderResult =
  | {
      success: true;
      data: {
        orderId: string;
        totalAmount: number;
      };
    }
  | {
      success: false;
      error: string;
    };

/**
 * 주문 생성
 *
 * @param orderData 배송지 정보 및 주문 메모
 * @returns 주문 생성 결과
 */
export async function createOrder(
  orderData: CreateOrderInput,
): Promise<CreateOrderResult> {
  console.group("📦 주문 생성 시작");

  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.error("❌ 로그인하지 않은 사용자");
      console.groupEnd();
      return {
        success: false,
        error: "로그인이 필요합니다. 로그인 후 다시 시도해주세요.",
      };
    }
    console.log("✅ 사용자 인증 확인 완료:", userId);

    // 2. 입력 데이터 검증
    console.log("🔍 주문 데이터 검증 중...");
    const validationResult = createOrderSchema.safeParse(orderData);
    if (!validationResult.success) {
      console.error("❌ 입력 데이터 검증 실패:");
      console.error("  - 에러:", validationResult.error.errors);
      console.groupEnd();
      return {
        success: false,
        error: "입력한 정보가 올바르지 않습니다. 다시 확인해주세요.",
      };
    }
    console.log("✅ 입력 데이터 검증 완료");

    const validatedData = validationResult.data;

    // 3. Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();
    console.log("✅ Supabase 클라이언트 생성 완료");

    // 4. 장바구니 데이터 조회
    console.log("🛒 장바구니 데이터 조회 중...");
    const cartResult = await getCartItems();

    if (cartResult.success === false) {
      console.error("❌ 장바구니 조회 실패:", cartResult.error);
      console.groupEnd();
      return {
        success: false,
        error: "장바구니를 불러올 수 없습니다.",
      };
    }

    const { data: cartItems, totalAmount: cartTotalAmount } = cartResult;

    if (!cartItems || cartItems.length === 0) {
      console.error("❌ 장바구니가 비어있음");
      console.groupEnd();
      return {
        success: false,
        error: "장바구니가 비어있습니다. 상품을 추가한 후 주문해주세요.",
      };
    }

    console.log("✅ 장바구니 조회 완료:", {
      아이템개수: cartItems.length,
      총액: cartTotalAmount,
    });

    // 5. 재고 재확인 및 가격 검증
    console.log("📊 재고 및 가격 재확인 중...");
    const orderItems: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      price: number;
    }> = [];

    let calculatedTotalAmount = 0;

    for (const cartItem of cartItems) {
      const product = cartItem.products;

      // 상품 활성화 확인
      if (!product.is_active) {
        console.error("❌ 비활성화된 상품:", product.name);
        console.groupEnd();
        return {
          success: false,
          error: `판매 중지된 상품이 있습니다: ${product.name}`,
        };
      }

      // 재고 확인
      if (cartItem.quantity > product.stock_quantity) {
        console.error("❌ 재고 부족:", {
          상품명: product.name,
          요청수량: cartItem.quantity,
          현재재고: product.stock_quantity,
        });
        console.groupEnd();
        return {
          success: false,
          error: `재고가 부족합니다: ${product.name} (현재 재고: ${product.stock_quantity}개, 요청 수량: ${cartItem.quantity}개)`,
        };
      }

      // 품절 확인
      if (product.stock_quantity === 0) {
        console.error("❌ 품절 상품:", product.name);
        console.groupEnd();
        return {
          success: false,
          error: `품절된 상품이 있습니다: ${product.name}`,
        };
      }

      const itemTotal = Number(product.price) * cartItem.quantity;
      calculatedTotalAmount += itemTotal;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: cartItem.quantity,
        price: Number(product.price),
      });
    }

    console.log("✅ 재고 및 가격 재확인 완료:", {
      총액: calculatedTotalAmount,
    });

    // 6. 주문 총액 검증
    if (Math.abs(calculatedTotalAmount - cartTotalAmount) > 0.01) {
      console.error("❌ 주문 총액 불일치:", {
        장바구니총액: cartTotalAmount,
        계산된총액: calculatedTotalAmount,
        차이: Math.abs(calculatedTotalAmount - cartTotalAmount),
      });
      console.groupEnd();
      return {
        success: false,
        error:
          "주문 금액이 일치하지 않습니다. 페이지를 새로고침한 후 다시 시도해주세요.",
      };
    }

    console.log("✅ 주문 총액 검증 완료");

    // 7. 주문 생성 (트랜잭션)
    console.log("💾 주문 데이터 저장 시작...");

    // 7-1. orders 테이블에 주문 저장
    const shippingAddressJson = {
      address: validatedData.shippingAddress.address,
      postalCode: validatedData.shippingAddress.postalCode,
      addressDetail: validatedData.shippingAddress.addressDetail,
      phoneNumber: validatedData.shippingAddress.phoneNumber,
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        clerk_id: userId,
        total_amount: calculatedTotalAmount,
        status: "pending",
        shipping_address: shippingAddressJson,
        order_note: validatedData.orderNote || null,
      })
      .select("id, total_amount")
      .single();

    if (orderError || !order) {
      console.error("❌ 주문 저장 실패:");
      console.error("  - 에러 코드:", orderError?.code);
      console.error("  - 에러 메시지:", orderError?.message);
      console.groupEnd();
      return {
        success: false,
        error: "주문 생성에 실패했습니다. 잠시 후 다시 시도해주세요.",
      };
    }

    console.log("✅ 주문 저장 완료:", {
      주문ID: order.id,
      총액: order.total_amount,
    });

    // 7-2. order_items 테이블에 주문 상품 저장
    const orderItemsData = orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItemsData);

    if (orderItemsError) {
      console.error("❌ 주문 상품 저장 실패:");
      console.error("  - 에러 코드:", orderItemsError.code);
      console.error("  - 에러 메시지:", orderItemsError.message);

      // 주문은 이미 생성되었으므로 주문을 삭제 (롤백)
      console.log("🔄 주문 롤백 중...");
      await supabase.from("orders").delete().eq("id", order.id);

      console.groupEnd();
      return {
        success: false,
        error: "주문 상품 저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
      };
    }

    console.log("✅ 주문 상품 저장 완료:", {
      상품개수: orderItems.length,
    });

    // 8. 로그 출력
    console.log("✅ 주문 생성 완료:", {
      주문ID: order.id,
      총액: order.total_amount,
      상품개수: orderItems.length,
      배송지: shippingAddressJson.address,
    });
    console.groupEnd();

    // 9. 캐시 무효화
    revalidatePath("/orders");
    revalidatePath("/cart");
    revalidatePath("/");

    return {
      success: true,
      data: {
        orderId: order.id,
        totalAmount: order.total_amount,
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
      error: "주문 생성 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 주문 정보 타입
 */
export type Order = {
  id: string;
  clerk_id: string;
  total_amount: number;
  status: string;
  shipping_address: {
    address: string;
    postalCode: string;
    addressDetail?: string;
    phoneNumber: string;
  } | null;
  order_note: string | null;
  created_at: string;
  updated_at: string;
  order_items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
};

/**
 * 주문 조회 결과 타입
 */
export type GetOrderResult =
  | {
      success: true;
      data: Order;
    }
  | {
      success: false;
      error: string;
    };

/**
 * 주문 조회
 *
 * @param orderId 주문 ID
 * @returns 주문 정보
 */
export async function getOrder(orderId: string): Promise<GetOrderResult> {
  console.group("📦 주문 조회 시작");
  console.log("주문 ID:", orderId);

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
    console.log("✅ 사용자 인증 확인 완료:", userId);

    // 2. Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();
    console.log("✅ Supabase 클라이언트 생성 완료");

    // 3. 주문 정보 조회 (order_items 포함)
    console.log("📦 주문 정보 조회 중...");
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        id,
        clerk_id,
        total_amount,
        status,
        shipping_address,
        order_note,
        created_at,
        updated_at,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          price
        )
      `,
      )
      .eq("id", orderId)
      .eq("clerk_id", userId) // 권한 검증
      .single();

    if (orderError) {
      console.error("❌ 주문 조회 실패:");
      console.error("  - 에러 코드:", orderError.code);
      console.error("  - 에러 메시지:", orderError.message);
      console.groupEnd();

      if (orderError.code === "PGRST116") {
        return {
          success: false,
          error: "주문을 찾을 수 없습니다.",
        };
      }

      return {
        success: false,
        error: "주문 정보를 불러올 수 없습니다.",
      };
    }

    if (!order) {
      console.error("❌ 주문을 찾을 수 없음");
      console.groupEnd();
      return {
        success: false,
        error: "주문을 찾을 수 없습니다.",
      };
    }

    // order_items가 배열이 아닌 경우 처리
    const orderItems = Array.isArray(order.order_items)
      ? order.order_items
      : [];

    const orderData: Order = {
      id: order.id,
      clerk_id: order.clerk_id,
      total_amount: Number(order.total_amount),
      status: order.status,
      shipping_address: order.shipping_address as Order["shipping_address"],
      order_note: order.order_note,
      created_at: order.created_at,
      updated_at: order.updated_at,
      order_items: orderItems.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: Number(item.price),
      })),
    };

    console.log("✅ 주문 조회 완료:", {
      주문ID: orderData.id,
      총액: orderData.total_amount,
      상품개수: orderData.order_items.length,
    });
    console.groupEnd();

    return {
      success: true,
      data: orderData,
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
      error: "주문 조회 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 주문 목록 조회 결과 타입
 */
export type GetOrdersResult =
  | {
      success: true;
      data: Array<{
        id: string;
        clerk_id: string;
        total_amount: number;
        status: string;
        created_at: string;
        updated_at: string;
      }>;
    }
  | {
      success: false;
      error: string;
    };

/**
 * 주문 목록 조회
 *
 * @returns 사용자의 주문 목록 (최신순 정렬)
 */
export async function getOrders(): Promise<GetOrdersResult> {
  console.group("📦 주문 목록 조회 시작");

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
    console.log("✅ 사용자 인증 확인 완료:", userId);

    // 2. Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();
    console.log("✅ Supabase 클라이언트 생성 완료");

    // 3. 주문 목록 조회 (clerk_id로 필터링, 최신순 정렬)
    console.log("📦 주문 목록 조회 중...");
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, clerk_id, total_amount, status, created_at, updated_at")
      .eq("clerk_id", userId) // 권한 검증
      .order("created_at", { ascending: false }); // 최신순 정렬

    if (ordersError) {
      console.error("❌ 주문 목록 조회 실패:");
      console.error("  - 에러 코드:", ordersError.code);
      console.error("  - 에러 메시지:", ordersError.message);
      console.groupEnd();
      return {
        success: false,
        error: "주문 목록을 불러올 수 없습니다.",
      };
    }

    if (!orders) {
      console.log("⚠️ 주문 목록이 비어있음");
      console.groupEnd();
      return {
        success: true,
        data: [],
      };
    }

    // 데이터 변환 (total_amount를 number로 변환)
    const ordersData = orders.map((order) => ({
      id: order.id,
      clerk_id: order.clerk_id,
      total_amount: Number(order.total_amount),
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,
    }));

    console.log("✅ 주문 목록 조회 완료:", {
      주문개수: ordersData.length,
    });
    console.groupEnd();

    return {
      success: true,
      data: ordersData,
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
      error: "주문 목록 조회 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 주문 취소 결과 타입
 */
export type CancelOrderResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

/**
 * 주문 취소
 *
 * @param orderId 주문 ID
 * @returns 주문 취소 결과
 */
export async function cancelOrder(orderId: string): Promise<CancelOrderResult> {
  console.group("❌ 주문 취소 시작");
  console.log("주문 ID:", orderId);

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
    console.log("✅ 사용자 인증 확인 완료:", userId);

    // 2. Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();
    console.log("✅ Supabase 클라이언트 생성 완료");

    // 3. 주문 정보 조회 및 권한 확인
    console.log("📦 주문 정보 조회 중...");
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, clerk_id, status")
      .eq("id", orderId)
      .eq("clerk_id", userId) // 권한 검증
      .single();

    if (orderError || !order) {
      console.error("❌ 주문 조회 실패:");
      console.error("  - 에러 코드:", orderError?.code);
      console.error("  - 에러 메시지:", orderError?.message);
      console.groupEnd();
      return {
        success: false,
        error: "주문을 찾을 수 없습니다.",
      };
    }

    // 4. 주문 상태 확인 (pending일 때만 취소 가능)
    if (order.status !== "pending") {
      console.error("❌ 취소 불가능한 주문 상태:", order.status);
      console.groupEnd();
      return {
        success: false,
        error: "결제 대기 중인 주문만 취소할 수 있습니다.",
      };
    }

    console.log("✅ 주문 상태 확인 완료:", order.status);

    // 5. 주문 상태를 'cancelled'로 업데이트
    console.log("🔄 주문 취소 처리 중...");
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId)
      .eq("clerk_id", userId); // 권한 재확인

    if (updateError) {
      console.error("❌ 주문 취소 실패:");
      console.error("  - 에러 코드:", updateError.code);
      console.error("  - 에러 메시지:", updateError.message);
      console.groupEnd();
      return {
        success: false,
        error: "주문 취소에 실패했습니다.",
      };
    }

    console.log("✅ 주문 취소 완료");
    console.groupEnd();

    // 6. 캐시 무효화
    revalidatePath("/my-orders");
    revalidatePath("/orders");

    return {
      success: true,
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
      error: "주문 취소 중 오류가 발생했습니다.",
    };
  }
}