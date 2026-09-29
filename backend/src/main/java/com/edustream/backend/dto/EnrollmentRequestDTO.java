package com.edustream.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class EnrollmentRequestDTO {
    private String studentId;
    private String studentEmail;

    @NotBlank(message = "Course ID is required")
    private String courseId;

    private CardDataDTO cardData;
    private String firstName;
    private String lastName;
    private String phone;

    public EnrollmentRequestDTO() {}

    public EnrollmentRequestDTO(String studentId, String courseId, CardDataDTO cardData) {
        this.studentId = studentId;
        this.courseId = courseId;
        this.cardData = cardData;
    }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public CardDataDTO getCardData() { return cardData; }
    public void setCardData(CardDataDTO cardData) { this.cardData = cardData; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
