package kr.co.growlog.growlog_project.dto;

import kr.co.growlog.growlog_project.entity.Category;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CategoryResponse {
    private Long categoryNum;
    private String categoryName;
    private String categoryIcon;
    private String categoryColor;

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
                category.getCategoryNum(),
                category.getCategoryName(),
                category.getCategoryIcon(),
                category.getCategoryColor()
        );
    }
}
