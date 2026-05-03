package handler

import (
	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"cicada/internal/api/middleware"
	"cicada/internal/config"
	"cicada/internal/store"

	"github.com/gin-gonic/gin"
)

const singerPhotoDescriptionMaxLen = 500

type createSingerPhotoBody struct {
	SingerID    string `json:"singerId" binding:"required"`
	Asset       string `json:"asset" binding:"required"`
	Description string `json:"description"`
}

func AdminCreateSingerPhoto(c *gin.Context) {
	u := middleware.GetUser(c)
	var body createSingerPhotoBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if len(body.Description) > singerPhotoDescriptionMaxLen {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if _, err := store.GetSingerByID(body.SingerID); err != nil {
		api.Fail(c, apperr.SingerNotExisted)
		return
	}
	if !assetExists(body.Asset, config.AssetTypeSingerPhoto) {
		api.Fail(c, apperr.AssetNotExisted)
		return
	}
	id, err := store.CreateSingerPhoto(body.SingerID, body.Asset, body.Description, u.ID)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, gin.H{"id": id})
}

type updateSingerPhotoBody struct {
	ID          string `json:"id" binding:"required"`
	Description string `json:"description"`
}

func AdminUpdateSingerPhoto(c *gin.Context) {
	var body updateSingerPhotoBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if len(body.Description) > singerPhotoDescriptionMaxLen {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	p, err := store.GetSingerPhoto(body.ID)
	if err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if _, err := store.GetSingerByID(p.SingerID); err != nil {
		api.Fail(c, apperr.SingerNotExisted)
		return
	}
	if err := store.UpdateSingerPhotoDescription(body.ID, body.Description); err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, nil)
}

type deleteSingerPhotoBody struct {
	ID string `json:"id" binding:"required"`
}

func AdminDeleteSingerPhoto(c *gin.Context) {
	var body deleteSingerPhotoBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	p, err := store.GetSingerPhoto(body.ID)
	if err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if _, err := store.GetSingerByID(p.SingerID); err != nil {
		api.Fail(c, apperr.SingerNotExisted)
		return
	}
	if err := store.DeleteSingerPhoto(body.ID); err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, nil)
}

type reorderSingerPhotosBody struct {
	SingerID string   `json:"singerId" binding:"required"`
	IDs      []string `json:"ids" binding:"required"`
}

func AdminReorderSingerPhotos(c *gin.Context) {
	var body reorderSingerPhotosBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if _, err := store.GetSingerByID(body.SingerID); err != nil {
		api.Fail(c, apperr.SingerNotExisted)
		return
	}
	if err := store.ReorderSingerPhotos(body.SingerID, body.IDs); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	api.OK(c, nil)
}
