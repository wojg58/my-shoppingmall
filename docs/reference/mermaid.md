graph TD
    Start([방문]) --> Home[홈페이지]
    
    Home --> Login{로그인?}
    Login -->|No| SignIn[Clerk 로그인]
    SignIn --> Products
    Login -->|Yes| Products[상품 목록]
    
    Products --> Filter[카테고리 필터]
    Filter --> Products
    
    Products --> Detail[상품 상세]
    
    Detail --> AddCart[장바구니 추가]
    AddCart --> Cart[장바구니]
    
    Cart --> Edit{수정/삭제}
    Edit --> Cart
    
    Cart --> Order[주문/결제]
    
    Order --> Pay[Toss 테스트 결제]
    
    Pay --> Success{성공?}
    Success -->|Yes| Complete[주문 완료]
    Success -->|No| Order
    
    Complete --> MyPage[마이페이지]
    Home --> MyPage
    MyPage --> OrderList[주문 내역]
    
    style Start fill:#e1f5e1
    style Complete fill:#f0e1ff
    style Pay fill:#e1f0ff
    style SignIn fill:#fff4e1