package com.trocaplantao.sisTroca.entity;

import com.trocaplantao.sisTroca.entity.dto.AceitaSN;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class Troca {
    @Id
    private String id;
    private String funcaoPlantao;
    private String unidade;

    @OneToMany(mappedBy = "troca", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TrocaRequerente> participantes = new ArrayList<>();

    private boolean trocaEmAnalise = true;
    @Enumerated(EnumType.STRING)
    private AceitaSN aceitaSN = AceitaSN.EM_ANALISE;

    private LocalDateTime finalizadaEm;
    private String nomeInspetor;
    private String motivoTroca;
    private LocalDateTime dataCriacao;

    @PrePersist
    public void gerarIdSeNaoExistir() {
        if (this.id == null) {
            this.id = java.time.format.DateTimeFormatter.ofPattern("yyMMddHHmmss")
                    .format(java.time.LocalDateTime.now())
                    + (int) (Math.random() * 90 + 10);
        }
    }

    // helper para adicionar participante e linkar ambas as pontas
    public void addParticipante(TrocaRequerente tr) {
        tr.setTroca(this);
        this.participantes.add(tr);
    }
}