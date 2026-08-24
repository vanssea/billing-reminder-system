package models

import "time"

type Client struct {
	ID          string    `json:"id"`
	ProfileID   *string   `json:"profile_id,omitempty"`
	CompanyName string    `json:"company_name"`
	PICName     string    `json:"pic_name"`
	Email       string    `json:"email"`
	Phone       *string   `json:"phone,omitempty"`
	Address     *string   `json:"address,omitempty"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ClientRequest struct {
	CompanyName string  `json:"company_name"`
	PICName     string  `json:"pic_name"`
	Email       string  `json:"email"`
	Phone       *string `json:"phone,omitempty"`
	Address     *string `json:"address,omitempty"`
	Status      string  `json:"status"`
}

type PaginatedClientResponse struct {
	Data       []Client `json:"data"`
	Pagination struct {
		Page       int `json:"page"`
		Limit      int `json:"limit"`
		Total      int `json:"total"`
		TotalPages int `json:"total_pages"`
	} `json:"pagination"`
}