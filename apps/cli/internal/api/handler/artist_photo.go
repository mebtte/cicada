package handler

import (
	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"cicada/internal/config"
	"cicada/internal/store"

	"github.com/gin-gonic/gin"
)

const artistPhotoDescriptionMaxLen = 500

type createArtistPhotoBody struct {
	ArtistID    string `json:"artistId" binding:"required"`
	Asset       string `json:"asset" binding:"required"`
	Description string `json:"description"`
}

func AdminCreateArtistPhoto(c *gin.Context) {
	var body createArtistPhotoBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if len(body.Description) > artistPhotoDescriptionMaxLen {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if _, err := store.GetArtistByID(body.ArtistID); err != nil {
		api.Fail(c, apperr.ArtistNotExisted)
		return
	}
	if !assetExists(body.Asset, config.AssetTypeArtistPhoto) {
		api.Fail(c, apperr.AssetNotExisted)
		return
	}
	thumbnail := assetThumbnailDataURL(body.Asset, config.AssetTypeArtistPhoto)
	id, err := store.CreateArtistPhotoWithThumbnail(body.ArtistID, body.Asset, thumbnail, body.Description)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, gin.H{"id": id, "thumbnail": thumbnail})
}

type updateArtistPhotoBody struct {
	ID          string `json:"id" binding:"required"`
	Description string `json:"description"`
}

func AdminUpdateArtistPhoto(c *gin.Context) {
	var body updateArtistPhotoBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if len(body.Description) > artistPhotoDescriptionMaxLen {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	p, err := store.GetArtistPhoto(body.ID)
	if err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if _, err := store.GetArtistByID(p.ArtistID); err != nil {
		api.Fail(c, apperr.ArtistNotExisted)
		return
	}
	if err := store.UpdateArtistPhotoDescription(body.ID, body.Description); err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, nil)
}

type deleteArtistPhotoBody struct {
	ID string `json:"id" binding:"required"`
}

func AdminDeleteArtistPhoto(c *gin.Context) {
	var body deleteArtistPhotoBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	p, err := store.GetArtistPhoto(body.ID)
	if err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if _, err := store.GetArtistByID(p.ArtistID); err != nil {
		api.Fail(c, apperr.ArtistNotExisted)
		return
	}
	if err := store.DeleteArtistPhoto(body.ID); err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, nil)
}

type reorderArtistPhotosBody struct {
	ArtistID string   `json:"artistId" binding:"required"`
	IDs      []string `json:"ids" binding:"required"`
}

func AdminReorderArtistPhotos(c *gin.Context) {
	var body reorderArtistPhotosBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if _, err := store.GetArtistByID(body.ArtistID); err != nil {
		api.Fail(c, apperr.ArtistNotExisted)
		return
	}
	if err := store.ReorderArtistPhotos(body.ArtistID, body.IDs); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	api.OK(c, nil)
}
