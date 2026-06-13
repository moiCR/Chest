package handlers

import (
	"backend/database"
	"backend/models"
	"backend/utils"
	"encoding/json"
	"log"
	"net/http"

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

	var count int
	err := database.DB.QueryRow(
		`SELECT COUNT(*) FROM "Users" WHERE "username" = ? OR "email" = ?`,
		req.Username, req.Email,
	).Scan(&count)
	if err != nil {
		log.Printf("Register error (count): %v", err)
		jsonError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

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

	newUser := models.User{
		ID: uuid.New().String(),
	}

	_, err = database.DB.Exec(
		`INSERT INTO "Users" ("id", "username", "email", "password", "role") VALUES (?, ?, ?, ?, 'USER')`,
		newUser.ID, req.Username, req.Email, hashedPassword,
	)
	if err != nil {
		log.Printf("Register error (insert): %v", err)
		jsonError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	err = database.DB.QueryRow(
		`SELECT "id", "username", "email", "role", "active", "created_at", "updated_at"
		 FROM "Users" WHERE "username" = ?`,
		req.Username,
	).Scan(&newUser.ID, &newUser.Username, &newUser.Email, &newUser.Role, &newUser.Active, &newUser.CreatedAt, &newUser.UpdatedAt)
	if err != nil {
		log.Printf("Register error (select after insert): %v", err)
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
	var hashedPassword string
	err := database.DB.QueryRow(
		`SELECT "id", "username", "email", "role", "password", "active", "created_at", "updated_at"
		 FROM "Users" WHERE "username" = ?`,
		req.Username,
	).Scan(&user.ID, &user.Username, &user.Email, &user.Role, &hashedPassword, &user.Active, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		jsonError(w, http.StatusBadRequest, "This user does not exist")
		return
	}

	if !user.Active {
		jsonError(w, http.StatusForbidden, "This account is currently disabled")
		return
	}

	if !utils.CheckPasswordHash(req.Password, hashedPassword) {
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
