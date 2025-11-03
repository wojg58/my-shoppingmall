-- ==========================================
  -- Clerk + Supabase 쇼핑몰 스키마
  -- RLS 없이 애플리케이션 레벨에서 clerk_id로 필터링
  -- 파일명: 20251030120000_create_shopping_mall_schema.sql
  -- ==========================================

  -- 1. 상품 테이블 생성
  CREATE TABLE IF NOT EXISTS public.products (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
      category TEXT,
      stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- 2. 장바구니 테이블 생성
  CREATE TABLE IF NOT EXISTS public.cart_items (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      clerk_id TEXT NOT NULL,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE
  CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      UNIQUE(clerk_id, product_id)
  );

  -- 3. 주문 테이블 생성
  CREATE TABLE IF NOT EXISTS public.orders (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      clerk_id TEXT NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
      status TEXT NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'confirmed', 'shipped',
  'delivered', 'cancelled')),
      shipping_address JSONB,
      order_note TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- 4. 주문 상세 테이블 생성
  CREATE TABLE IF NOT EXISTS public.order_items (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE
  RESTRICT,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- 5. updated_at 자동 갱신 함수 생성
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = now();
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- 6. updated_at 트리거 등록
  CREATE TRIGGER set_updated_at_products
      BEFORE UPDATE ON products
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER set_updated_at_cart_items
      BEFORE UPDATE ON cart_items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER set_updated_at_orders
      BEFORE UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

  -- 7. 인덱스 생성 (성능 최적화)
  CREATE INDEX IF NOT EXISTS idx_cart_items_clerk_id ON
  cart_items(clerk_id);
  CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON
  cart_items(product_id);
  CREATE INDEX IF NOT EXISTS idx_orders_clerk_id ON orders(clerk_id);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_orders_created_at ON
  orders(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON
  order_items(order_id);
  CREATE INDEX IF NOT EXISTS idx_products_category ON
  products(category);
  CREATE INDEX IF NOT EXISTS idx_products_is_active ON
  products(is_active);

  -- 8. RLS 비활성화
  ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.cart_items DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

  -- 9. 테이블 소유자 설정
  ALTER TABLE public.products OWNER TO postgres;
  ALTER TABLE public.cart_items OWNER TO postgres;
  ALTER TABLE public.orders OWNER TO postgres;
  ALTER TABLE public.order_items OWNER TO postgres;

  -- 10. 권한 부여
  GRANT ALL ON TABLE public.products TO anon, authenticated,
  service_role;
  GRANT ALL ON TABLE public.cart_items TO anon, authenticated,
  service_role;
  GRANT ALL ON TABLE public.orders TO anon, authenticated,
  service_role;
  GRANT ALL ON TABLE public.order_items TO anon, authenticated,
  service_role;

 -- 11. 샘플 데이터 (개발용 - 20개)
  INSERT INTO products (name, description, price, category, stock_quantity) VALUES
  -- 전자제품 (5개)
  ('무선 블루투스 이어폰', '고음질 노이즈 캔슬링 기능, 30시간 재생', 89000, 'electronics',
  150),
  ('스마트워치 프로', '건강 모니터링 및 운동 추적 기능', 320000, 'electronics', 80),
  ('휴대용 보조배터리 20000mAh', '고속 충전 지원, 3개 포트', 45000, 'electronics', 200),
  ('무선 마우스', '인체공학적 디자인, 조용한 클릭', 35000, 'electronics', 120),
  ('USB-C 멀티 허브', '7in1 확장 포트, 4K 지원', 52000, 'electronics', 95),

  -- 의류 (4개)
  ('면 100% 기본 티셔츠', '심플한 디자인, 5가지 컬러', 25000, 'clothing', 300),
  ('후드 집업 자켓', '부드러운 안감, 캐주얼 스타일', 68000, 'clothing', 150),
  ('청바지 슬림핏', '신축성 좋은 데님, 남녀공용', 79000, 'clothing', 180),
  ('운동용 레깅스', '흡수력 좋은 원단, 요가/헬스', 42000, 'clothing', 220),

  -- 도서 (3개)
  ('클린 코드', '소프트웨어 장인 정신의 바이블', 33000, 'books', 50),
  ('이펙티브 타입스크립트', '타입스크립트 활용법 62가지', 28000, 'books', 60),
  ('HTTP 완벽 가이드', '웹 개발자를 위한 필수서', 45000, 'books', 40),

  -- 식품 (3개)
  ('프리미엄 원두 커피 1kg', '산미와 바디감의 균형, 중배전', 28000, 'food', 100),
  ('유기농 아몬드 500g', '무염 로스팅, 신선한 견과', 18000, 'food', 150),
  ('올리브 오일 엑스트라 버진', '스페인 직수입, 요리/샐러드용', 35000, 'food', 80),

  -- 스포츠 (2개)
  ('요가 매트 10mm', '두꺼운 쿠션, 미끄럼 방지', 45000, 'sports', 90),
  ('덤벨 세트 10kg', '조절식 무게, 홈트레이닝', 85000, 'sports', 65),

  -- 뷰티 (2개)
  ('비타민C 세럼 30ml', '피부 톤 개선, 저자극 포뮬러', 38000, 'beauty', 120),
  ('선크림 SPF50+ PA++++', '끈적임 없는 텍스처, 50ml', 22000, 'beauty', 200),

  -- 생활/가정 (1개)
  ('디퓨저 세트', '천연 에센셜 오일 포함, 200ml', 32000, 'home', 110)
  ON CONFLICT DO NOTHING;
  