package br.com.woodriver.infinity_grove_ws.adapter.repository

import org.springframework.data.jpa.repository.JpaRepository

interface JpaUserRepository : JpaRepository<UserEntity, String>
