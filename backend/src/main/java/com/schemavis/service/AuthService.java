package com.schemavis.service;

import com.schemavis.domain.User;
import com.schemavis.dto.AuthResponse;
import com.schemavis.dto.LoginRequest;
import com.schemavis.dto.RegisterRequest;
import com.schemavis.exception.AppException;
import com.schemavis.repository.UserRepository;
import com.schemavis.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository   userRepository;
    private final PasswordEncoder  passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider   = tokenProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().toLowerCase().trim();
        if (userRepository.existsByEmail(email)) {
            throw AppException.conflict("Email already registered");
        }
        User user = User.create(
                email,
                passwordEncoder.encode(req.password()),
                req.displayName().trim()
        );
        userRepository.save(user);
        String token = tokenProvider.generate(user.getId());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getDisplayName());
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.email().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.unauthorized("Invalid credentials"));
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw AppException.unauthorized("Invalid credentials");
        }
        String token = tokenProvider.generate(user.getId());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getDisplayName());
    }
}
