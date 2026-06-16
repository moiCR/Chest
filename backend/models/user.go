package models

import "time"

type User struct {
	ID        string    `gorm:"column:id;primaryKey" json:"id"`
	Username  string    `gorm:"column:username" json:"username"`
	Email     string    `gorm:"column:email" json:"email"`
	Password  string    `gorm:"column:password" json:"-"`
	Role      string    `gorm:"column:role" json:"role"`
	Active    bool      `gorm:"column:active" json:"active"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updated_at"`
	Deleted   bool      `gorm:"column:deleted" json:"deleted"`
	DeletedAt time.Time `gorm:"column:deleted_at" json:"deleted_at"`
	Products  []Product  `gorm:"foreignKey:AuthorID" json:"products"`
	Licenses  []License  `gorm:"foreignKey:UserID" json:"licenses"`
}

func (User) TableName() string {
	return "Users"
}
