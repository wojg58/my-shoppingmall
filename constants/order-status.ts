/**
 * @file constants/order-status.ts
 * @description 주문 상태 상수 및 매핑 정의
 *
 * 주문 상태 코드와 한글 라벨 매핑을 중앙에서 관리합니다.
 * 여러 컴포넌트에서 일관된 주문 상태 표시를 위해 사용됩니다.
 */

/**
 * 주문 상태 코드 타입
 */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

/**
 * 주문 상태 한글 라벨 매핑
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "결제 대기",
  confirmed: "확인됨",
  shipped: "배송 중",
  delivered: "배송 완료",
  cancelled: "취소됨",
} as const;

/**
 * 모든 주문 상태 코드 목록
 */
export const ALL_ORDER_STATUSES: OrderStatus[] = Object.keys(
  ORDER_STATUS_LABELS,
) as OrderStatus[];

/**
 * 주문 상태 코드로 한글 라벨 조회
 * @param status 주문 상태 코드 또는 null
 * @returns 한글 라벨 또는 원본 상태
 */
export function getOrderStatusLabel(status: string | null): string {
  if (!status) return "알 수 없음";
  return ORDER_STATUS_LABELS[status as OrderStatus] || status;
}

/**
 * 주문 상태 코드 유효성 검증
 * @param status 검증할 주문 상태 코드
 * @returns 유효한 주문 상태 코드인지 여부
 */
export function isValidOrderStatus(
  status: string | null,
): status is OrderStatus {
  if (!status) return false;
  return status in ORDER_STATUS_LABELS;
}

