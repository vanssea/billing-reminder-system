package models

// Nilai kolom profiles.role (enum user_role). Sumber kebenaran role adalah
// database; nilai ini dipakai middleware dan handler untuk otorisasi.
const (
	RoleSuperadmin = "SUPERADMIN"
	RoleAdmin      = "ADMIN"
	RoleClient     = "CLIENT"
)

type AuthUser struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	FullName string `json:"full_name"`
	Role     string `json:"role"`
}

type RegisterRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}