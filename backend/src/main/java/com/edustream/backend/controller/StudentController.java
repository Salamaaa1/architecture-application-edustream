package com.edustream.backend.controller;

import com.edustream.backend.dto.StudentProfileDTO;
import com.edustream.backend.model.Student;
import com.edustream.backend.service.StudentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PostMapping("/students")
    public ResponseEntity<Student> registerStudent(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String firstName = payload.get("firstName");
        String lastName = payload.get("lastName");
        String password = payload.get("password");

        Student created = studentService.createStudent(email, firstName, lastName, password != null ? password : "pass123");
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/auth/login")
    public ResponseEntity<Student> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");
        Student student = studentService.authenticateStudent(email, password);
        return ResponseEntity.ok(student);
    }

    @GetMapping("/students")
    public ResponseEntity<java.util.List<Student>> getAllStudents() {
        return ResponseEntity.ok(studentService.getAllStudents());
    }

    @GetMapping("/students/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable String id) {
        return ResponseEntity.ok(studentService.getStudentById(id));
    }

    @GetMapping("/students/{id}/profile")
    public ResponseEntity<StudentProfileDTO> getStudentProfile(@PathVariable String id) {
        return ResponseEntity.ok(studentService.getStudentProfile(id));
    }

    @PutMapping("/students/{id}")
    public ResponseEntity<Student> updateStudent(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String firstName = payload.get("firstName");
        String lastName = payload.get("lastName");
        String password = payload.get("password");

        Student updated = studentService.updateStudent(id, email, firstName, lastName, password);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/students/{id}/role")
    public ResponseEntity<Student> updateStudentRole(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String role = payload.get("role");
        Student updated = studentService.updateStudentRole(id, role != null ? role : "ADMIN");
        return ResponseEntity.ok(updated);
    }
}
