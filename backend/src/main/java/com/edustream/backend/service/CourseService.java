package com.edustream.backend.service;

import com.edustream.backend.exception.CourseNotFoundException;
import com.edustream.backend.model.Course;
import com.edustream.backend.repository.CourseRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    public Course createCourse(String title, String description, double price, int totalSeats,
                               String instructorName, String category, int duration) {
        String id = UUID.randomUUID().toString().substring(0, 8);
        Course course = new Course(id, title, description, price, totalSeats, instructorName, category, duration);
        return courseRepository.save(course);
    }

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public List<Course> getAvailableCourses() {
        return courseRepository.findByAvailableSeatsGreaterThan(0);
    }

    public Course getCourseDetails(String courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException(courseId));
    }

    public Course updateCourse(String courseId, Course updates) {
        Course existing = getCourseDetails(courseId);
        if (updates.getTitle() != null) existing.setTitle(updates.getTitle());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        if (updates.getPrice() > 0) existing.setPrice(updates.getPrice());
        if (updates.getTotalSeats() > 0) existing.setTotalSeats(updates.getTotalSeats());
        if (updates.getAvailableSeats() >= 0) existing.setAvailableSeats(updates.getAvailableSeats());
        if (updates.getInstructorName() != null) existing.setInstructorName(updates.getInstructorName());
        if (updates.getCategory() != null) existing.setCategory(updates.getCategory());
        if (updates.getDuration() > 0) existing.setDuration(updates.getDuration());

        return courseRepository.save(existing);
    }

    public Map<String, Object> getCourseAvailability(String courseId) {
        Course course = getCourseDetails(courseId);
        return Map.of(
                "courseId", course.getId(),
                "totalSeats", course.getTotalSeats(),
                "availableSeats", course.getAvailableSeats(),
                "enrolledCount", course.getTotalSeats() - course.getAvailableSeats()
        );
    }
}
