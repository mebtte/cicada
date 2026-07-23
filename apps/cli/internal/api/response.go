package api

import (
	"cicada/internal/api/apperr"
	"net/http"

	"github.com/gin-gonic/gin"
)

const clientLanguageQuery = "__client_language"

type response struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data"`
}

// OK writes a successful JSON response.
func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, response{Code: apperr.Success, Message: "", Data: data})
}

// Fail writes an error JSON response and aborts the request chain.
func Fail(c *gin.Context, code string) {
	FailWithStatus(c, http.StatusOK, code)
}

// FailWithStatus writes the same stable error envelope for non-business HTTP failures.
func FailWithStatus(c *gin.Context, status int, code string) {
	c.JSON(status, response{
		Code:    code,
		Message: apperr.Message(code, c.Query(clientLanguageQuery)),
		Data:    nil,
	})
	c.Abort()
}
