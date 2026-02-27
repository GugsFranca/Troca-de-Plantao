package com.trocaplantao.sisTroca.service;

import com.trocaplantao.sisTroca.entity.Requerente;
import com.trocaplantao.sisTroca.entity.Troca;
import com.trocaplantao.sisTroca.entity.TrocaRequerente;
import com.trocaplantao.sisTroca.entity.dto.AceitaSN;
import com.trocaplantao.sisTroca.entity.dto.RequerentePessoaDTO;
import com.trocaplantao.sisTroca.entity.dto.TrocaCompletaRequest;
import com.trocaplantao.sisTroca.entity.dto.TrocaResponse;
import com.trocaplantao.sisTroca.repository.RequerenteRepository;
import com.trocaplantao.sisTroca.repository.TrocaRepository;
import com.trocaplantao.sisTroca.service.map.RequerenteMapper;
import com.trocaplantao.sisTroca.service.map.TrocaMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrocaService {
    private final TrocaRepository trocaRepository;
    private final TrocaMapper trocaMapper;
    private final RequerenteRepository requerenteRepository;
    private final EmailService emailService;

    @Transactional
    public TrocaResponse createTroca(TrocaCompletaRequest trocaRequest, List<MultipartFile> pri_files, List<MultipartFile> sec_files) throws IOException {
        List<String> allowedTypes = List.of("image/png", "image/jpeg");

        if (pri_files.size() > 2 ||  sec_files.size() > 2) {
            throw new IllegalArgumentException("Máximo de 2 arquivos permitidos");
        }

        ValidaFiles(pri_files, allowedTypes);
        ValidaFiles(sec_files, allowedTypes);

        var trocaEntity = trocaMapper.toTrocaEntity(trocaRequest, pri_files, sec_files);

        for (var tr : trocaEntity.getParticipantes()) {
            Requerente p = tr.getRequerente();
            if (!requerenteRepository.existsById(p.getCpf())) {
                requerenteRepository.save(p);
            }
        }

        var savedTroca = trocaRepository.save(trocaEntity); // cascade salva TrocaRequerente e Imagens

        emailService.enviarEmailsTroca(savedTroca);

        return trocaMapper.toTrocaResponse(savedTroca);
    }

    private void ValidaFiles(List<MultipartFile> sec_files, List<String> allowedTypes) {
        for (MultipartFile file : sec_files) {
            String nome = file.getOriginalFilename();
            assert nome != null;
            boolean validaExtencao = !nome.contains(".png") &&  !nome.contains(".jpg") && !nome.contains(".jpeg");
            if (!allowedTypes.contains(file.getContentType()) || validaExtencao) {
                throw new IllegalArgumentException("Somente imagens JPG ou PNG são permitidas");
            }
        }
    }

    public List<TrocaResponse> getAll() {
        var trocas = trocaRepository.findAll();
        return trocas.stream()
                .map(trocaMapper::toTrocaResponse)
                .toList();
    }

    public TrocaResponse getById(String id) {
        var trocaEntity = trocaRepository.findById(id).orElse(new Troca());
        return trocaMapper.toTrocaResponse(trocaEntity);
    }

    public RequerentePessoaDTO getRequerenteByCpf(String cpf) {
        var requerente = requerenteRepository.findRequerenteByCpf(cpf).orElse(new Requerente());
        return RequerenteMapper.toPessoaDTO(requerente);
    }

    @Transactional
    public void deleteById(String id) {
        trocaRepository.findById(id).ifPresent(troca -> {
            deletarArquivosDaTroca(troca);
            trocaRepository.delete(troca);
        });
    }


    public void finalizeTroca(String id, String aceitoSN, String nomeInspector, String motivoTroca) {
        var troca = trocaRepository.findById(id)
                .orElseThrow();

       if (nomeInspector.trim().length() < 3){
           throw new IllegalArgumentException("Nome do inspetor deve ter 3 caracteres");
       }

        troca.setTrocaEmAnalise(false);
        troca.setFinalizadaEm(LocalDateTime.now());
        troca.setAceitaSN(AceitaSN.valueOf(aceitoSN));
        troca.setNomeInspetor(nomeInspector);
        troca.setMotivoTroca(motivoTroca);

        trocaRepository.save(troca);
        emailService.enviarEmailFinalizacao(troca);
    }

    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void removerTrocasAntigas() {
        var limite = LocalDateTime.now().minusDays(7);
        var trocas = trocaRepository.findTrocasParaLimpeza(limite);

        for (Troca troca : trocas) {
            deletarArquivosDaTroca(troca);
            trocaRepository.delete(troca);
        }
        log.info("Limpeza automática concluída: {} trocas removidas.", trocas.size());
    }

    private void deletarArquivosDaTroca(Troca troca) {
        var imagens = troca.getParticipantes().stream()
                .map(TrocaRequerente::getImagens)
                .flatMap(List::stream)
                .toList();

        for (var img : imagens) {
            try {

                Path path = Paths.get(img.getCaminhoArquivo());
                boolean deletado = Files.deleteIfExists(path);

                if (!deletado) {
                    log.warn("Arquivo não encontrado para deleção: {}", path);
                }
            } catch (IOException e) {
                log.error("Erro ao deletar arquivo {}: {}", img.getCaminhoArquivo(), e.getMessage());
            }
        }
    }
}
