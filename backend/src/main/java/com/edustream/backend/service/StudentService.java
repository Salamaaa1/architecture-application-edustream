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
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PaymentRepository paymentRepository;

    public StudentService(StudentRepository studentRepository,
                          EnrollmentRepository enrollmentRepository,
                          PaymentRepository paymentRepository) {
        this.studentRepository = studentRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.paymentRepository = paymentRepository;
    }

    public Student createStudent(String email, String firstName, String lastName, String password) {
        if (studentRepository.findByEmail(email).isPresent()) {
            throw new EmailAlreadyExistsException(email);
        }

        String id = UUID.randomUUID().toString().substring(0, 8);
        Student student = new Student(id, email, firstName, lastName, password);
        return studentRepository.save(student);
    }

    public Student authenticateStudent(String email, String password) {
        Student student = studentRepository.findByEmail(email)
                .orElseThrow(InvalidCredentialsException::new);

        if (!student.getPassword().equals(password)) {
            throw new InvalidCredentialsException();
        }
        return student;
    }

    public StudentProfileDTO getStudentProfile(String studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new StudentNotFoundException(studentId));

        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
        List<String> enrolledCourses = enrollments.stream()
                .filter(e -> "completed".equalsIgnoreCase(e.getStatus()))
                .map(Enrollment::getCourseId)
                .collect(Collectors.toList());

        List<Payment> payments = paymentRepository.findByStudentId(studentId);
        double totalSpent = payments.stream()
                .filter(p -> "completed".equalsIgnoreCase(p.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();

        return new StudentProfileDTO(
                student.getId(),
                student.getEmail(),
                student.getFirstName(),
                student.getLastName(),
                student.getRole(),
                student.getCreatedAt(),
                student.getUpdatedAt(),
                enrolledCourses,
                totalSpent
        );
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Student updateStudentRole(String studentId, String newRole) {
        Student student = getStudentById(studentId);
        student.setRole(newRole != null ? newRole.toUpperCase() : "USER");
        return studentRepository.save(student);
    }

    public Student updateStudent(String studentId, String email, String firstName, String lastName, String password) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new StudentNotFoundException(studentId));

        if (email != null && !email.equals(student.getEmail())) {
            if (studentRepository.findByEmail(email).isPresent()) {
                throw new EmailAlreadyExistsException(email);
            }
            student.setEmail(email);
        }

        if (firstName != null) student.setFirstName(firstName);
        if (lastName != null) student.setLastName(lastName);
        if (password != null) student.setPassword(password);

        return studentRepository.save(student);
    }

    public Student getStudentById(String id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new StudentNotFoundException(id));
    }

    public Student findOrCreateByEmail(String email, String firstName, String lastName) {
        return studentRepository.findByEmail(email)
                .orElseGet(() -> createStudent(email, firstName != null ? firstName : "User", lastName != null ? lastName : "EduStream", "defaultPass123"));
    }
}
