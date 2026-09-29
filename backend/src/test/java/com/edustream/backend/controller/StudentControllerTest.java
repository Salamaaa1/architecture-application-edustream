package com.edustream.backend.controller;

import com.edustream.backend.model.Student;
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
class StudentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private StudentRepository studentRepository;

    @BeforeEach
    void setUp() {
        studentRepository.deleteAll();
        studentRepository.save(new Student("std-demo", "demo@example.ma", "Demo", "User", "pass123"));
    }

    @Test
    @DisplayName("POST /api/students should register a new student")
    void testRegisterStudent() throws Exception {
        String jsonPayload = """
                {
                    "email": "amine@example.ma",
                    "firstName": "Amine",
                    "lastName": "Berada",
                    "password": "pass"
                }
                """;

        mockMvc.perform(post("/api/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("amine@example.ma"))
                .andExpect(jsonPath("$.firstName").value("Amine"));
    }

    @Test
    @DisplayName("POST /api/auth/login should authenticate student")
    void testLoginSuccess() throws Exception {
        String jsonPayload = """
                {
                    "email": "demo@example.ma",
                    "password": "pass123"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("std-demo"));
    }

    @Test
    @DisplayName("GET /api/students/{id}/profile should return student profile")
    void testGetStudentProfile() throws Exception {
        mockMvc.perform(get("/api/students/std-demo/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("demo@example.ma"));
    }
}
