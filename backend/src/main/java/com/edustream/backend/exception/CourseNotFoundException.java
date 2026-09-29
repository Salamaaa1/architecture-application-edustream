package com.edustream.backend.exception;

public class CourseNotFoundException extends BusinessException {
    public CourseNotFoundException(String courseId) {
        super("Cours " + courseId + " non trouvé", "COURSE_NOT_FOUND", 404);
    }
}
