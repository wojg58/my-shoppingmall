"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { revalidatePath } from "next/cache";

/**
 * @file actions/cart.ts
 * @description 장바구니 관련 Server Actions
 *
 * 장바구니에 상품을 추가, 수정, 삭제, 조회하는 Server Actions입니다.
 *
 * 주요 기능:
 * 1. 장바구니에 상품 추가 (재고 검증 포함)
 * 2. 장바구니 아이템 수량 변경
 * 3. 장바구니에서 상품 삭제
 * 4. 장바구니 조회 (상품 정보 포함)
 *
 * 핵심 구현 로직:
 * - Clerk 인증을 통한 사용자 확인 (clerk_id 사용)
 * - Supabase Service Role 클라이언트로 RLS 우회하여 데이터 접근
 * - 애플리케이션 레벨에서 clerk_id로 필터링 (보안)
 * - 재고 검증 및 권한 검증
 * - 상세한 로깅으로 디버깅 지원
 *
 * @dependencies
 * - @clerk/nextjs/server: Clerk 인증
 * - @/lib/supabase/service-role: Supabase Service Role 클라이언트
 * - next/cache: revalidatePath
 */

/**
 * 장바구니 아이템 타입
 */
export type CartItem = {
  id: string;
  clerk_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  products: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string | null;
    stock_quantity: number;
    is_active: boolean;
  };
};

/**
 * 장바구니 조회 결과 타입
 */
export type GetCartItemsResult =
  | {
      success: true;
      data: CartItem[];
      totalAmount: number;
    }
  | {
      success: false;
      error: string;
    };

/**
 * 장바구니 추가 결과 타입
 */
export type AddToCartResult =
  | {
      success: true;
      data: {
        id: string;
        quantity: number;
      };
    }
  | {
      success: false;
      error: string;
    };

/**
 * 장바구니 수량 변경 결과 타입
 */
export type UpdateCartItemQuantityResult =
  | {
      success: true;
      data: {
        id: string;
        quantity: number;
      };
    }
  | {
      success: false;
      error: string;
    };

/**
 * 장바구니 삭제 결과 타입
 */
export type RemoveFromCartResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

/**
 * 장바구니에 상품 추가
 *
 * @param productId 상품 ID
 * @param quantity 수량 (기본값: 1)
 * @returns 성공/실패 결과
 */
export async function addToCart(
  productId: string,
  quantity: number = 1,
): Promise<AddToCartResult> {
  console.group("🛒 장바구니 추가 시작");
  console.log("상품 ID:", productId);
  console.log("수량:", quantity);

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

    // 2. 입력값 검증
    if (!productId || typeof productId !== "string") {
      console.error("❌ 잘못된 상품 ID:", productId);
      console.groupEnd();
      return {
        success: false,
        error: "유효하지 않은 상품 정보입니다.",
      };
    }

    if (quantity < 1 || !Number.isInteger(quantity)) {
      console.error("❌ 잘못된 수량:", quantity);
      console.groupEnd();
      return {
        success: false,
        error: "수량은 1 이상의 정수여야 합니다.",
      };
    }

    // 3. Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();
    console.log("✅ Supabase 클라이언트 생성 완료");

    // 4. 상품 정보 조회 및 재고 확인
    console.log("📦 상품 정보 조회 중...");
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, stock_quantity, is_active")
      .eq("id", productId)
      .single();

    if (productError) {
      console.error("❌ 상품 조회 실패:");
      console.error("  - 에러 코드:", productError.code);
      console.error("  - 에러 메시지:", productError.message);
      console.groupEnd();
      return {
        success: false,
        error: "상품 정보를 불러올 수 없습니다.",
      };
    }

    if (!product) {
      console.error("❌ 상품을 찾을 수 없음");
      console.groupEnd();
      return {
        success: false,
        error: "상품을 찾을 수 없습니다.",
      };
    }

    if (!product.is_active) {
      console.error("❌ 비활성화된 상품");
      console.groupEnd();
      return {
        success: false,
        error: "판매 중인 상품이 아닙니다.",
      };
    }

    // 5. 재고 확인
    console.log("📊 재고 확인:", {
      재고: product.stock_quantity,
      주문수량: quantity,
    });

    // 기존 장바구니 아이템 확인
    const { data: existingCartItem } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("clerk_id", userId)
      .eq("product_id", productId)
      .single();

    const totalQuantity = existingCartItem
      ? existingCartItem.quantity + quantity
      : quantity;

    if (totalQuantity > product.stock_quantity) {
      console.error("❌ 재고 부족:", {
        현재재고: product.stock_quantity,
        요청수량: totalQuantity,
        부족수량: totalQuantity - product.stock_quantity,
      });
      console.groupEnd();
      return {
        success: false,
        error: `재고가 부족합니다. (현재 재고: ${product.stock_quantity}개, 요청 수량: ${totalQuantity}개)`,
      };
    }

    // 6. 장바구니에 추가 또는 수량 증가
    if (existingCartItem) {
      console.log("📝 기존 장바구니 아이템 수량 증가");
      const newQuantity = existingCartItem.quantity + quantity;

      const { data, error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", existingCartItem.id)
        .eq("clerk_id", userId) // 권한 검증
        .select("id, quantity")
        .single();

      if (error) {
        console.error("❌ 장바구니 수량 업데이트 실패:");
        console.error("  - 에러 코드:", error.code);
        console.error("  - 에러 메시지:", error.message);
        console.groupEnd();
        return {
          success: false,
          error: "장바구니 업데이트에 실패했습니다.",
        };
      }

      console.log("✅ 장바구니 수량 증가 완료:", {
        아이템ID: data.id,
        새수량: data.quantity,
      });
      console.groupEnd();

      revalidatePath("/cart");
      revalidatePath("/");

      return {
        success: true,
        data: {
          id: data.id,
          quantity: data.quantity,
        },
      };
    } else {
      console.log("➕ 새로운 장바구니 아이템 추가");
      const { data, error } = await supabase
        .from("cart_items")
        .insert({
          clerk_id: userId,
          product_id: productId,
          quantity: quantity,
        })
        .select("id, quantity")
        .single();

      if (error) {
        console.error("❌ 장바구니 추가 실패:");
        console.error("  - 에러 코드:", error.code);
        console.error("  - 에러 메시지:", error.message);
        console.groupEnd();
        return {
          success: false,
          error: "장바구니 추가에 실패했습니다.",
        };
      }

      console.log("✅ 장바구니 추가 완료:", {
        아이템ID: data.id,
        수량: data.quantity,
      });
      console.groupEnd();

      revalidatePath("/cart");
      revalidatePath("/");

      return {
        success: true,
        data: {
          id: data.id,
          quantity: data.quantity,
        },
      };
    }
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
      error: "장바구니 추가 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 장바구니 아이템 수량 변경
 *
 * @param cartItemId 장바구니 아이템 ID
 * @param newQuantity 새로운 수량
 * @returns 성공/실패 결과
 */
export async function updateCartItemQuantity(
  cartItemId: string,
  newQuantity: number,
): Promise<UpdateCartItemQuantityResult> {
  console.group("🔄 장바구니 수량 변경 시작");
  console.log("장바구니 아이템 ID:", cartItemId);
  console.log("새 수량:", newQuantity);

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

    // 2. 입력값 검증
    if (newQuantity < 1 || !Number.isInteger(newQuantity)) {
      console.error("❌ 잘못된 수량:", newQuantity);
      console.groupEnd();
      return {
        success: false,
        error: "수량은 1 이상의 정수여야 합니다.",
      };
    }

    // 3. Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();
    console.log("✅ Supabase 클라이언트 생성 완료");

    // 4. 기존 장바구니 아이템 조회 (권한 검증 포함)
    console.log("🔍 장바구니 아이템 조회 중...");
    const { data: cartItem, error: cartItemError } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity")
      .eq("id", cartItemId)
      .eq("clerk_id", userId) // 권한 검증
      .single();

    if (cartItemError || !cartItem) {
      console.error("❌ 장바구니 아이템 조회 실패 또는 권한 없음");
      console.error("  - 에러:", cartItemError?.message);
      console.groupEnd();
      return {
        success: false,
        error: "장바구니 아이템을 찾을 수 없거나 권한이 없습니다.",
      };
    }

    console.log("📊 현재 수량:", cartItem.quantity, "→ 새 수량:", newQuantity);

    // 5. 상품 재고 확인
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, stock_quantity, is_active")
      .eq("id", cartItem.product_id)
      .single();

    if (productError || !product) {
      console.error("❌ 상품 조회 실패");
      console.groupEnd();
      return {
        success: false,
        error: "상품 정보를 불러올 수 없습니다.",
      };
    }

    if (!product.is_active) {
      console.error("❌ 비활성화된 상품");
      console.groupEnd();
      return {
        success: false,
        error: "판매 중인 상품이 아닙니다.",
      };
    }

    if (newQuantity > product.stock_quantity) {
      console.error("❌ 재고 부족:", {
        현재재고: product.stock_quantity,
        요청수량: newQuantity,
      });
      console.groupEnd();
      return {
        success: false,
        error: `재고가 부족합니다. (현재 재고: ${product.stock_quantity}개)`,
      };
    }

    // 6. 수량 업데이트
    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity: newQuantity })
      .eq("id", cartItemId)
      .eq("clerk_id", userId) // 권한 검증
      .select("id, quantity")
      .single();

    if (error) {
      console.error("❌ 수량 업데이트 실패:");
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 메시지:", error.message);
      console.groupEnd();
      return {
        success: false,
        error: "수량 변경에 실패했습니다.",
      };
    }

    console.log("✅ 수량 변경 완료:", {
      아이템ID: data.id,
      새수량: data.quantity,
    });
    console.groupEnd();

    revalidatePath("/cart");
    revalidatePath("/");

    return {
      success: true,
      data: {
        id: data.id,
        quantity: data.quantity,
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
      error: "수량 변경 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 장바구니에서 상품 삭제
 *
 * @param cartItemId 장바구니 아이템 ID
 * @returns 성공/실패 결과
 */
export async function removeFromCart(
  cartItemId: string,
): Promise<RemoveFromCartResult> {
  console.group("🗑️ 장바구니 삭제 시작");
  console.log("장바구니 아이템 ID:", cartItemId);

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

    // 2. 입력값 검증
    if (!cartItemId || typeof cartItemId !== "string") {
      console.error("❌ 잘못된 장바구니 아이템 ID:", cartItemId);
      console.groupEnd();
      return {
        success: false,
        error: "유효하지 않은 장바구니 아이템입니다.",
      };
    }

    // 3. Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();
    console.log("✅ Supabase 클라이언트 생성 완료");

    // 4. 삭제 전 아이템 정보 조회 (로그용)
    const { data: cartItem } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity, products(name)")
      .eq("id", cartItemId)
      .eq("clerk_id", userId) // 권한 검증
      .single();

    if (!cartItem) {
      console.error("❌ 장바구니 아이템을 찾을 수 없거나 권한 없음");
      console.groupEnd();
      return {
        success: false,
        error: "장바구니 아이템을 찾을 수 없거나 권한이 없습니다.",
      };
    }

    console.log("📊 삭제할 아이템 정보:", {
      상품명: cartItem.products?.name || "알 수 없음",
      수량: cartItem.quantity,
    });

    // 5. 삭제 실행
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId)
      .eq("clerk_id", userId); // 권한 검증

    if (error) {
      console.error("❌ 삭제 실패:");
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 메시지:", error.message);
      console.groupEnd();
      return {
        success: false,
        error: "장바구니에서 삭제하는데 실패했습니다.",
      };
    }

    console.log("✅ 삭제 완료:", {
      아이템ID: cartItemId,
      상품명: cartItem.products?.name || "알 수 없음",
    });
    console.groupEnd();

    revalidatePath("/cart");
    revalidatePath("/");

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
      error: "삭제 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 장바구니 조회 (상품 정보 포함)
 *
 * @returns 장바구니 아이템 목록 및 총액
 */
export async function getCartItems(): Promise<GetCartItemsResult> {
  console.group("🛒 장바구니 조회 시작");

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

    // 3. 장바구니 아이템 조회 (상품 정보 JOIN)
    console.log("📦 장바구니 아이템 조회 중...");
    const { data: cartItems, error } = await supabase
      .from("cart_items")
      .select(
        `
        id,
        clerk_id,
        product_id,
        quantity,
        created_at,
        updated_at,
        products (
          id,
          name,
          description,
          price,
          category,
          stock_quantity,
          is_active
        )
      `,
      )
      .eq("clerk_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ 장바구니 조회 실패:");
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 메시지:", error.message);
      console.groupEnd();
      return {
        success: false,
        error: "장바구니를 불러오는데 실패했습니다.",
      };
    }

    if (!cartItems || cartItems.length === 0) {
      console.log("📭 장바구니가 비어있음");
      console.groupEnd();
      return {
        success: true,
        data: [],
        totalAmount: 0,
      };
    }

    // 4. 총액 계산
    let totalAmount = 0;
    const validCartItems: CartItem[] = [];

    for (const item of cartItems) {
      // products가 배열일 수도 있으므로 첫 번째 요소 사용
      const product = Array.isArray(item.products)
        ? item.products[0]
        : item.products;

      if (product && product.is_active) {
        const itemTotal = Number(product.price) * item.quantity;
        totalAmount += itemTotal;

        validCartItems.push({
          id: item.id,
          clerk_id: item.clerk_id,
          product_id: item.product_id,
          quantity: item.quantity,
          created_at: item.created_at,
          updated_at: item.updated_at,
          products: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: Number(product.price),
            category: product.category,
            stock_quantity: product.stock_quantity,
            is_active: product.is_active,
          },
        });
      }
    }

    console.log("✅ 장바구니 조회 완료:", {
      아이템개수: validCartItems.length,
      총액: totalAmount.toLocaleString("ko-KR") + "원",
    });
    console.groupEnd();

    return {
      success: true,
      data: validCartItems,
      totalAmount: totalAmount,
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
      error: "장바구니 조회 중 오류가 발생했습니다.",
    };
  }
}
