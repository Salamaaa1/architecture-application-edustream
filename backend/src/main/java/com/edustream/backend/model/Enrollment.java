package com.edustream.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "enrollments")
public class Enrollment {

    @Id
    private String id;

    @Column(nullable = false)
    private String studentId;

    @Column(nullable = false)
    private String courseId;

    @Column(nullable = false)
    private String status; // 'pending' | 'completed' | 'failed'

    private LocalDateTime enrolledAt;
    private String paymentId;

    public Enrollment() {}

    public Enrollment(String id, String studentId, String courseId, String status) {
        this.id = id;
        this.studentId = studentId;
        this.courseId = courseId;
        this.status = status;
        this.enrolledAt = LocalDateTime.now();
    }

    @PrePersist
    public void onCreate() {
        if (enrolledAt == null) enrolledAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getEnrolledAt() { return enrolledAt; }
    public void setEnrolledAt(LocalDateTime enrolledAt) { this.enrolledAt = enrolledAt; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }
}
