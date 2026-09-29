package com.edustream.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class PaymentRequestDTO {
    private String enrollmentId;

    @NotBlank(message = "Student ID or Email is required")
    private String studentId;

    private String studentEmail;

    @NotBlank(message = "Course ID is required")
    private String courseId;

    @NotNull(message = "Amount is required")
    private Double amount;

    @NotNull(message = "Card data is required")
    private CardDataDTO cardData;

    public PaymentRequestDTO() {}

    public PaymentRequestDTO(String enrollmentId, String studentId, String courseId, Double amount, CardDataDTO cardData) {
        this.enrollmentId = enrollmentId;
        this.studentId = studentId;
        this.courseId = courseId;
        this.amount = amount;
        this.cardData = cardData;
    }

    public String getEnrollmentId() { return enrollmentId; }
    public void setEnrollmentId(String enrollmentId) { this.enrollmentId = enrollmentId; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public CardDataDTO getCardData() { return cardData; }
    public void setCardData(CardDataDTO cardData) { this.cardData = cardData; }
}
