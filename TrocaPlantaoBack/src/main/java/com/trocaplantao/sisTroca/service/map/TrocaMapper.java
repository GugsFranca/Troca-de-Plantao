package com.trocaplantao.sisTroca.service.map;

import com.trocaplantao.sisTroca.entity.Imagens;
import com.trocaplantao.sisTroca.entity.Requerente;
import com.trocaplantao.sisTroca.entity.Troca;
import com.trocaplantao.sisTroca.entity.TrocaRequerente;
import com.trocaplantao.sisTroca.entity.dto.AceitaSN;
import com.trocaplantao.sisTroca.entity.dto.RequerenteDTO;
import com.trocaplantao.sisTroca.entity.dto.TrocaCompletaRequest;
import com.trocaplantao.sisTroca.entity.dto.TrocaResponse;
import com.trocaplantao.sisTroca.repository.RequerenteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrocaMapper {
    @Value("${file.upload-dir}")
    private String uploadDir;

    private final RequerenteRepository requerenteRepository;

    private static final Set<String> FUNCOES_ENF = Set.of(
            "TEC_ENFERMAGEM",
            "ENFERMEIRO"
    );

    private static final Set<String> FUNCOES_ADM = Set.of(
            "SUPERVISOR",
            "AUX_SERVICOS_GERAIS",
            "APOIO_ADMINISTRATIVO"
    );

    public TrocaResponse toTrocaResponse(Troca troca) {
        if (troca == null) return null;

        return TrocaResponse.builder()
                .id(troca.getId())
                .funcaoPlantao(troca.getFuncaoPlantao())
                .unidade(troca.getUnidade())
                .requerente(
                        troca.getParticipantes() == null
                                ? List.of()
                                : troca.getParticipantes().stream()
                                .map(RequerenteMapper::fromParticipacao)
                                .toList()
                )
                .trocaEmAnalise(troca.isTrocaEmAnalise())
                .finalizadaEm(troca.getFinalizadaEm())
                .aceitaSN(troca.getAceitaSN())
                .nomeInspetor(troca.getNomeInspetor() == null ? "" : troca.getNomeInspetor())
                .motivoTroca(troca.getMotivoTroca()  == null ? "" : troca.getMotivoTroca())
                .build();
    }

    public Troca toTrocaEntity(
            TrocaCompletaRequest dto,
            List<MultipartFile> priFiles,
            List<MultipartFile> secFiles
    ) throws IOException {

        Troca troca = Troca.builder()
                .funcaoPlantao(dto.getTroca().funcaoPlantao())
                .trocaEmAnalise(true)
                .aceitaSN(AceitaSN.EM_ANALISE)
                .build();

        var dtoTroca = dto.getTroca();

        String funcao = dtoTroca.funcaoPlantao();
        String unidadeBase = dtoTroca.unidade();

        if (unidadeBase == null || unidadeBase.isBlank()) {
            throw new IllegalArgumentException("Unidade não informada");
        }

// Se for Jardim Íris aplica regra de sufixo
        if (unidadeBase.startsWith("UPA_JARDIM_IRIS")) {

            if (FUNCOES_ENF.contains(funcao)) {
                troca.setUnidade(unidadeBase + "_ENF");

            } else if (FUNCOES_ADM.contains(funcao)) {
                troca.setUnidade(unidadeBase + "_ADM");

            } else {
                // APONT ou qualquer outra função
                troca.setUnidade(unidadeBase + "_APONT");
            }

        } else {
            // outras unidades futuras
            troca.setUnidade(unidadeBase);
        }

        Requerente pessoa1 = findOrCreatePessoa(dto.getPri_requerente());

        TrocaRequerente tr1 = TrocaRequerente.builder()
                .requerente(pessoa1)
                .dataTroca(dto.getPri_requerente().dataTroca())
                .horarioTrocaInit(dto.getPri_requerente().horarioTrocaInit())
                .horarioTrocaEnd(dto.getPri_requerente().horarioTrocaEnd())
                .papel("PRIMARY")
                .build();

        if (priFiles != null) {
            for (MultipartFile file : priFiles) {
                Imagens img = createImage(file);
                img.setTrocaRequerente(tr1);
                tr1.getImagens().add(img);
            }
        }

        troca.addParticipante(tr1);

        // =====================
        // SECONDARY
        // =====================
        Requerente pessoa2 = findOrCreatePessoa(dto.getSec_requerente());

        TrocaRequerente tr2 = TrocaRequerente.builder()
                .requerente(pessoa2)
                .dataTroca(dto.getSec_requerente().dataTroca())
                .horarioTrocaInit(dto.getSec_requerente().horarioTrocaInit())
                .horarioTrocaEnd(dto.getSec_requerente().horarioTrocaEnd())
                .papel("SECONDARY")
                .build();

        if (secFiles != null) {
            for (MultipartFile file : secFiles) {
                Imagens img = createImage(file);
                img.setTrocaRequerente(tr2);
                tr2.getImagens().add(img);
            }
        }

        troca.addParticipante(tr2);

        return troca;
    }

    private Requerente findOrCreatePessoa(RequerenteDTO dto) {

        return requerenteRepository.findById(dto.cpf())
                .map(existing -> {
                    existing.setNome(dto.nome());
                    existing.setMatricula(dto.matricula());
                    existing.setSobrenome(dto.sobrenome());
                    existing.setTelefone(dto.telefone());
                    existing.setEmail(dto.email());
                    return existing;
                })
                .orElseGet(() ->
                        Requerente.builder()
                                .cpf(dto.cpf())
                                .matricula(dto.matricula())
                                .nome(dto.nome())
                                .sobrenome(dto.sobrenome())
                                .telefone(dto.telefone())
                                .email(dto.email())
                                .build()
                );
    }



    public Imagens createImage(MultipartFile file) throws IOException {

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Arquivo vazio");
        }

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
        Files.createDirectories(uploadPath);

        String cleanName = Objects.requireNonNull(file.getOriginalFilename())
                .replaceAll("[^a-zA-Z0-9.\\-]", "_");

        String nomeGerado = UUID.randomUUID() + "_" + cleanName;

        Path destino = uploadPath.resolve(nomeGerado);

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, destino, StandardCopyOption.REPLACE_EXISTING);
        }

        return Imagens.builder()
                .nomeArquivo(nomeGerado)
                .caminhoArquivo(destino.toString())
                .tipo(file.getContentType())
                .build();
    }
}
