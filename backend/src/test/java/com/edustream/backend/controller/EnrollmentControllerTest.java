package com.edustream.backend.controller;

import com.edustream.backend.model.Course;
import com.edustream.backend.repository.CourseRepository;
import com.edustream.backend.repository.EnrollmentRepository;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class EnrollmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @BeforeEach
    void setUp() {
        enrollmentRepository.deleteAll();
        courseRepository.deleteAll();
        courseRepository.save(new Course("react", "React Avancé", "Desc", 1490.0, 10, "Alex", "Dev", 12));
    }

    @Test
    @DisplayName("POST /api/enrollments without cardData should validate pre-registration")
    void testPreRegistrationEndpoint() throws Exception {
        String jsonPayload = """
                {
                    "courseId": "react",
                    "studentEmail": "tariq@example.ma",
                    "firstName": "Tariq",
                    "lastName": "Ibnou"
                }
                """;

        mockMvc.perform(post("/api/enrollments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("GET /api/enrollments/{id} should return 404 for non-existent enrollment")
    void testGetEnrollmentNotFound() throws Exception {
        mockMvc.perform(get("/api/enrollments/non-existent-id"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/enrollments/student/{studentId} should return student enrollments")
    void testGetStudentEnrollments() throws Exception {
        mockMvc.perform(get("/api/enrollments/student/std-1"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/enrollments/course/{courseId} should return course enrollments")
    void testGetCourseEnrollments() throws Exception {
        mockMvc.perform(get("/api/enrollments/course/react"))
                .andExpect(status().isOk());
    }
}
