package com.hospital.backend.controller;

import com.hospital.backend.model.Billing;
import com.hospital.backend.repository.BillingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    @Autowired
    private BillingRepository billingRepository;

    @GetMapping
    public List<Billing> getAllBills() {
        return billingRepository.findAll();
    }

    @PutMapping("/{id}/pay")
    public ResponseEntity<?> payBill(@PathVariable Long id) {
        Billing bill = billingRepository.findById(id).orElse(null);
        if (bill == null) {
            return ResponseEntity.notFound().build();
        }
        
        bill.setStatus("PAID");
        Billing saved = billingRepository.save(bill);
        return ResponseEntity.ok(saved);
    }
}
