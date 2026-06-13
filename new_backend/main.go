package main

import (
	"backend/database"
	"backend/r2"
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

	r2.InitR2()

	port := os.Getenv("PORT")
	if port == "" {
		port = "3312"
	}

	PORT, _ := strconv.Atoi(port)

	mux := http.NewServeMux()
	routes.RegisterRoutes(mux)

	corsMux := corsMiddleware(mux)

	log.Printf("Server is running on port %d\n", PORT)

	err = http.ListenAndServe(fmt.Sprintf(":%d", PORT), corsMux)
	if err != nil {
		log.Fatal(err)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
