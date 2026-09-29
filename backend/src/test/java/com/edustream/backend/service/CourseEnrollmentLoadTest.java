package com.edustream.backend.service;

import com.edustream.backend.dto.CardDataDTO;
import com.edustream.backend.exception.CourseCompletedException;
import com.edustream.backend.model.Course;
import com.edustream.backend.repository.CourseRepository;
import com.edustream.backend.repository.EnrollmentRepository;
import com.edustream.backend.repository.PaymentRepository;
import com.edustream.backend.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class CourseEnrollmentLoadTest {

    @Autowired
    private EnrollmentService enrollmentService;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    private final String courseId = "load-test-course";

    @BeforeEach
    void setUp() {
        paymentRepository.deleteAll();
        enrollmentRepository.deleteAll();
        studentRepository.deleteAll();
        courseRepository.deleteAll();

        // Course with 10 available seats
        courseRepository.save(new Course(courseId, "Popular Course", "Desc", 1500.0, 10, "Prof", "IT", 10));
    }

    @Test
    @DisplayName("Load Test: 50 concurrent student enrollments for a course with 10 seats should prevent overbooking")
    void testConcurrentEnrollmentsLoad() throws InterruptedException {
        int totalRequests = 50;
        int seatsAvailable = 10;

        ExecutorService executorService = Executors.newFixedThreadPool(20);
        CountDownLatch latch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(totalRequests);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger soldOutCount = new AtomicInteger(0);
        AtomicInteger otherFailures = new AtomicInteger(0);

        for (int i = 0; i < totalRequests; i++) {
            final int index = i;
            executorService.submit(() -> {
                try {
                    latch.await(); // wait for all threads to start together
                    CardDataDTO card = new CardDataDTO("4532 1111 2222 3333", 10, 2028, "555", "Student " + index);
                    enrollmentService.enrollStudent("user" + index + "@loadtest.ma", courseId, card, "User", "Num" + index);
                    successCount.incrementAndGet();
                } catch (CourseCompletedException ex) {
                    soldOutCount.incrementAndGet();
                } catch (Exception ex) {
                    otherFailures.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        latch.countDown(); // trigger all threads simultaneously
        boolean completed = doneLatch.await(15, TimeUnit.SECONDS);

        executorService.shutdown();

        // Verification assertions
        assertEquals(true, completed, "All load test requests should complete within timeout");
        assertEquals(seatsAvailable, successCount.get(), "Exactly 10 enrollments should succeed");
        assertEquals(totalRequests - seatsAvailable, soldOutCount.get(), "Exactly 40 enrollments should fail with sold out");
        assertEquals(0, otherFailures.get(), "There should be 0 unexpected failures");

        // DB State Verification
        Course course = courseRepository.findById(courseId).orElseThrow();
        assertEquals(0, course.getAvailableSeats(), "Remaining seats should be exactly 0");
        assertEquals(10, enrollmentRepository.count(), "Exactly 10 enrollments should be recorded in DB");
    }
}
