package com.trocaplantao.sisTroca.entity.dto;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record TrocaResponse(
        String id,
        String funcaoPlantao,
        String unidade,
        List<RequerenteDTO> requerente,
        boolean trocaEmAnalise,
        AceitaSN aceitaSN,
        LocalDateTime finalizadaEm,
        String nomeInspetor,
        String motivoTroca,
        String dataCriacao

) {
}
