package com.edustream.backend.config;

import com.edustream.backend.model.Course;
import com.edustream.backend.model.Enrollment;
import com.edustream.backend.model.Payment;
import com.edustream.backend.model.Student;
import com.edustream.backend.repository.CourseRepository;
import com.edustream.backend.repository.EnrollmentRepository;
import com.edustream.backend.repository.PaymentRepository;
import com.edustream.backend.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Value("${admin.password:mysuperdupercoopersecret}")
    private String adminPassword;

    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PaymentRepository paymentRepository;

    public DataInitializer(CourseRepository courseRepository,
                           StudentRepository studentRepository,
                           EnrollmentRepository enrollmentRepository,
                           PaymentRepository paymentRepository) {
        this.courseRepository = courseRepository;
        this.studentRepository = studentRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.paymentRepository = paymentRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (courseRepository.count() == 0) {
            courseRepository.save(new Course(
                    "react",
                    "React avancé & architecture",
                    "Construisez des interfaces robustes avec des patterns modernes et testables.",
                    1490.00, // Price in MAD (DH)
                    8,
                    "Alexandre Dufour",
                    "Développement",
                    12
            ));

            courseRepository.save(new Course(
                    "data",
                    "Data visualisation avec Python",
                    "Transformez vos données en décisions grâce à des visualisations claires.",
                    990.00, // Price in MAD (DH)
                    14,
                    "Sophie Martin",
                    "Data & IA",
                    8
            ));

            courseRepository.save(new Course(
                    "product",
                    "Product design systémique",
                    "Créez un langage produit cohérent, accessible et prêt à évoluer.",
                    1190.00, // Price in MAD (DH)
                    5,
                    "Marie Leclerc",
                    "Design",
                    10
            ));
        }

        if (studentRepository.count() == 0) {
            Student jean = new Student(
                    "demo-student",
                    "jean@example.com",
                    "Jean",
                    "Dupont",
                    "password123"
            );
            studentRepository.save(jean);

            Student salama = new Student(
                    "db8e3596",
                    "salama.harbal@example.ma",
                    "Salama",
                    "Harbal",
                    "password123"
            );
            studentRepository.save(salama);

            Student admin = new Student(
                    "admin-001",
                    "admin@edustream.ma",
                    "System",
                    "Admin",
                    adminPassword,
                    "ADMIN"
            );
            studentRepository.save(admin);

            if (enrollmentRepository.count() == 0) {
                Payment pay = new Payment("pay-salama", "enr-salama", "db8e3596", "data", 990.00, "completed", "8901", "TXN-SALAMA");
                paymentRepository.save(pay);

                Enrollment enr = new Enrollment("enr-salama", "db8e3596", "data", "completed");
                enr.setPaymentId(pay.getId());
                enrollmentRepository.save(enr);
            }
        }
    }
}
