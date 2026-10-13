package kr.co.growlog.growlog_project.dto;

import lombok.Getter;

@Getter
public class BadgeView {
    private final String category;
    private final String title;
    private final String description;
    private final String imagePath;
    private final long currentValue;
    private final long targetValue;
    private final boolean earned;
    private final int progressPercent;

    public BadgeView(String category, String title, String description,
                     String imagePath, long currentValue, long targetValue) {
        this.category = category;
        this.title = title;
        this.description = description;
        this.imagePath = imagePath;
        this.currentValue = currentValue;
        this.targetValue = targetValue;
        this.earned = currentValue >= targetValue;
        this.progressPercent = targetValue == 0
                ? 100
                : (int) Math.min(100, (currentValue * 100) / targetValue);
    }
}
