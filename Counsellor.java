package com.career.guidance.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Counsellor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String expertise;

    @Column
    private String careerPath;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column
    private String password;
}
