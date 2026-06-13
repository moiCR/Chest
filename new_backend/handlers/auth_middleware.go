package handlers

import (
	"context"
	"net/http"
	"strings"

	"backend/utils"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString := ""

		authHeader := r.Header.Get("Authorization")
		if authHeader != "" {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			if tokenString == authHeader {
				jsonError(w, http.StatusUnauthorized, "Invalid authorization format")
				return
			}
		}

		if tokenString == "" {
			tokenString = r.URL.Query().Get("token")
		}

		if tokenString == "" {
			jsonError(w, http.StatusUnauthorized, "Authorization header is required")
			return
		}

		claims, err := utils.VerifyJWT(tokenString)
		if err != nil {
			jsonError(w, http.StatusUnauthorized, "Invalid or expired token")
			return
		}

		ctx := context.WithValue(r.Context(), "userID", claims["userId"])
		ctx = context.WithValue(ctx, "username", claims["username"])
		ctx = context.WithValue(ctx, "email", claims["email"])
		ctx = context.WithValue(ctx, "role", claims["role"])

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
