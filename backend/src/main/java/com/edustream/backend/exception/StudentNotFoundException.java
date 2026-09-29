package com.edustream.backend.exception;

public class StudentNotFoundException extends BusinessException {
    public StudentNotFoundException(String studentId) {
        super("Étudiant " + studentId + " non trouvé", "STUDENT_NOT_FOUND", 404);
    }
}
