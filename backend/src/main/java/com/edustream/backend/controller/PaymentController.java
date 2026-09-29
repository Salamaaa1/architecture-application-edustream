package com.edustream.backend.controller;

import com.edustream.backend.dto.PaymentRequestDTO;
import com.edustream.backend.model.Payment;
import com.edustream.backend.service.EnrollmentService;
import com.edustream.backend.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;
    private final EnrollmentService enrollmentService;

    public PaymentController(PaymentService paymentService, EnrollmentService enrollmentService) {
        this.paymentService = paymentService;
        this.enrollmentService = enrollmentService;
    }

    @PostMapping("/process")
    public ResponseEntity<Map<String, Object>> processPayment(@RequestBody @Valid PaymentRequestDTO request) {
        String studentIdentifier = request.getStudentId() != null ? request.getStudentId() : request.getStudentEmail();

        EnrollmentService.EnrollmentResult result = enrollmentService.enrollStudent(
                studentIdentifier,
                request.getCourseId(),
                request.getCardData(),
                null,
                null
        );

        Map<String, Object> response = Map.of(
                "success", true,
                "enrollmentId", result.getEnrollment().getId(),
                "paymentId", result.getPaymentId(),
                "status", result.getEnrollment().getStatus(),
                "message", "Paiement et inscription traités avec succès (" + request.getAmount() + " MAD)"
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentDetails(@PathVariable String id) {
        Payment payment = paymentService.getPaymentDetails(id);
        if (payment == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Payment>> getStudentPayments(@PathVariable String studentId) {
        return ResponseEntity.ok(paymentService.getStudentPayments(studentId));
    }
}
