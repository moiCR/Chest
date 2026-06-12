package routes

import (
	"backend/handlers"
	"net/http"
)

func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /health", handlers.Health)
}
