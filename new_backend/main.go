package main

import (
	"backend/database"
	"backend/routes"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/joho/godotenv"
	_ "github.com/tursodatabase/libsql-client-go/libsql"
)

func main() {

	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL not set")
	}

	db, err := sql.Open("libsql", dbURL)

	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	database.StartDatabase(db)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3312"
	}

	PORT, _ := strconv.Atoi(port)

	mux := http.NewServeMux()
	routes.RegisterRoutes(mux)

	log.Printf("Server is running on port %d\n", PORT)

	err = http.ListenAndServe(fmt.Sprintf(":%d", PORT), mux)
	if err != nil {
		log.Fatal(err)
	}
}
