package com.career.guidance.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionBooking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private AppUser student;

    @ManyToOne(optional = false)
    private Counsellor counsellor;

    @Column(nullable = false)
    private LocalDateTime sessionTime;

    @Column(nullable = false)
    private String mode;

    @Column(nullable = false)
    private String status;
}
