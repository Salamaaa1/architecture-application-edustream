package com.edustream.backend.controller;

import com.edustream.backend.model.Course;
import com.edustream.backend.repository.CourseRepository;
import com.edustream.backend.repository.EnrollmentRepository;
import com.edustream.backend.repository.PaymentRepository;
import com.edustream.backend.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class EnrollmentIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @BeforeEach
    void setUp() {
        paymentRepository.deleteAll();
        enrollmentRepository.deleteAll();
        studentRepository.deleteAll();
        courseRepository.deleteAll();

        courseRepository.save(new Course("data", "Data Viz Python", "Desc", 990.0, 3, "Sophie", "Data", 8));
    }

    @Test
    @DisplayName("End-to-End enrollment flow should process payment in MAD and update seat availability")
    void testEnrollmentEndToEnd() throws Exception {
        String jsonPayload = """
                {
                    "studentEmail": "nadia@example.ma",
                    "firstName": "Nadia",
                    "lastName": "Fassi",
                    "courseId": "data",
                    "cardData": {
                        "cardNumber": "4532 1111 2222 3333",
                        "expiryMonth": 12,
                        "expiryYear": 2028,
                        "cvv": "999",
                        "cardholderName": "Nadia Fassi"
                    }
                }
                """;

        mockMvc.perform(post("/api/enrollments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.enrollment.status").value("completed"))
                .andExpect(jsonPath("$.paymentId").exists());

        // Verify Database state
        assertEquals(1, enrollmentRepository.count());
        assertEquals(1, paymentRepository.count());
        assertEquals(1, studentRepository.count());

        // Verify seats decremented from 3 to 2
        Course updatedCourse = courseRepository.findById("data").orElseThrow();
        assertEquals(2, updatedCourse.getAvailableSeats());
    }
}
