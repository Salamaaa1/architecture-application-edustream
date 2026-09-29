package com.edustream.backend.service;

import com.edustream.backend.dto.CardDataDTO;
import com.edustream.backend.exception.PaymentRefusedException;
import com.edustream.backend.model.Payment;
import com.edustream.backend.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentGateway paymentGateway;
    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentGateway paymentGateway, PaymentRepository paymentRepository) {
        this.paymentGateway = paymentGateway;
        this.paymentRepository = paymentRepository;
    }

    public Payment processPayment(String enrollmentId, String studentId, String courseId, double amount, CardDataDTO cardData) {
        CardValidator.validateCardData(cardData);

        String transactionId;
        String failureReason = null;

        try {
            transactionId = paymentGateway.processPayment(amount, cardData);
        } catch (Exception error) {
            failureReason = error.getMessage() != null ? error.getMessage() : "Erreur inconnue";
            transactionId = "FAILED-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

            Payment failedPayment = new Payment(
                    UUID.randomUUID().toString().substring(0, 8),
                    enrollmentId,
                    studentId,
                    courseId,
                    amount,
                    "failed",
                    CardValidator.maskCardNumber(cardData.getCardNumber()),
                    transactionId
            );
            failedPayment.setFailureReason(failureReason);
            paymentRepository.save(failedPayment);

            if (error instanceof RuntimeException) {
                throw (RuntimeException) error;
            }
            throw new PaymentRefusedException(failureReason);
        }

        Payment payment = new Payment(
                UUID.randomUUID().toString().substring(0, 8),
                enrollmentId,
                studentId,
                courseId,
                amount,
                "completed",
                CardValidator.maskCardNumber(cardData.getCardNumber()),
                transactionId
        );

        return paymentRepository.save(payment);
    }

    public Payment getPaymentDetails(String paymentId) {
        return paymentRepository.findById(paymentId).orElse(null);
    }

    public List<Payment> getStudentPayments(String studentId) {
        return paymentRepository.findByStudentId(studentId);
    }
}
