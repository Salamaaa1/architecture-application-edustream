package com.edustream.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private double price; // Price in Moroccan Dirham (MAD)

    @Column(nullable = false)
    private int availableSeats;

    @Column(nullable = false)
    private int totalSeats;

    private String instructorName;
    private String category;
    private int duration; // in hours

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Course() {}

    public Course(String id, String title, String description, double price, int totalSeats,
                  String instructorName, String category, int duration) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.price = price;
        this.totalSeats = totalSeats;
        this.availableSeats = totalSeats;
        this.instructorName = instructorName;
        this.category = category;
        this.duration = duration;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    public void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public int getAvailableSeats() { return availableSeats; }
    public void setAvailableSeats(int availableSeats) { this.availableSeats = availableSeats; }

    public int getTotalSeats() { return totalSeats; }
    public void setTotalSeats(int totalSeats) { this.totalSeats = totalSeats; }

    public String getInstructorName() { return instructorName; }
    public void setInstructorName(String instructorName) { this.instructorName = instructorName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
