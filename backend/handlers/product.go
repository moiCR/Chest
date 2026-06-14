package handlers

import (
	"backend/database"
	"backend/models"
	"backend/r2"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func UploadProduct(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(100 << 20); err != nil {
		jsonError(w, http.StatusBadRequest, "Invalid form data")
		return
	}

	name := r.FormValue("name")
	description := r.FormValue("description")
	version := r.FormValue("version")
	category := r.FormValue("category")

	if name == "" || version == "" {
		jsonError(w, http.StatusBadRequest, "Name and version are required")
		return
	}

	authorID := r.Context().Value("userID").(string)

	productID := uuid.New().String()
	var fileKey string
	var fileSize int64
	var fileName string

	file, header, err := r.FormFile("file")
	if err == nil {
		defer file.Close()
		folder := "plugins"
		if category == "mod" {
			folder = "mods"
		}
		fileKey = folder + "/" + productID + "/latest.jar"

		if err := r2.UploadFile(r.Context(), fileKey, file); err != nil {
			log.Printf("R2 upload error: %v", err)
			jsonError(w, http.StatusInternalServerError, "Error uploading file")
			return
		}
		fileSize = header.Size
		fileName = header.Filename
	}

	now := time.Now()
	product := models.Product{
		ID:          productID,
		Name:        name,
		Description: description,
		Version:     version,
		Category:    category,
		AuthorID:    authorID,
		FileKey:     fileKey,
		FileName:    fileName,
		FileSize:    fileSize,
		Active:      true,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := database.DB.Create(&product).Error; err != nil {
		if fileKey != "" {
			r2.DeleteFile(r.Context(), fileKey)
		}
		log.Printf("DB create error: %v", err)
		jsonError(w, http.StatusInternalServerError, "Error creating product")
		return
	}

	jsonResponse(w, http.StatusCreated, map[string]interface{}{
		"message": "Product created successfully",
		"product": product,
	})
}

func UploadProductUpdate(w http.ResponseWriter, r *http.Request) {
	productID := r.PathValue("id")

	var product models.Product
	if err := database.DB.First(&product, "id = ?", productID).Error; err != nil {
		jsonError(w, http.StatusNotFound, "Product not found")
		return
	}

	if err := r.ParseMultipartForm(100 << 20); err != nil {
		jsonError(w, http.StatusBadRequest, "Invalid form data")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		jsonError(w, http.StatusBadRequest, "File is required")
		return
	}
	defer file.Close()

	version := r.FormValue("version")
	title := r.FormValue("title")
	description := r.FormValue("description")
	updateType := r.FormValue("type")

	if version == "" || title == "" {
		jsonError(w, http.StatusBadRequest, "Version and title are required")
		return
	}

	if updateType == "" {
		updateType = "minor"
	}

	updateID := uuid.New().String()
	folder := "plugins"
	if product.Category == "mod" {
		folder = "mods"
	}
	fileKey := folder + "/" + productID + "/updates/" + updateID + ".jar"

	if err := r2.UploadFile(r.Context(), fileKey, file); err != nil {
		log.Printf("R2 upload error: %v", err)
		jsonError(w, http.StatusInternalServerError, "Error uploading file")
		return
	}

	now := time.Now()
	update := models.ProductUpdate{
		ID:          updateID,
		ProductID:   productID,
		Version:     version,
		Title:       title,
		Description: description,
		Type:        updateType,
		FileKey:     fileKey,
		FileName:    header.Filename,
		FileSize:    header.Size,
		CreatedAt:   now,
	}

	if err := database.DB.Create(&update).Error; err != nil {
		r2.DeleteFile(r.Context(), fileKey)
		log.Printf("DB create error: %v", err)
		jsonError(w, http.StatusInternalServerError, "Error creating update")
		return
	}

	database.DB.Model(&product).Updates(map[string]interface{}{
		"version":    version,
		"file_key":   fileKey,
		"file_size":  header.Size,
		"updated_at": now,
	})

	jsonResponse(w, http.StatusCreated, map[string]interface{}{
		"message": "Update uploaded successfully",
		"update":  update,
	})
}

func DownloadProduct(w http.ResponseWriter, r *http.Request) {
	productID := r.PathValue("id")

	var product models.Product
	if err := database.DB.First(&product, "id = ?", productID).Error; err != nil {
		jsonError(w, http.StatusNotFound, "Product not found")
		return
	}

	if product.FileKey == "" {
		jsonError(w, http.StatusNotFound, "File not found")
		return
	}

	filename := product.FileName
	if filename == "" {
		filename = fmt.Sprintf("%s-v%s.jar", product.Name, product.Version)
	}
	url, err := r2.GetSignedURL(r.Context(), product.FileKey, filename)
	if err != nil {
		log.Printf("R2 presign error: %v", err)
		jsonError(w, http.StatusInternalServerError, "Error generating download URL")
		return
	}

	database.DB.Model(&product).UpdateColumn("downloads", product.Downloads+1)

	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func DownloadProductUpdate(w http.ResponseWriter, r *http.Request) {
	updateID := r.PathValue("updateId")

	var update models.ProductUpdate
	if err := database.DB.First(&update, "id = ?", updateID).Error; err != nil {
		jsonError(w, http.StatusNotFound, "Update not found")
		return
	}

	if update.FileKey == "" {
		jsonError(w, http.StatusNotFound, "File not found")
		return
	}

	filename := update.FileName
	if filename == "" {
		filename = fmt.Sprintf("%s-v%s.jar", update.Title, update.Version)
	}
	url, err := r2.GetSignedURL(r.Context(), update.FileKey, filename)
	if err != nil {
		log.Printf("R2 presign error: %v", err)
		jsonError(w, http.StatusInternalServerError, "Error generating download URL")
		return
	}

	database.DB.Model(&update).UpdateColumn("downloads", update.Downloads+1)

	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func GetProductUpdates(w http.ResponseWriter, r *http.Request) {
	productID := r.PathValue("id")

	var updates []models.ProductUpdate
	if err := database.DB.Where("product_id = ?", productID).
		Order("created_at DESC").
		Find(&updates).Error; err != nil {
		jsonError(w, http.StatusInternalServerError, "Error fetching updates")
		return
	}

	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"updates": updates,
	})
}

func GetProducts(w http.ResponseWriter, r *http.Request) {
	authorID := r.Context().Value("userID").(string)

	var products []models.Product
	if err := database.DB.Where("author_id = ? AND active = ?", authorID, true).
		Order("created_at DESC").
		Find(&products).Error; err != nil {
		jsonError(w, http.StatusInternalServerError, "Error fetching products")
		return
	}

	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"products": products,
	})
}

func GetProduct(w http.ResponseWriter, r *http.Request) {
	productID := r.PathValue("id")
	authorID := r.Context().Value("userID").(string)

	var product models.Product
	if err := database.DB.Where("id = ? AND author_id = ?", productID, authorID).
		Preload("Updates", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("created_at DESC")
		}).
		First(&product).Error; err != nil {
		log.Printf("GetProduct error: %v", err)
		jsonError(w, http.StatusNotFound, "Product not found")
		return
	}

	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"product": product,
	})
}
