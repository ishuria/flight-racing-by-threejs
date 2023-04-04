package com.flightracing.backend;

//import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
//@MapperScan(basePackages = {"com.attom.scanner.data.mapper"})
//@EnableScheduling
public class SynchronizerApplication {

	public static void main(String[] args) {
		SpringApplication.run(SynchronizerApplication.class, args);
	}
}
