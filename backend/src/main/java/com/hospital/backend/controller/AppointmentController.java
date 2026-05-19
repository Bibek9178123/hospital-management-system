package com.hospital.backend.controller;

import com.hospital.backend.model.Appointment;
import com.hospital.backend.model.Billing;
import com.hospital.backend.model.Doctor;
import com.hospital.backend.model.Patient;
import com.hospital.backend.repository.AppointmentRepository;
import com.hospital.backend.repository.BillingRepository;
import com.hospital.backend.repository.DoctorRepository;
import com.hospital.backend.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private BillingRepository billingRepository;

    @GetMapping
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> bookAppointment(@RequestBody Map<String, Object> payload) {
        Long doctorId = Long.valueOf(payload.get("doctorId").toString());
        Long patientId = Long.valueOf(payload.get("patientId").toString());
        String dateStr = payload.get("appointmentDate").toString();

        Doctor doctor = doctorRepository.findById(doctorId).orElse(null);
        Patient patient = patientRepository.findById(patientId).orElse(null);

        if (doctor == null || patient == null) {
            return ResponseEntity.badRequest().body("Doctor or Patient not found");
        }

        Appointment appt = new Appointment();
        appt.setDoctor(doctor);
        appt.setPatient(patient);
        appt.setAppointmentDate(LocalDateTime.parse(dateStr));
        appt.setStatus("SCHEDULED");

        Appointment saved = appointmentRepository.save(appt);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        Appointment appt = appointmentRepository.findById(id).orElse(null);
        
        if (appt == null) {
            return ResponseEntity.notFound().build();
        }

        appt.setStatus(newStatus);
        Appointment saved = appointmentRepository.save(appt);

        // Automated Billing Generation workflow
        if ("COMPLETED".equalsIgnoreCase(newStatus)) {
            Billing bill = new Billing();
            bill.setAppointment(saved);
            bill.setAmount(500.0); // Flat fee for simplicity
            bill.setStatus("PENDING");
            billingRepository.save(bill);
        }

        return ResponseEntity.ok(saved);
    }
}
