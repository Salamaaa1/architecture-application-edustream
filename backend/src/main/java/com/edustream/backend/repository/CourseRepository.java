package com.edustream.backend.repository;

import com.edustream.backend.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, String> {
    List<Course> findByAvailableSeatsGreaterThan(int seats);

    @Modifying
    @Query("UPDATE Course c SET c.availableSeats = GREATEST(0, c.availableSeats - :seats) WHERE c.id = :courseId")
    int reduceAvailableSeats(@Param("courseId") String courseId, @Param("seats") int seats);
}
