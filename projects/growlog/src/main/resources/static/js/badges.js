document.addEventListener("DOMContentLoaded", () => {
    const filters = document.querySelectorAll("[data-badge-filter]");
    const groups = document.querySelectorAll("[data-badge-group]");

    filters.forEach((button) => {
        button.addEventListener("click", () => {
            const selected = button.dataset.badgeFilter;

            filters.forEach((item) => {
                const active = item === button;
                item.classList.toggle("active", active);
                item.setAttribute("aria-pressed", String(active));
            });

            groups.forEach((group) => {
                group.hidden = selected !== "all"
                    && group.dataset.badgeGroup !== selected;
            });
        });
    });
});
