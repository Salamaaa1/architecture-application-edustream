package com.edustream.backend.controller;

import com.edustream.backend.model.Course;
import com.edustream.backend.repository.CourseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class CourseControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CourseRepository courseRepository;

    @BeforeEach
    void setUp() {
        courseRepository.deleteAll();
        courseRepository.save(new Course("react", "React Avancé", "Desc", 1490.0, 10, "Alexandre", "Dev", 12));
    }

    @Test
    @DisplayName("GET /api/courses should return course list with MAD prices")
    void testGetAvailableCoursesEndpoint() throws Exception {
        mockMvc.perform(get("/api/courses"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value("react"))
                .andExpect(jsonPath("$[0].price").value(1490.0));
    }

    @Test
    @DisplayName("GET /api/courses/react should return course details")
    void testGetCourseByIdEndpoint() throws Exception {
        mockMvc.perform(get("/api/courses/react"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("React Avancé"))
                .andExpect(jsonPath("$.availableSeats").value(10));
    }

    @Test
    @DisplayName("POST /api/courses should create a new course in MAD")
    void testCreateCourseEndpoint() throws Exception {
        String jsonPayload = """
                {
                    "title": "Flutter & Mobile",
                    "description": "Mobile dev",
                    "price": 1800.0,
                    "totalSeats": 20,
                    "instructorName": "Hassan",
                    "category": "Mobile",
                    "duration": 15
                }
                """;

        mockMvc.perform(post("/api/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Flutter & Mobile"))
                .andExpect(jsonPath("$.price").value(1800.0));
    }
}
