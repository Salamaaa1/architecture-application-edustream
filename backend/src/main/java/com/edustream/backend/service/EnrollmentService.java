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
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class EnrollmentService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PaymentService paymentService;

    public EnrollmentService(StudentRepository studentRepository,
                             CourseRepository courseRepository,
                             EnrollmentRepository enrollmentRepository,
                             PaymentService paymentService) {
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.paymentService = paymentService;
    }

    public synchronized EnrollmentResult enrollStudent(String studentIdOrEmail, String courseId, CardDataDTO cardData, String firstName, String lastName) {
        Student student;
        if (studentIdOrEmail.contains("@")) {
            student = studentRepository.findByEmail(studentIdOrEmail)
                    .orElseGet(() -> {
                        String id = UUID.randomUUID().toString().substring(0, 8);
                        String fn = (firstName != null && !firstName.isBlank()) ? firstName : "Student";
                        String ln = (lastName != null && !lastName.isBlank()) ? lastName : "EduStream";
                        Student s = new Student(id, studentIdOrEmail, fn, ln, "pass123");
                        return studentRepository.save(s);
                    });
        } else {
            student = studentRepository.findById(studentIdOrEmail)
                    .orElseThrow(() -> new StudentNotFoundException(studentIdOrEmail));
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException(courseId));

        if (course.getAvailableSeats() <= 0) {
            throw new CourseCompletedException(courseId);
        }

        Optional<Enrollment> existingOpt = enrollmentRepository.findByStudentIdAndCourseId(student.getId(), courseId);
        Enrollment enrollment;
        if (existingOpt.isPresent()) {
            Enrollment existing = existingOpt.get();
            if ("completed".equalsIgnoreCase(existing.getStatus())) {
                throw new EnrollmentAlreadyExistsException(student.getId(), courseId);
            }
            enrollment = existing;
            enrollment.setStatus("pending");
        } else {
            String enrollmentId = UUID.randomUUID().toString().substring(0, 8);
            enrollment = new Enrollment(enrollmentId, student.getId(), courseId, "pending");
        }
        enrollmentRepository.save(enrollment);

        try {
            Payment payment = paymentService.processPayment(
                    enrollment.getId(),
                    student.getId(),
                    courseId,
                    course.getPrice(),
                    cardData
            );

            enrollment.setStatus("completed");
            enrollment.setPaymentId(payment.getId());
            Enrollment completedEnrollment = enrollmentRepository.save(enrollment);

            course.setAvailableSeats(Math.max(0, course.getAvailableSeats() - 1));
            courseRepository.save(course);

            return new EnrollmentResult(completedEnrollment, payment.getId());
        } catch (Exception error) {
            enrollment.setStatus("failed");
            enrollmentRepository.save(enrollment);
            throw error;
        }
    }

    public List<Enrollment> getStudentEnrollments(String studentId) {
        return enrollmentRepository.findByStudentId(studentId);
    }

    public List<Enrollment> getCourseEnrollments(String courseId) {
        return enrollmentRepository.findByCourseId(courseId);
    }

    public Enrollment getEnrollmentDetails(String enrollmentId) {
        return enrollmentRepository.findById(enrollmentId).orElse(null);
    }

    public static class EnrollmentResult {
        private final Enrollment enrollment;
        private final String paymentId;

        public EnrollmentResult(Enrollment enrollment, String paymentId) {
            this.enrollment = enrollment;
            this.paymentId = paymentId;
        }

        public Enrollment getEnrollment() { return enrollment; }
        public String getPaymentId() { return paymentId; }
    }
}
