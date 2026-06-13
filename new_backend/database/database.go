package database

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"
)

var DB *sql.DB

func StartDatabase(db *sql.DB) {
	DB = db
	schemePath := filepath.Join("database", "scheme.sqlite")
	scheme, err := os.ReadFile(schemePath)

	if err != nil {
		log.Fatalf("Error reading scheme file: %v", err)
	}

	_, err = DB.Exec(string(scheme))

	if err != nil {
		log.Fatalf("Error executing scheme: %v", err)
	}

	log.Println("Tables and indexes successfully created")
}

func Migrate(migrationFile string) {
	scheme, err := os.ReadFile(migrationFile)

	if err != nil {
		log.Fatalf("Error reading migration file: %v", err)
	}

	_, err = DB.Exec(string(scheme))

	if err != nil {
		log.Fatalf("Error executing migration: %v", err)
	}

	log.Println("Migration successful")
}
