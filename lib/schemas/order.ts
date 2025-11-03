import { z } from "zod";

/**
 * @file lib/schemas/order.ts
 * @description 주문 관련 Zod 스키마
 *
 * 주문 프로세스에서 사용하는 폼 검증 스키마입니다.
 *
 * 주요 기능:
 * 1. 배송지 정보 검증
 * 2. 주문 메모 검증
 * 3. TypeScript 타입 추론 지원
 *
 * 핵심 구현 로직:
 * - Zod를 사용한 런타임 검증
 * - react-hook-form과 zodResolver와 함께 사용
 * - 한국 전화번호 형식 검증
 * - 한국 우편번호 형식 검증 (5자리 숫자)
 *
 * @dependencies
 * - zod: 스키마 검증 라이브러리
 *
 * @example
 * ```tsx
 * import { shippingAddressSchema, orderNoteSchema, orderFormSchema } from '@/lib/schemas/order';
 * import { useForm } from 'react-hook-form';
 * import { zodResolver } from '@hookform/resolvers/zod';
 *
 * const form = useForm({
 *   resolver: zodResolver(orderFormSchema),
 * });
 * ```
 */

/**
 * 한국 전화번호 형식 검증 (하이픈 포함/미포함 모두 허용)
 * - 010-1234-5678
 * - 01012345678
 * - 02-1234-5678
 * - 02-123-4567
 * - 031-123-4567
 * - 등등
 */
const phoneNumberRegex = /^0\d{1,3}-?\d{3,4}-?\d{4}$/;

/**
 * 한국 우편번호 형식 검증 (5자리 숫자)
 * - 12345
 * - 01234
 */
const postalCodeRegex = /^\d{5}$/;

/**
 * 배송지 정보 스키마
 */
export const shippingAddressSchema = z.object({
  /**
   * 받는 사람 이름
   * 필수, 최소 2자 이상
   */
  customerName: z
    .string({
      required_error: "받는 사람 이름을 입력해주세요.",
      invalid_type_error: "받는 사람 이름은 문자열이어야 합니다.",
    })
    .min(2, "받는 사람 이름은 최소 2자 이상이어야 합니다.")
    .max(50, "받는 사람 이름은 50자 이하여야 합니다."),

  /**
   * 주소 (도로명 주소 또는 지번 주소)
   * 필수, 최소 5자 이상
   */
  address: z
    .string({
      required_error: "주소를 입력해주세요.",
      invalid_type_error: "주소는 문자열이어야 합니다.",
    })
    .min(5, "주소는 최소 5자 이상이어야 합니다.")
    .max(200, "주소는 200자 이하여야 합니다."),

  /**
   * 우편번호 (5자리 숫자)
   * 필수
   */
  postalCode: z
    .string({
      required_error: "우편번호를 입력해주세요.",
      invalid_type_error: "우편번호는 문자열이어야 합니다.",
    })
    .regex(postalCodeRegex, "우편번호는 5자리 숫자 형식이어야 합니다.")
    .transform((val) => val.replace(/-/g, "")), // 하이픈 제거

  /**
   * 상세 주소 (건물명, 동/호수 등)
   * 선택사항
   */
  addressDetail: z
    .string()
    .max(200, "상세 주소는 200자 이하여야 합니다.")
    .optional()
    .transform((val) => (val === "" ? undefined : val)), // 빈 문자열을 undefined로 변환

  /**
   * 연락처 (전화번호)
   * 필수, 한국 전화번호 형식
   */
  phoneNumber: z
    .string({
      required_error: "연락처를 입력해주세요.",
      invalid_type_error: "연락처는 문자열이어야 합니다.",
    })
    .regex(
      phoneNumberRegex,
      "올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)",
    )
    .transform((val) => {
      // 하이픈 제거하여 저장
      return val.replace(/-/g, "");
    }),
});

/**
 * 배송지 정보 타입 (TypeScript 타입 추론)
 */
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

/**
 * 주문 메모 스키마
 */
export const orderNoteSchema = z
  .string()
  .max(500, "주문 메모는 500자 이하여야 합니다.")
  .optional()
  .transform((val) => (val === "" || !val ? undefined : val)); // 빈 문자열을 undefined로 변환

/**
 * 주문 메모 타입
 */
export type OrderNote = z.infer<typeof orderNoteSchema>;

/**
 * 주문 폼 전체 스키마 (배송지 정보 + 주문 메모)
 */
export const orderFormSchema = z.object({
  shippingAddress: shippingAddressSchema,
  orderNote: orderNoteSchema,
});

/**
 * 주문 폼 타입
 */
export type OrderForm = z.infer<typeof orderFormSchema>;

/**
 * 주문 생성에 필요한 데이터 스키마
 * (Server Action에서 사용)
 */
export const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  orderNote: orderNoteSchema,
});

/**
 * 주문 생성 데이터 타입
 */
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
