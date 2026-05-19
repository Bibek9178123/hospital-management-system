package com.hospital.backend.model;

import jakarta.persistence.*;

@Entity
public class Bed {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String wardName;
    private String bedNumber;
    private Boolean isOccupied = false;

    @OneToOne
    @JoinColumn(name = "patient_id", nullable = true)
    private Patient patient;

    public Bed() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getWardName() { return wardName; }
    public void setWardName(String wardName) { this.wardName = wardName; }
    public String getBedNumber() { return bedNumber; }
    public void setBedNumber(String bedNumber) { this.bedNumber = bedNumber; }
    public Boolean getIsOccupied() { return isOccupied; }
    public void setIsOccupied(Boolean isOccupied) { this.isOccupied = isOccupied; }
    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }
}
