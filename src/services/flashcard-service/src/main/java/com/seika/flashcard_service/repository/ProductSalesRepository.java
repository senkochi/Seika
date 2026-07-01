package com.seika.flashcard_service.repository;

import com.seika.flashcard_service.domain.ProductSales;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductSalesRepository extends MongoRepository<ProductSales, String> {

    List<ProductSales> findByTeacherUserId(String teacherUserId);

    List<ProductSales> findByTeacherUserIdAndProductId(String teacherUserId, String productId);
}