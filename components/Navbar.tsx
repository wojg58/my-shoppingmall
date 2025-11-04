import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { CartIcon } from "@/components/cart-icon";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @file components/Navbar.tsx
 * @description 네비게이션 바 컴포넌트
 *
 * GNB(Gobal Navigation Bar) 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 로고 및 홈 링크
 * 2. 장바구니 아이콘 (로그인 시 표시)
 * 3. 마이페이지 링크 (로그인 시 표시)
 * 4. 로그인/회원가입 버튼 (비로그인 시)
 * 5. 사용자 프로필 버튼 (로그인 시)
 *
 * @dependencies
 * - @clerk/nextjs: Clerk 인증 컴포넌트
 * - @/components/cart-icon: 장바구니 아이콘 컴포넌트
 */
const Navbar = () => {
  return (
    <header className="flex justify-between items-center p-4 gap-4 h-16 max-w-7xl mx-auto">
      <Link href="/" className="text-2xl font-bold">
        SaaS Template
      </Link>
      <div className="flex gap-4 items-center">
        {/* 장바구니 아이콘 (로그인 시에만 표시) */}
        <SignedIn>
          <CartIcon />
        </SignedIn>

        {/* 마이페이지 링크 (로그인 시에만 표시) */}
        <SignedIn>
          <Link
            href="/my-page"
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            )}
            aria-label="마이페이지"
          >
            <User className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </Link>
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <Button>로그인</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
};

export default Navbar;
