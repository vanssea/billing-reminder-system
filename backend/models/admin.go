package models

import "time"

type Admin struct {
	ID        string    `json:"id"`
	FullName  string    `json:"full_name"`
	Email     string    `json:"email"`
	Phone     *string   `json:"phone"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}

type CreateAdminRequest struct {
	FullName string  `json:"full_name"`
	Email    string  `json:"email"`
	Password string  `json:"password"`
	Phone    *string `json:"phone"`
}

type UpdateAdminRequest struct {
	FullName string  `json:"full_name"`
	Role     string  `json:"role"`
	Phone    *string `json:"phone"`
}