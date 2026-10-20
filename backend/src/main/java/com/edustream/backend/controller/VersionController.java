package com.edustream.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/version")
@CrossOrigin(origins = "*")
public class VersionController {

    private final String version;

    public VersionController(@Value("${app.version}") String version) {
        this.version = version;
    }

    @GetMapping
    public ResponseEntity<Map<String, String>> getVersion() {
        return ResponseEntity.ok(Map.of("version", version));
    }
}
