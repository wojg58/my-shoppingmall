"use client";

import { useAuth } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { useEffect, useState } from "react";

/**
 * @file hooks/use-cart-count.ts
 * @description 장바구니 개수 조회 Hook
 *
 * 인증된 사용자의 장바구니 아이템 개수를 조회하는 Hook입니다.
 *
 * 주요 기능:
 * 1. 로그인 상태 확인
 * 2. 장바구니 아이템 개수 조회
 * 3. 자동 갱신 (인증 상태 변경 시)
 * 4. 로그 추가
 *
 * 핵심 구현 로직:
 * - Clerk 인증을 통한 사용자 확인
 * - Supabase 클라이언트로 cart_items 테이블 조회
 * - clerk_id로 필터링하여 개수 집계
 * - 로그인하지 않은 경우 0 반환
 *
 * @dependencies
 * - @clerk/nextjs: Clerk 인증
 * - @/lib/supabase/clerk-client: Supabase 클라이언트
 *
 * @todo React Query로 캐싱 및 자동 갱신 개선 (선택사항)
 */

/**
 * 장바구니 개수 조회 Hook
 *
 * @returns 장바구니 개수 및 로딩 상태
 */
export function useCartCount() {
  const { userId, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 인증 상태 로딩 중이거나 로그인하지 않은 경우
    if (!isLoaded || !userId) {
      setCount(0);
      setIsLoading(false);
      return;
    }

    // 장바구니 개수 조회 함수
    const fetchCartCount = async () => {
      console.group("🛒 장바구니 개수 조회 시작");
      console.log("사용자 ID:", userId);

      try {
        setIsLoading(true);
        setError(null);

        // 장바구니 아이템 개수 조회
        const { count, error: countError } = await supabase
          .from("cart_items")
          .select("*", { count: "exact", head: true })
          .eq("clerk_id", userId);

        if (countError) {
          console.error("❌ 장바구니 개수 조회 실패:");
          console.error("  - 에러 코드:", countError.code);
          console.error("  - 에러 메시지:", countError.message);
          console.groupEnd();
          setError(countError.message);
          setCount(0);
          return;
        }

        const cartCount = count ?? 0;
        console.log("✅ 장바구니 개수 조회 완료:", {
          개수: cartCount,
        });
        console.groupEnd();

        setCount(cartCount);
      } catch (err) {
        console.error("❌ 예상치 못한 오류 발생:");
        if (err instanceof Error) {
          console.error("  - 에러 메시지:", err.message);
          console.error("  - 스택 트레이스:", err.stack);
        } else {
          console.error("  - 에러 객체:", JSON.stringify(err, null, 2));
        }
        console.groupEnd();
        setError("장바구니 개수를 불러오는데 실패했습니다.");
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    // 초기 조회
    fetchCartCount();

    // 페이지 포커스 시 갱신 (다른 탭에서 장바구니를 변경한 경우 대비)
    const handleFocus = () => {
      fetchCartCount();
    };

    window.addEventListener("focus", handleFocus);

    // cleanup
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [userId, isLoaded, supabase]);

  // 커스텀 이벤트로 장바구니 갱신 요청 (다른 컴포넌트에서 호출 가능)
  useEffect(() => {
    const handleCartUpdate = () => {
      if (isLoaded && userId) {
        // 장바구니 개수 재조회
        const fetchCartCount = async () => {
          try {
            const { count } = await supabase
              .from("cart_items")
              .select("*", { count: "exact", head: true })
              .eq("clerk_id", userId);
            setCount(count ?? 0);
          } catch (err) {
            console.error("장바구니 개수 갱신 실패:", err);
          }
        };
        fetchCartCount();
      }
    };

    window.addEventListener("cart-updated", handleCartUpdate);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, [userId, isLoaded, supabase]);

  return {
    count,
    isLoading,
    error,
  };
}
