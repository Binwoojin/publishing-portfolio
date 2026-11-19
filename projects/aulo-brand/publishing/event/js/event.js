// jQuery가 준비되면 페이지 요소에 등장 효과를 연결
if (window.jQuery) {
    jQuery(function ($) {
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );

        if (reducedMotion.matches || !("IntersectionObserver" in window)) {
            return;
        }

        // 1. 화면 진입을 감지했을 때 실행할 동작을 정의
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) {
                    return;
                }

                // CSS의 최종 상태를 적용해 등장 효과를 시작
                $(entry.target).addClass("is-visible");

                // 등장 효과를 한 번 재생한 뒤 관찰 종료
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.12,
            rootMargin: "0px"
        });


        // selector는 효과를 적용할 대상
        // delay는 같은 묶음 안에서 다른 요소가 등장하기까지의 간격

        // 2. 효과를 적용할 요소와 등장 간격을 지정
        const revealGroups = [
            // {
            //     selector: ".hero__label, .hero__title, .hero__message",
            //     delay: 140
            // },
            {
                selector: ".letter__label, .letter__divider, .letter__title, .letter__copy, .letter__envelope",
                delay: 120
            },
            {
                selector: ".gift__content",
                delay: 0
            },
            {
                selector: ".bag-details__header",
                delay: 0
            },
            {
                selector: ".bag-detail",
                delay: 100
            },
            {
                selector: ".product-info__media, .product-info__content",
                delay: 120
            },
            {
                selector: ".coupons__header",
                delay: 0
            },
            {
                selector: ".coupon-card",
                delay: 150
            },
            {
                selector: ".event-guide__header, dl.event-guide__panel",
                delay: 100
            },
            {
                selector: ".event-steps__item",
                delay: 120
            }
        ];

        // 3. 콜백 바깥에서 대상을 등록해 관찰 시작
        revealGroups.forEach(function (group) {
            $(group.selector).each(function (index) {
                // delay가 120이면 순서대로 0ms, 120ms, 240ms가 적용
                $(this).css("--reveal-delay", index * group.delay + "ms").addClass("reveal-ready");
                    
                observer.observe(this);
            });
        });
    });
}