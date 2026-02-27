package com.trocaplantao.sisTroca.service;

import com.trocaplantao.auth.entity.UserEntity;
import com.trocaplantao.auth.repository.UserRepository;
import com.trocaplantao.sisTroca.entity.Requerente;
import com.trocaplantao.sisTroca.entity.Troca;
import com.trocaplantao.sisTroca.entity.TrocaRequerente;
import com.trocaplantao.sisTroca.entity.dto.AceitaSN;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;
    private final UserRepository userRepository;

    public void enviarEmail(String para, String assunto, String mensagem, boolean html) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            helper.setTo(para.trim());
            helper.setSubject(assunto);
            helper.setText(mensagem, html);
            try {
                helper.setFrom("trocadeplantaosamubaixada@gmail.com", "Sistema de Troca de Plantão");
            } catch (java.io.UnsupportedEncodingException e) {
                log.error("Erro ao definir o nome do remetente: {}", e.getMessage());
                helper.setFrom("trocadeplantaosamubaixada@gmail.com");
            }
            helper.setReplyTo("trocadeplantaosamubaixada@gmail.com");
            mimeMessage.setHeader("X-Mailer", "JavaMailSender");
            mimeMessage.setHeader("X-Priority", "3");
            mimeMessage.setHeader("Message-ID", "<" + System.currentTimeMillis() + "@gmail.com>"); // Gerar um Message-ID único com o domínio do remetente

            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            log.error("Erro ao enviar email: {}", e.getMessage());
            log.error("Erro na solicitação de Para: {} com o assunto {}", para, assunto);
        }
    }

    public void enviarEmailsTroca(Troca troca) {
        log.info("Enviando emails de troca: {}", troca.getUnidade());
        String nomeBase = troca.getUnidade();
        Optional<UserEntity> baseOpt;
        if(nomeBase.contains("UPA_JARDIM_IRIS")){
            baseOpt =  userRepository.findByNameIgnoreCase("UPA_JARDIM_IRIS");
        }else {
            baseOpt = userRepository.findByNameIgnoreCase(nomeBase);
        }
        baseOpt.ifPresent(base -> enviarEmail(
                base.getEmail(),
                "Nova Solicitação de Troca de Plantão - " + troca.getId(),
                montarEmailBase(troca),
                true
        ));

        troca.getParticipantes().forEach(requerente -> {
            var req = requerente.getRequerente();
            if (req.getEmail() != null) {
                enviarEmail(
                        req.getEmail(),
                        "Confirmação de Solicitação de Troca - " + troca.getId(),
                        montarEmailRequerente(troca, requerente),
                        true
                );
            }
        });
    }

    public void enviarEmailFinalizacao(Troca troca) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");


        // Email para os requerentes
        troca.getParticipantes().forEach(requerente -> {
            var req = requerente.getRequerente();

            if (req.getEmail() != null) {
                enviarEmail(
                        req.getEmail(),
                        "Sua Troca foi " + troca.getAceitaSN().getStatus(),
                        montarEmailFinalizacaoRequerente(troca, requerente, dateFormatter, timeFormatter),
                        true
                );
            }
        });
    }

    private String montarEmailBase(Troca troca) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

        StringBuilder sb = new StringBuilder();
        sb.append("<html><body>");
        sb.append("<h3>Nova Solicitação de Troca de Plantão</h3>");
        sb.append("<p>Uma nova solicitação foi registrada no sistema:</p>");

        sb.append("<table border='0' cellpadding='5' style='border-collapse: collapse;'>");
        sb.append("<tr><td><strong>ID:</strong></td><td>").append(troca.getId()).append("</td></tr>");
        sb.append("<tr><td><strong>Unidade:</strong></td><td>").append(troca.getUnidade()).append("</td></tr>");
        sb.append("<tr><td><strong>Função:</strong></td><td>").append(troca.getFuncaoPlantao()).append("</td></tr>");

        if (!troca.getParticipantes().isEmpty()) {
            var primeiro = troca.getParticipantes().getFirst();
            var ultimo = troca.getParticipantes().getLast();
            sb.append("<tr><td colspan='2'><strong>Primero Requerente:</strong></td></tr>");
            sb.append("<tr><td>Data:</td><td>").append(primeiro.getDataTroca().format(dateFormatter)).append("</td></tr>");
            sb.append("<tr><td>Horário:</td><td>").append(primeiro.getHorarioTrocaInit().format(timeFormatter))
                    .append(" às ").append(primeiro.getHorarioTrocaEnd().format(timeFormatter)).append("</td></tr>");
            sb.append("<tr><td colspan='2'><strong>Segundo Requerente:</strong></td></tr>");
            sb.append("<tr><td>Data:</td><td>").append(ultimo.getDataTroca().format(dateFormatter)).append("</td></tr>");
            sb.append("<tr><td>Horário:</td><td>").append(ultimo.getHorarioTrocaInit().format(timeFormatter))
                    .append(" às ").append(ultimo.getHorarioTrocaEnd().format(timeFormatter)).append("</td></tr>");

        }

        sb.append("</table>");

        sb.append("<h4>Requerentes:</h4>");
        sb.append("<ul>");
        troca.getParticipantes().forEach(req -> sb.append("<li>").append(req.getRequerente().getNome()).append(" ").append(req.getRequerente().getSobrenome())
                .append(" (CPF: ").append(req.getRequerente().getCpf()).append(") - Tel: ")
                .append(req.getRequerente().getTelefone()).append("</li>"));
        sb.append("</ul>");

        sb.append("<p>Acesse o sistema para analisar esta solicitação.</p>");
        sb.append("<hr>");
        sb.append("<p style='font-size: 12px; color: #666;'>Este é um email automático do Sistema de Troca de Plantão</p>");
        sb.append("</body></html>");

        return sb.toString();
    }

    private String montarEmailRequerente(Troca troca, TrocaRequerente part) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

        Requerente pessoa = part.getRequerente();

        return "<html><body>" +
                "<h3>Confirmação de Solicitação de Troca</h3>" +
                "<p>Sua solicitação de troca de plantão foi registrada com sucesso.</p>" +
                "<table border='0' cellpadding='5' style='border-collapse: collapse;'>" +
                "<tr><td><strong>ID da Solicitação:</strong></td><td>" + troca.getId() + "</td></tr>" +
                "<tr><td><strong>Requerente:</strong></td><td>" + safe(pessoa.getNome()) + " " + safe(pessoa.getSobrenome()) + "</td></tr>" +
                "<tr><td><strong>CPF:</strong></td><td>" + safe(pessoa.getCpf()) + "</td></tr>" +
                "<tr><td><strong>Unidade:</strong></td><td>" + safe(troca.getUnidade()) + "</td></tr>" +
                "<tr><td><strong>Função:</strong></td><td>" + safe(troca.getFuncaoPlantao()) + "</td></tr>" +
                "<tr><td><strong>Data da Troca:</strong></td><td>" + fmtDate(part.getDataTroca(), dateFormatter) + "</td></tr>" +
                "<tr><td><strong>Horário:</strong></td><td>" + fmtTime(part.getHorarioTrocaInit(), timeFormatter) +
                " às " + fmtTime(part.getHorarioTrocaEnd(), timeFormatter) + "</td></tr>" +
                "</table>" +
                "<p>Status: <strong>Aguardando análise da base</strong></p>" +
                "<p>A base responsável analisará sua solicitação em breve. Você receberá uma nova notificação quando houver atualizações.</p>" +
                "<hr>" +
                "<p style='font-size: 12px; color: #666;'>Este é um email automático do Sistema de Troca de Plantão</p>" +
                "</body></html>";
    }

    private String montarEmailFinalizacaoRequerente(Troca troca, TrocaRequerente part, DateTimeFormatter dateFormatter, DateTimeFormatter timeFormatter) {
        String motivo = troca.getAceitaSN() != null
                && troca.getAceitaSN() == AceitaSN.RECUSADO
                && troca.getMotivoTroca() != null
                && !troca.getMotivoTroca().isEmpty()
                ? "<tr><td><strong>Motivo da Recusa:</strong></td><td>" + safe(troca.getMotivoTroca()) + "</td></tr>"
                : "";
        return "<html><body>" +
                "<h3>Sua Troca de Plantão foi " + safe(troca.getAceitaSN() == null ? "-" : troca.getAceitaSN().getStatus().toUpperCase()) + "</h3>" +
                "<p>A troca de plantão em que você está envolvido foi finalizada.</p>" +
                "<table border='0' cellpadding='5' style='border-collapse: collapse;'>" +
                "<tr><td><strong>ID da Solicitação:</strong></td><td>" + safe(troca.getId()) + "</td></tr>" +
                motivo+
                "<tr><td> </td></tr>"+
                "<tr><td><strong>Analista da troca:</strong></td><td>" + safe(troca.getNomeInspetor()) + "</td></tr>" +
                "<tr><td><strong>Requerentes:</strong></td><td>" + safe(troca.getParticipantes().getFirst().getRequerente().getNome()) + " e "
                + safe(troca.getParticipantes().get(1).getRequerente().getSobrenome()) + "</td></tr>" +
                "<tr><td><strong>Unidade:</strong></td><td>" + safe(troca.getUnidade()) + "</td></tr>" +
                "<tr><td><strong>Função:</strong></td><td>" + safe(troca.getFuncaoPlantao()) + "</td></tr>" +
                "<tr><td><strong>Data da Troca:</strong></td><td>" + fmtDate(part.getDataTroca(), dateFormatter) + "</td></tr>" +
                "<tr><td><strong>Horário:</strong></td><td>" + fmtTime(part.getHorarioTrocaInit(), timeFormatter) +
                " às " + fmtTime(part.getHorarioTrocaEnd(), timeFormatter) + "</td></tr>" +
                "<tr><td><strong>Status:</strong></td><td>" + safe(troca.getAceitaSN() == null ? "-" : troca.getAceitaSN().getStatus()) + "</td></tr>" +
                "</table>" +
                "<p>A troca foi registrada como concluída no sistema. Caso tenha dúvidas, entre em contato com a base responsável.</p>" +
                "<hr>" +
                "<p style='font-size: 12px; color: #666;'>Este é um email automático do Sistema de Troca de Plantão</p>" +
                "</body></html>";
    }


    private String safe(String s) {
        return s == null ? "-" : s;
    }

    private String fmtDate(LocalDate date, DateTimeFormatter df) {
        return date == null ? "-" : date.format(df);
    }

    private String fmtTime(LocalTime time, DateTimeFormatter tf) {
        return time == null ? "-" : time.format(tf);
    }
}