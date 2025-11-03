"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { orderFormSchema, type OrderForm } from "@/lib/schemas/order";

/**
 * @file components/shipping-form.tsx
 * @description 배송지 정보 입력 폼 컴포넌트
 *
 * 주문 페이지에서 배송지 정보를 입력받는 폼 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 배송지 정보 입력 (주소, 우편번호, 상세 주소, 연락처)
 * 2. 주문 메모 입력
 * 3. react-hook-form + Zod를 통한 유효성 검사
 * 4. 에러 메시지 표시
 *
 * 핵심 구현 로직:
 * - react-hook-form으로 폼 상태 관리
 * - zodResolver로 Zod 스키마 검증
 * - shadcn/ui Form 컴포넌트 사용
 * - 제출 시 부모 컴포넌트로 데이터 전달
 *
 * @dependencies
 * - react-hook-form: 폼 상태 관리
 * - @hookform/resolvers: Zod resolver
 * - @/lib/schemas/order: 주문 스키마
 * - @/components/ui/form: shadcn/ui Form 컴포넌트
 */

interface ShippingFormProps {
  onSubmit?: (data: OrderForm) => void | Promise<void>;
  defaultValues?: Partial<OrderForm>;
  isSubmitting?: boolean;
  form?: ReturnType<typeof useForm<OrderForm>>;
}

/**
 * 배송지 정보 입력 폼 컴포넌트
 *
 * @param onSubmit 폼 제출 시 호출되는 콜백 함수 (선택사항)
 * @param defaultValues 기본값 (선택사항)
 * @param isSubmitting 제출 중 여부
 * @param form 외부에서 전달된 form 인스턴스 (선택사항)
 */
export function ShippingForm({
  onSubmit,
  defaultValues,
  isSubmitting = false,
  form: externalForm,
}: ShippingFormProps) {
  const internalForm = useForm<OrderForm>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: defaultValues || {
      shippingAddress: {
        customerName: "",
        address: "",
        postalCode: "",
        addressDetail: "",
        phoneNumber: "",
      },
      orderNote: "",
    },
  });

  const form = externalForm || internalForm;

  const handleSubmit = onSubmit
    ? form.handleSubmit(async (data) => {
        await onSubmit(data);
      })
    : undefined;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6" id="shipping-form">
        {/* 배송지 정보 섹션 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            배송지 정보
          </h3>
          <div className="space-y-4">
            {/* 받는 사람 이름 */}
            <FormField
              control={form.control}
              name="shippingAddress.customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    받는 사람 이름 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="홍길동"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    배송지에서 상품을 받을 분의 이름을 입력해주세요.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 주소 */}
            <FormField
              control={form.control}
              name="shippingAddress.address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    주소 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="도로명 주소 또는 지번 주소를 입력해주세요"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    도로명 주소 또는 지번 주소를 입력해주세요.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 우편번호 */}
            <FormField
              control={form.control}
              name="shippingAddress.postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    우편번호 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="12345"
                      maxLength={5}
                      {...field}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        // 숫자만 입력 가능
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    5자리 숫자로 입력해주세요. (예: 12345)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 상세 주소 */}
            <FormField
              control={form.control}
              name="shippingAddress.addressDetail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상세 주소 (선택)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="건물명, 동/호수 등을 입력해주세요"
                      {...field}
                      value={field.value || ""}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    건물명, 동/호수 등을 입력해주세요. (선택사항)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 연락처 */}
            <FormField
              control={form.control}
              name="shippingAddress.phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    연락처 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="010-1234-5678"
                      {...field}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^0-9-]/g, "");

                        // 하이픈 자동 추가 (선택사항)
                        // 사용자가 입력하는대로 두되, 검증은 Zod에서 처리
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    전화번호를 입력해주세요. (예: 010-1234-5678)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* 주문 메모 섹션 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            주문 메모
          </h3>
          <FormField
            control={form.control}
            name="orderNote"
            render={({ field }) => (
              <FormItem>
                <FormLabel>배송 시 요청사항 (선택)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="배송 시 요청사항을 입력해주세요. (최대 500자)"
                    className="min-h-[100px] resize-none"
                    maxLength={500}
                    {...field}
                    value={field.value || ""}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  배송 시 요청사항을 입력해주세요. (선택사항, 최대 500자)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 제출 버튼은 부모 컴포넌트에서 처리 */}
        <div className="pt-4">
          {form.formState.isSubmitting && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              제출 중...
            </p>
          )}
        </div>
      </form>
    </Form>
  );
}

/**
 * ShippingForm에서 폼 제출 함수를 반환하는 함수
 * (부모 컴포넌트에서 버튼 클릭 시 호출)
 */
export function useShippingFormSubmit(
  form: ReturnType<typeof useForm<OrderForm>>,
  onSubmit: (data: OrderForm) => void | Promise<void>,
) {
  return form.handleSubmit(async (data) => {
    await onSubmit(data);
  });
}

/**
 * ShippingForm에서 폼 데이터를 가져오는 Hook
 * (부모 컴포넌트에서 폼 데이터 접근 시 사용)
 */
export function useShippingForm() {
  return useForm<OrderForm>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      shippingAddress: {
        address: "",
        postalCode: "",
        addressDetail: "",
        phoneNumber: "",
      },
      orderNote: "",
    },
  });
}
