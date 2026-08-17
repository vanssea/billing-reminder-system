package models

import "time"

type FAQ struct {
	ID           string    `json:"id"`
	Question     string    `json:"question"`
	Answer       string    `json:"answer"`
	Status       string    `json:"status"`
	DisplayOrder int       `json:"display_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreateFAQRequest struct {
	Question     string `json:"question"`
	Answer       string `json:"answer"`
	Status       string `json:"status"`
	DisplayOrder int    `json:"display_order"`
}

type UpdateFAQRequest struct {
	Question     string `json:"question"`
	Answer       string `json:"answer"`
	Status       string `json:"status"`
	DisplayOrder int    `json:"display_order"`
}