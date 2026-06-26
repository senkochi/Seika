package com.seika.quiz_service.controller;

import com.seika.quiz_service.constant.data.QuizMockData;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("Mock Data Controller Tests")
@WebMvcTest(MockDataController.class)
public class MockDataControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Should return all mock quizzes")
    public void testGetAllMockQuizzes() throws Exception {
        mockMvc.perform(get("/api/v1/dev/mock/quizzes"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.message").value("Mock quizzes retrieved successfully"))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(8));
    }

    @Test
    @DisplayName("Should return mock quizzes by type - MULTIPLE_CHOICE")
    public void testGetMockQuizzesByTypeMultipleChoice() throws Exception {
        mockMvc.perform(get("/api/v1/dev/mock/quizzes/type/MULTIPLE_CHOICE"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("Should return mock quizzes by type - FILL_IN_THE_BLANK")
    public void testGetMockQuizzesByTypeFillInBlank() throws Exception {
        mockMvc.perform(get("/api/v1/dev/mock/quizzes/type/FILL_IN_THE_BLANK"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("Should return mock quizzes by type - MATCHING")
    public void testGetMockQuizzesByTypeMatching() throws Exception {
        mockMvc.perform(get("/api/v1/dev/mock/quizzes/type/MATCHING"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("Should return mock quizzes by type - REORDER")
    public void testGetMockQuizzesByTypeReorder() throws Exception {
        mockMvc.perform(get("/api/v1/dev/mock/quizzes/type/REORDER"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("Should return empty list for unknown type")
    public void testGetMockQuizzesByTypeUnknown() throws Exception {
        mockMvc.perform(get("/api/v1/dev/mock/quizzes/type/UNKNOWN"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    @DisplayName("Should return mock quiz by ID")
    public void testGetMockQuizById() throws Exception {
        mockMvc.perform(get("/api/v1/dev/mock/quizzes/625f5d7b4c3f1a2b9c8d7e6f"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.id").value("625f5d7b4c3f1a2b9c8d7e6f"))
            .andExpect(jsonPath("$.data.questionText").value("What is the capital of France?"));
    }

    @Test
    @DisplayName("Should return multiple choice mock data")
    public void testGetMockMultipleChoice() throws Exception {
        mockMvc.perform(get("/api/v1/dev/mock/multiple-choice"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("Should return fill in blank mock data")
    public void testGetMockFillInBlank() throws Exception {
        mockMvc.perform(get("/api/v1/dev/mock/fill-in-blank"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("Should return matching mock data")
    public void testGetMockMatching() throws Exception {
        mockMvc.perform(get("/api/v1/dev/mock/matching"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("Should return reorder mock data")
    public void testGetMockReorder() throws Exception {
        mockMvc.perform(get("/api/v1/dev/mock/reorder"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(2));
    }
}
