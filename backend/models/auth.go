package models

// Nilai kolom profiles.role (enum user_role). Sumber kebenaran role adalah
// database; nilai ini dipakai middleware dan handler untuk otorisasi.
const (
	RoleSuperadmin = "SUPERADMIN"
	RoleAdmin      = "ADMIN"
	RoleClient     = "CLIENT"
)

// IsStaffRole mengembalikan true untuk role staf (ADMIN/SUPERADMIN).
// Sumber kebenaran role adalah database; semua role lain (CLIENT maupun role
// tidak dikenal/NULL) dianggap non-staf sehingga harus melewati ownership check
// di handler agar tidak bisa mengakses data milik pengguna lain.
func IsStaffRole(role string) bool {
	return role == RoleAdmin || role == RoleSuperadmin
}

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