import { useEffect } from 'react';

// [포트폴리오 데모 전용] 원본 저장소(aulo-reservation-app)에는 없는 기능 — 포트폴리오를 데스크톱에서 보는 사람도
// 홈 대표 메뉴가 넘어가는 목록이라는 것을 알 수 있게 2026-10-21에 이 복사본에만 넣었다. 원본에 옮기지 않는다.
// 가로 목록 끌어서 넘기기 (데스크톱 전용): 마우스처럼 정밀한 포인터가 있는 기기에서만 켠다.
// 앱은 데스크톱에서도 390px 화면이라 화면 폭으로는 휴대폰과 구분할 수 없어서, 포인터 종류로 판단한다.
// 터치 기기는 브라우저 기본 스와이프를 그대로 쓴다. 화살표 버튼은 두지 않는다(2026-10-21 사용자 결정).
const DESKTOP_POINTER = '(hover: hover) and (pointer: fine)';
const DRAG_THRESHOLD = 5; // 이만큼 움직여야 끌기로 본다 — 그보다 짧으면 카드 클릭

export function useDragScroll(ref, key) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined' || !window.matchMedia?.(DESKTOP_POINTER).matches) return undefined;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let start = null; // { x, left }
    let dragged = false;

    const onDown = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || el.scrollWidth <= el.clientWidth) return;
      start = { x: e.clientX, left: el.scrollLeft };
      dragged = false;
    };
    const onMove = (e) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      if (!dragged && Math.abs(dx) < DRAG_THRESHOLD) return;
      if (!dragged) {
        dragged = true;
        el.setPointerCapture(e.pointerId);
        el.classList.add('is-dragging'); // 끄는 동안 스냅을 꺼야 손을 따라 움직인다
      }
      el.scrollLeft = start.left - dx;
    };
    const onUp = () => {
      if (!start) return;
      start = null;
      if (!dragged) return;
      // 놓은 자리에서 가장 가까운 카드에 맞춘다 (스냅 규칙과 같은 결과)
      const pad = parseFloat(getComputedStyle(el).scrollPaddingInlineStart) || 0;
      const items = [...el.children];
      const base = el.getBoundingClientRect().left + pad;
      const offsets = items.map((li) => el.scrollLeft + li.getBoundingClientRect().left - base);
      const target = offsets.reduce((best, o) => (Math.abs(o - el.scrollLeft) < Math.abs(best - el.scrollLeft) ? o : best), 0);
      el.scrollTo({ left: Math.min(Math.max(target, 0), el.scrollWidth - el.clientWidth), behavior: reduceMotion ? 'auto' : 'smooth' });
      // 스크롤이 끝난 뒤 스냅을 되돌린다
      window.setTimeout(() => el.classList.remove('is-dragging'), reduceMotion ? 0 : 400);
    };
    // 끌고 나서 놓을 때 카드 링크가 눌리지 않게
    const onClick = (e) => {
      if (!dragged) return;
      e.preventDefault();
      e.stopPropagation();
      dragged = false;
    };
    const onDragStart = (e) => e.preventDefault(); // 사진 · 링크 기본 끌기(고스트 이미지) 막기

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('click', onClick, true);
    el.addEventListener('dragstart', onDragStart);
    el.classList.add('is-draggable');
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('click', onClick, true);
      el.removeEventListener('dragstart', onDragStart);
      el.classList.remove('is-draggable', 'is-dragging');
    };
  }, [ref, key]);
}
