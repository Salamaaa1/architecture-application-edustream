package com.edustream.backend.exception;

public class CourseCompletedException extends BusinessException {
    public CourseCompletedException(String courseId) {
        super("Le cours " + courseId + " n'a plus de places disponibles", "COURSE_COMPLETED", 409);
    }
}
