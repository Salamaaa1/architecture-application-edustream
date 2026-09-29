package com.edustream.backend.service;

import com.edustream.backend.dto.StudentProfileDTO;
import com.edustream.backend.exception.EmailAlreadyExistsException;
import com.edustream.backend.exception.InvalidCredentialsException;
import com.edustream.backend.exception.StudentNotFoundException;
import com.edustream.backend.model.Enrollment;
import com.edustream.backend.model.Payment;
import com.edustream.backend.model.Student;
import com.edustream.backend.repository.EnrollmentRepository;
import com.edustream.backend.repository.PaymentRepository;
import com.edustream.backend.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private StudentService studentService;

    private Student mockStudent;

    @BeforeEach
    void setUp() {
        mockStudent = new Student("s-123", "youssef@example.ma", "Youssef", "Alami", "secret123");
    }

    @Test
    @DisplayName("Should create a student successfully when email is unique")
    void testCreateStudentSuccess() {
        when(studentRepository.findByEmail("youssef@example.ma")).thenReturn(Optional.empty());
        when(studentRepository.save(any(Student.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Student result = studentService.createStudent("youssef@example.ma", "Youssef", "Alami", "secret123");

        assertNotNull(result);
        assertEquals("youssef@example.ma", result.getEmail());
        assertEquals("Youssef", result.getFirstName());
        verify(studentRepository, times(1)).save(any(Student.class));
    }

    @Test
    @DisplayName("Should throw EmailAlreadyExistsException when email is taken")
    void testCreateStudentDuplicateEmail() {
        when(studentRepository.findByEmail("youssef@example.ma")).thenReturn(Optional.of(mockStudent));

        assertThrows(EmailAlreadyExistsException.class, () ->
                studentService.createStudent("youssef@example.ma", "Youssef", "Alami", "secret123")
        );

        verify(studentRepository, never()).save(any(Student.class));
    }

    @Test
    @DisplayName("Should authenticate student with valid credentials")
    void testAuthenticateStudentSuccess() {
        when(studentRepository.findByEmail("youssef@example.ma")).thenReturn(Optional.of(mockStudent));

        Student authenticated = studentService.authenticateStudent("youssef@example.ma", "secret123");

        assertNotNull(authenticated);
        assertEquals("s-123", authenticated.getId());
    }

    @Test
    @DisplayName("Should throw InvalidCredentialsException when password is incorrect")
    void testAuthenticateStudentInvalidPassword() {
        when(studentRepository.findByEmail("youssef@example.ma")).thenReturn(Optional.of(mockStudent));

        assertThrows(InvalidCredentialsException.class, () ->
                studentService.authenticateStudent("youssef@example.ma", "wrongPass")
        );
    }

    @Test
    @DisplayName("Should calculate profile total spent in MAD correctly")
    void testGetStudentProfile() {
        when(studentRepository.findById("s-123")).thenReturn(Optional.of(mockStudent));

        Enrollment enr1 = new Enrollment("e-1", "s-123", "react", "completed");
        Enrollment enr2 = new Enrollment("e-2", "s-123", "data", "pending");
        when(enrollmentRepository.findByStudentId("s-123")).thenReturn(List.of(enr1, enr2));

        Payment p1 = new Payment("p-1", "e-1", "s-123", "react", 1490.0, "completed", "1234", "TXN-1");
        Payment p2 = new Payment("p-2", "e-2", "s-123", "data", 990.0, "failed", "1234", "TXN-2");
        when(paymentRepository.findByStudentId("s-123")).thenReturn(List.of(p1, p2));

        StudentProfileDTO profile = studentService.getStudentProfile("s-123");

        assertNotNull(profile);
        assertEquals("s-123", profile.getId());
        assertEquals(1, profile.getEnrolledCourses().size());
        assertEquals("react", profile.getEnrolledCourses().get(0));
        assertEquals(1490.0, profile.getTotalSpent());
    }

    @Test
    @DisplayName("Should throw StudentNotFoundException when student profile is not found")
    void testGetStudentProfileNotFound() {
        when(studentRepository.findById("invalid")).thenReturn(Optional.empty());

        assertThrows(StudentNotFoundException.class, () -> studentService.getStudentProfile("invalid"));
    }
}
