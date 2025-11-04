"use client";

import { getOrderStatusLabel } from "@/constants/order-status";
import { Calendar, Package } from "lucide-react";
import * as React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { OrderDetailAccordion } from "@/components/order-detail-accordion";

/**
 * @file components/order-card.tsx
 * @description 주문 카드 컴포넌트
 *
 * 주문 목록에서 각 주문을 카드 형태로 표시하는 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 주문 번호 표시 (8자리 축약)
 * 2. 주문 날짜 표시
 * 3. 주문 총액 표시
 * 4. 주문 상태 표시 (한글 라벨 + 뱃지)
 * 5. 아코디언으로 주문 상세 정보 표시
 *
 * @dependencies
 * - @/constants/order-status: 주문 상태 한글 라벨
 * - @/components/ui/accordion: 아코디언 컴포넌트
 * - @/components/order-detail-accordion: 주문 상세 아코디언 컴포넌트
 *
 * @note 클라이언트 컴포넌트로 변경 필요 (아코디언 상태 관리)
 */

interface OrderCardProps {
  order: {
    id: string;
    total_amount: number;
    status: string;
    created_at: string;
  };
}

/**
 * 가격 포맷팅 함수
 */
function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}

/**
 * 주문 카드 컴포넌트
 *
 * @param order 주문 정보
 */
export function OrderCard({ order }: OrderCardProps) {
  // 주문 날짜 포맷팅
  const orderDate = new Date(order.created_at);
  const formattedDate = orderDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = orderDate.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // 주문 번호 축약 (8자리)
  const shortOrderId = order.id.substring(0, 8).toUpperCase();

  // 주문 상태 한글 라벨
  const statusLabel = getOrderStatusLabel(order.status);

  // 주문 상태에 따른 뱃지 스타일
  const getStatusBadgeStyle = (status: string): string => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      value={openValue}
      onValueChange={(value) => setOpenValue(value)}
    >
      <AccordionItem
        value={order.id}
        className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
      >
        <AccordionTrigger className="px-6 py-4 hover:no-underline">
          <div className="flex items-start justify-between gap-4 w-full pr-4">
            {/* 주문 정보 (왼쪽) */}
            <div className="flex-1 space-y-3 text-left">
              {/* 주문 번호 및 날짜 */}
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4" />
                  <span className="font-mono font-semibold">{shortOrderId}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {formattedDate} {formattedTime}
                  </span>
                </div>
              </div>

              {/* 주문 총액 */}
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatPrice(order.total_amount)}
              </div>
            </div>

            {/* 주문 상태 (오른쪽) */}
            <div className="flex flex-col items-end gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(order.status)}`}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <OrderDetailAccordion
            orderId={order.id}
            orderStatus={order.status}
            isOpen={openValue === order.id}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

