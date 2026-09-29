package com.edustream.backend.exception;

public class EnrollmentAlreadyExistsException extends BusinessException {
    public EnrollmentAlreadyExistsException(String studentId, String courseId) {
        super("L'étudiant " + studentId + " est déjà inscrit au cours " + courseId, "ENROLLMENT_EXISTS", 409);
    }
}
