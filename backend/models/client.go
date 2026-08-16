package models

import "time"

type Client struct {
	ID          string    `json:"id"`
	ProfileID   *string   `json:"profile_id"`
	CompanyName string    `json:"company_name"`
	PICName     string    `json:"pic_name"`
	Email       string    `json:"email"`
	Phone       *string   `json:"phone"`
	Address     *string   `json:"address"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}