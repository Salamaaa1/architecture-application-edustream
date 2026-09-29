package com.edustream.backend.controller;

import com.edustream.backend.model.Course;
import com.edustream.backend.model.Payment;
import com.edustream.backend.model.Student;
import com.edustream.backend.repository.CourseRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private StudentRepository studentRepository;

    @BeforeEach
    void setUp() {
        paymentRepository.deleteAll();
        courseRepository.save(new Course("data", "Data Viz", "Desc", 990.0, 10, "Sophie", "Data", 8));
        studentRepository.save(new Student("std-55", "omar@example.ma", "Omar", "Tazi", "pass123"));
        paymentRepository.save(new Payment("pay-123", "enr-1", "std-1", "react", 1490.0, "completed", "3333", "TXN-123"));
    }

    @Test
    @DisplayName("POST /api/payments/process should process payment in MAD")
    void testProcessPaymentEndpoint() throws Exception {
        String jsonPayload = """
                {
                    "enrollmentId": "enr-55",
                    "studentId": "std-55",
                    "courseId": "data",
                    "amount": 990.0,
                    "cardData": {
                        "cardNumber": "4532 1111 2222 3333",
                        "expiryMonth": 11,
                        "expiryYear": 2028,
                        "cvv": "123",
                        "cardholderName": "Omar Tazi"
                    }
                }
                """;

        mockMvc.perform(post("/api/payments/process")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Paiement et inscription traités avec succès (990.0 MAD)"));
    }

    @Test
    @DisplayName("GET /api/payments/{id} should return payment details")
    void testGetPaymentById() throws Exception {
        mockMvc.perform(get("/api/payments/pay-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(1490.0))
                .andExpect(jsonPath("$.status").value("completed"));
    }
}
