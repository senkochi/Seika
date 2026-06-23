package com.seika.identity_service.shared;
 
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;
 
import java.time.LocalDateTime;
import java.util.List;
 
/**
 * Paginated Response Wrapper
 * Used for paginated API responses
 */
@Data
public class PagedResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean isLast;
    private LocalDateTime timestamp;
 
    public PagedResponse() {
    }
 
    public PagedResponse(List<T> content, int page, int size, long totalElements, int totalPages, boolean isLast, LocalDateTime timestamp) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.isLast = isLast;
        this.timestamp = timestamp;
    }
 
    /**
     * Convert Spring Data Page to PagedResponse
     */
    public static <T> PagedResponse<T> of(Page<T> page) {
        return new PagedResponse<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.isLast(),
            LocalDateTime.now()
        );
    }
 
    /**
     * Create an empty paginated response
     */
    public static <T> PagedResponse<T> empty() {
        return new PagedResponse<>(
            List.of(),
            0,
            0,
            0,
            0,
            true,
            LocalDateTime.now()
        );
    }
 
    /**
     * Check if this is the first page
     */
    public boolean isFirst() {
        return page == 0;
    }
 
    /**
     * Get the next page number
     */
    public int getNextPage() {
        return isLast() ? page : page + 1;
    }
 
    /**
     * Get the previous page number
     */
    public int getPreviousPage() {
        return page > 0 ? page - 1 : 0;
    }
}
