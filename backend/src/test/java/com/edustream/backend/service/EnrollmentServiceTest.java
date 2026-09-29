package com.edustream.backend.service;

import com.edustream.backend.dto.CardDataDTO;
import com.edustream.backend.exception.CourseCompletedException;
import com.edustream.backend.exception.CourseNotFoundException;
import com.edustream.backend.exception.EnrollmentAlreadyExistsException;
import com.edustream.backend.exception.StudentNotFoundException;
import com.edustream.backend.model.Course;
import com.edustream.backend.model.Enrollment;
import com.edustream.backend.model.Payment;
import com.edustream.backend.model.Student;
import com.edustream.backend.repository.CourseRepository;
import com.edustream.backend.repository.EnrollmentRepository;
import com.edustream.backend.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EnrollmentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private EnrollmentService enrollmentService;

    private Student mockStudent;
    private Course mockCourse;
    private CardDataDTO cardData;

    @BeforeEach
    void setUp() {
        mockStudent = new Student("s-100", "salma@example.ma", "Salma", "Tazi", "pass");
        mockCourse = new Course("react", "React Avancé", "Desc", 1490.0, 5, "Alex", "Dev", 10);
        cardData = new CardDataDTO("4532 1111 2222 3333", 11, 2028, "789", "Salma Tazi");
    }

    @Test
    @DisplayName("Should successfully enroll student and decrement available seats")
    void testEnrollStudentSuccess() {
        when(studentRepository.findById("s-100")).thenReturn(Optional.of(mockStudent));
        when(courseRepository.findById("react")).thenReturn(Optional.of(mockCourse));
        when(enrollmentRepository.findByStudentIdAndCourseId("s-100", "react")).thenReturn(Optional.empty());
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(i -> i.getArgument(0));

        Payment mockPayment = new Payment("p-99", "enr-99", "s-100", "react", 1490.0, "completed", "3333", "TXN-99");
        when(paymentService.processPayment(anyString(), eq("s-100"), eq("react"), eq(1490.0), any(CardDataDTO.class)))
                .thenReturn(mockPayment);

        EnrollmentService.EnrollmentResult result = enrollmentService.enrollStudent("s-100", "react", cardData, "Salma", "Tazi");

        assertNotNull(result);
        assertEquals("completed", result.getEnrollment().getStatus());
        assertEquals("p-99", result.getPaymentId());
        assertEquals(4, mockCourse.getAvailableSeats()); // seat decremented from 5 to 4
        verify(courseRepository, times(1)).save(mockCourse);
    }

    @Test
    @DisplayName("Should throw CourseCompletedException when no seats available")
    void testEnrollStudentCourseSoldOut() {
        mockCourse.setAvailableSeats(0);
        when(studentRepository.findById("s-100")).thenReturn(Optional.of(mockStudent));
        when(courseRepository.findById("react")).thenReturn(Optional.of(mockCourse));

        assertThrows(CourseCompletedException.class, () ->
                enrollmentService.enrollStudent("s-100", "react", cardData, "Salma", "Tazi")
        );

        verify(enrollmentRepository, never()).save(any());
        verify(paymentService, never()).processPayment(anyString(), anyString(), anyString(), anyDouble(), any());
    }

    @Test
    @DisplayName("Should throw EnrollmentAlreadyExistsException when student is already enrolled")
    void testEnrollStudentDuplicate() {
        when(studentRepository.findById("s-100")).thenReturn(Optional.of(mockStudent));
        when(courseRepository.findById("react")).thenReturn(Optional.of(mockCourse));
        Enrollment existing = new Enrollment("e-old", "s-100", "react", "completed");
        when(enrollmentRepository.findByStudentIdAndCourseId("s-100", "react")).thenReturn(Optional.of(existing));

        assertThrows(EnrollmentAlreadyExistsException.class, () ->
                enrollmentService.enrollStudent("s-100", "react", cardData, "Salma", "Tazi")
        );
    }

    @Test
    @DisplayName("Should mark enrollment failed when payment process fails")
    void testEnrollStudentPaymentFailure() {
        when(studentRepository.findById("s-100")).thenReturn(Optional.of(mockStudent));
        when(courseRepository.findById("react")).thenReturn(Optional.of(mockCourse));
        when(enrollmentRepository.findByStudentIdAndCourseId("s-100", "react")).thenReturn(Optional.empty());
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(i -> i.getArgument(0));

        when(paymentService.processPayment(anyString(), anyString(), anyString(), anyDouble(), any()))
                .thenThrow(new RuntimeException("Payment Error"));

        assertThrows(RuntimeException.class, () ->
                enrollmentService.enrollStudent("s-100", "react", cardData, "Salma", "Tazi")
        );

        // Verify that enrollment was updated to failed
        verify(enrollmentRepository, times(2)).save(argThat(e -> "failed".equals(e.getStatus())));
        // Verify seats were NOT decremented
        assertEquals(5, mockCourse.getAvailableSeats());
    }
}
