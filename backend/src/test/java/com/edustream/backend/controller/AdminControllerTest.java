package com.edustream.backend.controller;

import com.edustream.backend.model.Course;
import com.edustream.backend.model.Enrollment;
import com.edustream.backend.model.Payment;
import com.edustream.backend.model.Student;
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

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @BeforeEach
    void setUp() {
        enrollmentRepository.deleteAll();
        paymentRepository.deleteAll();
        studentRepository.deleteAll();
        courseRepository.deleteAll();

        Student admin = new Student("admin-1", "admin@edustream.ma", "Admin", "User", "mysuperdupercoopersecret", "ADMIN");
        studentRepository.save(admin);

        Student student = new Student("s-1", "student@edustream.ma", "Test", "Student", "pass123", "USER");
        studentRepository.save(student);

        Course course = new Course("react", "React Avancé", "Desc", 1490.0, 5, "Alex", "Dev", 10);
        courseRepository.save(course);

        Enrollment enrollment = new Enrollment("e-1", "s-1", "react", "completed");
        enrollmentRepository.save(enrollment);

        Payment payment = new Payment("p-1", "e-1", "s-1", "react", 1490.0, "completed", "1234", "TXN-1");
        paymentRepository.save(payment);
    }

    @Test
    @DisplayName("Admin login with valid password should return HTTP 200 OK")
    void testAdminLoginSuccess() throws Exception {
        String body = """
            {
                "email": "admin@edustream.ma",
                "password": "mysuperdupercoopersecret"
            }
            """;

        mockMvc.perform(post("/api/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    @DisplayName("Admin login with invalid password should return HTTP 401 Unauthorized")
    void testAdminLoginFailure() throws Exception {
        String body = """
            {
                "email": "admin@edustream.ma",
                "password": "wrongpassword"
            }
            """;

        mockMvc.perform(post("/api/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Get admin stats should calculate total revenue in DH")
    void testGetAdminStats() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalStudents").value(2))
                .andExpect(jsonPath("$.totalCourses").value(1))
                .andExpect(jsonPath("$.totalEnrollments").value(1))
                .andExpect(jsonPath("$.totalRevenue").value(1490.0))
                .andExpect(jsonPath("$.currency").value("DH"));
    }

    @Test
    @DisplayName("Promote user to admin should update student role")
    void testPromoteUserToAdmin() throws Exception {
        String body = """
            {
                "role": "ADMIN"
            }
            """;

        mockMvc.perform(put("/api/students/s-1/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }
}
