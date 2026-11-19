// jQuery가 준비되면 시그니처 커피 페이지에 등장 효과를 연결
if (window.jQuery) {
    window.jQuery(function ($) {
        const motionSetting = window.matchMedia("(prefers-reduced-motion: reduce)");

        if (motionSetting.matches || !("IntersectionObserver" in window)) {
            return;
        }

        const $page = $(".coffee-page");
        const $heroImage = $page.find(".coffee-hero__image");
        const heroImage = $heroImage[0];

        if (heroImage && heroImage.complete && heroImage.naturalWidth > 0) {
            $heroImage.addClass("is-hero-intro");
        } else {
            $heroImage.one("load", function () {
                $(this).addClass("is-hero-intro");
            });
        }


        const initialViewportBottom = window.innerHeight;

        // delay는 같은 묶음 안에서 한 요소씩 늦게 시작하는 시간(ms)
        const revealGroups = [
            {
                selector: ".coffee-feature",
                delay: 70
            },
            {
                selector: ".coffee-story__content, .coffee-detail__stage, .coffee-drip__scene",
                delay: 0
            },
            {
                selector: ".coffee-blend-step",
                delay: 90
            },
            {
                selector: ".coffee-tasting-card",
                delay: 90
            },
            {
                selector: ".coffee-enjoy-card",
                delay: 90
            },
            {
                selector: ".coffee-drip-feature",
                delay: 80
            },
            {
                selector: ".coffee-brew__step",
                delay: 180
            },
            {
                selector: ".coffee-launch__copy, .coffee-launch__notice",
                delay: 0
            },
            {
                selector: ".coffee-launch__offer",
                delay: 100
            }
        ];

        // 화면 아래쪽 24px까지 감지해 요소가 들어오는 시점에 재생
        const observer = new window.IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) {
                    return;
                }

                $(entry.target).addClass("coffee-reveal-in");

                // 다시 스크롤해도 같은 효과가 반복되지 않도록 관찰 종료
                observer.unobserve(entry.target);
            });
        }, {
            rootMargin: "0px 0px 24px 0px",
            threshold: 0
        });

            revealGroups.forEach(function (group) {
                $page.find(group.selector).filter(function () {
                    // 처음부터 화면에 보이는 콘텐츠는 바로 읽을 수 있게 표시
                    return this.getBoundingClientRect().top >= initialViewportBottom;
                })
                .each(function (index) {
                    $(this).css("--coffee-reveal-delay", `${index * group.delay}ms`);
                    observer.observe(this);
                });
        });
    });
}