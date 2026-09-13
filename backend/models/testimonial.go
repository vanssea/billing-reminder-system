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
	ClientID     *string   `json:"client_id,omitempty"`
	PurchaseID   *string   `json:"purchase_id,omitempty"`
	CreatedByID  *string   `json:"created_by_id,omitempty"`
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

type CreateClientTestimonialRequest struct {
	Quote  string `json:"quote"`
	Rating int    `json:"rating"`
}

type TestimonialEligibilityResponse struct {
	HasApprovedPurchase bool                   `json:"has_approved_purchase"`
	HasTestimonial      bool                   `json:"has_testimonial"`
	ApprovedPurchases   []PurchaseRequestModel `json:"approved_purchases"`
}