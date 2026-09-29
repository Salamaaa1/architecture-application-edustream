package com.edustream.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class StudentProfileDTO {
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<String> enrolledCourses;
    private double totalSpent; // Total spent in MAD

    public StudentProfileDTO() {}

    public StudentProfileDTO(String id, String email, String firstName, String lastName, String role,
                             LocalDateTime createdAt, LocalDateTime updatedAt,
                             List<String> enrolledCourses, double totalSpent) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role != null ? role : "USER";
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.enrolledCourses = enrolledCourses;
        this.totalSpent = totalSpent;
    }

    public StudentProfileDTO(String id, String email, String firstName, String lastName,
                             LocalDateTime createdAt, LocalDateTime updatedAt,
                             List<String> enrolledCourses, double totalSpent) {
        this(id, email, firstName, lastName, "USER", createdAt, updatedAt, enrolledCourses, totalSpent);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<String> getEnrolledCourses() { return enrolledCourses; }
    public void setEnrolledCourses(List<String> enrolledCourses) { this.enrolledCourses = enrolledCourses; }

    public double getTotalSpent() { return totalSpent; }
    public void setTotalSpent(double totalSpent) { this.totalSpent = totalSpent; }
}
