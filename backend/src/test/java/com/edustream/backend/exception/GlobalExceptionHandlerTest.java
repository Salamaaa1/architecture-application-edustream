package com.edustream.backend.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("Should handle BusinessException and return custom status and error map")
    void testHandleBusinessException() {
        BusinessException ex = new CourseNotFoundException("react-test");
        ResponseEntity<Map<String, Object>> response = handler.handleBusinessException(ex);

        assertEquals(404, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("COURSE_NOT_FOUND", response.getBody().get("code"));
    }

    @Test
    @DisplayName("Should handle general Exception and return 500 error map")
    void testHandleGeneralException() {
        Exception ex = new RuntimeException("DB Connection Failed");
        ResponseEntity<Map<String, Object>> response = handler.handleGeneralException(ex);

        assertEquals(500, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("Internal server error: DB Connection Failed", response.getBody().get("error"));
    }
}
