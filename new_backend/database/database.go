package database

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"
)

func StartDatabase(db *sql.DB) {
	schemePath := filepath.Join("database", "scheme.sqlite")
	scheme, err := os.ReadFile(schemePath)

	if err != nil {
		log.Fatalf("Error reading scheme file: %v", err)
	}

	_, err = db.Exec(string(scheme))

	if err != nil {
		log.Fatalf("Error executing scheme: %v", err)
	}

	log.Println("Tables and indexes successfully created")
}


func Migrate(db *sql.DB, migrationFile string) {
	scheme, err := os.ReadFile(migrationFile)

	if err != nil {
		log.Fatalf("Error reading migration file: %v", err)
	}

	_, err = db.Exec(string(scheme))

	if err != nil {
		log.Fatalf("Error executing migration: %v", err)
	}

	log.Println("Migration successful")
}