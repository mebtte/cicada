package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type response struct {
	Code    string `json:"code"`
	Data    any    `json:"data,omitempty"`
	Message string `json:"message,omitempty"`
}

// OK writes a successful JSON response.
func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, response{Code: "success", Data: data})
}

// Fail writes an error JSON response and aborts the request chain.
func Fail(c *gin.Context, code string) {
	c.JSON(http.StatusOK, response{Code: code, Message: code})
	c.Abort()
}
