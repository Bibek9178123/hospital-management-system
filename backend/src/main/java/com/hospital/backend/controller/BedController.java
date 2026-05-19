package com.hospital.backend.controller;

import com.hospital.backend.model.Bed;
import com.hospital.backend.model.Patient;
import com.hospital.backend.repository.BedRepository;
import com.hospital.backend.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/beds")
public class BedController {

    @Autowired
    private BedRepository bedRepository;

    @Autowired
    private PatientRepository patientRepository;

    @GetMapping
    public List<Bed> getAllBeds() {
        return bedRepository.findAll();
    }

    @PostMapping
    public Bed addBed(@RequestBody Bed bed) {
        bed.setIsOccupied(false);
        return bedRepository.save(bed);
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assignPatient(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        Long patientId = payload.get("patientId");
        Bed bed = bedRepository.findById(id).orElse(null);
        Patient patient = patientRepository.findById(patientId).orElse(null);

        if (bed == null || patient == null) {
            return ResponseEntity.badRequest().body("Bed or Patient not found");
        }

        bed.setPatient(patient);
        bed.setIsOccupied(true);
        return ResponseEntity.ok(bedRepository.save(bed));
    }

    @PutMapping("/{id}/discharge")
    public ResponseEntity<?> dischargePatient(@PathVariable Long id) {
        Bed bed = bedRepository.findById(id).orElse(null);
        if (bed == null) {
            return ResponseEntity.notFound().build();
        }

        bed.setPatient(null);
        bed.setIsOccupied(false);
        return ResponseEntity.ok(bedRepository.save(bed));
    }
    
    @DeleteMapping("/{id}")
    public void deleteBed(@PathVariable Long id) {
        bedRepository.deleteById(id);
    }
}
