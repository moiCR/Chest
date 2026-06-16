package handlers

import (
	"backend/database"
	"backend/models"
	"backend/utils"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
)

type createLicenseRequest struct {
	ProductID string `json:"product_id"`
	UserID    string `json:"user_id"`
	MaxUses   int    `json:"max_uses"`
	ExpiresAt string `json:"expires_at"`
}

func CreateLicense(w http.ResponseWriter, r *http.Request) {
	var req createLicenseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.ProductID == "" || req.UserID == "" {
		jsonError(w, http.StatusBadRequest, "product_id and user_id are required")
		return
	}

	var product models.Product
	if err := database.DB.First(&product, "id = ?", req.ProductID).Error; err != nil {
		jsonError(w, http.StatusNotFound, "Product not found")
		return
	}

	var user models.User
	if err := database.DB.First(&user, "id = ?", req.UserID).Error; err != nil {
		jsonError(w, http.StatusNotFound, "User not found")
		return
	}

	maxUses := req.MaxUses
	if maxUses <= 0 {
		maxUses = 1
	}

	rawKey := GenerateLicenseKey()
	hashedKey, err := utils.HashPassword(rawKey)
	if err != nil {
		log.Printf("License hash error: %v", err)
		jsonError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	var expiresAt time.Time
	if req.ExpiresAt != "" {
		expiresAt, err = time.Parse(time.RFC3339, req.ExpiresAt)
		if err != nil {
			jsonError(w, http.StatusBadRequest, "Invalid expires_at format, use RFC3339")
			return
		}
	} else {
		expiresAt = time.Time{}
	}

	now := time.Now()
	license := models.License{
		ID:        uuid.New().String(),
		Key:       hashedKey,
		ProductID: req.ProductID,
		UserID:    req.UserID,
		Active:    true,
		MaxUses:   maxUses,
		UsedCount: 0,
		ExpiresAt: expiresAt,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := database.DB.Create(&license).Error; err != nil {
		log.Printf("License create error: %v", err)
		jsonError(w, http.StatusInternalServerError, "Error creating license")
		return
	}

	jsonResponse(w, http.StatusCreated, map[string]interface{}{
		"message": "License created successfully",
		"key":     rawKey,
		"license": license,
	})
}


type validateLicenseRequest struct {
	Key        string `json:"key"`
	ProductID  string `json:"product_id"`
	ServerName string `json:"server_name"`
	ServerPort int    `json:"server_port"`
}

func ValidateLicense(w http.ResponseWriter, r *http.Request) {
	var req validateLicenseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Key == "" || req.ProductID == "" {
		jsonError(w, http.StatusBadRequest, "key and product_id are required")
		return
	}

	ip := r.RemoteAddr

	var licenses []models.License
	if err := database.DB.Where("product_id = ? AND active = ?", req.ProductID, true).Find(&licenses).Error; err != nil {
		jsonError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	var matched *models.License
	for i := range licenses {
		if utils.CheckPasswordHash(req.Key, licenses[i].Key) {
			matched = &licenses[i]
			break
		}
	}

	success := false
	reason := ""

	if matched == nil {
		reason = "Invalid license key"
	} else if !matched.ExpiresAt.IsZero() && matched.ExpiresAt.Before(time.Now()) {
		reason = "License expired"
	} else if matched.UsedCount >= matched.MaxUses {
		reason = "License usage limit reached"
	} else {
		success = true
		matched.UsedCount++
		database.DB.Model(matched).UpdateColumn("used_count", matched.UsedCount)
	}

	logEntry := models.LicenseLog{
		ID:         uuid.New().String(),
		LicenseID:  func() string { if matched != nil { return matched.ID }; return "" }(),
		IP:         ip,
		Action:     "validate",
		ServerName: req.ServerName,
		ServerPort: req.ServerPort,
		Success:    success,
		CreatedAt:  time.Now(),
	}
	database.DB.Create(&logEntry)

	if !success {
		jsonResponse(w, http.StatusOK, map[string]interface{}{
			"valid":  false,
			"reason": reason,
		})
		return
	}

	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"valid": true,
	})
}

func GenerateLicenseKey() string {
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("CHEST-%X-%X-%X-%X",
		b[0:4], b[4:8], b[8:12], b[12:16])
}
