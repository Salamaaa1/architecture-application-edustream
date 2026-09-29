package com.edustream.backend.service;

import com.edustream.backend.exception.CourseNotFoundException;
import com.edustream.backend.model.Course;
import com.edustream.backend.repository.CourseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @InjectMocks
    private CourseService courseService;

    private Course mockCourse;

    @BeforeEach
    void setUp() {
        mockCourse = new Course("react", "React Avancé", "Desc", 1490.0, 10, "Instructor", "Dev", 12);
    }

    @Test
    @DisplayName("Should create course with price in MAD")
    void testCreateCourse() {
        when(courseRepository.save(any(Course.class))).thenAnswer(i -> i.getArgument(0));

        Course created = courseService.createCourse("Spring Boot", "Backend Java", 1200.0, 15, "Omar", "Dev", 20);

        assertNotNull(created);
        assertEquals("Spring Boot", created.getTitle());
        assertEquals(1200.0, created.getPrice());
        assertEquals(15, created.getAvailableSeats());
        verify(courseRepository, times(1)).save(any(Course.class));
    }

    @Test
    @DisplayName("Should return available courses")
    void testGetAvailableCourses() {
        when(courseRepository.findByAvailableSeatsGreaterThan(0)).thenReturn(List.of(mockCourse));

        List<Course> courses = courseService.getAvailableCourses();

        assertEquals(1, courses.size());
        assertEquals("react", courses.get(0).getId());
    }

    @Test
    @DisplayName("Should return course details by ID")
    void testGetCourseDetailsSuccess() {
        when(courseRepository.findById("react")).thenReturn(Optional.of(mockCourse));

        Course course = courseService.getCourseDetails("react");

        assertNotNull(course);
        assertEquals("React Avancé", course.getTitle());
    }

    @Test
    @DisplayName("Should throw CourseNotFoundException for invalid ID")
    void testGetCourseDetailsNotFound() {
        when(courseRepository.findById("invalid")).thenReturn(Optional.empty());

        assertThrows(CourseNotFoundException.class, () -> courseService.getCourseDetails("invalid"));
    }

    @Test
    @DisplayName("Should compute course availability statistics correctly")
    void testGetCourseAvailability() {
        mockCourse.setAvailableSeats(4); // 6 enrolled out of 10
        when(courseRepository.findById("react")).thenReturn(Optional.of(mockCourse));

        Map<String, Object> availability = courseService.getCourseAvailability("react");

        assertEquals("react", availability.get("courseId"));
        assertEquals(10, availability.get("totalSeats"));
        assertEquals(4, availability.get("availableSeats"));
        assertEquals(6, availability.get("enrolledCount"));
    }
}
