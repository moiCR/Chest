package database

import (
	"database/sql"
	"log"

	"backend/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func StartDatabase(sqlDB *sql.DB) {
	db, err := gorm.Open(sqlite.New(sqlite.Config{
		Conn: sqlDB,
	}), &gorm.Config{})

	if err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}

	DB = db

	if err := db.AutoMigrate(&models.User{}, &models.Product{}, &models.ProductUpdate{}); err != nil {
		log.Fatalf("Error migrating database: %v", err)
	}

	log.Println("Database migrated successfully")
}
