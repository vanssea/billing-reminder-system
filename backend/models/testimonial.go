package models

import "time"

type Testimonial struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Role         *string   `json:"role"`
	Quote        string    `json:"quote"`
	Initials     *string   `json:"initials"`
	Tone         string    `json:"tone"`
	Rating       int       `json:"rating"`
	Status       string    `json:"status"`
	DisplayOrder int       `json:"display_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreateTestimonialRequest struct {
	Name         string  `json:"name"`
	Role         *string `json:"role"`
	Quote        string  `json:"quote"`
	Initials     *string `json:"initials"`
	Tone         string  `json:"tone"`
	Rating       int     `json:"rating"`
	Status       string  `json:"status"`
	DisplayOrder int     `json:"display_order"`
}

type UpdateTestimonialRequest struct {
	Name         string  `json:"name"`
	Role         *string `json:"role"`
	Quote        string  `json:"quote"`
	Initials     *string `json:"initials"`
	Tone         string  `json:"tone"`
	Rating       int     `json:"rating"`
	Status       string  `json:"status"`
	DisplayOrder int     `json:"display_order"`
}