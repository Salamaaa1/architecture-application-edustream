package com.edustream.backend.controller;

import com.edustream.backend.model.Course;
import com.edustream.backend.service.CourseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "*")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public ResponseEntity<List<Course>> getAllAvailableCourses() {
        return ResponseEntity.ok(courseService.getAvailableCourses());
    }

    @GetMapping("/all")
    public ResponseEntity<List<Course>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable String id) {
        return ResponseEntity.ok(courseService.getCourseDetails(id));
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<Map<String, Object>> getCourseAvailability(@PathVariable String id) {
        return ResponseEntity.ok(courseService.getCourseAvailability(id));
    }

    @PostMapping
    public ResponseEntity<Course> createCourse(@RequestBody Course course) {
        Course created = courseService.createCourse(
                course.getTitle(),
                course.getDescription(),
                course.getPrice(),
                course.getTotalSeats(),
                course.getInstructorName(),
                course.getCategory(),
                course.getDuration()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Course> updateCourse(@PathVariable String id, @RequestBody Course updates) {
        return ResponseEntity.ok(courseService.updateCourse(id, updates));
    }
}
