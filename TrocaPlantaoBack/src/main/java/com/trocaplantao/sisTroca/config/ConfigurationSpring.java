package com.trocaplantao.sisTroca.config;

import jakarta.servlet.MultipartConfigElement;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class ConfigurationSpring implements WebMvcConfigurer {
    @Value("${file.upload-dir}")
    private String uploadDir;
    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        factory.setMaxFileSize(DataSize.ofMegabytes(500));
        factory.setMaxRequestSize(DataSize.ofMegabytes(500));
        return factory.createMultipartConfig();
    }

//    public void addResourceHandlers(ResourceHandlerRegistry registry) {
//        registry
//                .addResourceHandler("/uploads/**")
//                .addResourceLocations("file:" + Paths.get(uploadDir).toAbsolutePath() + "/");
//    }
}
