package routes

import (
	"backend/handlers"
	"net/http"
)

func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /health", handlers.Health)
	mux.HandleFunc("POST /auth/register", handlers.Register)
	mux.HandleFunc("POST /auth/login", handlers.Login)
}
