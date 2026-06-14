package routes

import (
	"backend/handlers"
	"net/http"
)

func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /health", handlers.Health)
	mux.HandleFunc("POST /auth/register", handlers.Register)
	mux.HandleFunc("POST /auth/login", handlers.Login)

	authMux := http.NewServeMux()
	authMux.HandleFunc("GET /products", handlers.GetProducts)
	authMux.HandleFunc("GET /products/{id}", handlers.GetProduct)
	authMux.HandleFunc("POST /products", handlers.UploadProduct)
	authMux.HandleFunc("GET /products/{id}/updates", handlers.GetProductUpdates)
	authMux.HandleFunc("POST /products/{id}/updates", handlers.UploadProductUpdate)
	authMux.HandleFunc("GET /products/{id}/download", handlers.DownloadProduct)
	authMux.HandleFunc("GET /products/updates/{updateId}/download", handlers.DownloadProductUpdate)

	mux.Handle("/", handlers.AuthMiddleware(authMux))
}
