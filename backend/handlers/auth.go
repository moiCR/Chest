package handlers

import (
	"backend/database"
	"backend/models"
	"backend/utils"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
)

type registerRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func jsonError(w http.ResponseWriter, status int, message string) {
	jsonResponse(w, status, map[string]string{"message": message})
}

func Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Username == "" || req.Email == "" || req.Password == "" {
		jsonError(w, http.StatusBadRequest, "All fields are required")
		return
	}

	if len(req.Password) < 8 {
		jsonError(w, http.StatusBadRequest, "The password must be at least 8 characters long")
		return
	}

	var count int64
	database.DB.Model(&models.User{}).Where("username = ? OR email = ?", req.Username, req.Email).Count(&count)

	if count > 0 {
		jsonError(w, http.StatusBadRequest, "The email address or username is already in use")
		return
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		log.Printf("Register error (hash): %v", err)
		jsonError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	now := time.Now()
	newUser := models.User{
		ID:        uuid.New().String(),
		Username:  req.Username,
		Email:     req.Email,
		Password:  hashedPassword,
		Role:      "USER",
		Active:    true,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := database.DB.Create(&newUser).Error; err != nil {
		log.Printf("Register error (insert): %v", err)
		jsonError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	token, err := utils.GenerateJWT(newUser.ID, newUser.Username, newUser.Email, newUser.Role)
	if err != nil {
		log.Printf("Register error (jwt): %v", err)
		jsonError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	jsonResponse(w, http.StatusCreated, map[string]interface{}{
		"message": "User successfully created",
		"token":   token,
		"newUser": newUser,
	})
}

func Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Username == "" || req.Password == "" {
		jsonError(w, http.StatusBadRequest, "All fields are required")
		return
	}

	var user models.User
	if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		jsonError(w, http.StatusBadRequest, "This user does not exist")
		return
	}

	if !user.Active {
		jsonError(w, http.StatusForbidden, "This account is currently disabled")
		return
	}

	if !utils.CheckPasswordHash(req.Password, user.Password) {
		jsonError(w, http.StatusForbidden, "The credentials are invalid")
		return
	}

	token, err := utils.GenerateJWT(user.ID, user.Username, user.Email, user.Role)
	if err != nil {
		jsonError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"message": "Successfully login",
		"token":   token,
		"user":    user,
	})
}
